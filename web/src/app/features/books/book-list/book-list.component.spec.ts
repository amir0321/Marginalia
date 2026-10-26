import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  it('should filter books based on search query', () => {
    fixture.detectChanges();

    component.searchQuery.set('boye');
    fixture.detectChanges();

    const filtered = component.filteredBooks();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Kallocain');

    // When search yields no results
    component.searchQuery.set('inte-en-bok');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Inga böcker matchade din sökning');
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

  it('should open confirm modal and delete book on confirm', fakeAsync(() => {
    fixture.detectChanges();

    const modalRefSpy = {
      componentInstance: {
        title: { set: jasmine.createSpy('title.set') },
        message: { set: jasmine.createSpy('message.set') },
        supportText: { set: jasmine.createSpy('supportText.set') },
        confirmText: { set: jasmine.createSpy('confirmText.set') },
        cancelText: { set: jasmine.createSpy('cancelText.set') },
      },
      result: Promise.resolve(true),
    };

    modalServiceSpy.open.and.returnValue(modalRefSpy as any);
    bookServiceSpy.delete.and.returnValue(of(undefined as any));

    const bookToDelete = mockBooks[0];
    component.onDelete(bookToDelete);
    tick();

    expect(modalServiceSpy.open).toHaveBeenCalled();
    expect(modalRefSpy.componentInstance.title.set).toHaveBeenCalledWith('Radera bok');
    expect(modalRefSpy.componentInstance.message.set).toHaveBeenCalledWith('Är du säker på att du vill radera “Ett eget rum”?');
    expect(bookServiceSpy.delete).toHaveBeenCalledWith(bookToDelete.id);
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

    const modalRefSpy = {
      componentInstance: {
        title: { set: jasmine.createSpy('title.set') },
        message: { set: jasmine.createSpy('message.set') },
        supportText: { set: jasmine.createSpy('supportText.set') },
        confirmText: { set: jasmine.createSpy('confirmText.set') },
        cancelText: { set: jasmine.createSpy('cancelText.set') },
      },
      result: Promise.resolve(true),
    };

    modalServiceSpy.open.and.returnValue(modalRefSpy as any);
    bookServiceSpy.delete.and.returnValue(throwError(() => new Error('Delete error')));

    component.onDelete(mockBooks[0]);
    tick();

    expect(bookServiceSpy.delete).toHaveBeenCalledWith(mockBooks[0].id);
    expect(component.books().length).toBe(3);
    expect(toastServiceSpy.show).toHaveBeenCalledWith('Kunde inte radera boken. Försök igen.', 'danger');
  }));

  it('should not delete book if modal is cancelled or dismissed', fakeAsync(() => {
    fixture.detectChanges();

    const modalRefSpy = {
      componentInstance: {
        title: { set: jasmine.createSpy('title.set') },
        message: { set: jasmine.createSpy('message.set') },
        supportText: { set: jasmine.createSpy('supportText.set') },
        confirmText: { set: jasmine.createSpy('confirmText.set') },
        cancelText: { set: jasmine.createSpy('cancelText.set') },
      },
      result: Promise.reject('cancel'),
    };

    modalServiceSpy.open.and.returnValue(modalRefSpy as any);

    component.onDelete(mockBooks[0]);
    tick();

    expect(bookServiceSpy.delete).not.toHaveBeenCalled();
    expect(component.books().length).toBe(3);
  }));
});
