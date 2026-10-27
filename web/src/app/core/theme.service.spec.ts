import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.removeItem('marginalia.theme');
    document.documentElement.removeAttribute('data-bs-theme');
    originalMatchMedia = window.matchMedia;
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.removeItem('marginalia.theme');
    document.documentElement.removeAttribute('data-bs-theme');
    window.matchMedia = originalMatchMedia;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle between light and dark', () => {
    const initial = service.current();
    const expectedNext = initial === 'light' ? 'dark' : 'light';

    service.toggle();
    expect(service.current()).toBe(expectedNext);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe(expectedNext);
    expect(localStorage.getItem('marginalia.theme')).toBe(expectedNext);

    service.toggle();
    expect(service.current()).toBe(initial);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe(initial);
    expect(localStorage.getItem('marginalia.theme')).toBe(initial);
  });

  it('should restore stored theme from localStorage', () => {
    localStorage.setItem('marginalia.theme', 'dark');
    TestBed.resetTestingModule();
    const newService = TestBed.inject(ThemeService);
    expect(newService.current()).toBe('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('should use prefers-color-scheme: dark on first visit when no theme is in localStorage', () => {
    localStorage.removeItem('marginalia.theme');
    window.matchMedia = jasmine.createSpy().and.callFake((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent'),
    })) as any;

    TestBed.resetTestingModule();
    const systemDarkService = TestBed.inject(ThemeService);
    expect(systemDarkService.current()).toBe('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('should use prefers-color-scheme: light on first visit when dark mode is not preferred', () => {
    localStorage.removeItem('marginalia.theme');
    window.matchMedia = jasmine.createSpy().and.callFake((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent'),
    })) as any;

    TestBed.resetTestingModule();
    const systemLightService = TestBed.inject(ThemeService);
    expect(systemLightService.current()).toBe('light');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('should react to prefers-color-scheme changes when no stored choice exists', () => {
    localStorage.removeItem('marginalia.theme');
    let listener: ((e: any) => void) | null = null;
    window.matchMedia = jasmine.createSpy().and.callFake((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      addEventListener: jasmine.createSpy('addEventListener').and.callFake((event: string, fn: any) => {
        if (event === 'change') listener = fn;
      }),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent'),
    })) as any;

    TestBed.resetTestingModule();
    const dynamicService = TestBed.inject(ThemeService);
    expect(dynamicService.current()).toBe('light');
    expect(listener).toBeTruthy();

    // Trigger system theme change to dark
    listener!({ matches: true } as any);
    expect(dynamicService.current()).toBe('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');

    // Trigger system theme change back to light
    listener!({ matches: false } as any);
    expect(dynamicService.current()).toBe('light');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('should ignore prefers-color-scheme changes when a preference is stored in localStorage', () => {
    localStorage.setItem('marginalia.theme', 'light');
    let listener: ((e: any) => void) | null = null;
    window.matchMedia = jasmine.createSpy().and.callFake((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      addEventListener: jasmine.createSpy('addEventListener').and.callFake((event: string, fn: any) => {
        if (event === 'change') listener = fn;
      }),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent'),
    })) as any;

    TestBed.resetTestingModule();
    const explicitService = TestBed.inject(ThemeService);
    expect(explicitService.current()).toBe('light');
    expect(listener).toBeTruthy();

    // System changes to dark, but user explicitly chose light in localStorage
    listener!({ matches: true } as any);
    expect(explicitService.current()).toBe('light');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });
});
