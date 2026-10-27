---
trigger: always_on
---

# Design rule (source of truth: `docs/design-system.md` & `docs/design/`)

Always follow the design specification in `docs/design-system.md` and `docs/design/` (`01-brand-and-tokens.md`, `02-typography-and-layout.md`, `03-components.md`, `04-screens.md`) while respecting the fixed Angular 20 + Bootstrap 5.3 stack (`00-core.md`) and API contract (`05-api-contract.md`). Before creating or modifying any UI, template, or stylesheet in `web/`, read the matching spec file in `docs/design/`. Never use Tailwind CSS or invent colors, spacing, icons, or UI texts outside this design system.

## Brand & core principles
- **Promise:** *Ett hem för ord som stannar kvar.* · **Footer/support:** *En stillsam plats för böckerna som stannar kvar.*
- **Principles:**
  1. *Lugn före täthet:* 8 px spacing scale (`4, 8, 12, 16, 24, 32, 40, 48, 64, 80 px`). Container `max-width: 1140px` (`24px` side padding desktop, `16px` mobile); narrow form container `760px`; page padding `64px` top / `88px` bottom (`40px` / `60px` mobile).
  2. *Innehållet först:* Book titles, authors, and quotes take visual precedence over controls.
  3. *Amber är endast dekor:* `#E8A33D` is strictly for logo margin mark, eyebrows, active nav line, book spine, quote card left border & quote icon, active theme icon, and password strength bars. Never use as button bg or body text.
  4. *Subtilt djup:* `1px` `--border`, soft shadows, frosted navbar (`backdrop-filter: blur(14px)`), blurred modal backdrop (`blur(4px)`).

## Logo & Favicon
- **SVG (`viewBox="0 0 32 32"`, `31×31 px` navbar, `24×24 px` footer):** Open book (`M4.5 6.5c4.7-1.2 8.3.2 11.5 2.7v17c-3.2-2.5-6.8-3.8-11.5-2.7v-17Z` and `M27.5 6.5c-4.7-1.2-8.3.2-11.5 2.7v17c3.2-2.5 6.8-3.8 11.5-2.7v-17Z`, `stroke-width="2"`) + vertical left-page margin line (`M9.5 8v14`, `stroke-width="1.5"`) + short horizontal amber margin mark (`M6.7 12.5h1.2`, `stroke="#E8A33D"`, `stroke-width="2.6"`).
- **Wordmark:** `Marginalia` in `Fraunces` `600`, `23px` (`17px` footer), `letter-spacing: -0.04em`, `gap: 10px`. Color: `var(--ink)` (`#FFFFFF` on dark auth panel).
- **Favicon:** `32×32` `#1F3A5F` rounded rect (`rx="8"`) with white book + amber mark; `<meta name="theme-color" content="#1F3A5F">`.

## Design tokens
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--ink` | `#1F3A5F` | `#7AA2D4` | Logo, links, book/form icons, outline buttons |
| `--ink-hover` | `#2A4D7D` | `#91B4DF` | Hover for `--ink` elements |
| `--ink-solid` | `#1F3A5F` | `#1F3A5F` | Primary buttons, auth brand panel, user avatar circle (`#FFF` text in both themes) |
| `--ink-solid-hover` | `#2A4D7D` | `#2A4D7D` | Primary button hover |
| `--amber` | `#E8A33D` | `#E8A33D` | Decorative accents only |
| `--bg` | `#F7F8FA` | `#0E131A` | Main page background |
| `--surface` | `#FFFFFF` | `#161D27` | Cards, table, navbar, footer, modals, right auth panel |
| `--surface-2` | `#F0F2F5` | `#1D2632` | Secondary buttons, table header, theme pill, hover states |
| `--border` | `#E4E7EC` | `#263142` | `1px` borders, dividers, quote numbers (`01`–`05`) |
| `--text` | `#101828` | `#F2F4F7` | Primary text & form labels |
| `--muted` | `#667085` | `#98A2B3` | Secondary text, dates, placeholders, inactive nav links |

- **Semantics:** `--success: #12B76A`, `--warning: #F79009`, `--danger: #F04438` (solid danger button `#D92D20` with `#FFF` text for ≥4.5:1 AA contrast), `--info: #2E90FA`.
- **Shadows:** `--shadow-sm`: `0 1px 2px rgba(16,24,40,.04), 0 2px 8px rgba(16,24,40,.04)` (dark: `0 1px 2px rgba(0,0,0,.20)`); `--shadow-lg`: `0 24px 64px rgba(16,24,40,.14), 0 8px 24px rgba(16,24,40,.08)` (dark: `0 24px 64px rgba(0,0,0,.45)`).
- **Focus:** `outline: 3px solid rgba(46,144,250,.28); outline-offset: 2px;` (inputs: `border-color: var(--info); box-shadow: 0 0 0 3px rgba(46,144,250,.12)`).

