import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    activeModalSpy = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModalSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default values', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.confirm-modal-title')?.textContent?.trim()).toBe('Är du säker?');
    expect(el.querySelector('.confirm-modal-msg')?.textContent?.trim()).toBe('Är du säker på att du vill radera?');
    expect(el.querySelector('.confirm-modal-support')?.textContent?.trim()).toBe('Åtgärden går inte att ångra.');
    expect(el.querySelector('.btn-danger')?.textContent?.trim()).toBe('Radera');
    expect(el.querySelector('.btn-secondary')?.textContent?.trim()).toBe('Avbryt');
  });

  it('should update rendered content when signals are changed', () => {
    component.title.set('Radera bok');
    component.message.set('Är du säker på att du vill radera “Ett eget rum”?');
    component.confirmText.set('Ta bort');
    component.cancelText.set('Behåll');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.confirm-modal-title')?.textContent?.trim()).toBe('Radera bok');
    expect(el.querySelector('.confirm-modal-msg')?.textContent?.trim()).toBe('Är du säker på att du vill radera “Ett eget rum”?');
    expect(el.querySelector('.btn-danger')?.textContent?.trim()).toBe('Ta bort');
    expect(el.querySelector('.btn-secondary')?.textContent?.trim()).toBe('Behåll');
  });

  it('should hide support text when supportText signal is empty', () => {
    component.supportText.set('');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.confirm-modal-support')).toBeNull();
  });

  it('should close modal with true when confirm button is clicked', () => {
    const confirmBtn = fixture.nativeElement.querySelector('.btn-danger') as HTMLButtonElement;
    confirmBtn.click();

    expect(activeModalSpy.close).toHaveBeenCalledWith(true);
  });

  it('should dismiss modal with cancel when cancel button is clicked', () => {
    const cancelBtn = fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement;
    cancelBtn.click();

    expect(activeModalSpy.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should dismiss modal with cancel when close icon button is clicked', () => {
    const closeBtn = fixture.nativeElement.querySelector('.btn-icon') as HTMLButtonElement;
    closeBtn.click();

    expect(activeModalSpy.dismiss).toHaveBeenCalledWith('cancel');
  });
});
