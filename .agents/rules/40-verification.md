---
trigger: model_decision
description: Apply when finishing a task, testing, debugging, reviewing a diff, or before saying that something is done.
---

# Verification and QA checklist

## Commands (from repo root)
- API: dotnet build api/Marginalia.sln && dotnet test api
- Web: cd web && npm run build && npm test -- --watch=false
- Local run: docker compose up -d; dotnet run --project api/Marginalia.Api; cd web && npm start
- Proxy check: GET http://localhost:4200/api/health returns 200 through the Angular proxy.

## Manual flow (browser, 390 px and 1440 px)
1. Register → log in → lands on /books.
2. Add a book → list shows it. Edit → list shows changes. Delete → confirm modal → gone, toast shown.
3. Mina citat: add, edit, delete. At 5 quotes the add button is disabled with the hint.
4. Log out; /books redirects to /login. Reload while logged in stays logged in.
   Expired/invalid token → login page with the session message.
5. User B cannot see or open user A's books/quotes (404).
6. Navbar collapses below 992 px; no horizontal scroll at 320 px; focus visible; keyboard works; Escape closes modals.
7. Wrong password shows "Fel användarnamn eller lösenord". API stopped shows the network error toast.
8. Check contrast and tokens in the light theme (and dark if implemented).

## Debugging
- Reproduce first, find the root cause, fix minimally, re-run the failing check.
- Do not hide errors with try/catch, `any` or by disabling lint/analyzers.
- If you cannot run something (no browser, no Docker), say so and list the exact steps the owner should run.

## Review before finishing
- Re-read the diff: unrelated changes, leftover logs, hard-coded hosts or secrets, missing Swedish text,
  missing aria-labels, missing loading/empty/error states, mismatches between api and web contract.