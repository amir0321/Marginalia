import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['register']);
    toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and have initial invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.form.valid).toBeFalse();
    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBeNull();
  });

  it('should validate empty username as required', () => {
    component.form.controls.username.setValue('   ');
    component.form.controls.username.markAsTouched();

    expect(component.usernameInvalid()).toBeTrue();
    expect(component.usernameError()).toBe('Ange ett användarnamn');
  });

  it('should validate username length between 3 and 30 characters', () => {
    component.form.controls.username.setValue('ab');
    component.form.controls.username.markAsTouched();

    expect(component.usernameInvalid()).toBeTrue();
    expect(component.usernameError()).toBe('Användarnamnet måste vara mellan 3 och 30 tecken');

    component.form.controls.username.setValue('a'.repeat(31));
    expect(component.usernameInvalid()).toBeTrue();
    expect(component.usernameError()).toBe('Användarnamnet måste vara mellan 3 och 30 tecken');
  });

  it('should validate username allowed characters (letters, numbers, dot, underscore, hyphen)', () => {
    component.form.controls.username.setValue('user@name!');
    component.form.controls.username.markAsTouched();

    expect(component.usernameInvalid()).toBeTrue();
    expect(component.usernameError()).toBe(
      'Användarnamnet får bara innehålla bokstäver, siffror, punkt, understreck och bindestreck'
    );

    component.form.controls.username.setValue('user.name-123_ok');
    expect(component.form.controls.username.valid).toBeTrue();
  });

  it('should validate password minimum length of 8 characters', () => {
    component.form.controls.password.setValue('short');
    component.form.controls.password.markAsTouched();

    expect(component.passwordInvalid()).toBeTrue();
    expect(component.passwordError()).toBe('Använd minst 8 tecken');
  });

  it('should calculate password strength levels and labels', () => {
    component.form.controls.password.setValue('');
    expect(component.strengthLevel()).toBe(0);
    expect(component.strengthText()).toBe('ange lösenord');

    component.form.controls.password.setValue('short');
    expect(component.strengthLevel()).toBe(1);
    expect(component.strengthText()).toBe('svag');

    component.form.controls.password.setValue('length08');
    expect(component.strengthLevel()).toBe(2);
    expect(component.strengthText()).toBe('bra');

    component.form.controls.password.setValue('mediumlength10');
    expect(component.strengthLevel()).toBe(3);
    expect(component.strengthText()).toBe('bra');

    component.form.controls.password.setValue('VeryStrongPassword123');
    expect(component.strengthLevel()).toBe(4);
    expect(component.strengthText()).toBe('stark');
  });

  it('should validate confirmPassword matching password', () => {
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('different123');
    component.form.controls.confirmPassword.markAsTouched();

    expect(component.confirmPasswordInvalid()).toBeTrue();
    expect(component.confirmPasswordError()).toBe('Lösenorden matchar inte');

    component.form.controls.confirmPassword.setValue('password123');
    expect(component.confirmPasswordInvalid()).toBeFalse();
  });

  it('should show alert and mark all touched on invalid submit', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(authSpy.register).not.toHaveBeenCalled();
    expect(component.form.controls.username.touched).toBeTrue();
    expect(component.form.controls.password.touched).toBeTrue();
    expect(component.form.controls.confirmPassword.touched).toBeTrue();
    expect(component.errorMessage()).toBe('Kontrollera de markerade fälten');
  });

  it('should call auth.register and redirect to /login with toast on 201 Created', () => {
    authSpy.register.and.returnValue(of(undefined));

    component.form.controls.username.setValue('  bokmalen  ');
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');

    component.onSubmit();

    expect(authSpy.register).toHaveBeenCalledWith({
      username: 'bokmalen',
      password: 'password123',
    });
    expect(toastSpy.show).toHaveBeenCalledWith(
      'Konto skapat! Du kan nu logga in.',
      'success'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.isSubmitting()).toBeFalse();
  });

  it('should handle 409 Conflict by showing username taken error', () => {
    const errorResponse = new HttpErrorResponse({
      status: 409,
      statusText: 'Conflict',
      error: 'Username taken',
    });
    authSpy.register.and.returnValue(throwError(() => errorResponse));

    component.form.controls.username.setValue('bokmalen');
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.usernameInvalid()).toBeTrue();
    expect(component.usernameError()).toBe('Användarnamnet är redan upptaget');
    expect(component.errorMessage()).toBe('Användarnamnet är redan upptaget');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBeFalse();
  });

  it('should handle 400 ProblemDetails errors from backend', () => {
    const errorResponse = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: {
        title: 'Validation Failed',
        errors: {
          Password: ['Lösenordet uppfyller inte säkerhetskraven.'],
        },
      },
    });
    authSpy.register.and.returnValue(throwError(() => errorResponse));

    component.form.controls.username.setValue('bokmalen');
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.passwordInvalid()).toBeTrue();
    expect(component.passwordError()).toBe('Lösenordet uppfyller inte säkerhetskraven.');
    expect(component.errorMessage()).toBe('Kontrollera de markerade fälten');
  });

  it('should validate password maxLength of 128 characters', () => {
    component.form.controls.password.setValue('a'.repeat(129));
    component.form.controls.password.markAsTouched();

    expect(component.passwordInvalid()).toBeTrue();
    expect(component.passwordError()).toBe('Lösenordet får vara högst 128 tecken');
  });

  it('should show 429 rate limit error message on HTTP 429', () => {
    const errorResponse = new HttpErrorResponse({
      status: 429,
      statusText: 'Too Many Requests',
      error: {
        title: 'Too Many Requests',
        detail: 'För många försök. Vänta en stund och försök igen.',
      },
    });
    authSpy.register.and.returnValue(throwError(() => errorResponse));

    component.form.controls.username.setValue('bokmalen');
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('För många försök. Vänta en stund och försök igen.');
    expect(component.isSubmitting()).toBeFalse();
  });
});
