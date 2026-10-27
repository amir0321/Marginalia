import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QuoteListComponent } from './quote-list.component';
import { QuoteService } from '../quote.service';
import { ToastService } from '../../../core/toast.service';
import { Quote } from '../../../core/models';

describe('QuoteListComponent', () => {
  let component: QuoteListComponent;
  let fixture: ComponentFixture<QuoteListComponent>;
  let quoteServiceSpy: jasmine.SpyObj<QuoteService>;
  let modalServiceSpy: jasmine.SpyObj<NgbModal>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockQuotes: Quote[] = [
    {
      id: 'quote-1',
      text: 'Ett hem utan böcker är som en kropp utan själ.',
      author: 'Cicero',
    },
    {
      id: 'quote-2',
      text: 'Att läsa är att resa utan att röra sig.',
      author: 'Jhumpa Lahiri',
    },
    {
      id: 'quote-3',
      text: 'Ord har vingar.',
      author: 'Homeros',
    },
  ];

  beforeEach(async () => {
    quoteServiceSpy = jasmine.createSpyObj<QuoteService>('QuoteService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    modalServiceSpy = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['show']);

    quoteServiceSpy.getAll.and.returnValue(of(mockQuotes));

    await TestBed.configureTestingModule({
      imports: [QuoteListComponent],
      providers: [
        { provide: QuoteService, useValue: quoteServiceSpy },
        { provide: NgbModal, useValue: modalServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteListComponent);
    component = fixture.componentInstance;
  });

  it('should create and load quotes on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.quotes().length).toBe(3);
    expect(component.isLoading()).toBeFalse();
  });

  it('should show skeleton loader while loading', () => {
    const quotes$ = new Subject<Quote[]>();
    quoteServiceSpy.getAll.and.returnValue(quotes$);

    component.loadQuotes();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.quote-skeleton')).toBeTruthy();

    quotes$.next(mockQuotes);
    quotes$.complete();
    fixture.detectChanges();

    expect(el.querySelector('.quote-skeleton')).toBeFalsy();
    expect(el.querySelectorAll('.quote-card').length).toBe(3);
  });

  it('should display error empty state on fetch failure and retry on action', () => {
    quoteServiceSpy.getAll.and.returnValue(throwError(() => new Error('Network error')));

    component.loadQuotes();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Kunde inte hämta citat');

    quoteServiceSpy.getAll.and.returnValue(of(mockQuotes));
    const retryBtn = el.querySelector<HTMLButtonElement>('button.retry-btn');
    retryBtn?.click();
    fixture.detectChanges();

    expect(component.quotes().length).toBe(3);
  });

  it('should display dashed card with next ordinal word when fewer than 5 quotes', () => {
    fixture.detectChanges();

    expect(component.isMaxLimitReached()).toBeFalse();
    expect(component.nextOrdinalWord()).toBe('4:e');

    const el = fixture.nativeElement as HTMLElement;
    const dashedCard = el.querySelector('.dashed-quote-card');
    expect(dashedCard).toBeTruthy();
    expect(dashedCard?.textContent).toContain('Lägg till ditt 4:e citat');
  });

  it('should enforce max limit UI when 5 quotes are loaded', () => {
    const fiveQuotes: Quote[] = [
      ...mockQuotes,
      { id: 'quote-4', text: 'Citat 4', author: 'Författare 4' },
      { id: 'quote-5', text: 'Citat 5', author: 'Författare 5' },
    ];
    quoteServiceSpy.getAll.and.returnValue(of(fiveQuotes));

    component.loadQuotes();
    fixture.detectChanges();

    expect(component.isMaxLimitReached()).toBeTrue();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dashed-quote-card')).toBeFalsy();
    expect(el.textContent).toContain('Du har nått maxgränsen på fem citat.');

    const addBtn = el.querySelector<HTMLButtonElement>('button.page-header-action');
    expect(addBtn?.disabled).toBeTrue();
  });

  it('should open QuoteFormModalComponent when clicking add button and add result to list', async () => {
    fixture.detectChanges();

    const newQuote: Quote = {
      id: 'quote-new',
      text: 'Nytt spännande citat.',
      author: 'Ny författare',
    };

    const modalRefMock = {
      componentInstance: {},
      result: Promise.resolve(newQuote),
    };
    modalServiceSpy.open.and.returnValue(modalRefMock as any);

    component.onAddQuote();

    expect(modalServiceSpy.open).toHaveBeenCalled();

    await modalRefMock.result;
    expect(component.quotes().length).toBe(4);
    expect(component.quotes().some(q => q.id === 'quote-new')).toBeTrue();
  });

  it('should open QuoteFormModalComponent with quote on edit and update list', async () => {
    fixture.detectChanges();

    const quoteToEdit = mockQuotes[0];
    const updatedQuote: Quote = {
      ...quoteToEdit,
      text: 'Ändrat citat.',
    };

    const quoteSignal = signal<Quote | null>(null);
    const modalRefMock = {
      componentInstance: {
        quote: quoteSignal,
      },
      result: Promise.resolve(updatedQuote),
    };
    modalServiceSpy.open.and.returnValue(modalRefMock as any);

    component.onEditQuote(quoteToEdit);

    expect(modalServiceSpy.open).toHaveBeenCalled();
    expect(quoteSignal()).toEqual(quoteToEdit);

    await modalRefMock.result;
    expect(component.quotes().find(q => q.id === quoteToEdit.id)?.text).toBe('Ändrat citat.');
  });

  it('should open ConfirmModalComponent on delete, remove quote, and allow undo', async () => {
    fixture.detectChanges();

    const quoteToDelete = mockQuotes[0];
    quoteServiceSpy.delete.and.returnValue(of(undefined as any));

    const titleSignal = signal<string>('');
    const messageSignal = signal<string>('');
    const supportTextSignal = signal<string>('');
    const confirmTextSignal = signal<string>('');
    const cancelTextSignal = signal<string>('');
    const isSubmittingSignal = signal<boolean>(false);

    const modalRefMock = {
      componentInstance: {
        title: titleSignal,
        message: messageSignal,
        supportText: supportTextSignal,
        confirmText: confirmTextSignal,
        cancelText: cancelTextSignal,
        isSubmitting: isSubmittingSignal,
        onConfirmCallback: undefined as (() => void) | undefined,
      },
      close: jasmine.createSpy('close'),
      result: Promise.resolve(true),
    };
    modalServiceSpy.open.and.returnValue(modalRefMock as any);

    component.onDeleteQuote(quoteToDelete);

    expect(modalServiceSpy.open).toHaveBeenCalled();
    expect(titleSignal()).toBe('Radera citat');
    expect(messageSignal()).toContain(quoteToDelete.author);
    expect(modalRefMock.componentInstance.onConfirmCallback).toBeDefined();

    modalRefMock.componentInstance.onConfirmCallback!();

    expect(quoteServiceSpy.delete).toHaveBeenCalledWith(quoteToDelete.id);
    expect(modalRefMock.close).toHaveBeenCalledWith(true);
    expect(component.quotes().some(q => q.id === quoteToDelete.id)).toBeFalse();
    expect(toastServiceSpy.show).toHaveBeenCalledWith(
      'Citatet har raderats.',
      'success',
      true,
      jasmine.objectContaining({
        label: 'Ångra',
      })
    );

    // Test the undo action
    const lastToastCallArgs = toastServiceSpy.show.calls.mostRecent().args;
    const undoAction = lastToastCallArgs[3];
    expect(undoAction?.label).toBe('Ångra');

    const restoredQuote: Quote = {
      id: 'quote-restored',
      text: quoteToDelete.text,
      author: quoteToDelete.author,
    };
    quoteServiceSpy.create.and.returnValue(of(restoredQuote));

    undoAction?.onClick();

    expect(quoteServiceSpy.create).toHaveBeenCalledWith({
      text: quoteToDelete.text,
      author: quoteToDelete.author,
    });
    expect(component.quotes().some(q => q.id === 'quote-restored')).toBeTrue();
    expect(toastServiceSpy.show).toHaveBeenCalledWith('Citatet har återställts.', 'success');
  });

  it('should show error toast if delete fails', async () => {
    fixture.detectChanges();

    const quoteToDelete = mockQuotes[0];
    quoteServiceSpy.delete.and.returnValue(throwError(() => new Error('Delete failed')));
    const isSubmittingSignal = signal(false);

    const modalRefMock = {
      componentInstance: {
        title: signal(''),
        message: signal(''),
        supportText: signal(''),
        confirmText: signal(''),
        cancelText: signal(''),
        isSubmitting: isSubmittingSignal,
        onConfirmCallback: undefined as (() => void) | undefined,
      },
      close: jasmine.createSpy('close'),
      result: Promise.resolve(true),
    };
    modalServiceSpy.open.and.returnValue(modalRefMock as any);

    component.onDeleteQuote(quoteToDelete);
    modalRefMock.componentInstance.onConfirmCallback!();

    expect(isSubmittingSignal()).toBeFalse();
    expect(modalRefMock.close).not.toHaveBeenCalled();
    expect(toastServiceSpy.show).toHaveBeenCalledWith('Kunde inte radera citatet. Försök igen.', 'danger');
    expect(component.quotes().some(q => q.id === quoteToDelete.id)).toBeTrue();
  });

  it('should remove quote and show info toast if delete returns 404', async () => {
    fixture.detectChanges();

    const quoteToDelete = mockQuotes[0];
    const notFoundError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    quoteServiceSpy.delete.and.returnValue(throwError(() => notFoundError));
    const isSubmittingSignal = signal(false);

    const modalRefMock = {
      componentInstance: {
        title: signal(''),
        message: signal(''),
        supportText: signal(''),
        confirmText: signal(''),
        cancelText: signal(''),
        isSubmitting: isSubmittingSignal,
        onConfirmCallback: undefined as (() => void) | undefined,
      },
      close: jasmine.createSpy('close'),
      result: Promise.resolve(true),
    };
    modalServiceSpy.open.and.returnValue(modalRefMock as any);

    component.onDeleteQuote(quoteToDelete);
    modalRefMock.componentInstance.onConfirmCallback!();

    expect(quoteServiceSpy.delete).toHaveBeenCalledWith(quoteToDelete.id);
    expect(modalRefMock.close).toHaveBeenCalledWith(true);
    expect(toastServiceSpy.show).toHaveBeenCalledWith('Citatet var redan borttaget.', 'info');
    expect(component.quotes().some(q => q.id === quoteToDelete.id)).toBeFalse();
  });

  it('should open QuoteDetailModalComponent when clicking a quote card or quote text', () => {
    fixture.detectChanges();
    spyOn(component, 'openDetail');

    const card = fixture.nativeElement.querySelector('.quote-card') as HTMLElement;
    expect(card).toBeTruthy();
    card.click();

    expect(component.openDetail).toHaveBeenCalledWith(mockQuotes[0], 1);
  });

  it('should configure QuoteDetailModalComponent and open edit modal when detail returns "edit"', async () => {
    fixture.detectChanges();
    spyOn(component, 'onEditQuote');

    const detailModalMock = {
      componentInstance: {
        quote: { set: jasmine.createSpy('quote.set') },
        index: { set: jasmine.createSpy('index.set') },
      },
      result: Promise.resolve('edit'),
    };
    modalServiceSpy.open.and.returnValue(detailModalMock as any);

    component.openDetail(mockQuotes[0], 1);

    expect(modalServiceSpy.open).toHaveBeenCalled();
    expect(detailModalMock.componentInstance.quote.set).toHaveBeenCalledWith(mockQuotes[0]);
    expect(detailModalMock.componentInstance.index.set).toHaveBeenCalledWith(1);

    await detailModalMock.result;
    expect(component.onEditQuote).toHaveBeenCalledWith(mockQuotes[0]);
  });
});
