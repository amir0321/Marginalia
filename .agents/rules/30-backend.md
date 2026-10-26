---
trigger: glob
globs: api/**
---

# .NET 9 backend rules (api/)

## Structure
api/Marginalia.Api: Controllers, Data (AppDbContext, migrations), Models (entities), Dtos, Services, Program.cs.
Nullable reference types and implicit usings on. Treat new compiler warnings as problems.

## API design
- Controllers with [ApiController]. Routes: api/auth, api/books, api/quotes, api/health.
- Never expose entities. Use request/response DTOs (records) and map explicitly.
- Follow the API contract rule exactly (status codes, bodies, limits, messages).
- Validation with data annotations (Swedish ErrorMessage) plus code checks; return ValidationProblem/ProblemDetails.
- POST 201 + Location; PUT 200; DELETE 204; unknown or foreign id → 404.
- Async all the way, CancellationToken on actions, no .Result/.Wait().
- Thin controllers. Non-trivial logic (token creation, quote limit) lives in services.

## Auth
- JwtBearer with full validation, MapInboundClaims = false. Claims: sub (user id), unique_name.
- One helper reads "sub" and is the only way to get the current user id.
- Register: store UsernameNormalized (upper-case, unique index), hash with PasswordHasher<User>.
  Duplicate → 409 "Användarnamnet är redan upptaget".
- Login: generic 401 "Fel användarnamn eller lösenord" for unknown user or wrong password.
  Returns { token, username, expiresAt }.
- Quote limit: count the user's quotes in the same request; ≥ 5 → 409. Do check + insert in one transaction.

## Data (EF Core 9 + Npgsql)
- Entities User, Book, Quote with UserId FKs (cascade delete), Guid keys, CreatedAt in UTC.
- Configure limits and required fields in OnModelCreating to match the contract. Index UserId on Books and Quotes.
- Books/quotes queries always include Where(x => x.UserId == currentUserId). AsNoTracking for reads.
- Migrations: dotnet ef migrations add <Name>; read the generated code before applying; apply only to the local DB.
  Database.Migrate() on startup is allowed. Never edit an applied migration; add a new one.
- EnableRetryOnFailure stays on (the free database may be asleep).

## Configuration and hosting
- user-secrets locally, environment variables in production: ConnectionStrings__Default, Jwt__Key, Jwt__Issuer,
  Jwt__Audience, Jwt__ExpiresMinutes. Fail fast with a clear message if Jwt:Key is missing or shorter than 32 chars.
- No AddCors/UseCors (same-origin via proxy). No UseHttpsRedirection (TLS ends at the host).
  UseForwardedHeaders for X-Forwarded-For/Proto.
- Docker listens on port 8080; locally http://localhost:5080. GET /api/health is anonymous.
- UseExceptionHandler + ProblemDetails, no stack traces. Log with ILogger; never log passwords, tokens or bodies.
- OpenAPI/Scalar only in Development.

## Quality
- Small methods, clear names, no dead code.
- Only add comments (in English) when logic is complex or difficult to understand; avoid comments on obvious or self-explanatory code.
- Unit tests: every endpoint, service, and business rule (token generation, auth, per-user isolation, and the 5-quote limit) must have accompanying unit tests using xUnit.