import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../core/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create and render empty container when no toasts', () => {
    expect(component).toBeTruthy();
    const cards = fixture.nativeElement.querySelectorAll('.toast-card');
    expect(cards.length).toBe(0);
  });

  it('should render toasts and dismiss when close button clicked', () => {
    toastService.show('Bok sparad', 'success', false);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.toast-card');
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Klart');
    expect(card.textContent).toContain('Bok sparad');

    const closeBtn = fixture.nativeElement.querySelector('.toast-close-btn');
    closeBtn.click();
    fixture.detectChanges();

    expect(toastService.toasts().length).toBe(0);
  });

  it('should render action button and trigger action on click', () => {
    let actionTriggered = false;
    toastService.show('Bok raderad', 'success', false, {
      label: 'Ångra',
      onClick: () => { actionTriggered = true; },
    });
    fixture.detectChanges();

    const actionBtn = fixture.nativeElement.querySelector('.toast-action-btn');
    expect(actionBtn).toBeTruthy();
    expect(actionBtn.textContent.trim()).toBe('Ångra');

    actionBtn.click();
    fixture.detectChanges();

    expect(actionTriggered).toBeTrue();
    expect(toastService.toasts().length).toBe(0);
  });
});
