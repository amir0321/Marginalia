import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  readonly activeModal = inject(NgbActiveModal);

  readonly title = signal<string>('Är du säker?');
  readonly message = signal<string>('Är du säker på att du vill radera?');
  readonly supportText = signal<string>('Åtgärden går inte att ångra.');
  readonly confirmText = signal<string>('Radera');
  readonly cancelText = signal<string>('Avbryt');
  readonly isSubmitting = signal<boolean>(false);

  onConfirmCallback?: () => void;

  onConfirm(): void {
    if (this.isSubmitting()) return;
    if (this.onConfirmCallback) {
      this.onConfirmCallback();
    } else {
      this.activeModal.close(true);
    }
  }

  dismiss(reason = 'cancel'): void {
    if (this.isSubmitting()) return;
    this.activeModal.dismiss(reason);
  }
}
