import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/AuthService/auth';

const withToken = (req: HttpRequest<unknown>, token: string | null) =>
  token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthCall = req.url.includes('/auth/');

  return next(withToken(req, isAuthCall ? null : auth.token())).pipe(
    catchError(err => {
      if (err.status !== 401 || isAuthCall || !auth.isLoggedIn()) {
        return throwError(() => err);
      }

      // access token rejected: refresh once, then retry the original request
      return from(auth.refresh()).pipe(
        switchMap(newToken => next(withToken(req, newToken))),
        catchError(refreshErr => {
          auth.logout();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};