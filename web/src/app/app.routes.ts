import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'books', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },

  {
    path: 'books',
    loadComponent: () =>
      import('./features/books/book-list/book-list.component').then(m => m.BookListComponent),
  },
  {
    path: 'books/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/book-form/book-form.component').then(m => m.BookFormComponent),
  },
  {
    path: 'books/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/book-form/book-form.component').then(m => m.BookFormComponent),
  },

  {
    path: 'quotes',
    loadComponent: () =>
      import('./features/quotes/quote-list/quote-list.component').then(m => m.QuoteListComponent),
  },
  { path: 'mina-citat', redirectTo: 'quotes', pathMatch: 'full' },

  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
