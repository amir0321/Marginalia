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
_Fylls i när projekten finns (issue 1.1 och Angular-setup)._

## Arbetssätt
- `main` är alltid fungerande och är det som publiceras.
- Allt arbete sker i feature-brancher som mergas via pull request.
- Branch-namn: `feat/<issue>-kort-namn`, `fix/...`, `docs/...`, `chore/...`
- Commit-meddelanden: `feat: lägg till bokformulär (#12)`
- Pull requests innehåller `Closes #12`, så stängs issuen automatiskt.
- Uppgifterna hanteras på GitHub Project-tavlan med epics, stories och milstolpar.

## Antaganden och beslut
_Fylls i (per användare-data, max 5 citat, hosting, databas, tokenlagring)._# Marginalia
