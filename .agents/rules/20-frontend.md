---
trigger: model_decision
description: Apply whenever creating, editing, styling, reviewing, or testing Angular frontend files in web/.
---

# Angular 20 frontend rules (web/)

## Structure
src/app/
  core/      auth service, interceptors, guards, theme, toast, api-wake, models
  layout/    shell + navbar
  features/  auth (login, register), books (list, form), quotes (list, dialog), not-found
  shared/    confirm-modal, toast container, empty-state, small reusable pieces
- Feature code stays in its feature folder; only truly reusable things go to shared/.
- Use `ng generate` and keep the file naming the Angular 20 CLI produces, consistently.

## Angular conventions
- Consult the `angular-developer` skill when creating or refactoring Angular components, services, or reactive architecture.
- Standalone components only (no NgModules). OnPush change detection. Lazy-load with loadComponent.
- Signals for local state (signal, computed, input(), output()); RxJS only for HTTP and event streams.
  Use toSignal/takeUntilDestroyed. No manual subscribe without cleanup.
- inject() instead of constructor injection. Built-in control flow (@if, @for with track, @switch), not *ngIf/*ngFor.
- Strict TypeScript: no `any`, no non-null assertions to silence errors, explicit return types on public methods.
- Typed reactive forms (NonNullableFormBuilder). Validators match the API contract exactly.
- Small components. No business logic or HTTP calls in templates. HTTP lives in services.
- Always separate component files: every component must have separate .ts (logic), .html (template via templateUrl), and .scss (styles via styleUrl) files. Never use inline templates or inline styles.
- Unit tests: every component, service, and guard must have an accompanying .spec.ts file testing its core behavior.
- Only add comments (in English) when logic is complex or difficult to understand; prefer clean, self-documenting code over obvious comments.
- Functional guards (CanActivateFn) and interceptors (HttpInterceptorFn).
- Routes: /login, /register (guest only); /books, /books/new, /books/:id/edit, /quotes (auth only);
  "" → /books; ** → not-found. After login go to /books; after successful registration go to /login.
  Page titles in Swedish.

## HTTP, auth and errors
- Only relative URLs ("/api/..."). No environment files with hosts.
- The auth interceptor adds the Bearer token to /api requests except login and register.
- 401 from /api/auth/login → "Fel användarnamn eller lösenord", no logout.
  401 anywhere else → clear token, go to /login, toast "Din session har gått ut. Logga in igen för att fortsätta."
- Status 0 or 5xx → toast "Kunde inte nå servern just nu. Kontrollera din anslutning och försök igen."
- 404 on book edit → "Boken hittades inte" view with a back button.
- Map ProblemDetails "errors" to the matching form fields. 409 username → field error;
  409 quote limit → message near the add button.
- Every list/page handles loading, empty, error and content. Disable submit buttons while a request is pending.
  Deleting always goes through the shared confirm modal.
- ApiWakeService pings /api/health at start, retries every 3 s up to 90 s, and shows the banner
  "Väcker servern, det kan ta upp till en minut…" if there is no answer within 2 s.

## Theming
- data-bs-theme on <html>; persist in localStorage; default to prefers-color-scheme.
- Colors only through CSS variables. No hard-coded hex in components.

## Bootstrap and icons
- Bootstrap 5.3 classes for layout, forms, buttons, navbar, table, card, modal, toast, dropdown.
- ng-bootstrap for interactive parts (collapse, dropdown, modal, toast). Do NOT also import Bootstrap's JS bundle.
- Do not rebuild Bootstrap components with custom classes; customize via Sass and CSS variables.
- Font Awesome as classes: <i class="fa-solid fa-pen" aria-hidden="true"></i>.
  Icons: fa-book, fa-book-open, fa-quote-left, fa-plus, fa-pen, fa-trash, fa-magnifying-glass, fa-sun, fa-moon,
  fa-user, fa-lock, fa-eye, fa-eye-slash, fa-arrow-left, fa-arrow-right, fa-chevron-down,
  fa-right-from-bracket, fa-bars, fa-xmark, fa-check, fa-circle-exclamation.

## Responsive
- Mobile first. Navbar collapses below 992 px (navbar-expand-lg).
- Books: table ≥ 768 px; stacked cards below. No horizontal scroll down to 320 px.
- Touch targets ≥ 44 px where layout allows.

## Accessibility
- Semantic HTML: use landmark and structural elements (<header>, <nav>, <main>, <section>, <article>, <aside>, <footer>, <time>, <form>, <label>) instead of unsemantic <div> wrappers.
- Visible <label> on every field; placeholders never replace labels. Required fields marked visually and programmatically.
- Errors linked with aria-describedby and shown as text, not only color.
- Icon-only buttons have aria-label ("Redigera citat", "Radera bok", "Stäng dialog", "Visa lösenord", "Byt färgtema").
- Modals: dialog role, aria-modal, labelled title, focus trapped, Escape closes, focus returns to the trigger.
- Visible focus ring in both themes. Respect prefers-reduced-motion.
- Dates shown in Swedish short format (`d MMM yyyy`, e.g. `24 sep. 1929`) via `DatePipe` with `registerLocaleData(localeSv)` and `LOCALE_ID` `'sv-SE'`; keep ISO `yyyy-MM-dd` in `<time [attr.datetime]="...">`, date inputs, and API payloads.