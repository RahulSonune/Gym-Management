import { encryptForClientStorage, isClientEncrypted } from './client-crypto.util';
import { decryptPiiString, displayPiiField } from './member-pii-crypto.util';

/** Sealed in API responses and staff create (except password only on write). */
export const STAFF_PII_STRING_KEYS = new Set(['fullName', 'phone', 'email']);

export const STAFF_WRITE_SECRET_KEYS = new Set(['password']);

function encryptField(value: string, secret: string): Promise<string> {
  return encryptForClientStorage(value, secret);
}

function isStaffLike(obj: Record<string, unknown>): boolean {
  return (
    typeof obj['id'] === 'number' &&
    typeof obj['fullName'] === 'string' &&
    Array.isArray(obj['roles'])
  );
}

export { displayPiiField };

export async function transformStaffPiiDeep(
  value: unknown,
  secret: string,
  seal: boolean,
  extraSealKeys: Set<string> = new Set()
): Promise<unknown> {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => transformStaffPiiDeep(item, secret, seal, extraSealKeys)));
  }

  if (t !== 'object') return value;

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, v] of Object.entries(obj)) {
    const shouldSeal =
      seal && (STAFF_PII_STRING_KEYS.has(key) || STAFF_WRITE_SECRET_KEYS.has(key) || extraSealKeys.has(key));
    const shouldUnseal = !seal && STAFF_PII_STRING_KEYS.has(key);

    if (typeof v === 'string' && v !== '' && (shouldSeal || shouldUnseal)) {
      out[key] = seal ? await encryptField(v, secret) : await decryptPiiString(v, secret);
    } else if (v !== null && typeof v === 'object') {
      out[key] = await transformStaffPiiDeep(v, secret, seal, extraSealKeys);
    } else {
      out[key] = v;
    }
  }

  if (!seal && isStaffLike(out) && typeof out['fullName'] === 'string') {
    const name = String(out['fullName']).trim();
    if (!name || isClientEncrypted(name)) {
      out['fullName'] = '-';
    }
  }

  return out;
}
