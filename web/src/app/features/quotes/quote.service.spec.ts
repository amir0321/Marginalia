import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { QuoteService } from './quote.service';
import { Quote, QuoteRequest } from '../../core/models';

describe('QuoteService', () => {
  let service: QuoteService;
  let httpTesting: HttpTestingController;

  const mockQuote: Quote = {
    id: '876e4567-e89b-12d3-a456-426614174000',
    text: 'Ett hem utan böcker är som en kropp utan själ.',
    author: 'Cicero',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QuoteService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(QuoteService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all quotes via GET /api/quotes', () => {
    const mockQuotes: Quote[] = [mockQuote];

    service.getAll().subscribe(quotes => {
      expect(quotes).toEqual(mockQuotes);
    });

    const req = httpTesting.expectOne('/api/quotes');
    expect(req.request.method).toBe('GET');
    req.flush(mockQuotes);
  });

  it('should fetch single quote via GET /api/quotes/{id}', () => {
    service.getById(mockQuote.id).subscribe(quote => {
      expect(quote).toEqual(mockQuote);
    });

    const req = httpTesting.expectOne(`/api/quotes/${mockQuote.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockQuote);
  });

  it('should create quote via POST /api/quotes', () => {
    const request: QuoteRequest = {
      text: 'Ett hem utan böcker är som en kropp utan själ.',
      author: 'Cicero',
    };

    service.create(request).subscribe(createdQuote => {
      expect(createdQuote).toEqual(mockQuote);
    });

    const req = httpTesting.expectOne('/api/quotes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockQuote);
  });

  it('should update quote via PUT /api/quotes/{id}', () => {
    const request: QuoteRequest = {
      text: 'Uppdaterat citat.',
      author: 'Cicero',
    };

    const updatedQuote: Quote = { ...mockQuote, text: request.text };

    service.update(mockQuote.id, request).subscribe(result => {
      expect(result).toEqual(updatedQuote);
    });

    const req = httpTesting.expectOne(`/api/quotes/${mockQuote.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(updatedQuote);
  });

  it('should delete quote via DELETE /api/quotes/{id}', () => {
    service.delete(mockQuote.id).subscribe(result => {
      expect(result).toBeNull();
    });

    const req = httpTesting.expectOne(`/api/quotes/${mockQuote.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
