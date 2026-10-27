import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { QuoteDetailModalComponent } from './quote-detail-modal.component';
import { Quote } from '../../../core/models';

describe('QuoteDetailModalComponent', () => {
  let component: QuoteDetailModalComponent;
  let fixture: ComponentFixture<QuoteDetailModalComponent>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  const mockQuote: Quote = {
    id: 'quote-1',
    text: 'Ett rum utan böcker är som en kropp utan själ.',
    author: 'Cicero',
  };

  beforeEach(async () => {
    activeModalSpy = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      imports: [QuoteDetailModalComponent],
      providers: [{ provide: NgbActiveModal, useValue: activeModalSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteDetailModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display quote text, author, and index when signals are set', () => {
    component.quote.set(mockQuote);
    component.index.set(1);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.quote-detail-text')?.textContent?.trim()).toBe(mockQuote.text);
    expect(el.querySelector('.quote-detail-author')?.textContent?.trim()).toBe(mockQuote.author);
    expect(el.querySelector('.quote-detail-index')?.textContent?.trim()).toBe('01');
  });

  it('should dismiss modal on close click or xmark button click', () => {
    component.quote.set(mockQuote);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement;
    closeBtn.click();
    expect(activeModalSpy.dismiss).toHaveBeenCalledWith('close');

    const xmarkBtn = fixture.nativeElement.querySelector('.btn-icon') as HTMLButtonElement;
    xmarkBtn.click();
    expect(activeModalSpy.dismiss).toHaveBeenCalledWith('close');
  });

  it('should close modal with "edit" result when clicking redigera citat', () => {
    component.quote.set(mockQuote);
    fixture.detectChanges();

    const editBtn = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    editBtn.click();

    expect(activeModalSpy.close).toHaveBeenCalledWith('edit');
  });
});
