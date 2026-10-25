import { Component, signal, computed } from '@angular/core';
import { Quote } from '../../../core/models';

const ORDINAL_SWEDISH = ['1:a', '2:a', '3:e', '4:e', '5:e'];

@Component({
  selector: 'app-quote-list',
  standalone: true,
  templateUrl: './quote-list.component.html',
  styleUrl: './quote-list.component.scss',
})
export class QuoteListComponent {
  readonly quotes = signal<Quote[]>([]);

  readonly isMaxLimitReached = computed(() => this.quotes().length >= 5);

  readonly nextOrdinalWord = computed(() => {
    const idx = Math.min(this.quotes().length, 4);
    return ORDINAL_SWEDISH[idx];
  });

  onAddQuote(): void {
    if (this.isMaxLimitReached()) return;
    // Dialog handling in backend phase
  }

  onEditQuote(_quote: Quote): void {
    // Dialog handling in backend phase
  }

  onDeleteQuote(_quote: Quote): void {
    // Confirm modal in backend phase
  }
}
