import { Observable, catchError, from, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { transformStaffPiiDeep } from './staff-pii-crypto.util';
import { memberPiiEncryptionEnabled } from './member-pii-rx.util';

export function staffPiiEncryptionEnabled(): boolean {
  return memberPiiEncryptionEnabled();
}

function secret(): string {
  return environment.clientStorageSecret;
}

export function unsealStaffPii<T>(source: Observable<T>): Observable<T> {
  if (!staffPiiEncryptionEnabled()) return source;
  return source.pipe(
    switchMap((data) =>
      from(transformStaffPiiDeep(data, secret(), false) as Promise<T>).pipe(
        catchError((err) => {
          console.warn('[staffPii] decrypt failed, using raw API payload', err);
          return of(data);
        })
      )
    )
  );
}

export function sealStaffPiiRequest<B, R>(
  body: B,
  apiCall: (sealedBody: B) => Observable<R>
): Observable<R> {
  if (!staffPiiEncryptionEnabled()) return apiCall(body);
  return from(transformStaffPiiDeep(body, secret(), true) as Promise<B>).pipe(
    switchMap((sealed) => apiCall(sealed)),
    switchMap((res) =>
      from(transformStaffPiiDeep(res, secret(), false) as Promise<R>).pipe(
        catchError(() => of(res))
      )
    )
  );
}
