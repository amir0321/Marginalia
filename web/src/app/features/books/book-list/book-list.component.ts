import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/custom-select/custom-select.component';
import { ConfirmModalComponent } from '../../../shared/confirm-modal/confirm-modal.component';
import { BookDetailModalComponent } from '../book-detail-modal/book-detail-modal.component';
import { BookService } from '../book.service';
import { ToastService } from '../../../core/toast.service';
import { Book } from '../../../core/models';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, EmptyStateComponent, CustomSelectComponent],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookListComponent implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly modalService = inject(NgbModal);
  private readonly toastService = inject(ToastService);

  readonly books = signal<Book[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<'title-asc' | 'date-desc'>('title-asc');

  readonly sortOptions: SelectOption<'title-asc' | 'date-desc'>[] = [
    { value: 'title-asc', label: 'Titel A–Ö' },
    { value: 'date-desc', label: 'Nyast först' },
  ];

  readonly filteredBooks = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    let result = [...this.books()];

    if (query) {
      result = result.filter(
        b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query)
      );
    }

    if (this.sortBy() === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'sv'));
    } else {
      result.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
    }

    return result;
  });

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bookService.getAll().subscribe({
      next: books => {
        this.books.set(books);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Kunde inte hämta dina böcker. Kontrollera din anslutning och försök igen.');
        this.isLoading.set(false);
      },
    });
  }

  openDetail(book: Book): void {
    const modalRef = this.modalService.open(BookDetailModalComponent, {
      centered: true,
      backdrop: true,
    });
    modalRef.componentInstance.book.set(book);
  }

  onDelete(book: Book): void {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true,
      backdrop: true,
    });

    modalRef.componentInstance.title.set('Radera bok');
    modalRef.componentInstance.message.set(`Är du säker på att du vill radera “${book.title}”?`);
    modalRef.componentInstance.supportText.set('Åtgärden går inte att ångra.');
    modalRef.componentInstance.confirmText.set('Radera');
    modalRef.componentInstance.cancelText.set('Avbryt');

    modalRef.result.then(
      confirmed => {
        if (confirmed) {
          this.bookService.delete(book.id).subscribe({
            next: () => {
              this.books.update(list => list.filter(b => b.id !== book.id));
              this.toastService.show(
                `"${book.title}" har raderats.`,
                'success',
                true,
                {
                  label: 'Ångra',
                  onClick: () => this.restoreBook(book),
                }
              );
            },
            error: () => {
              this.toastService.show('Kunde inte radera boken. Försök igen.', 'danger');
            },
          });
        }
      },
      () => {
        // Avbröts
      }
    );
  }

  restoreBook(book: Book): void {
    this.bookService
      .create({
        title: book.title,
        author: book.author,
        publishedDate: book.publishedDate,
        description: book.description,
      })
      .subscribe({
        next: created => {
          this.books.update(list => [...list, created]);
          this.toastService.show(`"${created.title}" har återställts.`, 'success');
        },
        error: () => {
          this.toastService.show('Kunde inte återställa boken.', 'danger');
        },
      });
  }
}
