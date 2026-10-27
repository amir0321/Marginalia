import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpErrorResponse } from '@angular/common/http';
import { QuoteService } from '../quote.service';
import { ToastService } from '../../../core/toast.service';
import { Quote, QuoteRequest, ProblemDetails } from '../../../core/models';

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
    return { required: true };
  }
  return null;
}

@Component({
  selector: 'app-quote-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './quote-form-modal.component.html',
  styleUrl: './quote-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteFormModalComponent implements OnInit {
  readonly activeModal = inject(NgbActiveModal);
  private readonly fb = inject(FormBuilder);
  private readonly quoteService = inject(QuoteService);
  private readonly toastService = inject(ToastService);

  readonly quote = signal<Quote | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);
  readonly serverErrorMessage = signal<string | null>(null);

  readonly isEditMode = computed(() => !!this.quote());

  readonly form = this.fb.nonNullable.group({
    text: ['', [trimmedRequired, Validators.maxLength(600)]],
    author: ['', [trimmedRequired, Validators.maxLength(200)]],
  });

  get textControl() {
    return this.form.controls.text;
  }

  get authorControl() {
    return this.form.controls.author;
  }

  private readonly textValue = toSignal(this.form.controls.text.valueChanges, {
    initialValue: this.form.controls.text.value,
  });

  readonly textCount = computed(() => this.textValue()?.length ?? 0);

  ngOnInit(): void {
    const current = this.quote();
    if (current) {
      this.form.patchValue({
        text: current.text,
        author: current.author,
      });
    }
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverErrorMessage.set(null);

    const raw = this.form.getRawValue();
    const request: QuoteRequest = {
      text: raw.text.trim(),
      author: raw.author.trim(),
    };

    const currentQuote = this.quote();
    if (currentQuote) {
      this.quoteService.update(currentQuote.id, request).subscribe({
        next: updated => {
          this.isSubmitting.set(false);
          this.toastService.show('Citatet har uppdaterats.', 'success');
          this.activeModal.close(updated);
        },
        error: err => {
          this.isSubmitting.set(false);
          this.handleSaveError(err);
        },
      });
    } else {
      this.quoteService.create(request).subscribe({
        next: created => {
          this.isSubmitting.set(false);
          this.toastService.show('Citatet har sparats.', 'success');
          this.activeModal.close(created);
        },
        error: err => {
          this.isSubmitting.set(false);
          this.handleSaveError(err);
        },
      });
    }
  }

  private handleSaveError(err: unknown): void {
    if (err instanceof HttpErrorResponse || (typeof err === 'object' && err !== null && 'status' in err)) {
      const httpErr = err as { status?: number; error?: ProblemDetails };
      if (httpErr.status === 409) {
        this.serverErrorMessage.set(
          httpErr.error?.detail || 'Du har nått maxgränsen på fem citat.'
        );
        return;
      }

      if (httpErr.status === 404) {
        this.serverErrorMessage.set('Citatet hittades inte eller har redan raderats.');
        return;
      }

      if (httpErr.status === 400 && httpErr.error?.errors) {
        const errors = httpErr.error.errors;
        let hasFieldErrors = false;

        for (const [key, messages] of Object.entries(errors)) {
          const k = key.toLowerCase();
          const msg = Array.isArray(messages) ? messages[0] : String(messages);

          if (k === 'text') {
            this.textControl.setErrors({ server: msg });
            hasFieldErrors = true;
          } else if (k === 'author') {
            this.authorControl.setErrors({ server: msg });
            hasFieldErrors = true;
          }
        }

        if (!hasFieldErrors) {
          this.serverErrorMessage.set(httpErr.error?.detail || 'Ett valideringsfel uppstod. Kontrollera uppgifterna.');
        }
      } else {
        this.serverErrorMessage.set('Kunde inte spara citatet. Kontrollera anslutningen och försök igen.');
      }
    } else {
      this.serverErrorMessage.set('Kunde inte spara citatet. Kontrollera anslutningen och försök igen.');
    }
  }
}
