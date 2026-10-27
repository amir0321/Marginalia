import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent {
  readonly onDark = input<boolean>(false);
  readonly showText = input<boolean>(true);
  readonly linkUrl = input<string>('/');
  readonly ariaLabel = input<string>('Marginalia startsida');
  readonly compact = input<boolean>(false);
}