## Typography
- Local `@fontsource/inter` (`400, 500, 600`) & `@fontsource/fraunces` (`400, 400-italic, 500, 500-italic, 600`).
- **Page H1:** Fraunces 600, `clamp(2rem, 3.6vw, 2.5rem)` (`2rem` on `<576px`), `line-height: 1.14`, `letter-spacing: -0.035em`. **Form H1:** `28px`. **H2:** `24px` (`22px` modal), `-0.025em`. **H3:** `20px`.
- **Quotes:** Fraunces 400 italic, `clamp(18px, 2vw, 22px)`, `line-height: 1.52`. **Quote number:** Fraunces 500/600 `30px` upright in `var(--border)`.
- **Body:** Inter 400 `16px` (`line-height: 1.65`). **Controls/Table:** `13–14px`. **Labels:** `13px` Inter 600 in `var(--text)` (neutral `*`, never red). **Eyebrow:** `12px` Inter 600 uppercase, `letter-spacing: 0.12em`, `margin-bottom: 10px`, `var(--amber)`.

## Radii & key components
- **Radii:** `10px` buttons/inputs/icon-buttons/hamburger/user-btn · `12px` dropdowns/toasts · `13px` form header icon (`48×48`) · `14px` mobile book cards · `16px` cards/table/modals/empty-state · `20px` theme pill · `50%` avatars & status circles.
- **Shell:** Sticky `72px` (`64px` mobile) frosted navbar; active link has `2px` bottom amber line on desktop and `3px` left vertical amber line on mobile (`<992px` collapse, `40×40` bordered `fa-bars`/`fa-xmark` toggle). `70×34px` `ThemeToggle` with sliding `27×27px` round knob. `34×34px` `#1F3A5F` avatar + username + `fa-chevron-down` dropdown (`Logga ut`). `102px` `<footer>` with dimmed logo, slogan, and copyright.
- **Auth (`/login`, `/register`):** Desktop `minmax(430px, 0.9fr) 1.1fr` split. Left `#1F3A5F` panel: inverse logo + theme toggle, concentric circles, `-2deg` two-sheet `#F7F4EC` open book (`16px` `#E9E4D8` edge, 3 lines + `44px` amber `“` on left; 3 lines + `2px` amber-bordered *"en tanke värd / att återvända till"* on right), Mason Cooley quote. Right `--surface` panel (`430px` card, mobile top bar `<992px`, no bottom footer, **no email**, **no designguide link**): `46px` inputs (`Ditt användarnamn`, `Minst 8 tecken`, `Upprepa lösenordet`), 4-bar amber password strength (`svag`/`bra`/`stark`), `48px` full-width primary submit + `fa-arrow-right`, `.alert-danger` (`Något gick fel`).
- **Books (`/books`):** Header (`DITT BIBLIOTEK`, `Mina böcker`, `[X] böcker sparade i din samling.`, `+ Lägg till ny bok` — icon-compact on `<768px` with accessible label). `44px` search + `Sortera` dropdown (`Titel A–Ö`, `Nyast först`). Table (`≥768px`): `44px` `--surface-2` header, `76px` rows with `36×42px` `.book-glyph` (`fa-book-open` + `3px` amber left spine), Swedish short date (`d MMM yyyy`), ghost `Redigera`/`Radera` (icon-only on `768–991px`). Mobile (`<768px`): `14px` cards without inner border divider. Empty state: `1px dashed` `--surface` card (`min-height: 360px`) with `62×62px` `--surface-2` circle.
- **Book Form (`/books/new`, `/books/:id/edit`):** `760px` container, `--ink` semibold `← Tillbaka till mina böcker`, `.form-card` with side-by-side `48×48px` `.form-icon` + heading + `1px` bottom border, uniform `46px` inputs, inline muted `Valfritt` on `Beskrivning` (`0/500 tecken`), `1px` top-bordered `.form-actions` (`Avbryt` secondary + `✓ Spara` primary).
- **Quotes (`/quotes`):** 2-col grid (`1 col <768px`), `.quote-card` (`3px` amber left border, `fa-quote-left` `23px` amber, `01`–`05` top-right, Fraunces italic quote, bold author without `—` or top border, two `36×36px` bordered `.btn-icon` `fa-pen`/`fa-trash`, no fake `book` subtitle). `<5` quotes shows `1px dashed` `<button>` (`42×42px` round `+`, `Lägg till ditt 1:a–5:e citat`). Add/Edit opens modal (`Citat *`, `Författare *`, `Avbryt`, `Spara citat`).
- **Delete Modal & Toast:** Delete modal shows `58×58px` soft-red `fa-trash` circle, `Är du säker på att du vill radera “…”?`, `Åtgärden går inte att ångra.`, `Avbryt` + `Radera`. Toast is a `--surface` card (`12px` radius, `--shadow-lg`) with `34×34px` status circle, bold title (`Klart` / `Fel`) + muted message + `fa-xmark`.
