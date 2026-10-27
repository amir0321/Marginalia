import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthHeroComponent } from './auth-hero.component';
import { ThemeService } from '../../../core/theme.service';

describe('AuthHeroComponent', () => {
  let component: AuthHeroComponent;
  let fixture: ComponentFixture<AuthHeroComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
    localStorage.removeItem('marginalia.theme');
    await TestBed.configureTestingModule({
      imports: [AuthHeroComponent],
      providers: [provideRouter([]), ThemeService],
    }).compileComponents();

    themeService = TestBed.inject(ThemeService);
    fixture = TestBed.createComponent(AuthHeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('marginalia.theme');
  });

  it('should create and render quote and citation', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;

    const quoteEl = el.querySelector('.hero-quote');
    expect(quoteEl?.textContent).toContain('Läsning ger oss någonstans att ta vägen');

    const citeEl = el.querySelector('cite');
    expect(citeEl?.textContent).toContain('Mason Cooley');
  });

  it('should toggle theme when clicking theme toggle button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button.theme-toggle') as HTMLButtonElement;
    expect(button).toBeTruthy();

    const initialTheme = themeService.current();
    button.click();
    fixture.detectChanges();

    const expectedNext = initialTheme === 'light' ? 'dark' : 'light';
    expect(themeService.current()).toBe(expectedNext);
  });
});
