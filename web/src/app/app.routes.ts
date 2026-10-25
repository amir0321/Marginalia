import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'books', pathMatch: 'full' },

  {
    path: 'login',
    title: 'Logga in – Marginalia',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Skapa konto – Marginalia',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },

  {
    path: 'books',
    title: 'Mina böcker – Marginalia',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/book-list/book-list.component').then(m => m.BookListComponent),
  },
  {
    path: 'books/new',
    title: 'Lägg till ny bok – Marginalia',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/book-form/book-form.component').then(m => m.BookFormComponent),
  },
  {
    path: 'books/:id/edit',
    title: 'Redigera bok – Marginalia',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/book-form/book-form.component').then(m => m.BookFormComponent),
  },

  {
    path: 'quotes',
    title: 'Mina citat – Marginalia',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quotes/quote-list/quote-list.component').then(m => m.QuoteListComponent),
  },
  { path: 'mina-citat', redirectTo: 'quotes', pathMatch: 'full' },

  {
    path: '**',
    title: 'Sidan hittades inte – Marginalia',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
