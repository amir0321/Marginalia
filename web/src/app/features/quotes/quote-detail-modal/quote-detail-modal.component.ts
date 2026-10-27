import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Quote } from '../../../core/models';

@Component({
  selector: 'app-quote-detail-modal',
  standalone: true,
  imports: [],
  templateUrl: './quote-detail-modal.component.html',
  styleUrl: './quote-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteDetailModalComponent {
  readonly activeModal = inject(NgbActiveModal);

  readonly quote = signal<Quote | null>(null);
  readonly index = signal<number | null>(null);

  onEdit(): void {
    this.activeModal.close('edit');
  }
}
