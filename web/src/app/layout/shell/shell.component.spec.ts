import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { ShellComponent } from './shell.component';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;
  let router: Router;
  let authSpy: jasmine.SpyObj<AuthService>;
  let themeSpy: jasmine.SpyObj<ThemeService>;
  const isLoggedInSignal = signal(false);
  const usernameSignal = signal('');

  beforeEach(async () => {
    isLoggedInSignal.set(false);
    usernameSignal.set('');

    authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      isLoggedIn: isLoggedInSignal,
      username: usernameSignal,
    });

    themeSpy = jasmine.createSpyObj('ThemeService', ['toggle'], {
      current: signal('light' as const),
    });

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([
          { path: 'books', component: DummyComponent },
          { path: 'quotes', component: DummyComponent },
          { path: 'login', component: DummyComponent },
          { path: 'register', component: DummyComponent },
        ]),
        { provide: AuthService, useValue: authSpy },
        { provide: ThemeService, useValue: themeSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and default to collapsed navbar', () => {
    expect(component).toBeTruthy();
    expect(component.isCollapsed()).toBeTrue();

    const header = fixture.nativeElement.querySelector('.app-header');
    expect(header?.classList.contains('is-open')).toBeFalse();

    component.isCollapsed.set(false);
    fixture.detectChanges();
    expect(header?.classList.contains('is-open')).toBeTrue();
  });

  it('should render navigation links for Böcker and Mina citat', () => {
    const links = fixture.nativeElement.querySelectorAll('.app-nav .nav-link');
    expect(links.length).toBe(2);

    const booksLink = fixture.nativeElement.querySelector('a[routerLink="/books"]');
    const quotesLink = fixture.nativeElement.querySelector('a[routerLink="/quotes"]');

    expect(booksLink).toBeTruthy();
    expect(booksLink.textContent).toContain('Böcker');
    expect(booksLink.querySelector('.fa-book')).toBeTruthy();

    expect(quotesLink).toBeTruthy();
    expect(quotesLink.textContent).toContain('Mina citat');
    expect(quotesLink.querySelector('.fa-quote-left')).toBeTruthy();
  });

  it('should mark active link and set aria-current="page" upon navigation', async () => {
    const booksLink: HTMLElement = fixture.nativeElement.querySelector('a[routerLink="/books"]');
    const quotesLink: HTMLElement = fixture.nativeElement.querySelector('a[routerLink="/quotes"]');

    await router.navigate(['/books']);
    fixture.detectChanges();

    expect(booksLink.classList.contains('active')).toBeTrue();
    expect(booksLink.getAttribute('aria-current')).toBe('page');
    expect(quotesLink.classList.contains('active')).toBeFalse();
    expect(quotesLink.getAttribute('aria-current')).toBeFalsy();

    await router.navigate(['/quotes']);
    fixture.detectChanges();

    expect(quotesLink.classList.contains('active')).toBeTrue();
    expect(quotesLink.getAttribute('aria-current')).toBe('page');
    expect(booksLink.classList.contains('active')).toBeFalse();
    expect(booksLink.getAttribute('aria-current')).toBeFalsy();
  });

  it('should collapse mobile navbar when clicking a nav link', () => {
    component.isCollapsed.set(false);
    fixture.detectChanges();

    const quotesLink: HTMLElement = fixture.nativeElement.querySelector('a[routerLink="/quotes"]');
    quotesLink.click();

    expect(component.isCollapsed()).toBeTrue();
  });

  it('should calculate userInitials properly', () => {
    usernameSignal.set('');
    expect(component.userInitials()).toBe('U');

    usernameSignal.set('Virginia Woolf');
    expect(component.userInitials()).toBe('VW');

    usernameSignal.set('Bokmalen');
    expect(component.userInitials()).toBe('BO');
  });

  it('should close mobile menu and call auth.logout on logout', () => {
    component.isCollapsed.set(false);

    component.logout();

    expect(component.isCollapsed()).toBeTrue();
    expect(authSpy.logout).toHaveBeenCalled();
  });

  it('should close mobile menu when clicking outside header', () => {
    component.isCollapsed.set(false);
    fixture.detectChanges();

    const outsideDiv = document.createElement('div');
    document.body.appendChild(outsideDiv);

    component.onDocumentClick({ target: outsideDiv } as unknown as MouseEvent);
    expect(component.isCollapsed()).toBeTrue();

    outsideDiv.remove();
  });

  it('should not close mobile menu when clicking inside header', () => {
    component.isCollapsed.set(false);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.app-header');
    component.onDocumentClick({ target: header } as unknown as MouseEvent);
    expect(component.isCollapsed()).toBeFalse();
  });

  it('should close mobile menu on escape key press', () => {
    component.isCollapsed.set(false);
    component.onEscape();
    expect(component.isCollapsed()).toBeTrue();
  });

  it('should hide header and footer on auth pages like /login and /register', async () => {
    expect(fixture.nativeElement.querySelector('.app-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-footer')).toBeTruthy();
    expect(component.isAuthPage()).toBeFalse();

    await router.navigate(['/login']);
    fixture.detectChanges();

    expect(component.isAuthPage()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.app-header')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-footer')).toBeNull();

    await router.navigate(['/books']);
    fixture.detectChanges();

    expect(component.isAuthPage()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.app-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-footer')).toBeTruthy();
  });
});
