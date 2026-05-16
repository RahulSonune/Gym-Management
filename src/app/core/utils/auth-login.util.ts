import { environment } from '../../../environments/environment';
import { encryptForClientStorage } from './client-crypto.util';
import { memberPiiEncryptionEnabled } from './member-pii-rx.util';

export interface SealedLoginBody {
  credentials?: string;
  email?: string;
  password?: string;
}

/** Login body with sealed credentials envelope (email + password not visible in JSON). */
export async function buildLoginRequestBody(
  email: string,
  password: string
): Promise<SealedLoginBody> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!memberPiiEncryptionEnabled()) {
    return { email: normalizedEmail, password };
  }
  const inner = JSON.stringify({ email: normalizedEmail, password });
  const credentials = await encryptForClientStorage(inner, environment.clientStorageSecret);
  return { credentials };
}
