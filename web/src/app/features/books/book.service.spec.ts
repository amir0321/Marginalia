import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookService } from './book.service';
import { Book, BookRequest } from '../../core/models';

describe('BookService', () => {
  let service: BookService;
  let httpTesting: HttpTestingController;

  const mockBook: Book = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Ett eget rum',
    author: 'Virginia Woolf',
    publishedDate: '1929-10-24',
    description: 'En essä om kvinnors skapande villkor.',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(BookService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all books via GET /api/books', () => {
    const mockBooks: Book[] = [mockBook];

    service.getAll().subscribe(books => {
      expect(books).toEqual(mockBooks);
    });

    const req = httpTesting.expectOne('/api/books');
    expect(req.request.method).toBe('GET');
    req.flush(mockBooks);
  });

  it('should fetch a single book via GET /api/books/{id}', () => {
    service.getById(mockBook.id).subscribe(book => {
      expect(book).toEqual(mockBook);
    });

    const req = httpTesting.expectOne(`/api/books/${mockBook.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBook);
  });

  it('should create a book via POST /api/books', () => {
    const bookRequest: BookRequest = {
      title: 'Ett eget rum',
      author: 'Virginia Woolf',
      publishedDate: '1929-10-24',
      description: 'En essä om kvinnors skapande villkor.',
    };

    service.create(bookRequest).subscribe(createdBook => {
      expect(createdBook).toEqual(mockBook);
    });

    const req = httpTesting.expectOne('/api/books');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(bookRequest);
    req.flush(mockBook);
  });

  it('should update a book via PUT /api/books/{id}', () => {
    const updateRequest: BookRequest = {
      title: 'Ett eget rum (Uppdaterad)',
      author: 'Virginia Woolf',
      publishedDate: '1929-10-24',
      description: 'Ny beskrivning.',
    };

    const updatedBook: Book = { ...mockBook, title: updateRequest.title };

    service.update(mockBook.id, updateRequest).subscribe(result => {
      expect(result).toEqual(updatedBook);
    });

    const req = httpTesting.expectOne(`/api/books/${mockBook.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(updatedBook);
  });

  it('should delete a book via DELETE /api/books/{id}', () => {
    service.delete(mockBook.id).subscribe(result => {
      expect(result).toBeNull();
    });

    const req = httpTesting.expectOne(`/api/books/${mockBook.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
