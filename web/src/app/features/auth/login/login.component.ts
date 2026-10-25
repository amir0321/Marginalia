import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ProblemDetails } from '../../../core/models';

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (!val || typeof val !== 'string' || val.trim().length === 0) {
    return { required: true };
  }
  return null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, AuthHeroComponent, LogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [trimmedRequired]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.form.controls.username.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearServerError(this.form.controls.username);
    });
    this.form.controls.password.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearServerError(this.form.controls.password);
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

    this.auth.login({ username, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/books']);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this.errorMessage.set('Fel användarnamn eller lösenord');
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
            this.errorMessage.set('Ett fel uppstod vid inloggningen. Försök igen.');
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
