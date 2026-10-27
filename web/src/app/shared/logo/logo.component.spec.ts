import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.onDark()).toBeFalse();
    expect(component.showText()).toBeTrue();
    expect(component.linkUrl()).toBe('/');
    expect(component.compact()).toBeFalse();

    const textEl = fixture.nativeElement.querySelector('.brand-text');
    expect(textEl).toBeTruthy();
    expect(textEl.textContent?.trim()).toBe('Marginalia');
  });

  it('should apply on-dark and is-compact classes when configured', () => {
    fixture.componentRef.setInput('onDark', true);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    const linkEl = fixture.nativeElement.querySelector('.brand-logo');
    expect(linkEl.classList.contains('on-dark')).toBeTrue();
    expect(linkEl.classList.contains('is-compact')).toBeTrue();
  });

  it('should hide brand text when showText is false', () => {
    fixture.componentRef.setInput('showText', false);
    fixture.detectChanges();

    const textEl = fixture.nativeElement.querySelector('.brand-text');
    expect(textEl).toBeNull();
  });

  it('should have custom aria-label when provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Anpassad logolabel');
    fixture.detectChanges();

    const linkEl = fixture.nativeElement.querySelector('.brand-logo');
    expect(linkEl.getAttribute('aria-label')).toBe('Anpassad logolabel');
  });
});
