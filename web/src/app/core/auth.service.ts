import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, tap, throwError } from 'rxjs';
import { ApiWakeService } from './api-wake.service';
import { SUPPRESS_GATEWAY_ERROR_TOAST } from './auth.interceptor';
import { AuthResponse, LoginRequest, RegisterRequest } from './models';

const TOKEN_KEY = 'marginalia.token';

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiWake = inject(ApiWakeService);

  private readonly _token = signal<string | null>(this.readToken());

  readonly isLoggedIn = computed(() => {
    const token = this._token();
    if (!token) return false;
    const payload = parseJwtPayload(token);
    if (!payload) return false;
    const exp = payload['exp'] as number | undefined;
    return exp ? Date.now() / 1000 < exp : false;
  });

  readonly username = computed<string>(() => {
    const token = this._token();
    if (!token) return '';
    const payload = parseJwtPayload(token);
    return (payload?.['unique_name'] as string) ?? '';
  });

  getToken(): string | null {
    return this._token();
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
    }
    this._token.set(token);
  }

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
    }
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.executeWithWakeRetry(suppressToast =>
      this.http.post<AuthResponse>('/api/auth/login', request, {
        context: new HttpContext().set(SUPPRESS_GATEWAY_ERROR_TOAST, suppressToast),
      })
    ).pipe(tap(response => this.setToken(response.token)));
  }

  register(request: RegisterRequest): Observable<void> {
    return this.executeWithWakeRetry(suppressToast =>
      this.http.post<void>('/api/auth/register', request, {
        context: new HttpContext().set(SUPPRESS_GATEWAY_ERROR_TOAST, suppressToast),
      })
    );
  }

  private executeWithWakeRetry<T>(
    requestFn: (suppressGatewayToast: boolean) => Observable<T>
  ): Observable<T> {
    return this.apiWake.waitUntilAwake().pipe(
      switchMap(wasAwake =>
        requestFn(wasAwake).pipe(
          catchError((err: unknown) => {
            if (
              wasAwake &&
              err instanceof HttpErrorResponse &&
              (err.status === 502 || err.status === 503 || err.status === 504)
            ) {
              return this.apiWake.wakeAndWait().pipe(switchMap(() => requestFn(false)));
            }
            return throwError(() => err);
          })
        )
      )
    );
  }

  private readToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      const payload = parseJwtPayload(token);
      if (!payload) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      const exp = payload['exp'] as number | undefined;
      if (!exp || Date.now() / 1000 >= exp) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }
}
