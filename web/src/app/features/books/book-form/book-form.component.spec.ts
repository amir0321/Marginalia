import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BookFormComponent } from './book-form.component';
import { BookService } from '../book.service';
import { ToastService } from '../../../core/toast.service';
import { Book } from '../../../core/models';

describe('BookFormComponent', () => {
  let component: BookFormComponent;
  let fixture: ComponentFixture<BookFormComponent>;
  let bookServiceSpy: jasmine.SpyObj<BookService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  const mockBook: Book = {
    id: 'book-123',
    title: 'Ett eget rum',
    author: 'Virginia Woolf',
    publishedDate: '1929-10-24',
    description: 'En klassisk essä.',
  };

  const createComponent = async (routeParamId: string | null = null) => {
    bookServiceSpy = jasmine.createSpyObj<BookService>('BookService', ['getById', 'create', 'update']);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [BookFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? routeParamId : null),
              },
            },
          },
        },
        { provide: BookService, useValue: bookServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(BookFormComponent);
    component = fixture.componentInstance;
  };

  describe('Add Mode (/books/new)', () => {
    beforeEach(async () => {
      await createComponent(null);
      fixture.detectChanges();
    });

    it('should create in add mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode()).toBeFalse();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.form-card-title')?.textContent?.trim()).toBe('Lägg till ny bok');
      expect(el.querySelector('.overline')?.textContent?.trim()).toBe('EN NY BERÄTTELSE');
      expect(el.querySelector('.fa-plus')).toBeTruthy();
    });

    it('should be invalid initially and disable submit button', () => {
      expect(component.form.invalid).toBeTrue();
      const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitBtn.disabled).toBeTrue();
    });

    it('should validate required fields and trimmed whitespace', () => {
      component.form.controls.title.setValue('   ');
      component.form.controls.author.setValue('   ');
      expect(component.form.controls.title.hasError('required')).toBeTrue();
      expect(component.form.controls.author.hasError('required')).toBeTrue();

      component.form.controls.title.setValue('Ett eget rum');
      component.form.controls.author.setValue('Virginia Woolf');
      expect(component.form.controls.title.hasError('required')).toBeFalse();
      expect(component.form.controls.author.hasError('required')).toBeFalse();
    });

    it('should show Swedish field errors when controls are touched', () => {
      component.titleControl.markAsTouched();
      component.authorControl.markAsTouched();
      component.dateControl.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Ange bokens titel');
      expect(el.textContent).toContain('Ange bokens författare');
      expect(el.textContent).toContain('Välj ett publiceringsdatum');
    });

    it('should reject dates in the future with futureDate error', () => {
      const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
      component.dateControl.setValue(tomorrow);
      component.dateControl.markAsTouched();
      fixture.detectChanges();

      expect(component.dateControl.hasError('futureDate')).toBeTrue();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Publiceringsdatumet kan inte vara i framtiden');

      const past = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      component.dateControl.setValue(past);
      fixture.detectChanges();
      expect(component.dateControl.hasError('futureDate')).toBeFalse();
    });

    it('should validate max lengths on title, author and description', () => {
      component.titleControl.setValue('a'.repeat(201));
      component.authorControl.setValue('b'.repeat(201));
      component.descControl.setValue('c'.repeat(501));

      expect(component.titleControl.hasError('maxlength')).toBeTrue();
      expect(component.authorControl.hasError('maxlength')).toBeTrue();
      expect(component.descControl.hasError('maxlength')).toBeTrue();
    });

    it('should update description character counter', () => {
      component.descControl.setValue('Testbeskrivning');
      fixture.detectChanges();

      expect(component.descriptionCount()).toBe(15);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.char-counter')?.textContent?.trim()).toBe('15/500 tecken');
    });

    it('should submit valid form, call bookService.create, show toast and navigate to /books', fakeAsync(() => {
      bookServiceSpy.create.and.returnValue(of(mockBook));

      component.form.setValue({
        title: '  Ett eget rum  ',
        author: '  Virginia Woolf  ',
        publishedDate: '1929-10-24',
        description: '  Klassiker  ',
      });
      fixture.detectChanges();

      expect(component.form.valid).toBeTrue();

      component.onSubmit();
      tick();

      expect(bookServiceSpy.create).toHaveBeenCalledWith({
        title: 'Ett eget rum',
        author: 'Virginia Woolf',
        publishedDate: '1929-10-24',
        description: 'Klassiker',
      });
      expect(toastServiceSpy.show).toHaveBeenCalledWith('"Ett eget rum" har lagts till.', 'success');
      expect(router.navigate).toHaveBeenCalledWith(['/books']);
    }));

    it('should map 400 ProblemDetails errors to form fields', fakeAsync(() => {
      const problemDetailsError = {
        status: 400,
        error: {
          title: 'One or more validation errors occurred.',
          errors: {
            Title: ['Titeln får vara högst 200 tecken'],
            Author: ['Författaren får vara högst 200 tecken'],
          },
        },
      };

      bookServiceSpy.create.and.returnValue(throwError(() => problemDetailsError));

      component.form.setValue({
        title: 'Ett eget rum',
        author: 'Virginia Woolf',
        publishedDate: '1929-10-24',
        description: '',
      });

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(component.titleControl.getError('server')).toBe('Titeln får vara högst 200 tecken');
      expect(component.authorControl.getError('server')).toBe('Författaren får vara högst 200 tecken');
    }));

    it('should show general server error message on submit failure without field errors', fakeAsync(() => {
      bookServiceSpy.create.and.returnValue(throwError(() => ({ status: 500 })));

      component.form.setValue({
        title: 'Ett eget rum',
        author: 'Virginia Woolf',
        publishedDate: '1929-10-24',
        description: '',
      });

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(component.serverErrorMessage()).toContain('Kunde inte spara boken');
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.alert-danger')).toBeTruthy();
    }));
  });

  describe('Edit Mode (/books/:id/edit)', () => {
    beforeEach(() => {
      toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['show']);
    });

    it('should fetch and populate book data on init in edit mode', fakeAsync(() => {
      bookServiceSpy = jasmine.createSpyObj<BookService>('BookService', ['getById', 'create', 'update']);
      bookServiceSpy.getById.and.returnValue(of(mockBook));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BookFormComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'id' ? mockBook.id : null),
                },
              },
            },
          },
          { provide: BookService, useValue: bookServiceSpy },
          { provide: ToastService, useValue: toastServiceSpy },
        ],
      });

      router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      fixture = TestBed.createComponent(BookFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.isEditMode()).toBeTrue();
      expect(bookServiceSpy.getById).toHaveBeenCalledWith(mockBook.id);
      expect(component.form.value.title).toBe(mockBook.title);
      expect(component.form.value.author).toBe(mockBook.author);
      expect(component.form.value.publishedDate).toBe(mockBook.publishedDate);
      expect(component.form.value.description).toBe(mockBook.description ?? '');

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.form-card-title')?.textContent?.trim()).toBe('Redigera bok');
      expect(el.querySelector('.overline')?.textContent?.trim()).toBe('UPPDATERA DIN SAMLING');
      expect(el.querySelector('.fa-pen')).toBeTruthy();
    }));

    it('should display "Boken hittades inte" view if book is not found (404)', fakeAsync(() => {
      bookServiceSpy = jasmine.createSpyObj<BookService>('BookService', ['getById', 'create', 'update']);
      bookServiceSpy.getById.and.returnValue(throwError(() => ({ status: 404 })));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BookFormComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'id' ? 'non-existent-id' : null),
                },
              },
            },
          },
          { provide: BookService, useValue: bookServiceSpy },
          { provide: ToastService, useValue: toastServiceSpy },
        ],
      });

      fixture = TestBed.createComponent(BookFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.isNotFound()).toBeTrue();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Boken hittades inte');
      expect(el.querySelector('a[href="/books"]')).toBeTruthy();
    }));

    it('should call bookService.update on submit in edit mode, show toast and navigate', fakeAsync(() => {
      bookServiceSpy = jasmine.createSpyObj<BookService>('BookService', ['getById', 'create', 'update']);
      bookServiceSpy.getById.and.returnValue(of(mockBook));
      bookServiceSpy.update.and.returnValue(of({ ...mockBook, title: 'Ett eget rum (Reviderad)' }));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BookFormComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'id' ? mockBook.id : null),
                },
              },
            },
          },
          { provide: BookService, useValue: bookServiceSpy },
          { provide: ToastService, useValue: toastServiceSpy },
        ],
      });

      router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      fixture = TestBed.createComponent(BookFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      component.form.controls.title.setValue('Ett eget rum (Reviderad)');
      fixture.detectChanges();

      component.onSubmit();
      tick();

      expect(bookServiceSpy.update).toHaveBeenCalledWith(mockBook.id, {
        title: 'Ett eget rum (Reviderad)',
        author: mockBook.author,
        publishedDate: mockBook.publishedDate,
        description: mockBook.description,
      });
      expect(toastServiceSpy.show).toHaveBeenCalledWith('"Ett eget rum (Reviderad)" har uppdaterats.', 'success');
      expect(router.navigate).toHaveBeenCalledWith(['/books']);
    }));
  });
});
