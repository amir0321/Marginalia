import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render empty-state with title and back link', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;

    const titleEl = el.querySelector('.empty-state-title');
    expect(titleEl?.textContent?.trim()).toBe('Sidan hittades inte');

    const descEl = el.querySelector('.empty-state-desc');
    expect(descEl?.textContent).toContain('Sidan du letar efter verkar ha flyttats eller finns inte');

    const linkEl = el.querySelector('a.btn-primary') as HTMLAnchorElement;
    expect(linkEl).toBeTruthy();
    expect(linkEl.textContent?.trim()).toBe('Gå till mina böcker');
  });
});
