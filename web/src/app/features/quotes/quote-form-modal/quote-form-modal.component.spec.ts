import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { QuoteFormModalComponent } from './quote-form-modal.component';
import { QuoteService } from '../quote.service';
import { ToastService } from '../../../core/toast.service';
import { Quote } from '../../../core/models';

describe('QuoteFormModalComponent', () => {
  let component: QuoteFormModalComponent;
  let fixture: ComponentFixture<QuoteFormModalComponent>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;
  let quoteServiceSpy: jasmine.SpyObj<QuoteService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const existingQuote: Quote = {
    id: 'quote-123',
    text: 'Ett hem utan böcker är som en kropp utan själ.',
    author: 'Cicero',
  };

  beforeEach(async () => {
    activeModalSpy = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    quoteServiceSpy = jasmine.createSpyObj<QuoteService>('QuoteService', ['create', 'update']);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [QuoteFormModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModalSpy },
        { provide: QuoteService, useValue: quoteServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteFormModalComponent);
    component = fixture.componentInstance;
  });

  it('should create in create mode by default', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.isEditMode()).toBeFalse();
    expect(component.form.controls.text.value).toBe('');
    expect(component.form.controls.author.value).toBe('');
  });

  it('should populate fields and set isEditMode when quote is provided', () => {
    component.quote.set(existingQuote);
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isEditMode()).toBeTrue();
    expect(component.form.controls.text.value).toBe(existingQuote.text);
    expect(component.form.controls.author.value).toBe(existingQuote.author);
  });

  it('should validate required trimmed fields', () => {
    fixture.detectChanges();

    component.form.controls.text.setValue('   ');
    component.form.controls.author.setValue('   ');
    expect(component.form.invalid).toBeTrue();
    expect(component.textControl.hasError('required')).toBeTrue();
    expect(component.authorControl.hasError('required')).toBeTrue();

    component.form.controls.text.setValue('Giltigt citat');
    component.form.controls.author.setValue('Giltig författare');
    expect(component.form.valid).toBeTrue();
  });

  it('should validate max lengths', () => {
    fixture.detectChanges();

    component.form.controls.text.setValue('a'.repeat(601));
    component.form.controls.author.setValue('b'.repeat(201));
    expect(component.textControl.hasError('maxlength')).toBeTrue();
    expect(component.authorControl.hasError('maxlength')).toBeTrue();
  });

  it('should update character counter when text changes', () => {
    fixture.detectChanges();
    expect(component.textCount()).toBe(0);

    component.form.controls.text.setValue('Hej världen');
    expect(component.textCount()).toBe(11);
  });

  it('should create quote and close modal on submit in create mode', () => {
    fixture.detectChanges();

    const created: Quote = {
      id: 'quote-new',
      text: 'Nytt citat',
      author: 'Ny författare',
    };
    quoteServiceSpy.create.and.returnValue(of(created));

    component.form.controls.text.setValue('  Nytt citat  ');
    component.form.controls.author.setValue('  Ny författare  ');

    component.onSubmit();

    expect(quoteServiceSpy.create).toHaveBeenCalledWith({
      text: 'Nytt citat',
      author: 'Ny författare',
    });
    expect(toastServiceSpy.show).toHaveBeenCalledWith('Citatet har sparats.', 'success');
    expect(activeModalSpy.close).toHaveBeenCalledWith(created);
  });

  it('should update quote and close modal on submit in edit mode', () => {
    component.quote.set(existingQuote);
    component.ngOnInit();
    fixture.detectChanges();

    const updated: Quote = {
      ...existingQuote,
      text: 'Uppdaterat citat',
    };
    quoteServiceSpy.update.and.returnValue(of(updated));

    component.form.controls.text.setValue('Uppdaterat citat');
    component.onSubmit();

    expect(quoteServiceSpy.update).toHaveBeenCalledWith(existingQuote.id, {
      text: 'Uppdaterat citat',
      author: existingQuote.author,
    });
    expect(toastServiceSpy.show).toHaveBeenCalledWith('Citatet har uppdaterats.', 'success');
    expect(activeModalSpy.close).toHaveBeenCalledWith(updated);
  });

  it('should handle 409 conflict error properly', () => {
    fixture.detectChanges();

    quoteServiceSpy.create.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict',
        error: { detail: 'Du har nått maxgränsen på fem citat.' },
      }))
    );

    component.form.controls.text.setValue('Nytt citat');
    component.form.controls.author.setValue('Författare');

    component.onSubmit();

    expect(component.serverErrorMessage()).toBe('Du har nått maxgränsen på fem citat.');
    expect(component.isSubmitting()).toBeFalse();
  });

  it('should handle 400 validation error with field errors', () => {
    fixture.detectChanges();

    quoteServiceSpy.create.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: {
          errors: {
            text: ['Citatet får vara högst 600 tecken'],
            author: ['Författaren får vara högst 200 tecken'],
          },
        },
      }))
    );

    component.form.controls.text.setValue('Citat');
    component.form.controls.author.setValue('Författare');

    component.onSubmit();

    expect(component.textControl.getError('server')).toBe('Citatet får vara högst 600 tecken');
    expect(component.authorControl.getError('server')).toBe('Författaren får vara högst 200 tecken');
  });

  it('should dismiss modal on close or cancel', () => {
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const closeBtn = el.querySelector<HTMLButtonElement>('.btn-icon');
    closeBtn?.click();
    expect(activeModalSpy.dismiss).toHaveBeenCalledWith('close');

    const cancelBtn = el.querySelector<HTMLButtonElement>('.btn-secondary');
    cancelBtn?.click();
    expect(activeModalSpy.dismiss).toHaveBeenCalledWith('cancel');
  });
});
