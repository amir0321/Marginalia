import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

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

  login(_username: string, _password: string): void {
    throw new Error('TODO: implementera login()');
  }

  register(_username: string, _password: string): void {
    throw new Error('TODO: implementera register()');
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
