import { Component, inject, input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  readonly activeModal = inject(NgbActiveModal);

  readonly title = input<string>('Är du säker?');
  readonly message = input<string>('Är du säker på att du vill radera?');
  readonly supportText = input<string>('Åtgärden går inte att ångra.');
  readonly confirmText = input<string>('Radera');
  readonly cancelText = input<string>('Avbryt');
}
