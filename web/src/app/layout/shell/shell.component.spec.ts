import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { ShellComponent } from './shell.component';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;
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
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: ThemeService, useValue: themeSpy },
      ],
    }).compileComponents();

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
});
