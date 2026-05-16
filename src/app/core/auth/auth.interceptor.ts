import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      const status = err?.status as number | undefined;
      // Invalid or expired JWT returns 403 from Spring Security; clear stale mock sessions.
      if (status === 401 || (status === 403 && token)) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
