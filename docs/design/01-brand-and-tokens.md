# 01 – Varumärke, Logotyp & Färgtokens

[← Tillbaka till översikten](../design-system.md)

## Logotyp & Favicon

- **Symbol (`31×31 px` i navbar, `24×24 px` i footer, min `16 px`):** Uppslagen bok + vertikal marginal-linje + kort horisontellt amberstreck.
- **Wordmark:** `Marginalia` i **Fraunces 600**, `23 px` (`17 px` i footer), `letter-spacing: -0.04em`, `gap: 10 px`. Minsta bredd: `120 px`, friyta: ½ symbolbredd.
- **Varianter:** Standard (`color: var(--ink)`), Inverterad på mörk panel (`#FFFFFF` + amberstreck), Monokrom (`currentColor`).
- **Favicon (`32×32`):** Rundad platta (`rx="8"`, `#1F3A5F`) med vit boksymbol + `#E8A33D`-streck; `<meta name="theme-color" content="#1F3A5F">`.

```html
<svg viewBox="0 0 32 32" aria-hidden="true">
  <path d="M4.5 6.5c4.7-1.2 8.3.2 11.5 2.7v17c-3.2-2.5-6.8-3.8-11.5-2.7v-17Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  <path d="M27.5 6.5c-4.7-1.2-8.3.2-11.5 2.7v17c3.2-2.5 6.8-3.8 11.5-2.7v-17Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  <path d="M9.5 8v14" stroke="currentColor" stroke-width="1.5" />
  <path d="M6.7 12.5h1.2" stroke="#E8A33D" stroke-width="2.6" stroke-linecap="round" />
</svg>
```

## Ikoner (Font Awesome Solid)

- Tillåtna ikoner: `fa-book`, `fa-book-open`, `fa-quote-left`, `fa-plus`, `fa-pen`, `fa-trash`, `fa-magnifying-glass`, `fa-sun`, `fa-moon`, `fa-user`, `fa-lock`, `fa-eye`, `fa-eye-slash`, `fa-arrow-left`, `fa-arrow-right`, `fa-chevron-down`, `fa-bars`, `fa-xmark`, `fa-check`, `fa-circle-exclamation`.
- Dekorativa ikoner har `aria-hidden="true"`. Ikonknappar har alltid svensk `aria-label`.

## Färgtokens (Ljust & Mörkt tema)

| CSS-variabel | Ljust tema | Mörkt tema | Användning |
|---|---|---|---|
| `--ink` | `#1F3A5F` | `#7AA2D4` | Logotyp, länkar, bok-/formulärikoner, konturknapp |
| `--ink-hover` | `#2A4D7D` | `#91B4DF` | Hover för `--ink`-element |
| `--ink-solid` | `#1F3A5F` | `#1F3A5F` | Primärknapp, auth-sidopanel, avatarcirkel (alltid `#FFF`-text) |
| `--ink-solid-hover` | `#2A4D7D` | `#2A4D7D` | Hover på primärknapp |
| `--amber` | `#E8A33D` | `#E8A33D` | Dekor: marginalstreck, eyebrows, aktiv nav, bokrygg, citatkant, styrkemätare |
| `--bg` | `#F7F8FA` | `#0E131A` | Sidbakgrund |
| `--surface` | `#FFFFFF` | `#161D27` | Kort, tabell, navbar, footer, modaler, auth-formulärkolumn |
| `--surface-2` | `#F0F2F5` | `#1D2632` | Sekundärknapp, tabellhuvud, temaväxlare, hoverytor |
| `--border` | `#E4E7EC` | `#263142` | `1 px` ramar, avdelare, citatnummer (`01`–`05`) |
| `--text` | `#101828` | `#F2F4F7` | Primär text och fältetiketter |
| `--muted` | `#667085` | `#98A2B3` | Sekundär text, datum, placeholders, inaktiva nav-länkar |

## Semantiska färger, Skuggor & Fokus

- **Semantik:** `--success: #12B76A`, `--warning: #F79009`, `--danger: #F04438` (fylld raderingsknapp `#D92D20` med `#FFF`-text för ≥ 4,5:1 AA-kontrast), `--info: #2E90FA`.
- **Felruta (`.alert-danger`):** Ljust: text `#B42318`, bakgrund `#FEF3F2`, kant `#FECDCA`. Mörkt: text `#FDA29B`, bakgrund `rgba(240,68,56,0.10)`, kant `rgba(240,68,56,0.25)`.
- **Skuggor:**
  - `--shadow-sm`: Ljust `0 1px 2px rgba(16,24,40,.04), 0 2px 8px rgba(16,24,40,.04)` · Mörkt `0 1px 2px rgba(0,0,0,.20)`.
  - `--shadow-lg`: Ljust `0 24px 64px rgba(16,24,40,.14), 0 8px 24px rgba(16,24,40,.08)` · Mörkt `0 24px 64px rgba(0,0,0,.45)`.
- **Fokus:** Kontroller `outline: 3px solid rgba(46,144,250,.28); outline-offset: 2px;`. Fält `border-color: var(--info); box-shadow: 0 0 0 3px rgba(46,144,250,.12)`.
