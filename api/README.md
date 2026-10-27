# Marginalia – Backend (API)

REST API för Marginalia, byggt med **.NET 9 Web API**, **Entity Framework Core 9** och **PostgreSQL**.

För övergripande arkitektur och systemdokumentation, se [huvud-README i projektets rot](../README.md).

## Funktioner i API:t
- **Autentisering:** Registrering (`POST /api/auth/register`) och inloggning (`POST /api/auth/login`) med JWT (HS256, 60 minuters giltighetstid). Lösenord hashas med ASP.NET Core `PasswordHasher<User>`.
- **Dataisolering:** Alla böcker och citat är strikt isolerade per användare (härleds ur JWT `sub`-claim). Anrop mot en annan användares resurser returnerar konsekvent `404 Not Found` för att skydda mot IDOR.
- **Affärsregler:** Strikt gräns på max 5 citat per användare (`409 Conflict`), automatisk trimning av textsträngar och standardiserade RFC 7807 `ProblemDetails` med svenska felmeddelanden.
- **Interaktiv dokumentation:** Inbyggd Scalar API-referens på `/scalar`.

## Köra lokalt

### Förutsättningar
- .NET 9 SDK
- Docker Desktop (för lokal PostgreSQL)

### 1. Starta databasen
Starta PostgreSQL 17 från projektets rotmapp:
```bash
docker compose up -d
```
Databasen körs på port `5432` med användare `postgres` och lösenord `dev`.

### 2. Konfigurera hemligheter med user-secrets
Kör följande kommandon från mappen `api/Marginalia.Api`:
```bash
dotnet user-secrets init

dotnet user-secrets set "ConnectionStrings:Default" \
  "Host=localhost;Port=5432;Database=marginalia;Username=postgres;Password=dev"

dotnet user-secrets set "Jwt:Key" "ERSÄTT-MED-MINST-32-TECKEN-LÅNG-HEMLIG-NYCKEL"
dotnet user-secrets set "Jwt:Issuer" "marginalia"
dotnet user-secrets set "Jwt:Audience" "marginalia-web"
dotnet user-secrets set "Jwt:ExpiresMinutes" "60"
```

> [!IMPORTANT]
> `Jwt:Key` måste vara minst 32 tecken lång för att uppfylla HS256-kraven. Riktiga produktionshemligheter checkas aldrig in i versionshanteringen.

### 3. Starta API:t
```bash
dotnet build
dotnet run --project Marginalia.Api
```
API:t startar på **http://localhost:5080**.

Entity Framework Core kör databasmigreringarna automatiskt vid appstart om databasen inte är initierad.

### 4. URL:er vid lokal körning
- **Hälsokontroll:** `GET http://localhost:5080/api/health` → `{"status":"ok"}`
- **Scalar API-dokumentation:** `http://localhost:5080/scalar`

## Tester och kvalitetssäkring

Kör alla xUnit-enhetstester och integrationstester:
```bash
dotnet test
```

## Docker Container

### Bygg container lokalt
```bash
docker build -t marginalia-api:local ./Marginalia.Api
```

### Kör container lokalt
```bash
docker run -p 5080:8080 \
  -e "ConnectionStrings__Default=Host=host.docker.internal;Port=5432;Database=marginalia;Username=postgres;Password=dev" \
  -e "Jwt__Key=ERSÄTT-MED-MINST-32-TECKEN-LÅNG-HEMLIG-NYCKEL" \
  -e "Jwt__Issuer=marginalia" \
  -e "Jwt__Audience=marginalia-web" \
  -e "Jwt__ExpiresMinutes=60" \
  marginalia-api:local
```

## API-endpoints och kontrakt
Samtliga endpoints och deras exakta datakontrakt, statuskoder och felhantering finns dokumenterade i [rot-README](../README.md#api-endpoints) samt [.agents/rules/05-api-contract.md](../.agents/rules/05-api-contract.md).
