import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/custom-select/custom-select.component';
import { Book } from '../../../core/models';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, EmptyStateComponent, CustomSelectComponent],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.scss',
})
export class BookListComponent {
  readonly books = signal<Book[]>([]);
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

  onDelete(_book: Book): void {
    // Shared confirm modal call in backend integration step
  }
}
