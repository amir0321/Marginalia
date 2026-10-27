import { Component, inject } from '@angular/core';
import { LogoComponent } from '../../../shared/logo/logo.component';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-auth-hero',
  standalone: true,
  imports: [LogoComponent],
  templateUrl: './auth-hero.component.html',
  styleUrl: './auth-hero.component.scss',
})
export class AuthHeroComponent {
  readonly theme = inject(ThemeService);
}
