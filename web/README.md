# Marginalia – Frontend (Web)

Klientapplikationen för Marginalia, byggd som en Single Page Application (SPA) med **Angular 20**, **Bootstrap 5.3** och **Font Awesome**.

För övergripande arkitektur och systemdokumentation, se [huvud-README i projektets rot](../README.md).

## Funktioner i frontend
- **Autentisering & Rutter:** Inloggning och registrering med JWT, automatisk bifogning av Bearer-tokens via `authInterceptor`, skyddade rutter via `authGuard` och `guestGuard`.
- **Bokhantering (CRUD):** Biblioteksvy med realtidssökning och sortering (A–Ö, nyast först), formulär för att lägga till/redigera böcker, detaljmodal samt radering med bekräftelsedialog.
- **Mina citat (CRUD):** Responsivt galleri för favoritcitat med en strikt gräns på max 5 citat per användare och modal för att skapa/redigera citat.
- **Tema:** Växling mellan ljust och mörkt läge med omedelbar persistens i `localStorage`.
- **Design & Tillgänglighet:** Byggd efter specifikationen i `docs/design-system.md` med typografi från `@fontsource/fraunces` och `@fontsource/inter`. Fullt responsiv från 320 px upp till 1440 px+.

## Köra lokalt

### Förutsättningar
- Node.js ≥ 20
- npm ≥ 10

### 1. Installera beroenden
```bash
npm install
```

### 2. Starta utvecklingsservern
```bash
npm start
```
Frontend startar på **http://localhost:4200**.

### 3. API-proxy vid utveckling
Alla HTTP-anrop mot `/api/*` vidarebefordras automatiskt till backend på `http://localhost:5080` via konfigurationen i `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:5080",
    "secure": false
  }
}
```
Detta eliminerar behovet av CORS under lokal utveckling.

## Tester och kvalitetssäkring

### Enhetstester (Karma + Jasmine)
Kör alla enhetstester i headless Chrome:
```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Kör med kodtäckningsrapport:
```bash
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
```

### End-to-end-tester (Playwright)
Kör E2E-testerna för responsivitet, noll horisontell scrollning och tillgänglighet:
```bash
npm run test:e2e
```

## Bygg för produktion
```bash
npm run build
```
De optimerade produktionsfilerna genereras i mappen `dist/marginalia-web/`.

## Produktionsdrift
Frontend publiceras automatiskt via **Netlify**. Vidarebefordran av anrop till API:t styrs via regeln i `public/_redirects`:
```text
/api/*  https://marginalia-u916.onrender.com/api/:splat  200
/*      /index.html                                      200
```
