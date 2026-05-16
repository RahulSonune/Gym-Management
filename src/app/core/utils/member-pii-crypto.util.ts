import {
  CLIENT_STORAGE_PREFIX,
  decryptFromClientStorage,
  encryptForClientStorage,
  isClientEncrypted,
} from './client-crypto.util';

/**
 * Member PII fields sent/received on the API. Excludes `fullName` (server-derived from
 * encrypted first/last — decrypt those fields, then rebuild fullName for display).
 */
export const MEMBER_PII_STRING_KEYS = new Set([
  'firstName',
  'lastName',
  'phone',
  'email',
  'gender',
  'dateOfBirth',
  'emergencyContactName',
  'emergencyContactPhone',
  'source',
  'memberCode',
  'planName',
  'startDate',
  'endDate',
  'memberName',
  'photoUrl',
  'medicalNotes',
  'notes',
  'noteText',
  'createdByName',
]);

function encryptField(value: string, secret: string): Promise<string> {
  return encryptForClientStorage(value, secret);
}

async function decryptSingleSegment(value: string, secret: string): Promise<string> {
  if (!isClientEncrypted(value)) {
    return value;
  }
  try {
    return await decryptFromClientStorage(value, secret);
  } catch (err) {
    console.warn('[memberPii] field decrypt failed', err);
    return value;
  }
}

/**
 * Decrypt a PII string that may be one FLENC1 blob or several joined with spaces
 * (e.g. backend `fullName` / `memberName` built from encrypted first + last).
 */
export async function decryptPiiString(value: string, secret: string): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed || !isClientEncrypted(trimmed)) {
    return trimmed;
  }

  const hasMultiple = /\s+FLENC1:/.test(trimmed);
  if (!hasMultiple && trimmed.indexOf('FLENC1:', CLIENT_STORAGE_PREFIX.length) === -1) {
    return decryptSingleSegment(trimmed, secret);
  }

  const segments = trimmed
    .split(/\s+(?=FLENC1:)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const parts = await Promise.all(segments.map((s) => decryptSingleSegment(s, secret)));
  const joined = parts.join(' ').trim();
  if (joined && !parts.some((p) => isClientEncrypted(p))) {
    return joined;
  }
  return trimmed;
}

function isMemberLike(obj: Record<string, unknown>): boolean {
  return typeof obj['id'] === 'number' && 'firstName' in obj;
}

/** Rebuild display fullName from decrypted first + last (backend may send combined ciphertext). */
function hydrateMemberDisplayFields(obj: Record<string, unknown>): void {
  const first = String(obj['firstName'] ?? '').trim();
  const last = String(obj['lastName'] ?? '').trim();
  if (!first || isClientEncrypted(first)) {
    return;
  }
  obj['fullName'] = `${first} ${last}`.trim();
}

export function memberDisplayName(m: {
  firstName?: string;
  lastName?: string;
  fullName?: string;
}): string {
  const first = m.firstName?.trim() ?? '';
  const last = m.lastName?.trim() ?? '';
  const fromParts = `${first} ${last}`.trim();
  if (fromParts && !isClientEncrypted(fromParts)) {
    return fromParts;
  }
  const full = m.fullName?.trim();
  if (full && !isClientEncrypted(full)) {
    return full;
  }
  return '-';
}

/** Label for API rows that expose `memberName` and/or `fullName` (attendance, billing, reports). */
export function displayMemberLabel(row: {
  memberName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}): string {
  const memberName = row.memberName?.trim();
  if (memberName && !isClientEncrypted(memberName)) {
    return memberName;
  }
  return memberDisplayName(row);
}

/** Hide ciphertext in templates; use after decrypt or for legacy plaintext. */
export function displayPiiField(value: string | null | undefined, empty = '-'): string {
  const text = value?.trim();
  if (!text) return empty;
  return isClientEncrypted(text) ? empty : text;
}

/**
 * Recursively seal (encrypt) or unseal (decrypt) whitelisted string fields on API payloads/responses.
 */
export async function transformMemberPiiDeep(
  value: unknown,
  secret: string,
  seal: boolean
): Promise<unknown> {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => transformMemberPiiDeep(item, secret, seal)));
  }

  if (t !== 'object') return value;

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, v] of Object.entries(obj)) {
    if (key === 'addressJson' && v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const addr = v as Record<string, unknown>;
      const sealedAddr: Record<string, unknown> = {};
      for (const [ak, av] of Object.entries(addr)) {
        if (typeof av === 'string' && av !== '') {
          sealedAddr[ak] = seal ? await encryptField(av, secret) : await decryptPiiString(av, secret);
        } else {
          sealedAddr[ak] = av;
        }
      }
      out[key] = sealedAddr;
      continue;
    }

    if (typeof v === 'string' && v !== '' && MEMBER_PII_STRING_KEYS.has(key)) {
      out[key] = seal ? await encryptField(v, secret) : await decryptPiiString(v, secret);
    } else if (
      typeof v === 'string' &&
      v !== '' &&
      key === 'fullName' &&
      !('firstName' in obj)
    ) {
      out[key] = seal ? await encryptField(v, secret) : await decryptPiiString(v, secret);
    } else if (v !== null && typeof v === 'object') {
      out[key] = await transformMemberPiiDeep(v, secret, seal);
    } else {
      out[key] = v;
    }
  }

  if (!seal && isMemberLike(out)) {
    hydrateMemberDisplayFields(out);
  }

  return out;
}
