# 02 – Typografi, Layout & Responsivitet

[← Tillbaka till översikten](../design-system.md)

## Typsnitt

Laddas lokalt via `@fontsource` (inga externa Google Fonts-anrop):
- **`@fontsource/inter`:** `400`, `500`, `600` (navigation, knappar, formulär, tabeller, brödtext).
- **`@fontsource/fraunces`:** `400`, `400-italic`, `500`, `500-italic`, `600` (rubriker, citat, wordmark, citatnummer).

## Typografisk skala

| Stil | Typsnitt & Vikt | Storlek | Radhöjd / Tracking | Användning |
|---|---|---|---|---|
| **Display** | Fraunces 600 | `40 px` | `1.1` / `-0.035em` | Stora varumärkesrubriker |
| **H1 (Sida)** | Fraunces 600 | `clamp(32px, 3.6vw, 40px)` | `1.14` / `-0.035em` | Sidrubriker (`32 px` på `< 576 px`) |
| **H1 (Formulärkort)** | Fraunces 600 | `28 px` | `1.18` / `-0.035em` | Rubrik i bokformulärkort |
| **H2 / Modal** | Fraunces 600 | `24 px` (`22 px` i modal) | `1.25` / `-0.025em` | Sektioner, modaler, tomlägen |
| **H3** | Fraunces 600 | `20 px` | `1.3` / `-0.02em` | Underrubriker |
| **Citattext** | Fraunces 400 kursiv | `clamp(18px, 2vw, 22px)` | `1.52` / `0` | Citatkort (`20 px` i auth-panel) |
| **Citatnummer** | Fraunces 500/600 | `30 px` | `1` / `0` | `01`–`05` uppe till höger på citatkort (`--border`) |
| **Body** | Inter 400 | `16 px` | `1.65` | Ingress och brödtext (`color: var(--muted)`) |
| **UI / Small** | Inter 400 / 500 / 600 | `13–14 px` | `1.4` | Knappar (`14 px` 600), tabell (`13–14 px`), etiketter (`13 px` 600) |
| **Eyebrow** | Inter 600, versaler | `12 px` | `1` / `0.12em` | Överetikett i `--amber` (`margin-bottom: 10 px`) |

## Grid, Spacing & Hörnradier

- **8 px-skala:** `4, 8, 12, 16, 24, 32, 40, 48, 64, 80 px`.
- **Behållare:** Max `1140 px` med `24 px` sidmarginal på desktop (`16 px` på `< 768 px`). Smal formulärvy: `max-width: 760 px`.
- **Sidpadding (`.page`):** `64 px` topp / `88 px` botten på desktop; `40 px` topp / `60 px` botten på `< 768 px`.

| Radie | Komponenter |
|---|---|
| `10 px` | Knappar, inputs, textareas, ikonknappar (`36×36`), hamburgare (`40×40`), användarmenyknapp |
| `12 px` | Dropdown-menyer och toast-notiser |
| `13 px` | Ikonruta i formulärhuvud (`48×48`) |
| `14 px` | Bokkort på mobil (`< 768 px`) |
| `16 px` | Kort, tabellram, modaler, tomlägeskort och streckat citatkort |
| `20 px` / `50%` | Temaväxlare (`20 px` pill) samt avatarcirklar och runda statusikoner (`50%`) |

## Responsiva brytpunkter

| Vy | Bredd | Layoutbeteende |
|---|---|---|
| **Desktop** | `≥ 992 px` | Full navbar (`72 px`), auth i split-screen (`minmax(430px, 0.9fr) 1.1fr`), boktabell med text+ikon på radknappar, citat i 2 kolumner. |
| **Surfplatta** | `768–991 px` | Hamburgarmeny (`< 992 px`), auth visar formuläryta med mobil-topprad, boktabell med kompakta `36×36 px` ikonknappar, citat i 2 kolumner. |
| **Mobil** | `< 768 px` | Navbar `64 px`, primärknapp i sidhuvud blir `42×42 px` `+`-knapp, staplade bokkort, citat i 1 kolumn, formulärknappar `flex: 1`. Ingen horisontell scroll ned till `320 px`. |
