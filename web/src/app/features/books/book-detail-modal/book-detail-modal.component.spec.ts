import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BookDetailModalComponent } from './book-detail-modal.component';
import { Book } from '../../../core/models';

describe('BookDetailModalComponent', () => {
  let component: BookDetailModalComponent;
  let fixture: ComponentFixture<BookDetailModalComponent>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockBook: Book = {
    id: 'book-1',
    title: 'Ett eget rum',
    author: 'Virginia Woolf',
    publishedDate: '1929-10-24',
    description: 'En klassisk essä om kvinnors förutsättningar.',
  };

  beforeEach(async () => {
    activeModalSpy = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BookDetailModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModalSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookDetailModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display book details and description when book signal is set', () => {
    component.book.set(mockBook);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.book-detail-title')?.textContent?.trim()).toBe('Ett eget rum');
    expect(el.querySelector('.book-detail-author')?.textContent?.trim()).toBe('Virginia Woolf');
    expect(el.querySelector('.book-detail-text')?.textContent?.trim()).toBe(mockBook.description!);
  });

  it('should display placeholder when description is missing', () => {
    component.book.set({ ...mockBook, description: null });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ingen beskrivning har angetts');
  });

  it('should dismiss modal on close click', () => {
    component.book.set(mockBook);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement;
    closeBtn.click();

    expect(activeModalSpy.dismiss).toHaveBeenCalledWith('close');
  });

  it('should close modal and navigate to edit on onEdit', () => {
    component.book.set(mockBook);
    fixture.detectChanges();

    const editBtn = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    editBtn.click();

    expect(activeModalSpy.close).toHaveBeenCalledWith('edit');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/books', mockBook.id, 'edit']);
  });
});
