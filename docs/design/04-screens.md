# 04 – Skärmar & Texter

[← Tillbaka till översikten](../design-system.md)

## 1. Logga in (`/login`) & Registrera (`/register`)

- **Vänster varumärkespanel (`≥ 992 px`, `#1F3A5F`, `padding: 40px 48px`):**
  - Topp: Inverterad `<Logo />` + transparent `<ThemeToggle />`. Koncentriska vita cirkelbågar nere till vänster.
  - Mitt: Lutad (`-2deg`) öppen 3D-bok (`350×265 px`) med två pappersblad (`#F7F4EC`). Vänster blad har `16 px` bokkant (`#E9E4D8`), 3 tunna textlinjer och amber `“` (`44 px` nere till vänster). Höger blad har 3 textlinjer och kursiv marginalnotis *"en tanke värd / att återvända till"* med `2 px` vertikal amberlinje.
  - Botten: *“Läsning ger oss någonstans att ta vägen när vi måste stanna där vi är.”* och `— Mason Cooley`.
- **Höger formulärpanel (`var(--surface)`, kort `max-width: 430 px`):**
  - Mobil/surfplatta (`< 992 px`): Topprad med `<Logo />` + `<ThemeToggle />` (ingen sidfot under formuläret).
  - **Logga in:** Eyebrow `VÄLKOMMEN TILLBAKA`, H1 `Logga in`, ingress `Dina böcker och anteckningar väntar på dig.`. Fält: `Användarnamn *` (`fa-user`, `Ditt användarnamn`), `Lösenord *` (`fa-lock` + öga, `Minst 8 tecken`). Knapp: `Logga in` + `fa-arrow-right`. Länk: `Har du inget konto? Registrera dig`.
  - **Registrera:** Eyebrow `BÖRJA DIN SAMLING`, H1 `Skapa konto`, ingress `Samla böckerna och orden du vill bära med dig.`. Fält: `Användarnamn *`, `Lösenord *` + 4-stegs styrkemätare, `Bekräfta lösenord *` (`Upprepa lösenordet`). Knapp: `Registrera dig` + `fa-arrow-right`. Länk: `Har du redan ett konto? Logga in`.
  - **Felmeddelanden:** Felruta `Något gick fel` + `Fel användarnamn eller lösenord` / `Kontrollera de markerade fälten`; fältfel `Ange ett användarnamn`, `Använd minst 8 tecken`, `Lösenorden matchar inte`.

## 2. Mina böcker (`/books`)

- **Sidhuvud:** Eyebrow `DITT BIBLIOTEK`, H1 `Mina böcker`, ingress `[X] böcker sparade i din samling.` (`1 bok sparad...`), knapp `+ Lägg till ny bok` (`42×42 px` `+` på `< 768 px`).
- **Verktygsrad:** Sökfält (`max-width: 420 px`, `44 px`, `fa-magnifying-glass`, `Sök efter titel eller författare…`) + etikett `Sortera` med väljare (`Titel A–Ö`, `Nyast först`).
- **Tabell (`≥ 768 px`):** `44 px` `--surface-2` header (`TITEL`, `FÖRFATTARE`, `PUBLICERINGSDATUM`, `ÅTGÄRDER`). Rader (`76 px`) med `.book-glyph` (`fa-book-open`), fet titel, författare (`--text`), svenskt kortdatum (`24 sep. 1929`, `<time datetime="yyyy-MM-dd">`) samt ghost-knappar `Redigera` och `Radera`.
- **Mobilkort (`< 768 px`):** `14 px` radie, `18 px` padding. Överst `.book-glyph` + fet titel och dämpad författare direkt under; nederst indenterat svenskt datum till vänster och `Redigera`/`Radera` till höger (utan inre avdelningslinje).
- **Tomlägen:** Tom samling: `Du har inga böcker ännu` / `Lägg till din första bok och börja bygga ditt personliga bibliotek.` + `+ Lägg till en bok`. Tom sökning: `Prova en annan sökning eller rensa sökfältet.`.

## 3. Lägg till / Redigera bok (`/books/new`, `/books/:id/edit`)

- Behållare `max-width: 760 px`, tillbakalänk `← Tillbaka till mina böcker` (`13 px` 600 i `--ink`).
- **Formulärkort (`padding: 38px 42px`, mobil `26px 20px`):**
  - Sidhuvud i rad (`display: flex; gap: 18px`) med `1 px` bottenlinje: vänster `48×48 px` `.form-icon` (`fa-plus` / `fa-pen`, döljs `< 768 px`), höger eyebrow `EN NY BERÄTTELSE` / `UPPDATERA DIN SAMLING`, H1 (`28 px`) `Lägg till ny bok` / `Redigera bok`, ingress `Fyll i uppgifterna för boken du vill spara.` / `Ändra uppgifterna och spara när du är klar.`.
  - Fält (`46 px`): `Titel *` (`Exempel: Ett eget rum`), `Författare *` (`Exempel: Virginia Woolf`), `Publiceringsdatum *` (`type="date"`), `Beskrivning` med inline `Valfritt` + `textarea` (`rows="5"`, `Några ord om boken…`) + `0/500 tecken`.
  - Fältfel: `Ange bokens titel`, `Ange bokens författare`, `Välj ett publiceringsdatum`.
  - Fot med `1 px` toppkant: `Avbryt` (sekundär) och `✓ Spara` (primär).

## 4. Mina citat (`/quotes`) & Citatmodal

- **Sidhuvud:** Eyebrow `ORD ATT ÅTERVÄNDA TILL`, H1 `Mina citat`, ingress `Dina fem favoritcitat, samlade på ett ställe.`, knapp `+ Lägg till citat` (inaktiverad vid 5 citat med maxgränsmeddelande).
- **Citatkort (2 kolumner `≥ 768 px`, `gap: 18 px`, `min-height: 260 px`, `padding: 30px 30px 24px 34px`):** `3 px` `--amber` vänsterkant, `fa-quote-left` (`23 px`, `--amber`) uppe till vänster, `01`–`05` (`30 px` Fraunces i `--border`) uppe till höger, kursivt citat i Fraunces (`18–22 px`), nederst fet författare (`13 px`, utan tankstreck och utan bottenlinje) till vänster samt två `.btn-icon` (`fa-pen`, `fa-trash`) till höger.
- **Streckat tomkort (`< 5` citat):** `<button>` med `1 px dashed var(--border)`, `min-height: 230 px`, `42×42 px` rund `--surface-2`-cirkel (`fa-plus` i `--ink`), **Lägg till ditt 1:a–5:e citat** och *Spara ett stycke du vill minnas*.
- **Citatmodal (`Lägg till citat` / `Redigera citat`):** `Citat *` (`textarea rows="5"`, `Skriv eller klistra in citatet…`, max 600), `Författare *` (`input`, `Vem skrev orden?`, max 200), knappar `Avbryt` och `Spara citat`.
