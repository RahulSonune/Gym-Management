/**
 * Client-side AES-GCM encryption for browser storage and member PII transport.
 *
 * IV is deterministic (SHA-256 based on secret + plaintext, first 96 bits): the same plaintext
 * and secret always yields the same ciphertext. This exposes **equality leaks** — anyone who sees
 * two matching blobs knows the underlying values match; use only where that trade-off is acceptable.
 *
 * Uses the Web Crypto API. The secret lives in the app bundle — this is obfuscation at rest,
 * not a replacement for HTTPS, server-side auth, or protecting data from someone with devtools access.
 */

export const CLIENT_STORAGE_PREFIX = 'FLENC1:';
const STORAGE_PREFIX = CLIENT_STORAGE_PREFIX;

/** True when the value was produced by {@link encryptForClientStorage}. */
export function isClientEncrypted(value: string | null | undefined): boolean {
  return !!value?.trim().startsWith(STORAGE_PREFIX);
}
const PBKDF2_ITERATIONS = 100_000;
const IV_LENGTH = 12;
const VERSION_BYTE = 1;

/**
 * Synthetic IV derived from secret + plaintext so AES-GCM output is deterministic for the same inputs.
 * Different plaintext ⇒ different IV (under SHA-256), avoiding nonce reuse with distinct messages under one key.
 */
async function deterministicIv(secret: string, plaintext: string): Promise<Uint8Array> {
  const label = encodeUtf8('fitlife.aesgcm.iv.v1');
  const sb = encodeUtf8(secret);
  const pb = encodeUtf8(plaintext);
  const input = new Uint8Array(label.byteLength + sb.byteLength + pb.byteLength);
  input.set(label, 0);
  input.set(sb, label.byteLength);
  input.set(pb, label.byteLength + sb.byteLength);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
  return digest.subarray(0, IV_LENGTH);
}

function encodeUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function decodeUtf8(bytes: ArrayBuffer): string {
  return new TextDecoder().decode(bytes);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const enc = encodeUtf8(secret);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const salt = encodeUtf8('fitlife.client-storage.pbkdf2.salt.v1');
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a UTF-8 string. Output is prefixed for storage so decrypt can detect format.
 */
export async function encryptForClientStorage(plaintext: string, secret: string): Promise<string> {
  if (!secret?.trim()) {
    throw new Error('clientStorageSecret is required for encryption');
  }
  const key = await deriveAesKey(secret);
  const iv = await deterministicIv(secret, plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encodeUtf8(plaintext) as BufferSource
  );

  const ct = new Uint8Array(ciphertext);
  const packed = new Uint8Array(1 + IV_LENGTH + ct.length);
  packed[0] = VERSION_BYTE;
  packed.set(iv, 1);
  packed.set(ct, 1 + IV_LENGTH);

  return STORAGE_PREFIX + toBase64(packed);
}

/**
 * Decrypt a string produced by {@link encryptForClientStorage}.
 * If the value does not use the encrypted prefix, returns it unchanged (legacy plaintext migration).
 */
export async function decryptFromClientStorage(stored: string, secret: string): Promise<string> {
  const trimmed = stored.trim();
  if (!trimmed.startsWith(STORAGE_PREFIX)) {
    return trimmed;
  }
  if (!secret?.trim()) {
    throw new Error('clientStorageSecret is required for decryption');
  }

  const packed = fromBase64(trimmed.slice(STORAGE_PREFIX.length));
  if (packed.length < 1 + IV_LENGTH + 16) {
    throw new Error('Invalid encrypted payload length');
  }
  if (packed[0] !== VERSION_BYTE) {
    throw new Error('Unsupported crypto payload version');
  }

  const iv = packed.subarray(1, 1 + IV_LENGTH);
  const ciphertext = packed.subarray(1 + IV_LENGTH);

  const key = await deriveAesKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );
  return decodeUtf8(decrypted);
}
