import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthHeroComponent } from '../auth-hero/auth-hero.component';
import { LogoComponent } from '../../../shared/logo/logo.component';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, AuthHeroComponent, LogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  readonly theme = inject(ThemeService);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    // Handled in backend integration phase
  }
}
