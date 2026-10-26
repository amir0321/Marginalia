import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Authorization header for relative /api calls when token is present', () => {
    authSpy.getToken.and.returnValue('valid-mock-token');

    http.get('/api/books').subscribe();

    const req = httpMock.expectOne('/api/books');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-mock-token');
    req.flush([]);
  });

  it('should not attach Authorization header for relative /api calls when no token is present', () => {
    authSpy.getToken.and.returnValue(null);

    http.get('/api/books').subscribe();

    const req = httpMock.expectOne('/api/books');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should not attach Authorization header for login passthrough', () => {
    authSpy.getToken.and.returnValue('valid-mock-token');

    http.post('/api/auth/login', { username: 'test', password: 'password123' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ token: 'new-token' });
  });

  it('should not attach Authorization header for register passthrough', () => {
    authSpy.getToken.and.returnValue('valid-mock-token');

    http.post('/api/auth/register', { username: 'test', password: 'password123' }).subscribe();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({}, { status: 201, statusText: 'Created' });
  });

  it('should not attach Authorization header for non-/api calls', () => {
    authSpy.getToken.and.returnValue('valid-mock-token');

    http.get('/assets/test.json').subscribe();

    const req = httpMock.expectOne('/assets/test.json');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should handle 401 on protected /api call by logging out, navigating to login, and showing toast', () => {
    authSpy.getToken.and.returnValue('expired-token');

    let errorResponse: unknown;
    http.get('/api/books').subscribe({
      error: err => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/api/books');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(toastSpy.show).toHaveBeenCalledWith(
      'Din session har gått ut. Logga in igen för att fortsätta.',
      'warning'
    );
    expect(errorResponse).toBeTruthy();
  });

  it('should not trigger session expiration logout or redirect when 401 is returned from login endpoint', () => {
    let errorResponse: unknown;
    http.post('/api/auth/login', { username: 'user', password: 'wrong' }).subscribe({
      error: err => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush('Wrong credentials', { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(toastSpy.show).not.toHaveBeenCalled();
    expect(errorResponse).toBeTruthy();
  });

  it('should not trigger session expiration logout or redirect when 401 is returned from register endpoint', () => {
    let errorResponse: unknown;
    http.post('/api/auth/register', { username: 'user', password: 'pwd' }).subscribe({
      error: err => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/api/auth/register');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(toastSpy.show).not.toHaveBeenCalled();
    expect(errorResponse).toBeTruthy();
  });

  it('should show danger toast when /api request fails with status 0 (network error)', () => {
    http.get('/api/books').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/books');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(toastSpy.show).toHaveBeenCalledWith(
      'Kunde inte nå servern just nu. Kontrollera din anslutning och försök igen.',
      'danger'
    );
  });

  it('should show danger toast when /api request fails with 5xx server error', () => {
    http.get('/api/books').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/books');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(toastSpy.show).toHaveBeenCalledWith(
      'Kunde inte nå servern just nu. Kontrollera din anslutning och försök igen.',
      'danger'
    );
  });

  it('should not show server error toast when /api/health fails with status 0 or 500', () => {
    http.get('/api/health').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/health');
    req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(toastSpy.show).not.toHaveBeenCalled();
  });

  it('should not show server error toast for 4xx errors like 400 Bad Request', () => {
    http.post('/api/books', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/books');
    req.flush({ errors: {} }, { status: 400, statusText: 'Bad Request' });

    expect(toastSpy.show).not.toHaveBeenCalled();
  });

  it('should not show server error toast for non-/api requests failing with 500', () => {
    http.get('/assets/config.json').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/assets/config.json');
    req.flush('Not Found', { status: 500, statusText: 'Server Error' });

    expect(toastSpy.show).not.toHaveBeenCalled();
  });
});
