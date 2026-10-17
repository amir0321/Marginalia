# Marginalia – Designsystem & Varumärkesguide

> **Version:** 1.2 (Figma-justerad)  
> **Källa:** `docs/Marginalia_Designhandbok_v1.2.docx`, Varumärkesguide 1.0 & Figma-specifikation  
> **Teknik:** Bootstrap 5.3, Angular 20, SCSS, Font Awesome Free, @fontsource (Inter & Fraunces)

---

## 1. Varumärkesidentitet

Marginalia förenar bibliotekets lugn med den personliga anteckningens närhet. Identiteten är precis, varm och byggd för långsam uppmärksamhet.
- **Löfte:** *Ett hem för ord som stannar kvar.*
- **Stödbudskap:** *Samla böckerna och orden du vill bära med dig.*
- **Personlighet:** Reflekterande, elegant, modern, varm, litterär – aldrig högljudd, distanserad eller svårläst.

---

## 2. Designprinciper

1. **Lugn före täthet:** Generöst med whitespace (8 px grundgrid). Information grupperas harmoniskt.
2. **Innehållet är huvudpersonen:** Titlar, författare och citat har visuell prioritet framför kontroller och metadata.
3. **Varm amber är endast dekor:** Bärnstensfärgen (`#E8A33D`) används för marginalstreck, bokryggsmarkör, citattecken, aktiva menyindikatorer och små överetiketter. Den används **aldrig** som bakgrund på knappar eller för lång löpande brödtext, då kontrasten mot vitt endast är cirka 2:1.
4. **Subtilt djup:** Mjuka skuggor och 1 px borders (`--border`) istället för tunga ramar.
5. **Konsekvens:** Samma komponent, radie och färgkodning genom hela gränssnittet.

---

## 3. Logotyp & Ikonografi

### Logotyp
- **Symbol:** En stiliserad öppen bok med en vertikal marginal-linje och ett bärnstensfärgat (amber) streck i vänstra marginalen.
- **Ordmärke:** *Marginalia* satt i **Fraunces 600** med svagt åtstramat teckenmellanrum (`-0.02em`).
- **Friyta & storlek:**
  - Friyta: minst ½ symbolbredd runt om.
  - Minsta bredd för horisontell logotyp: 120 px.
  - Minsta symbolstorlek: 16 px (31 px höjd i desktop navbar).
  - Varianter: Mörk bläckblå på ljus yta (navbar/huvudsida), vit på mörk yta (split-screen på inloggning/registrering).

### Ikoner (Font Awesome 6 Free)
- Webbplatsikoner: `fa-book`, `fa-quote-left`, `fa-plus`, `fa-pen`, `fa-trash`, `fa-magnifying-glass`, `fa-sun`, `fa-moon`, `fa-user`, `fa-lock`, `fa-eye`, `fa-eye-slash`, `fa-arrow-left`, `fa-arrow-right`, `fa-check`, `fa-circle-exclamation`, `fa-calendar-days`.
- Alla ikonknappar kräver tydliga `aria-label` (t.ex. *"Visa lösenord"*, *"Redigera bok"*, *"Byt färgtema"*).

---

## 4. Design tokens (Färger)

Alla färger implementeras som CSS-variabler med stöd för ljust och mörkt läge:

| Token | Ljust tema | Mörkt tema | Användning & Roll |
|---|---|---|---|
| `--ink` | `#1F3A5F` | `#2B5082` | Primärknappar, varumärkespaneler, logotyp |
| `--ink-hover` | `#2A4D7D` | `#36639E` | Hover/aktiv status på primärknappar |
| `--link` | `#1F3A5F` | `#6EA8FE` | Textlänkar, fokuskant, aktiv länk |
| `--amber` | `#E8A33D` | `#E8A33D` | Dekor, bokrygg, citatkant, överetiketter |
| `--bg` | `#F7F8FA` | `#0E131A` | Huvudbakgrund |
| `--surface` | `#FFFFFF` | `#161D27` | Kort, tabeller, navbar, modaler |
| `--surface-2` | `#F0F2F5` | `#1D2632` | Sekundära ytor, formulärfocus, badges |
| `--border` | `#E4E7EC` | `#263142` | Subtila 1 px skiljelinjer och kortramar |
| `--text` | `#101828` | `#F2F4F7` | Primär textfärg |
| `--muted` | `#667085` | `#98A2B3` | Sekundär text, metadata, platshållare |

