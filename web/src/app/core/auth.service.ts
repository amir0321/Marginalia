import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap(response => this.setToken(response.token))
    );
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<void>('/api/auth/register', request);
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
