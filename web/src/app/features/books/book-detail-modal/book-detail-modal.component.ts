import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Book } from '../../../core/models';

@Component({
  selector: 'app-book-detail-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './book-detail-modal.component.html',
  styleUrl: './book-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetailModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private readonly router = inject(Router);

  readonly book = signal<Book | null>(null);

  onEdit(): void {
    const current = this.book();
    this.activeModal.close('edit');
    if (current) {
      this.router.navigate(['/books', current.id, 'edit']);
    }
  }
}
