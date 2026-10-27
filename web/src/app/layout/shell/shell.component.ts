import { Component, ChangeDetectionStrategy, computed, inject, signal, ElementRef, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { NgbCollapseModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';
import { ToastContainerComponent } from '../../shared/toast/toast-container.component';
import { LogoComponent } from '../../shared/logo/logo.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgbCollapseModule,
    NgbDropdownModule,
    ToastContainerComponent,
    LogoComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  readonly isCollapsed = signal(true);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isAuthPage = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/login') || url.startsWith('/register');
  });

  readonly userInitials = computed(() => {
    const name = this.auth.username()?.trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isCollapsed()) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const header = this.elementRef.nativeElement.querySelector('.app-header');
    if (header && !header.contains(target)) {
      this.isCollapsed.set(true);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isCollapsed()) {
      this.isCollapsed.set(true);
    }
  }

  logout(): void {
    this.isCollapsed.set(true);
    this.auth.logout();
  }
}
