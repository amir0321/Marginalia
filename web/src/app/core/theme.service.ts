import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const THEME_KEY = 'marginalia.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly current = signal<Theme>(this.resolveInitialTheme());

  constructor() {
    this.applyTheme(this.current());
  }

  toggle(): void {
    const next: Theme = this.current() === 'light' ? 'dark' : 'light';
    this.current.set(next);
    this.applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
    }
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  private resolveInitialTheme(): Theme {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
