import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LoadingBarComponent } from './loading-bar.component';
import { LoadingService } from '../../core/loading.service';

describe('LoadingBarComponent', () => {
  let component: LoadingBarComponent;
  let fixture: ComponentFixture<LoadingBarComponent>;
  const isLoadingSignal = signal(false);

  beforeEach(async () => {
    isLoadingSignal.set(false);

    const loadingSpy = jasmine.createSpyObj('LoadingService', ['start', 'stop', 'reset'], {
      isLoading: isLoadingSignal,
    });

    await TestBed.configureTestingModule({
      imports: [LoadingBarComponent],
      providers: [{ provide: LoadingService, useValue: loadingSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and not render bar when isLoading is false', () => {
    expect(component).toBeTruthy();
    const bar = fixture.nativeElement.querySelector('.global-loading-bar');
    expect(bar).toBeNull();
  });

  it('should render bar with progressbar role and aria-label when isLoading is true', () => {
    isLoadingSignal.set(true);
    fixture.detectChanges();

    const bar: HTMLElement | null = fixture.nativeElement.querySelector('.global-loading-bar');
    expect(bar).toBeTruthy();
    expect(bar?.getAttribute('role')).toBe('progressbar');
    expect(bar?.getAttribute('aria-label')).toBe('Laddar innehåll…');
    expect(bar?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar?.getAttribute('aria-valuemax')).toBe('100');

    const indicator = fixture.nativeElement.querySelector('.global-loading-bar-indicator');
    expect(indicator).toBeTruthy();
  });
});
