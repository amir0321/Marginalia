import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth.service';
import { ThemeService } from '../../../core/theme.service';
import { AuthResponse } from '../../../core/models';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and have initial invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.form.valid).toBeFalse();
    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBeNull();
  });

  it('should show validation errors and alert on submit with empty form', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(authSpy.login).not.toHaveBeenCalled();
    expect(component.form.controls.username.touched).toBeTrue();
    expect(component.form.controls.password.touched).toBeTrue();
    expect(component.usernameInvalid()).toBeTrue();
    expect(component.usernameError()).toBe('Ange ett användarnamn');
    expect(component.passwordInvalid()).toBeTrue();
    expect(component.passwordError()).toBe('Ange ett lösenord');
    expect(component.errorMessage()).toBe('Kontrollera de markerade fälten');
  });

  it('should validate whitespace-only username as required', () => {
    component.form.controls.username.setValue('    ');
    component.form.controls.username.markAsTouched();

    expect(component.usernameInvalid()).toBeTrue();
    expect(component.usernameError()).toBe('Ange ett användarnamn');
  });

  it('should validate password minlength of 8 characters', () => {
    component.form.controls.password.setValue('short');
    component.form.controls.password.markAsTouched();

    expect(component.passwordInvalid()).toBeTrue();
    expect(component.passwordError()).toBe('Använd minst 8 tecken');
  });

  it('should toggle password visibility when button clicked', () => {
    expect(component.showPassword()).toBeFalse();
    component.showPassword.set(true);
    expect(component.showPassword()).toBeTrue();
  });

  it('should call auth.login with trimmed username and navigate to /books on success', () => {
    const mockResponse: AuthResponse = {
      token: 'jwt-token',
      username: 'bokmalen',
      expiresAt: '2026-12-31T23:59:59Z',
    };
    authSpy.login.and.returnValue(of(mockResponse));

    component.form.controls.username.setValue('  bokmalen  ');
    component.form.controls.password.setValue('password123');

    component.onSubmit();

    expect(authSpy.login).toHaveBeenCalledWith({
      username: 'bokmalen',
      password: 'password123',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/books']);
    expect(component.isSubmitting()).toBeFalse();
  });

  it('should show "Fel användarnamn eller lösenord" on 401 Unauthorized', () => {
    const errorResponse = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: 'Invalid credentials',
    });
    authSpy.login.and.returnValue(throwError(() => errorResponse));

    component.form.controls.username.setValue('bokmalen');
    component.form.controls.password.setValue('felaktigt123');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Fel användarnamn eller lösenord');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBeFalse();
  });

  it('should map 400 ProblemDetails errors to form fields', () => {
    const errorResponse = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: {
        title: 'Validation Failed',
        errors: {
          Username: ['Ogiltigt användarnamn från servern'],
        },
      },
    });
    authSpy.login.and.returnValue(throwError(() => errorResponse));

    component.form.controls.username.setValue('bokmalen');
    component.form.controls.password.setValue('password123');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.usernameInvalid()).toBeTrue();
    expect(component.usernameError()).toBe('Ogiltigt användarnamn från servern');
    expect(component.errorMessage()).toBe('Kontrollera de markerade fälten');
  });
});
