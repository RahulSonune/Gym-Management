import { environment } from '../../../environments/environment';
import { AuthUser } from '../models';
import { decryptPiiString } from './member-pii-crypto.util';
import { memberPiiEncryptionEnabled } from './member-pii-rx.util';

export async function unsealAuthUser(user: AuthUser): Promise<AuthUser> {
  if (!memberPiiEncryptionEnabled()) {
    return user;
  }
  const secret = environment.clientStorageSecret;
  const [email, fullName] = await Promise.all([
    user.email ? decryptPiiString(user.email, secret) : Promise.resolve(user.email),
    user.fullName ? decryptPiiString(user.fullName, secret) : Promise.resolve(user.fullName),
  ]);
  return { ...user, email, fullName };
}
