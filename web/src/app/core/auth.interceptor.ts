import {
  HttpContextToken,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export const SUPPRESS_GATEWAY_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

const AUTH_PATHS_PASSTHROUGH = ['/api/auth/login', '/api/auth/register'];

function isGatewayWakeStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  const isApiCall = req.url.startsWith('/api');
  const isPassthrough = AUTH_PATHS_PASSTHROUGH.some(p => req.url.startsWith(p));

  let outReq = req;

  if (isApiCall && !isPassthrough) {
    const token = auth.getToken();
    if (token) {
      outReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return next(outReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && isApiCall) {
        if (err.status === 401) {
          if (!isPassthrough) {
            auth.logout();
            toast.show(
              'Din session har gått ut. Logga in igen för att fortsätta.',
              'warning'
            );
          }
        } else {
          const suppressGatewayToast =
            req.context.get(SUPPRESS_GATEWAY_ERROR_TOAST) && isGatewayWakeStatus(err.status);

          if (
            !req.url.startsWith('/api/health') &&
            !suppressGatewayToast &&
            (err.status === 0 || err.status >= 500)
          ) {
            toast.show(
              'Kunde inte nå servern just nu. Kontrollera din anslutning och försök igen.',
              'danger'
            );
          }
        }
      }
      return throwError(() => err);
    })
  );
};
