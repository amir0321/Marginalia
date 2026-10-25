# Marginalia

Ett personligt bibliotek för böcker och favoritcitat. Byggt som ett
praktiktest: en responsiv CRUD-applikation med JWT-autentisering.

**Live-version:** _läggs till vid publicering_
**GitHub Project (board):** _länk till tavlan_

## Funktioner
- Registrera konto och logga in (JWT)
- Skapa, visa, redigera och radera böcker
- "Mina citat": upp till fem favoritcitat per användare
- Responsiv design (desktop, surfplatta, mobil) med Bootstrap och Font Awesome
- Ljust och mörkt läge _(extrauppgift)_

## Teknik
| Del | Teknik | Värd |
|---|---|---|
| Frontend | Angular 20, Bootstrap 5.3, Font Awesome | Netlify |
| API | .NET 9 Web API, EF Core | Render (Docker) |
| Databas | PostgreSQL | Neon |

_Ändra tabellen om du valde annorlunda i issue 0.1 och 0.2._

## Projektstruktur
```
api/    .NET 9 Web API
web/    Angular-applikation
docs/   Designhandbok och beslut
```

## Köra lokalt

### Förutsättningar
- Docker Desktop
- .NET 9 SDK
- Node.js ≥ 20 och npm

### 1. Starta databasen (PostgreSQL via Docker)

```bash
docker compose up -d
```

Databasen `marginalia` startar på port 5432 (användare `postgres`, lösenord `dev`).

### 2. Konfigurera API:t med user-secrets

Navigera till API-projektet och kör:

```bash
cd api/Marginalia.Api

dotnet user-secrets init

dotnet user-secrets set "ConnectionStrings:Default" \
  "Host=localhost;Port=5432;Database=marginalia;Username=postgres;Password=dev"

dotnet user-secrets set "Jwt:Key" "ERSÄTT-MED-MINST-32-TECKEN-LÅNG-NYCKEL"
dotnet user-secrets set "Jwt:Issuer" "marginalia"
dotnet user-secrets set "Jwt:Audience" "marginalia-web"
dotnet user-secrets set "Jwt:ExpiresMinutes" "60"
```

> **OBS:** `Jwt:Key` måste vara minst 32 tecken. Generera t.ex. med:
> `openssl rand -base64 32`

### 3. Bygg och starta API:t

```bash
# Fortfarande i api/Marginalia.Api
dotnet build
dotnet run
```

API:t startar på **http://localhost:5080**.  
Hälsokontroll: `GET http://localhost:5080/api/health` → `{"status":"ok"}`

EF Core kör migrationerna automatiskt vid uppstart.

### 4. Installera och starta frontend

```bash
cd ../../web
npm install
npm start
```

Frontend startar på **http://localhost:4200**.  
Alla `/api/*`-anrop proxyas automatiskt till `http://localhost:5080`.

### URL:er lokalt

| Tjänst | URL |
|---|---|
| Frontend (Angular) | http://localhost:4200 |
| Hälsokontroll (via Angular-proxy) | http://localhost:4200/api/health |
| API (direkt) | http://localhost:5080/api |
| Hälsokontroll (direkt) | http://localhost:5080/api/health |
| API-dokumentation (Scalar) | http://localhost:5080/scalar |

## Arkitektur och hosting

Marginalia använder en same-origin-arkitektur baserad på omvänd proxy (reverse proxy), vilket eliminerar behovet av CORS (Cross-Origin Resource Sharing) helt och hållet:

- **Lokalt (utveckling):** Angular Dev Server proxyar alla anrop mot `/api/*` till backend-servern på `http://localhost:5080` via `web/proxy.conf.json`.
- **Produktion:** Frontend hostas som en statisk SPA på Netlify, medan API:t körs som en containeriserad Docker-webbtjänst på Render. Netlify dirigerar om alla `/api/*`-anrop till Render via regeln i `web/public/_redirects`, innan SPA-fallbacksregeln fångar upp resterande rutter.
- **Varför ingen CORS:** Eftersom webbläsaren endast kommunicerar med samma ursprung (same-origin) både lokalt (`http://localhost:4200`) och i produktion (Netlify-domänen) behövs inga CORS-headers (`AddCors`/`UseCors`). Detta minskar attackytan och eliminerar preflight-anrop (`OPTIONS`).
- **Säker hemlighetshantering:** Känsliga konfigurationsvärden (`ConnectionStrings:Default` och `Jwt:Key`) checkas aldrig in i källkod eller konfigurationsfiler. Lokalt lagras de utanför versionshanteringen med `dotnet user-secrets`. I produktion (Render) injiceras de som miljövariabler (`ConnectionStrings__Default`, `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`, `Jwt__ExpiresMinutes`). En mall finns i `.env.example`.
- **Uppväckning av fria instanser:** Gratisinstanser på Render går i viloläge efter ~15 minuters inaktivitet och behöver upp till en minut för att starta. Frontend skickar en hälsokontroll (`GET /api/health`) vid appstart för att väcka API:t i bakgrunden och informerar användaren med en toast först om svaret dröjer mer än 2 sekunder.

## Arbetssätt
- `main` är alltid fungerande och är det som publiceras.
- Allt arbete sker i feature-brancher som mergas via pull request.
- Branch-namn: `feat/<issue>-kort-namn`, `fix/...`, `docs/...`, `chore/...`
- Commit-meddelanden: `feat: lägg till bokformulär (#12)`
- Pull requests innehåller `Closes #12`, så stängs issuen automatiskt.
- Uppgifterna hanteras på GitHub Project-tavlan med epics, stories och milstolpar.

## Antaganden och beslut

Uppgiften lämnar några saker öppna. Så här tolkade jag dem:

| Fråga | Beslut | Motivering |
|---|---|---|
| Ska data vara per användare? | Ja, både böcker och citat | "Mina böcker" och "Mina citat" är personliga. API:t filtrerar på användar-id från token. Någon annans post ger 404. |
| Är "5 citat" ett tak eller exakt 5? | Tak: 0–5 citat | Kravet att lägga till och ta bort kräver att antalet kan variera. Gränsen kontrolleras både i API och UI. |
| Autentisering | JWT, giltig i 60 min, ingen refresh token | Räcker för uppgiften. Vid utgången session loggas användaren ut. |
| Var lagras token? | `localStorage` | Enkelt för en SPA. Avvägning: läsbar vid XSS, men Angular escapar innehåll. Cookie hade krävt CSRF-skydd. |
| Registrering | Användarnamn + lösenord (min 8 tecken). Unikt användarnamn. | Matchar testets krav. Samma regler i frontend och backend. |
| Lösenordslagring | Hashas med ASP.NET Core `PasswordHasher` | Aldrig klartext. |
| Radering | Permanent, med bekräftelsedialog | Enklast, och dialogen minskar risken för misstag. |
| Hosting och databas | Se "Arkitektur och hosting" ovan | |

**Utanför omfattning:** lösenordsåterställning, e-post, roller, refresh tokens och
sidindelning.
