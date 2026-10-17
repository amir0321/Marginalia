import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

function createMockToken(username: string, expInSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expInSecondsFromNow;
  const payload = btoa(JSON.stringify({
    sub: '12345678-1234-1234-1234-123456789abc',
    unique_name: username,
    exp
  }));
  return `${header}.${payload}.mockSignature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.removeItem('marginalia.token');
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.removeItem('marginalia.token');
  });

  it('should be created and default to logged out when no token exists', () => {
    expect(service).toBeTruthy();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.username()).toBe('');
    expect(service.getToken()).toBeNull();
  });

  it('should recognize valid token and expose username and isLoggedIn as true', () => {
    const validToken = createMockToken('bokmalen', 3600);
    service.setToken(validToken);

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.username()).toBe('bokmalen');
    expect(service.getToken()).toBe(validToken);
    expect(localStorage.getItem('marginalia.token')).toBe(validToken);
  });

  it('should treat expired token as not logged in', () => {
    const expiredToken = createMockToken('gammalanvandare', -3600);
    service.setToken(expiredToken);

    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should clear token and navigate to /login on logout', () => {
    const validToken = createMockToken('bokmalen', 3600);
    service.setToken(validToken);

    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.username()).toBe('');
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('marginalia.token')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
