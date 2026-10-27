import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BookListComponent } from './book-list.component';
import { BookService } from '../book.service';
import { ToastService } from '../../../core/toast.service';
import { Book } from '../../../core/models';

describe('BookListComponent', () => {
  let component: BookListComponent;
  let fixture: ComponentFixture<BookListComponent>;
  let bookServiceSpy: jasmine.SpyObj<BookService>;
  let modalServiceSpy: jasmine.SpyObj<NgbModal>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockBooks: Book[] = [
    {
      id: 'book-1',
      title: 'Ett eget rum',
      author: 'Virginia Woolf',
      publishedDate: '1929-10-24',
      description: 'En essä om kvinnors villkor.',
    },
    {
      id: 'book-2',
      title: 'Aniara',
      author: 'Harry Martinson',
      publishedDate: '1956-10-13',
      description: 'Ett rymdepos.',
    },
    {
      id: 'book-3',
      title: 'Kallocain',
      author: 'Karin Boye',
      publishedDate: '1940-01-01',
      description: 'En dystopisk roman.',
    },
  ];

  beforeEach(async () => {
    bookServiceSpy = jasmine.createSpyObj<BookService>('BookService', ['getAll', 'create', 'delete']);
    modalServiceSpy = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['show']);

    bookServiceSpy.getAll.and.returnValue(of(mockBooks));

    await TestBed.configureTestingModule({
      imports: [BookListComponent],
      providers: [
        provideRouter([]),
        { provide: BookService, useValue: bookServiceSpy },
        { provide: NgbModal, useValue: modalServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show loading skeleton initially and then display loaded books', () => {
    const booksSubject = new Subject<Book[]>();
    bookServiceSpy.getAll.and.returnValue(booksSubject);

    component.loadBooks();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.books-skeleton')).toBeTruthy();

    booksSubject.next(mockBooks);
    booksSubject.complete();
    fixture.detectChanges();

    expect(el.querySelector('.books-skeleton')).toBeFalsy();
    const rows = el.querySelectorAll('.book-row');
    expect(rows.length).toBe(3);
    expect(el.textContent).toContain('Ett eget rum');
    expect(el.textContent).toContain('Virginia Woolf');
  });

  it('should display empty state when books array is empty', () => {
    bookServiceSpy.getAll.and.returnValue(of([]));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Du har inga böcker ännu');
    expect(el.querySelector('a[href="/books/new"]')).toBeTruthy();
  });

  it('should display error message and retry button on fetch failure', () => {
    bookServiceSpy.getAll.and.returnValue(throwError(() => new Error('Server error')));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Kunde inte hämta böcker');

    // Clicking retry calls loadBooks again
    bookServiceSpy.getAll.and.returnValue(of(mockBooks));
    const retryBtn = el.querySelector('button.btn-primary') as HTMLButtonElement;
    retryBtn.click();
    fixture.detectChanges();

    expect(component.books().length).toBe(3);
  });

  it('should filter books by title', () => {
    fixture.detectChanges();

    component.searchQuery.set('eget');
    fixture.detectChanges();

    const filtered = component.filteredBooks();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Ett eget rum');
  });

  it('should filter books by author', () => {
    fixture.detectChanges();

    component.searchQuery.set('martinson');
    fixture.detectChanges();

    const filtered = component.filteredBooks();
    expect(filtered.length).toBe(1);
    expect(filtered[0].author).toBe('Harry Martinson');
  });

  it('should show empty state when search query yields no matches', () => {
    fixture.detectChanges();

    component.searchQuery.set('inte-en-bok');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Inga böcker matchade din sökning');
    expect(component.filteredBooks().length).toBe(0);
  });

  it('should clear search query and restore books when clicking "Rensa sökning" button', () => {
    fixture.detectChanges();

    component.searchQuery.set('okänd-bok');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const clearButton = el.querySelector('app-empty-state button.btn-secondary') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    expect(clearButton.textContent?.trim()).toBe('Rensa sökning');

    clearButton.click();
    fixture.detectChanges();

    expect(component.searchQuery()).toBe('');
    expect(component.filteredBooks().length).toBe(3);
  });

  it('should sort books by title ascending or date descending', () => {
    fixture.detectChanges();

    // Default: title-asc
    component.sortBy.set('title-asc');
    let sorted = component.filteredBooks();
    expect(sorted[0].title).toBe('Aniara');
    expect(sorted[1].title).toBe('Ett eget rum');
    expect(sorted[2].title).toBe('Kallocain');

    // date-desc (Nyast först)
    component.sortBy.set('date-desc');
    sorted = component.filteredBooks();
    expect(sorted[0].title).toBe('Aniara'); // 1956
    expect(sorted[1].title).toBe('Kallocain'); // 1940
    expect(sorted[2].title).toBe('Ett eget rum'); // 1929
  });

  it('should sort by title as secondary criteria when publishedDate is identical in date-desc sort', () => {
    const booksWithSameDate: Book[] = [
      {
        id: 'book-a',
        title: 'Ögonblick',
        author: 'Författare A',
        publishedDate: '2020-05-01',
        description: '',
      },
      {
        id: 'book-b',
        title: 'Bokstavslek',
        author: 'Författare B',
        publishedDate: '2020-05-01',
        description: '',
      },
      {
        id: 'book-c',
        title: 'Apelsinträdet',
        author: 'Författare C',
        publishedDate: '2020-05-01',
        description: '',
      },
      {
        id: 'book-d',
        title: 'Zorn',
        author: 'Författare D',
        publishedDate: '2019-01-01',
        description: '',
      },
    ];

    fixture.detectChanges();

    component.books.set(booksWithSameDate);
    component.sortBy.set('date-desc');

    const sorted = component.filteredBooks();
    expect(sorted.length).toBe(4);
    // Same date books sorted by title A-Ö with Swedish collation: Apelsinträdet -> Bokstavslek -> Ögonblick
    expect(sorted[0].title).toBe('Apelsinträdet');
    expect(sorted[1].title).toBe('Bokstavslek');
    expect(sorted[2].title).toBe('Ögonblick');
    // Older date
    expect(sorted[3].title).toBe('Zorn');
  });

  it('should have semantic label associated with the search input', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const label = el.querySelector('label[for="book-search"]') as HTMLLabelElement;
    const input = el.querySelector('#book-search') as HTMLInputElement;

    expect(label).toBeTruthy();
    expect(label.classList.contains('visually-hidden')).toBeTrue();
    expect(label.textContent?.trim()).toBe('Sök efter titel eller författare');
    expect(input).toBeTruthy();
    expect(input.id).toBe('book-search');
  });

  it('should open BookDetailModalComponent when openDetail is called', () => {
    fixture.detectChanges();

    const detailModalRefSpy = {
      componentInstance: {
        book: { set: jasmine.createSpy('book.set') },
      },
    };

    modalServiceSpy.open.and.returnValue(detailModalRefSpy as any);

    component.openDetail(mockBooks[0]);

    expect(modalServiceSpy.open).toHaveBeenCalled();
    expect(detailModalRefSpy.componentInstance.book.set).toHaveBeenCalledWith(mockBooks[0]);
  });

  it('should call openDetail when clicking a book table row', () => {
    fixture.detectChanges();
    spyOn(component, 'openDetail');

    const row = fixture.nativeElement.querySelector('tr.book-row') as HTMLElement;
    expect(row).toBeTruthy();
    row.click();

    expect(component.openDetail).toHaveBeenCalledWith(component.filteredBooks()[0]);
  });

  it('should call openDetail when clicking a mobile book card', () => {
    fixture.detectChanges();
    spyOn(component, 'openDetail');

    const card = fixture.nativeElement.querySelector('.mobile-book-card') as HTMLElement;
    expect(card).toBeTruthy();
    card.click();

    expect(component.openDetail).toHaveBeenCalledWith(component.filteredBooks()[0]);
  });

  it('should open confirm modal and delete book on confirm', fakeAsync(() => {
    fixture.detectChanges();

    const isSubmittingSignal = signal(false);
    const modalRefSpy = {
      componentInstance: {
        title: { set: jasmine.createSpy('title.set') },
        message: { set: jasmine.createSpy('message.set') },
        supportText: { set: jasmine.createSpy('supportText.set') },
        confirmText: { set: jasmine.createSpy('confirmText.set') },
        cancelText: { set: jasmine.createSpy('cancelText.set') },
        isSubmitting: isSubmittingSignal,
        onConfirmCallback: undefined as (() => void) | undefined,
      },
      close: jasmine.createSpy('close'),
      result: Promise.resolve(true),
    };

    modalServiceSpy.open.and.returnValue(modalRefSpy as any);
    bookServiceSpy.delete.and.returnValue(of(undefined as any));

    const bookToDelete = mockBooks[0];
    component.onDelete(bookToDelete);
    expect(modalRefSpy.componentInstance.onConfirmCallback).toBeDefined();

    modalRefSpy.componentInstance.onConfirmCallback!();
    tick();

    expect(modalServiceSpy.open).toHaveBeenCalled();
    expect(modalRefSpy.componentInstance.title.set).toHaveBeenCalledWith('Radera bok');
    expect(modalRefSpy.componentInstance.message.set).toHaveBeenCalledWith('Är du säker på att du vill radera “Ett eget rum”?');
    expect(bookServiceSpy.delete).toHaveBeenCalledWith(bookToDelete.id);
    expect(modalRefSpy.close).toHaveBeenCalledWith(true);
    expect(component.books().length).toBe(2);
    expect(toastServiceSpy.show).toHaveBeenCalledWith(
      '"Ett eget rum" har raderats.',
      'success',
      true,
      jasmine.objectContaining({ label: 'Ångra' })
    );
  }));

  it('should restore book when restoreBook is called', () => {
    fixture.detectChanges();
    const restoredBook: Book = {
      id: 'restored-1',
      title: 'Ett eget rum',
      author: 'Virginia Woolf',
      publishedDate: '1929-10-24',
      description: 'En essä.',
    };
    bookServiceSpy.create.and.returnValue(of(restoredBook));

    component.restoreBook(mockBooks[0]);

    expect(bookServiceSpy.create).toHaveBeenCalledWith({
      title: mockBooks[0].title,
      author: mockBooks[0].author,
      publishedDate: mockBooks[0].publishedDate,
      description: mockBooks[0].description,
    });
    expect(component.books()).toContain(restoredBook);
    expect(toastServiceSpy.show).toHaveBeenCalledWith('"Ett eget rum" har återställts.', 'success');
  });

  it('should show error toast if delete request fails', fakeAsync(() => {
    fixture.detectChanges();

    const isSubmittingSignal = signal(false);
    const modalRefSpy = {
      componentInstance: {
        title: { set: jasmine.createSpy('title.set') },
        message: { set: jasmine.createSpy('message.set') },
        supportText: { set: jasmine.createSpy('supportText.set') },
        confirmText: { set: jasmine.createSpy('confirmText.set') },
        cancelText: { set: jasmine.createSpy('cancelText.set') },
        isSubmitting: isSubmittingSignal,
        onConfirmCallback: undefined as (() => void) | undefined,
      },
      close: jasmine.createSpy('close'),
      result: Promise.resolve(true),
    };

    modalServiceSpy.open.and.returnValue(modalRefSpy as any);
    bookServiceSpy.delete.and.returnValue(throwError(() => new Error('Delete error')));

    component.onDelete(mockBooks[0]);
    modalRefSpy.componentInstance.onConfirmCallback!();
    tick();

    expect(bookServiceSpy.delete).toHaveBeenCalledWith(mockBooks[0].id);
    expect(isSubmittingSignal()).toBeFalse();
    expect(modalRefSpy.close).not.toHaveBeenCalled();
    expect(component.books().length).toBe(3);
    expect(toastServiceSpy.show).toHaveBeenCalledWith('Kunde inte radera boken. Försök igen.', 'danger');
  }));

  it('should not delete book if modal is cancelled or dismissed', fakeAsync(() => {
    fixture.detectChanges();

    const isSubmittingSignal = signal(false);
    const modalRefSpy = {
      componentInstance: {
        title: { set: jasmine.createSpy('title.set') },
        message: { set: jasmine.createSpy('message.set') },
        supportText: { set: jasmine.createSpy('supportText.set') },
        confirmText: { set: jasmine.createSpy('confirmText.set') },
        cancelText: { set: jasmine.createSpy('cancelText.set') },
        isSubmitting: isSubmittingSignal,
        onConfirmCallback: undefined as (() => void) | undefined,
      },
      close: jasmine.createSpy('close'),
      result: Promise.resolve('cancel'),
    };

    modalServiceSpy.open.and.returnValue(modalRefSpy as any);

    component.onDelete(mockBooks[0]);
    tick();

    expect(bookServiceSpy.delete).not.toHaveBeenCalled();
    expect(component.books().length).toBe(3);
  }));

  it('should remove book and show info toast if delete returns 404', fakeAsync(() => {
    fixture.detectChanges();

    const isSubmittingSignal = signal(false);
    const modalRefSpy = {
      componentInstance: {
        title: { set: jasmine.createSpy('title.set') },
        message: { set: jasmine.createSpy('message.set') },
        supportText: { set: jasmine.createSpy('supportText.set') },
        confirmText: { set: jasmine.createSpy('confirmText.set') },
        cancelText: { set: jasmine.createSpy('cancelText.set') },
        isSubmitting: isSubmittingSignal,
        onConfirmCallback: undefined as (() => void) | undefined,
      },
      close: jasmine.createSpy('close'),
      result: Promise.resolve(true),
    };

    modalServiceSpy.open.and.returnValue(modalRefSpy as any);
    const notFoundError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    bookServiceSpy.delete.and.returnValue(throwError(() => notFoundError));

    component.onDelete(mockBooks[0]);
    modalRefSpy.componentInstance.onConfirmCallback!();
    tick();

    expect(bookServiceSpy.delete).toHaveBeenCalledWith(mockBooks[0].id);
    expect(modalRefSpy.close).toHaveBeenCalledWith(true);
    expect(component.books().length).toBe(2);
    expect(toastServiceSpy.show).toHaveBeenCalledWith('Boken var redan borttagen.', 'info');
  }));
});
