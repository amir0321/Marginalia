import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.removeItem('marginalia.theme');
    document.documentElement.removeAttribute('data-bs-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.removeItem('marginalia.theme');
    document.documentElement.removeAttribute('data-bs-theme');
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
});
