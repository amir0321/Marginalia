import { Injectable, signal, OnDestroy } from '@angular/core';

type Theme = 'light' | 'dark';
const THEME_KEY = 'marginalia.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  readonly current = signal<Theme>(this.resolveInitialTheme());
  private mediaQueryList?: MediaQueryList;
  private mediaQueryListener?: (e: MediaQueryListEvent) => void;

  constructor() {
    this.applyTheme(this.current());
    this.listenToSystemChanges();
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

  ngOnDestroy(): void {
    if (this.mediaQueryList && this.mediaQueryListener) {
      if (this.mediaQueryList.removeEventListener) {
        this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
      } else if ((this.mediaQueryList as any).removeListener) {
        (this.mediaQueryList as any).removeListener(this.mediaQueryListener);
      }
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
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
      ? 'dark'
      : 'light';
  }

  private listenToSystemChanges(): void {
    try {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryListener = (e: MediaQueryListEvent) => {
        try {
          const stored = localStorage.getItem(THEME_KEY);
          if (!stored) {
            const systemTheme: Theme = e.matches ? 'dark' : 'light';
            this.current.set(systemTheme);
            this.applyTheme(systemTheme);
          }
        } catch {}
      };
      if (this.mediaQueryList.addEventListener) {
        this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
      } else if ((this.mediaQueryList as any).addListener) {
        (this.mediaQueryList as any).addListener(this.mediaQueryListener);
      }
    } catch {}
  }
}
