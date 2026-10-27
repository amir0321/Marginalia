import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../../shared/confirm-modal/confirm-modal.component';
import { QuoteFormModalComponent } from '../quote-form-modal/quote-form-modal.component';
import { QuoteService } from '../quote.service';
import { ToastService } from '../../../core/toast.service';
import { Quote } from '../../../core/models';

const ORDINAL_SWEDISH = ['1:a', '2:a', '3:e', '4:e', '5:e'];

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './quote-list.component.html',
  styleUrl: './quote-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteListComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly modalService = inject(NgbModal);
  private readonly toastService = inject(ToastService);

  readonly quotes = signal<Quote[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly isMaxLimitReached = computed(() => this.quotes().length >= 5);

  readonly nextOrdinalWord = computed(() => {
    const idx = Math.min(this.quotes().length, 4);
    return ORDINAL_SWEDISH[idx];
  });

  ngOnInit(): void {
    this.loadQuotes();
  }

  loadQuotes(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.quoteService.getAll().subscribe({
      next: quotes => {
        this.quotes.set(quotes);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Kunde inte hämta dina citat. Kontrollera din anslutning och försök igen.');
        this.isLoading.set(false);
      },
    });
  }

  onAddQuote(): void {
    if (this.isMaxLimitReached()) return;

    const modalRef = this.modalService.open(QuoteFormModalComponent, {
      centered: true,
      backdrop: true,
    });

    modalRef?.result?.then(
      (savedQuote: Quote) => {
        if (savedQuote) {
          this.quotes.update(list => [...list, savedQuote]);
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onEditQuote(quote: Quote): void {
    const modalRef = this.modalService.open(QuoteFormModalComponent, {
      centered: true,
      backdrop: true,
    });
    if (modalRef?.componentInstance) {
      modalRef.componentInstance.quote.set(quote);
    }

    modalRef?.result?.then(
      (savedQuote: Quote) => {
        if (savedQuote) {
          this.quotes.update(list =>
            list.map(q => (q.id === savedQuote.id ? savedQuote : q))
          );
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onDeleteQuote(quote: Quote): void {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true,
      backdrop: true,
    });

    if (modalRef?.componentInstance) {
      modalRef.componentInstance.title.set('Radera citat');
      modalRef.componentInstance.message.set(
        `Är du säker på att du vill radera citatet av “${quote.author}”?`
      );
      modalRef.componentInstance.supportText.set('Åtgärden går inte att ångra.');
      modalRef.componentInstance.confirmText.set('Radera');
      modalRef.componentInstance.cancelText.set('Avbryt');
    }

    modalRef?.result?.then(
      confirmed => {
        if (confirmed) {
          this.quoteService.delete(quote.id).subscribe({
            next: () => {
              this.quotes.update(list => list.filter(q => q.id !== quote.id));
              this.toastService.show(
                'Citatet har raderats.',
                'success',
                true,
                {
                  label: 'Ångra',
                  onClick: () => this.restoreQuote(quote),
                }
              );
            },
            error: (err: unknown) => {
              if (err instanceof HttpErrorResponse && err.status === 404) {
                this.quotes.update(list => list.filter(q => q.id !== quote.id));
                this.toastService.show('Citatet var redan borttaget.', 'info');
              } else {
                this.toastService.show('Kunde inte radera citatet. Försök igen.', 'danger');
              }
            },
          });
        }
      },
      () => {
        // Avbröts
      }
    );
  }

  restoreQuote(quote: Quote): void {
    this.quoteService
      .create({
        text: quote.text,
        author: quote.author,
      })
      .subscribe({
        next: created => {
          this.quotes.update(list => [...list, created]);
          this.toastService.show('Citatet har återställts.', 'success');
        },
        error: () => {
          this.toastService.show('Kunde inte återställa citatet.', 'danger');
        },
      });
  }
}
