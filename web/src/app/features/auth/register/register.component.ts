import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthHeroComponent } from '../auth-hero/auth-hero.component';
import { LogoComponent } from '../../../shared/logo/logo.component';
import { ThemeService } from '../../../core/theme.service';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { ProblemDetails } from '../../../core/models';

function usernameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return { required: true };
  }
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return { lengthRange: true };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return { patternMismatch: true };
  }
  return null;
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!pwd || !confirm) return null;
  return pwd === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, AuthHeroComponent, LogoComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly theme = inject(ThemeService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      username: ['', [usernameValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] }
  );

  private readonly passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: this.form.controls.password.value,
  });

  readonly strengthLevel = computed(() => {
    const pwd = this.passwordValue();
    if (!pwd || pwd.length === 0) return 0;
    if (pwd.length < 8) return 1;
    if (pwd.length < 10) return 2;
    if (pwd.length < 12 || !(/[A-Z]/.test(pwd) && /[0-9]/.test(pwd))) return 3;
    return 4;
  });

  readonly strengthText = computed(() => {
    switch (this.strengthLevel()) {
      case 4:
        return 'stark';
      case 3:
      case 2:
        return 'bra';
      case 1:
        return 'svag';
      default:
        return 'ange lösenord';
    }
  });

  constructor() {
    this.form.controls.username.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearServerError(this.form.controls.username);
    });
    this.form.controls.password.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearServerError(this.form.controls.password);
    });
    this.form.controls.confirmPassword.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearServerError(this.form.controls.confirmPassword);
    });
  }

  usernameInvalid(): boolean {
    const ctrl = this.form.controls.username;
    return (ctrl.invalid && ctrl.touched) || !!ctrl.errors?.['server'];
  }

  usernameError(): string {
    const ctrl = this.form.controls.username;
    if (ctrl.errors?.['server']) {
      return String(ctrl.errors['server']);
    }
    if (ctrl.errors?.['required']) {
      return 'Ange ett användarnamn';
    }
    if (ctrl.errors?.['lengthRange']) {
      return 'Användarnamnet måste vara mellan 3 och 30 tecken';
    }
    if (ctrl.errors?.['patternMismatch']) {
      return 'Användarnamnet får bara innehålla bokstäver, siffror, punkt, understreck och bindestreck';
    }
    return '';
  }

  passwordInvalid(): boolean {
    const ctrl = this.form.controls.password;
    return (ctrl.invalid && ctrl.touched) || !!ctrl.errors?.['server'];
  }

  passwordError(): string {
    const ctrl = this.form.controls.password;
    if (ctrl.errors?.['server']) {
      return String(ctrl.errors['server']);
    }
    if (ctrl.errors?.['required']) {
      return 'Ange ett lösenord';
    }
    if (ctrl.errors?.['minlength']) {
      return 'Använd minst 8 tecken';
    }
    return '';
  }

  confirmPasswordInvalid(): boolean {
    const ctrl = this.form.controls.confirmPassword;
    const mismatch = this.form.hasError('passwordMismatch') && ctrl.touched;
    return (ctrl.invalid && ctrl.touched) || mismatch || !!ctrl.errors?.['server'];
  }

  confirmPasswordError(): string {
    const ctrl = this.form.controls.confirmPassword;
    if (ctrl.errors?.['server']) {
      return String(ctrl.errors['server']);
    }
    if (ctrl.errors?.['required']) {
      return 'Bekräfta lösenordet';
    }
    if (this.form.hasError('passwordMismatch')) {
      return 'Lösenorden matchar inte';
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Kontrollera de markerade fälten');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const username = this.form.controls.username.value.trim();
    const password = this.form.controls.password.value;

    this.auth.register({ username, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.show('Konto skapat! Du kan nu logga in.', 'success');
        this.router.navigate(['/login']);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        if (err instanceof HttpErrorResponse) {
          if (err.status === 409) {
            this.form.controls.username.setErrors({ server: 'Användarnamnet är redan upptaget' });
            this.errorMessage.set('Användarnamnet är redan upptaget');
          } else if (err.status === 400) {
            const problem = err.error as ProblemDetails | undefined;
            if (problem?.errors) {
              for (const [field, messages] of Object.entries(problem.errors)) {
                const lower = field.toLowerCase();
                const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
                if (lower === 'username') {
                  this.form.controls.username.setErrors({ server: msg });
                } else if (lower === 'password') {
                  this.form.controls.password.setErrors({ server: msg });
                }
              }
            }
            this.errorMessage.set(problem?.detail || 'Kontrollera de markerade fälten');
          } else {
            this.errorMessage.set('Ett fel uppstod vid registreringen. Försök igen.');
          }
        } else {
          this.errorMessage.set('Ett oväntat fel uppstod. Försök igen.');
        }
      },
    });
  }

  private clearServerError(control: AbstractControl): void {
    if (control.hasError('server')) {
      const errors = { ...control.errors };
      delete errors['server'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
  }
}
