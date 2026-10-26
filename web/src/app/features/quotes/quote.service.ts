import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quote, QuoteRequest } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Quote[]> {
    return this.http.get<Quote[]>('/api/quotes');
  }

  getById(id: string): Observable<Quote> {
    return this.http.get<Quote>(`/api/quotes/${id}`);
  }

  create(quote: QuoteRequest): Observable<Quote> {
    return this.http.post<Quote>('/api/quotes', quote);
  }

  update(id: string, quote: QuoteRequest): Observable<Quote> {
    return this.http.put<Quote>(`/api/quotes/${id}`, quote);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/quotes/${id}`);
  }
}
