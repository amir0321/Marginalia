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

## Köra tester och kvalitetssäkring

Samtliga delar av projektet har heltäckande enhetstester och kan köras lokalt med följande kommandon:

### 1. Kör alla API-tester
Kör alla .NET 9-enhetstester och integrationstester:
```bash
cd api && dotnet test
```

### 2. Kör alla frontend-enhetstester
Kör alla Angular-tester i headless-läge (Karma + ChromeHeadless):
```bash
cd web && npx ng test --watch=false --browsers=ChromeHeadless
```

### 3. Testa CI-kommandona i Docker
Verifiera att API:ets Dockerfile bygger felfritt:
```bash
docker build -t marginalia-api:ci ./api/Marginalia.Api
```

### 4. Bygg frontend för produktion
Verifiera att produktionspaketet byggs utan fel eller budgetvarningar:
```bash
cd web && npm run build
```

## Arkitektur och hosting

Marginalia använder en same-origin-arkitektur baserad på omvänd proxy (reverse proxy), vilket eliminerar behovet av CORS (Cross-Origin Resource Sharing) helt och hållet:

- **Lokalt (utveckling):** Angular Dev Server proxyar alla anrop mot `/api/*` till backend-servern på `http://localhost:5080` via `web/proxy.conf.json`.
- **Produktion:** Frontend hostas som en statisk SPA på Netlify, medan API:t körs som en containeriserad Docker-webbtjänst på Render. Netlify dirigerar om alla `/api/*`-anrop till Render via regeln i `web/public/_redirects`, innan SPA-fallbacksregeln fångar upp resterande rutter.
- **Varför ingen CORS:** Eftersom webbläsaren endast kommunicerar med samma ursprung (same-origin) både lokalt (`http://localhost:4200`) och i produktion (Netlify-domänen) behövs inga CORS-headers (`AddCors`/`UseCors`). Detta minskar attackytan och eliminerar preflight-anrop (`OPTIONS`).
- **Säker hemlighetshantering:** Känsliga konfigurationsvärden (`ConnectionStrings:Default` och `Jwt:Key`) checkas aldrig in i källkod eller konfigurationsfiler. Lokalt lagras de utanför versionshanteringen med `dotnet user-secrets`. I produktion (Render) injiceras de som miljövariabler (`ConnectionStrings__Default`, `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`, `Jwt__ExpiresMinutes`). En mall finns i `.env.example`.
- **Uppväckning av fria instanser:** Gratisinstanser på Render går i viloläge efter ~15 minuters inaktivitet och behöver upp till en minut för att starta. Frontend skickar en hälsokontroll (`GET /api/health`) vid appstart för att väcka API:t i bakgrunden och informerar användaren med en toast först om svaret dröjer mer än 2 sekunder.

## Hur autentisering fungerar

Marginalia använder JSON Web Tokens (JWT) för tillståndslös (stateless) autentisering mellan frontend och backend:

1. **Inloggning & registrering:**
   - Vid registrering (`POST /api/auth/register`) skapas användarkontot och lösenordet hashas med ASP.NET Core `PasswordHasher<User>`.
   - Vid inloggning (`POST /api/auth/login`) valideras uppgifterna. Om autentiseringen lyckas returnerar API:t en signerad JWT-token med 60 minuters giltighetstid.
2. **Lagring i webbläsaren:**
   - Frontend sparar token i `localStorage` under nyckeln `marginalia.token`.
   - `AuthService` läser token vid appstart och härleder reaktivt inloggningsstatus (`isLoggedIn`) och användarnamn (`username`) från JWT-payloaden (`unique_name`, `exp`) med Angular-signaler.
3. **Bearer-interceptor (`authInterceptor`):**
   - Samtliga anrop mot `/api/*` (exklusive `/api/auth/login` och `/api/auth/register`) får automatiskt headern `Authorization: Bearer <token>` bifogad via en funktionell Angular HTTP-interceptor.
4. **Route guards:**
   - `authGuard` skyddar privata sidor (`/books`, `/books/new`, `/books/:id/edit`, `/quotes`). Oinloggade besökare dirigeras till `/login`.
   - `guestGuard` förhindrar inloggade användare från att besöka `/login` och `/register` och skickar dem vidare till `/books`.
5. **Utloggning & hantering av 401 Unauthorized:**
   - När en användare klickar på "Logga ut" rensas `marginalia.token` från `localStorage` och användaren navigeras till `/login`.
   - Om en token har löpt ut eller blivit ogiltig och ett skyddat API-anrop svarar med `401 Unauthorized`, fångar `authInterceptor` felet automatiskt, rensar sessionen, omdirigerar till `/login` och visar en informativ varningstoast: *"Din session har gått ut. Logga in igen för att fortsätta."*.
   - Felaktiga inloggningsförsök (`401` från `/api/auth/login`) fångas lokalt i formuläret och visar ett felmeddelande utan att trigga sessionsutloggning eller global toast.

