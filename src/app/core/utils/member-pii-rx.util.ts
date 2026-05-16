import { Observable, catchError, from, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { transformMemberPiiDeep } from './member-pii-crypto.util';

export function memberPiiEncryptionEnabled(): boolean {
  return environment.memberPiiEncryptionEnabled && !!environment.clientStorageSecret?.trim();
}

function secret(): string {
  return environment.clientStorageSecret;
}

/** Decrypt member PII on API responses (no-op when disabled; legacy plaintext passes through). */
export function unsealMemberPii<T>(source: Observable<T>): Observable<T> {
  if (!memberPiiEncryptionEnabled()) return source;
  return source.pipe(
    switchMap((data) =>
      from(transformMemberPiiDeep(data, secret(), false) as Promise<T>).pipe(
        catchError((err) => {
          console.warn('[memberPii] decrypt failed, using raw API payload', err);
          return of(data);
        })
      )
    )
  );
}

/** Encrypt request body, call API, decrypt response. */
export function sealMemberPiiRequest<B, R>(
  body: B,
  apiCall: (sealedBody: B) => Observable<R>
): Observable<R> {
  if (!memberPiiEncryptionEnabled()) return apiCall(body);
  return from(transformMemberPiiDeep(body, secret(), true) as Promise<B>).pipe(
    switchMap((sealed) => apiCall(sealed)),
    switchMap((res) => from(transformMemberPiiDeep(res, secret(), false) as Promise<R>))
  );
}
