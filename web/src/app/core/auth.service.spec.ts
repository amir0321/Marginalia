import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse, LoginRequest, RegisterRequest } from './models';

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
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('marginalia.token');
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.removeItem('marginalia.token');
    httpMock.verify();
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

  it('should call POST /api/auth/login, persist token, and return auth response', () => {
    const loginReq: LoginRequest = { username: 'testuser', password: 'password123' };
    const mockToken = createMockToken('testuser', 3600);
    const mockResponse: AuthResponse = {
      token: mockToken,
      username: 'testuser',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    };

    let actualResponse: AuthResponse | undefined;
    service.login(loginReq).subscribe(res => {
      actualResponse = res;
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginReq);
    req.flush(mockResponse);

    expect(actualResponse).toEqual(mockResponse);
    expect(service.getToken()).toBe(mockToken);
    expect(localStorage.getItem('marginalia.token')).toBe(mockToken);
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.username()).toBe('testuser');
  });

  it('should call POST /api/auth/register with request payload', () => {
    const registerReq: RegisterRequest = { username: 'newuser', password: 'password123' };
    let completed = false;

    service.register(registerReq).subscribe({
      next: () => {
        completed = true;
      }
    });

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerReq);
    req.flush(null, { status: 201, statusText: 'Created' });

    expect(completed).toBeTrue();
  });

  it('should purge corrupt token from localStorage on initialization and return null', () => {
    localStorage.setItem('marginalia.token', 'not-a-valid-jwt-token');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });
    const freshService = TestBed.inject(AuthService);
    expect(freshService.getToken()).toBeNull();
    expect(localStorage.getItem('marginalia.token')).toBeNull();
  });

  it('should purge expired token from localStorage on initialization and return null', () => {
    const expiredToken = createMockToken('gammalanvandare', -3600);
    localStorage.setItem('marginalia.token', expiredToken);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });
    const freshService = TestBed.inject(AuthService);
    expect(freshService.getToken()).toBeNull();
    expect(localStorage.getItem('marginalia.token')).toBeNull();
  });
});