### Säkerhetsavvägning: `localStorage` kontra `HttpOnly`-cookie (XSS vs CSRF)

Valet att lagra JWT i `localStorage` gjordes medvetet utifrån applikationens arkitektur och kraven i kodtestet:

- **Fördelar med `localStorage`:**
  - **Skydd mot CSRF (Cross-Site Request Forgery):** Webbläsaren bifogar inte `localStorage`-data automatiskt i HTTP-anrop till skillnad från kakor. Det gör att applikationen är immun mot klassiska CSRF-attacker utan att behöva hantera Anti-Forgery-tokens eller SameSite-undantag.
  - **Enkel och ren SPA-integration:** Frontend har full kontroll över när och hur token skickas via `Authorization`-headern, vilket passar utmärkt med reverse-proxy-arkitekturen och stateless API-design.
- **Avvägning och sårbarheter (XSS):**
  - Den främsta risken med `localStorage` är att token kan läsas av skadlig JavaScript vid en eventuell XSS-sårbarhet (Cross-Site Scripting).
  - En `HttpOnly`-kaka skyddar mot att klientskript kan läsa token direkt, men kräver i stället strikt CSRF-hantering och komplicerar proxykonfiguration.
- **Hur vi säkrar `localStorage` mot XSS:**
  - Angulars inbyggda strikta mall-sanering används konsekvent: inga opålitliga `innerHTML`, `bypassSecurityTrust*` eller `document.write`.
  - All användardata interpoleras säkert i HTML.
  - Backend validerar och sanerar all indata strikt.
  - Kort livslängd på JWT (60 minuter) och ingen refresh token minskar fönstret för ett eventuellt kapat token.

## CI/CD-pipeline (GitHub Actions)

Projektet använder en automatiserad kontinuerlig integrationspipeline via GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

- **Triggers:** Körs automatiskt vid varje `push` samt `pull_request` mot brancherna `main` och `develop`.
- **Tre parallella jobb:**
  1. **`api` (.NET 9):**
     - Sätter upp .NET 9 SDK
     - Kör `dotnet restore`
     - Bygger solutionen: `dotnet build --configuration Release --no-restore`
     - Kör samtliga tester: `dotnet test --configuration Release --no-build`
  2. **`web` (Angular 20):**
     - Sätter upp Node.js 20 med npm-cache (`package-lock.json`)
     - Installerar rena beroenden: `npm ci`
     - Bygger produktionspaketet: `npm run build`
     - Kör samtliga enhetstester: `npx ng test --watch=false --browsers=ChromeHeadless`
  3. **`docker` (Container Build):**
     - Verifierar att API-containern bygger felfritt: `docker build -t marginalia-api:ci ./api/Marginalia.Api`

## Versionshantering och arbetssätt

- **Branch-strategi:**
  - `main`: Alltid stabil och produktionsredo version (speglar driftmiljön).
  - `develop`: Huvudsaklig integrationsbranch där färdiga funktioner sammanförs.
  - Feature-brancher skapas från `develop` eller aktuell bas och namnges enligt:
    - `feat/<issue>-<kort-namn>` för nya funktioner (t.ex. `feat/20-33-search-sort-and-ci`)
    - `fix/<issue>-<kort-namn>` för buggrättningar
    - `docs/<issue>-<kort-namn>` för dokumentation
    - `chore/<issue>-<kort-namn>` för underhåll, byggskript och beroenden
- **Commit-meddelanden:**
  - Skrivs på engelska i imperativ form med referens till issue:
    - `feat: add book search and secondary sorting (#20)`
    - `ci: configure GitHub Actions workflow for api, web and docker (#33)`
    - `docs: update readme with testing and version control guide`
- **Pull Requests:**
  - PR öppnas mot målgrenen (`develop` eller `main`).
  - PR-mallen ska innehålla: vad som har ändrats, varför ändringen gjordes, hur ändringen testats, samt `Closes #<issue>` för att koppla och stänga ärendet automatiskt vid merge.
  - Alla jobb i CI-pipelinen (`api`, `web`, `docker`) måste passera grönt innan en PR får mergas.
- **Projektstyrning:**
  - Uppgifterna hanteras på GitHub Project-tavlan med epics, stories och tydliga acceptanskriterier.

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
