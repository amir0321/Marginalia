import { Component, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthHeroComponent } from '../auth-hero/auth-hero.component';
import { LogoComponent } from '../../../shared/logo/logo.component';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, AuthHeroComponent, LogoComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  readonly theme = inject(ThemeService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

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

  onSubmit(): void {
    if (this.form.invalid) return;
    // Handled in backend integration phase
  }
}
