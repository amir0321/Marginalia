import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly icon = input<string>('fa-solid fa-book-open');
  readonly title = input<string>('Inga poster än');
  readonly description = input<string>('');
}
