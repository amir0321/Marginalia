import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book, BookRequest } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Book[]> {
    return this.http.get<Book[]>('/api/books');
  }

  getById(id: string): Observable<Book> {
    return this.http.get<Book>(`/api/books/${id}`);
  }

  create(book: BookRequest): Observable<Book> {
    return this.http.post<Book>('/api/books', book);
  }

  update(id: string, book: BookRequest): Observable<Book> {
    return this.http.put<Book>(`/api/books/${id}`, book);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/books/${id}`);
  }
}