### Semantiska färger
- **Framgång (Success):** `#12B76A` (Text: `#027A48` ljust / `#6CE9A6` mörkt)
- **Varning (Warning):** `#F79009` (Text: `#B54708` ljust / `#FEC84B` mörkt)
- **Fara (Danger):** `#F04438` (Ikon/border), Knappar: `#D92D20` (Vit text, >4.5:1 kontrast)
- **Info:** `#2E90FA` (Text: `#175CD3` ljust / `#6EA8FE` mörkt)

---

## 5. Typografi

Installeras lokalt via `@fontsource/inter` och `@fontsource/fraunces` (inga externa anrop till Google Fonts).

| Nivå | Storlek | Vikt & Typsnitt | Användning |
|---|---|---|---|
| **Display** | 40 px | Fraunces 600 | Varumärkesyta vid login/register (desktop) |
| **H1** | 32 px | Fraunces 600 (`-0.02em`) | Huvudrubriker på sidor |
| **H2** | 24 px | Fraunces 600 (`-0.02em`) | Modaler, sektionsrubriker |
| **H3** | 20 px | Fraunces 600 (`-0.02em`) | Kortrubriker |
| **Body** | 16 px | Inter 400 (radhöjd 1.6) | Löpande brödtext, inmatningsfält |
| **Small** | 14 px | Inter 400/500 | Tabellceller, knappar, metadata |
| **Overline (Eyebrow)** | 12 px | Inter 600 versaler (`0.06em`) | Överetiketter (`--amber`, t.ex. `DITT BIBLIOTEK`) |
| **Citat** | 18–24 px | Fraunces 400 kursiv | Text i citatkort och inspirationssektioner |

---

## 6. Layout, Grid & Former

- **8 px Grid:** Alla marginaler och avstånd följer 4, 8, 12, 16, 24, 32, 40, 48, 64 px.
- **Maxbredd:** Behållare max 1140 px (Bootstrap container).
- **Hörnradier:**
  - Knappar och inputfält: `10px`
  - Dropdowns: `12px`
  - Mobilkort: `14px`
  - Innehållskort & modaler: `16px`
  - Avatarcirkel & ikonknappar: `50%` (helt runda)
- **Skuggor:**
  - Kort: `0 2px 8px rgba(16, 24, 40, 0.04)`
  - Modaler & Dropdowns: `0 12px 32px rgba(16, 24, 40, 0.12)`

### Responsiva brytpunkter
- **Desktop (≥ 992 px):** Full navbar, inloggning i split-screen med varumärkespanel, böcker i full tabell med amberrygg.
- **Surfplatta (768–991 px):** Hamburgarmeny, inloggning visar endast formulärdelen, böcker i tabell med ikonknappar.
- **Mobil (< 768 px):** Hamburgarmeny, böcker presenteras som staplade kort, ingen horisontell scroll (testas ned till 320 px).

---

## 7. Skärmspecifikationer (Figma-verifierade)

### 1. Inloggning (`/login`) & Registrering (`/register`)
- **Desktop (Split-screen):**
  - **Vänster panel (mörkblå `--ink`):**
    - Topp: Vit Marginalia-logotyp och temaväxlare.
    - Mitt: Stiliserad 3D/vektorillustration av en öppen bok med texten *"en tanke värd att återvända till"* och ett bärnstensfärgat citattecken (`“`).
    - Botten: Subtila dekorativa cirkelbågar och citatet:  
      *“Läsning ger oss någonstans att ta vägen när vi måste stanna där vi är.”* — Mason Cooley.
  - **Höger panel (vit yta):**
    - Överetikett: `VÄLKOMMEN TILLBAKA` / `BÖRJA DIN SAMLING` (`--amber`).
    - Rubrik: `Logga in` / `Skapa konto`.
    - Ingress: `Dina böcker och anteckningar väntar på dig.` / `Samla böckerna och orden du vill bära med dig.`.
    - Inmatningsfält:
      - Användarnamn med vänsterikon (`fa-user`).
      - Lösenord med vänsterikon (`fa-lock`) och visa/dölj-ögonknapp (`fa-eye` / `fa-eye-slash`).
      - Bekräfta lösenord (vid registrering) med lösenordsstyrkeindikator.
    - Primärknapp: `Logga in →` / `Registrera dig →` (fullbredd).
    - Länk: `Har du inget konto? Registrera dig` / `Har du redan ett konto? Logga in`.

