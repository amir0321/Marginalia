import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { BookService } from '../book.service';
import { ToastService } from '../../../core/toast.service';
import { BookRequest } from '../../../core/models';

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
    return { required: true };
  }
  return null;
}

function notInFuture(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const today = new Date().toISOString().split('T')[0];
  if (value > today) {
    return { futureDate: true };
  }
  return null;
}

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, EmptyStateComponent],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly toastService = inject(ToastService);

  readonly maxDate = new Date().toISOString().split('T')[0];

  readonly isEditMode = signal<boolean>(false);
  readonly bookId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isNotFound = signal<boolean>(false);
  readonly serverErrorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [trimmedRequired, Validators.maxLength(200)]],
    author: ['', [trimmedRequired, Validators.maxLength(200)]],
    publishedDate: ['', [Validators.required, notInFuture]],
    description: ['', [Validators.maxLength(500)]],
  });

  get titleControl() {
    return this.form.controls.title;
  }

  get authorControl() {
    return this.form.controls.author;
  }

  get dateControl() {
    return this.form.controls.publishedDate;
  }

  get descControl() {
    return this.form.controls.description;
  }

  private readonly descriptionValue = toSignal(this.form.controls.description.valueChanges, {
    initialValue: this.form.controls.description.value,
  });

  readonly descriptionCount = computed(() => {
    return this.descriptionValue()?.length ?? 0;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.bookId.set(id);
      this.loadBook(id);
    }
  }

  private loadBook(id: string): void {
    this.isLoading.set(true);
    this.isNotFound.set(false);
    this.serverErrorMessage.set(null);

    this.bookService.getById(id).subscribe({
      next: book => {
        this.form.patchValue({
          title: book.title,
          author: book.author,
          publishedDate: book.publishedDate,
          description: book.description ?? '',
        });
        this.isLoading.set(false);
      },
      error: err => {
        this.isLoading.set(false);
        if (err.status === 404) {
          this.isNotFound.set(true);
        } else {
          this.serverErrorMessage.set('Kunde inte hämta boken. Kontrollera din anslutning och försök igen.');
        }
      },
    });
  }

  onDateClick(event: MouseEvent): void {
    const target = event.target as HTMLInputElement;
    try {
      target.showPicker?.();
    } catch {
      // Browser fallback
    }
  }

  onDateIconClick(input: HTMLInputElement): void {
    try {
      input.showPicker?.();
    } catch {
      input.focus();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverErrorMessage.set(null);

    const raw = this.form.getRawValue();
    const request: BookRequest = {
      title: raw.title.trim(),
      author: raw.author.trim(),
      publishedDate: raw.publishedDate,
      description: raw.description.trim() ? raw.description.trim() : null,
    };

    if (this.isEditMode() && this.bookId()) {
      this.bookService.update(this.bookId()!, request).subscribe({
        next: updated => {
          this.isSubmitting.set(false);
          this.toastService.show(`"${updated.title}" har uppdaterats.`, 'success');
          this.router.navigate(['/books']);
        },
        error: err => {
          this.isSubmitting.set(false);
          this.handleSaveError(err);
        },
      });
    } else {
      this.bookService.create(request).subscribe({
        next: created => {
          this.isSubmitting.set(false);
          this.toastService.show(`"${created.title}" har lagts till.`, 'success');
          this.router.navigate(['/books']);
        },
        error: err => {
          this.isSubmitting.set(false);
          this.handleSaveError(err);
        },
      });
    }
  }

  private handleSaveError(err: any): void {
    if (err.status === 400 && err.error?.errors) {
      const errors = err.error.errors;
      let hasFieldErrors = false;

      for (const [key, messages] of Object.entries(errors)) {
        const k = key.toLowerCase();
        const msg = Array.isArray(messages) ? messages[0] : String(messages);

        if (k === 'title') {
          this.titleControl.setErrors({ server: msg });
          hasFieldErrors = true;
        } else if (k === 'author') {
          this.authorControl.setErrors({ server: msg });
          hasFieldErrors = true;
        } else if (k === 'publisheddate') {
          this.dateControl.setErrors({ server: msg });
          hasFieldErrors = true;
        } else if (k === 'description') {
          this.descControl.setErrors({ server: msg });
          hasFieldErrors = true;
        }
      }

      if (!hasFieldErrors) {
        this.serverErrorMessage.set(err.error?.detail || 'Ett valideringsfel uppstod. Kontrollera uppgifterna.');
      }
    } else {
      this.serverErrorMessage.set('Kunde inte spara boken. Kontrollera anslutningen och försök igen.');
    }
  }
}
