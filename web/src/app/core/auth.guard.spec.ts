import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
    router = TestBed.inject(Router);
  });

  it('should allow navigation when user is logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeTrue();
  });

  it('should redirect to /login when user is not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/login');
  });
});
