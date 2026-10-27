# 03 – Komponenter

[← Tillbaka till översikten](../design-system.md)

## Shell: Navbar, Temaväxlare, Användarmeny & Footer

- **Navbar:** Sticky, `72 px` (`64 px` på `< 768 px`), `background: color-mix(in srgb, var(--surface) 92%, transparent)`, `backdrop-filter: blur(14px)`, `1 px` `--border`.
  - Länkar (`margin-left: 54 px`): `Böcker` (`fa-book`), `Mina citat` (`fa-quote-left`), `14 px` Inter 500 i `--muted`.
  - Aktiv länk: `--text` + `2 px` horisontell `--amber`-linje längs navbarens nederkant på `≥ 992 px`, och `3 px` vertikal `--amber`-linje till vänster i mobilmenyn (`< 992 px`).
  - Hamburgarknapp (`< 992 px`): `40×40 px`, `1 px` `--border`, `10 px` radie, växlar mellan `fa-bars` och `fa-xmark`.
- **Temaväxlare (`ThemeToggle`):** `70×34 px` pill (`--surface-2`, `1 px` `--border`), `fa-sun` vänster, `fa-moon` höger, samt en rund glidande knapp (`27×27 px`, `--surface`, `--shadow-sm`, `translateX(35px)` i mörkt läge). Aktiv ikon i `--amber`. `aria-label="Byt färgtema"`, `aria-pressed`. På mörk auth-panel används halvtransparenta vita toner.
- **Användarmeny:** Knapp (`height: 42 px`, `10 px` radie) med `34×34 px` `#1F3A5F`-cirkel (vita initialer, `11 px` 600), användarnamn och `fa-chevron-down` (`10 px`). Dropdown (`210 px`, `12 px` radie, `--shadow-lg`) visar användarnamn i header med bottenlinje + `Logga ut` (`fa-right-from-bracket`). Oinloggad vy visar `Logga in` (sekundärknapp) och `Registrera dig` (primärknapp).
- **Footer:** `min-height: 102 px`, `--surface`, `1 px` toppkant. Vänster: nedtonad logotyp (`opacity: 0.65`, `24 px` symbol, `17 px` wordmark) + *"En stillsam plats för böckerna som stannar kvar."* (döljs `< 768 px`). Höger: `© 2026 Marginalia`.

## Knappar & Rörelse

Alla knappar har `10 px` radie, `min-height: 42–44 px` (`.btn-block` `48 px`) och lyfter `translateY(-1px)` vid hover (`180 ms`, avstängt vid `:disabled` och `prefers-reduced-motion: reduce`).

| Variant | Utseende | Användning |
|---|---|---|
| **Primary** | `#1F3A5F` (hover `#2A4D7D`), `#FFF`-text, skugga `0 4px 12px rgba(31,58,95,.18)` | Huvudåtgärd (`Logga in`, `Lägg till ny bok`, `Spara`) |
| **Secondary** | `--surface-2`, `1 px` `--border`, `--text` | Neutral åtgärd (`Avbryt`) |
| **Danger** | `#D92D20`, `#FFF`-text | Destruktiv bekräftelse (`Radera` i modal) |
| **Ghost** | Transparent, `--muted`; hover `--surface-2` + `--text` (eller `rgba(240,68,56,.08)` + `--danger` för radera) | Radåtgärder i boktabell (`Redigera`, `Radera`) |
| **Icon (`.btn-icon`)** | `36×36 px`, `1 px` `--border`, transparent → `--surface-2` vid hover | Citatkort (`fa-pen`, `fa-trash`) och modal-stäng (`fa-xmark`) |

## Formulärfält & Lösenordsstyrka

- **Etikett:** `13 px` Inter 600 i `--text`. Obligatoriska fält har neutral `*` (`aria-hidden="true"`), valfria fält har inline `Valfritt` i `--muted` 400.
- **Inputs & Select:** `height: 46 px` (`44 px` i sök-/sorteringsrad), `10 px` radie, `1 px` `--border`, `--surface`. Vänsterikon placeras `15 px` in, visa/dölj-öga till höger.
- **Felstatus:** Röd kant (`--danger`) och felmeddelande under fältet med `fa-circle-exclamation`.
- **Lösenordsstyrka (Registrering):** 4 horisontella segment (`height: 3 px`, aktiva i `--amber`) + text `Lösenordsstyrka: svag` / `bra` / `stark` (`11 px` `--muted`).

## Kort, Modaler, Toast & Tomläge

- **Bok-glyph (`.book-glyph`):** `36×42 px` (`32×38 px` `< 576 px`), `border-radius: 5px 9px 9px 5px`, `background: color-mix(in srgb, var(--ink) 10%, var(--surface))`, `3 px` `--amber` vänsterkant, ikon `fa-book-open` i `--ink`.
- **Modal & Raderingsdialog:** Backdrop `rgba(14,19,26,.58)` + `backdrop-filter: blur(4px)`. Modal `max-width: 500 px`, `padding: 26 px`, `16 px` radie, `--shadow-lg`, stängknapp `.btn-icon` (`fa-xmark`). Raderingsdialog har centrerad `58×58 px` ljusröd cirkel (`rgba(240,68,56,.10)`) med `fa-trash` i `--danger`, frågetext + stödtext och `.form-actions` med `1 px` toppkant.
- **Toast:** Ytkort (`--surface`, `1 px` `--border`, `12 px` radie, `--shadow-lg`, `min-width: 320 px`, fullbredd med `16 px` marginal på `< 576 px`). Består av `34×34 px` rund statuscirkel (`--success`/`--danger`/`--warning`/`--info`), fet rubrik (`Klart` / `Fel`) + meddelandetext i `--muted` samt `fa-xmark`.
- **Empty State:** Streckat ytkort (`min-height: 360 px`, `1 px dashed var(--border)`, `16 px` radie, `--surface`), `62×62 px` rund ikonplatta (`--surface-2`, ikon i `--ink`), H2, beskrivning och valfri primärknapp.