### 2. Boklista (`/books`)
- **Header:**
  - Överetikett: `DITT BIBLIOTEK` (`--amber`).
  - Rubrik: `Mina böcker`.
  - Underrubrik: `[X] böcker sparade i din samling.`
  - Knapp till höger: `+ Lägg till ny bok` (`btn-primary`).
- **Filter & sökrad:**
  - Sökfält med förstoringsglasikon: `Sök efter titel eller författare...`
  - Sorteringsdropdown: `Sortera: Titel A–Ö ▾`
- **Tabell (Desktop ≥ 768 px):**
  - Kolumner: `TITEL`, `FÖRFATTARE`, `PUBLICERINGSDATUM`, `ÅTGÄRDER`.
  - Rader: Bokikon med amber-accentbadge på vänster sida, boktitel i halvfet stil, författare, svenskt datum (t.ex. `24 sep. 1929`), åtgärder med `Redigera` och `Radera`.
- **Tomt läge:**
  - Ikon, rubrik *"Du har inga böcker ännu"*, beskrivning *"Lägg till din första bok och börja bygga ditt personliga bibliotek."*, knapp *"Lägg till en bok"*.

### 3. Lägg till / Redigera bok (`/books/new`, `/books/:id/edit`)
- Tillbakalänk: `← Tillbaka till mina böcker`.
- Formulärkort (maxbredd 680 px):
  - Ikon i rundad ljusblå ruta: `+` (ny) eller `✏️` (redigera).
  - Överetikett: `EN NY BERÄTTELSE` (ny) eller `UPPDATERA DIN SAMLING` (redigera).
  - Rubrik: `Lägg till ny bok` / `Redigera bok`.
  - Ingress: `Fyll i uppgifterna för boken du vill spara.`
  - Fält:
    - `Titel *` (placeholder: `Exempel: Ett eget rum`).
    - `Författare *` (placeholder: `Exempel: Virginia Woolf`).
    - `Publiceringsdatum *` med kalenderikon (placeholder: `åååå-mm-dd`).
    - `Beskrivning` `Valfritt` (textarea, placeholder: `Några ord om boken...`) med teckenräknare `0/500 tecken`.
  - Knappar: `Avbryt` (sekundär), `✓ Spara` (primär).

### 4. Mina citat (`/quotes`)
- **Header:**
  - Överetikett: `ORD ATT ÅTERVÄNDA TILL` (`--amber`).
  - Rubrik: `Mina citat`.
  - Ingress: `Upp till fem favoritcitat, samlade på ett ställe.`
  - Knapp: `+ Lägg till citat`.
- **Citatkort:**
  - Vänsterkant: 3 px bärnstenslinje (`--amber`).
  - Citattext satt i Fraunces 400 kursiv med dekorativt citattecken.
  - Författare/källa i Inter 500.
  - Åtgärder: Redigera och Radera.
  - Max 5 citat (vid 5 citat inaktiveras lägg till-knappen och maxmeddelande visas).

---

## 8. Avvikelser & Medvetna beslut (Figma vs MVP-krav)

1. **E-postfält i registrering:**
   - *Figma:* Visar ett "E-post *"-fält i skissen för Skapa konto.
   - *Beslut & API-kontrakt:* Marginalia är designat med stark dataintegritet och minimal personuppgiftsinsamling för internship-testet. Inloggning och registrering sker **enbart via unikt användarnamn och lösenord** (`POST /api/auth/register { username, password }`). E-postfält byggs inte.
2. **"Visa varumärke och designsystem"-länk:**
   - *Figma:* Visar en länk i botten av inloggningssidan.
   - *Beslut:* Enligt projektets kärnregler (`00-core.md`: *Won't build: design-guide page*) ska applikationen inte innehålla en intern designguidesida. Designguiden dokumenteras här i `docs/` och i versionshanteringen.
