---
trigger: always_on
---

# API contract (frontend and backend must match exactly)

Base path /api, JSON, camelCase, dates as "yyyy-MM-dd" (DateOnly), ids are GUID strings.
All endpoints except /api/health, /api/auth/register and /api/auth/login require "Authorization: Bearer <token>".

| Method & path | Request body | Success | Errors |
|---|---|---|---|
| GET /api/health | – | 200 { "status": "ok" } | – |
| POST /api/auth/register | { username, password } | 201 | 400 validation, 409 username taken |
| POST /api/auth/login | { username, password } | 200 { token, username, expiresAt } | 400, 401 wrong credentials |
| GET /api/books | – | 200 [Book] sorted by title | 401 |
| GET /api/books/{id} | – | 200 Book | 401, 404 |
| POST /api/books | { title, author, publishedDate, description? } | 201 Book + Location | 400, 401 |
| PUT /api/books/{id} | same as POST | 200 Book | 400, 401, 404 |
| DELETE /api/books/{id} | – | 204 | 401, 404 |
| GET /api/quotes | – | 200 [Quote] oldest first | 401 |
| POST /api/quotes | { text, author } | 201 Quote | 400, 401, 409 limit reached |
| PUT /api/quotes/{id} | { text, author } | 200 Quote | 400, 401, 404 |
| DELETE /api/quotes/{id} | – | 204 | 401, 404 |

Book  = { id, title, author, publishedDate, description }
Quote = { id, text, author }

Limits (identical in frontend validators and backend validation):
username 3–30 chars (letters, digits, . _ -), unique case-insensitive; password min 8; book title ≤ 200;
book author ≤ 200; description ≤ 500 (optional); quote text ≤ 600; quote author ≤ 200.

Errors use ProblemDetails (RFC 7807). Validation: 400 with "errors": { "field": ["message"] }.
Messages are Swedish: "Ange ett användarnamn", "Använd minst 8 tecken", "Användarnamnet är redan upptaget",
"Fel användarnamn eller lösenord", "Du har nått maxgränsen på fem citat."
Another user's record returns 404, never 403.
If the contract changes, update both sides and this rule in the same task.