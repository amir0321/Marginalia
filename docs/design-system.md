# Marginalia – Designsystem (Översikt)

> **Stack:** Angular 20, SCSS, Bootstrap 5.3, ng-bootstrap, Font Awesome Free, `@fontsource/inter` & `@fontsource/fraunces`

Designsystemet är uppdelat i fyra korta deldokument i `docs/design/`:

1. **[01 – Varumärke, Logotyp & Färgtokens](design/01-brand-and-tokens.md)** – Logotyp-SVG, favicon, ikoner, ljust/mörkt tema och skuggor.
2. **[02 – Typografi, Layout & Responsivitet](design/02-typography-and-layout.md)** – Typsnittsskala, 8 px-grid, hörnradier och brytpunkter.
3. **[03 – Komponenter](design/03-components.md)** – Navbar, temaväxlare, sidfot, knappar, formulärfält, kort, modaler och toast.
4. **[04 – Skärmar & Texter](design/04-screens.md)** – Exakt innehåll och flöde för `/login`, `/register`, `/books`, bokformulär och `/quotes`.

---

## Varumärke & Designprinciper

- **Löfte:** *Ett hem för ord som stannar kvar.*
- **Stödbudskap:** *En stillsam plats för böckerna som stannar kvar.* · *Samla böckerna och orden du vill bära med dig.*
- **Tonalitet:** Reflekterande, varm, tydlig och litterär. Direkt tilltal (*du*), korta meningar och verb först i knappar.

| Princip | Regel |
|---|---|
| **Lugn före täthet** | Generös luft (`64 px` topp / `88 px` botten på desktop), 8 px-grid, maxbredd `1140 px`. |
| **Innehållet först** | Boktitlar, författare och citat har visuell prioritet framför knappar och metadata. |
| **Amber är endast dekor** | `#E8A33D` används **aldrig** som knappbakgrund eller brödtext (kontrast ~2:1 mot vitt). |
| **Subtilt djup** | Tunna `1 px`-linjer (`--border`), mjuka skuggor och diskret glas-effekt i navbar/backdrop. |
| **Konsekvens** | Enhetliga radier, fälthöjder (`46 px`) och interaktioner på alla sidor. |

---

## MVP-avgränsningar (Design vs API-kontrakt)

1. **Ingen e-post:** Inloggning och registrering använder endast unikt `username` och `password` enligt `05-api-contract.md`.
2. **Ingen intern designguide-vy:** Länkar till designguide byggs inte i Angular-appen (`00-core.md`).
3. **Citatmodell (`text`, `author`):** API:t har inget `book`-fält på citat; visa endast författare utan hårdkodad undertitel.
4. **Menybrytpunkt `< 992 px`:** Navbaren kollapsar till hamburgarmeny vid `< 992 px` (`navbar-expand-lg`) enligt RedRiver-kraven.
