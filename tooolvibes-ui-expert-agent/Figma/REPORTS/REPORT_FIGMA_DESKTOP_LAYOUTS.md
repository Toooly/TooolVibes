# REPORT FIGMA — Layout Desktop

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## Viewport di riferimento

- **Small desktop:** 1024px (laptop)
- **Standard desktop:** 1280px (target principale)
- **Large desktop:** 1440px
- **Wide:** 1920px (sanity check)

---

## Desktop Section: Header / Nav
**Viewport:** 1280px  
**Problema da risolvere:** Nav orizzontale con link visibili, search bar integrata, stato auth con avatar/dropdown.  
**Layout Figma consigliato:**
- Logo sinistra, link nav centrati (o sinistra dopo logo), search bar centrale-destra, auth/avatar destra.
- Container max-width 1280px centrato, padding orizzontale 24–48px.
- Stato scrolled: sottile ombra, sfondo opaco, altezza ridotta.
- Dropdown auth: sotto avatar, larghezza 200px, radius/lg.
**Auto-layout:** Horizontal space-between per container; horizontal per link nav; vertical per dropdown.  
**Spacing:** space/4 tra link; space/6 padding orizzontale container; space/3 tra search e auth.  
**Safe-area:** n/a su desktop, ma mantenere margini laterali 24px minimo.  
**Componenti coinvolti:** Header/Nav, Input/Search, Button, Avatar, Dropdown menu.  
**Stati da rappresentare:** default / scrolled / auth / anonimo / dropdown-open  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Header troppo alto (>80px); link nav troppo piccoli; search bar troppo corta (<240px).  
**Priorità:** P0  
**QA Figma:** Verificare allineamento verticale elementi; verificare che il container non si allarghi oltre 1440px senza controllo; verificare stato scrolled.

---

## Desktop Section: Home
**Viewport:** 1280px  
**Problema da risolvere:** Hero con titolo display grande, sottotitolo, CTA, possibile immagine/illustrazione laterale; sezioni sotto (catalogo, radar, editorial) in griglia.  
**Layout Figma consigliato:**
- Hero: 2 colonne (testo sinistra, illustrazione destra) o centrato se no illustrazione. Container max-width 1280px.
- Titolo display: size display, max 2 righe.
- CTA: button lg, opzionalmente secondary button affiancato.
- Sezione Catalogo: grid 3–4 colonne card.
- Sezione Radar: struttura visiva del radar (cerchi concentrici o blob), leggenda a lato.
- Sezione Editorial: 2–3 card affiancate.
**Auto-layout:** Vertical stack per sezioni; horizontal 2-col per hero; grid auto-layout per card.  
**Spacing:** space/12 (48px) tra sezioni; space/6 padding interno sezione; space/4 gap card.  
**Safe-area:** Container centrato con max-width, margini auto.  
**Componenti coinvolti:** Button, Input, Card/Tool Card, Card/Editorial Card, Tabs.  
**Stati da rappresentare:** default / loading / first-visit / signed-out  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Testo display troppo largo (>80px); griglia card che si allarga troppo (max 4 colonne a 1280px); mancato container max-width.  
**Priorità:** P0  
**QA Figma:** Verificare leggibilità a 1024px (non troppo stretto); verificare che a 1920px il container non si allarghi oltre 1440px oppure usare padding proporzionale.

---

## Desktop Section: Tool Discovery (Category Hub + Filters)
**Viewport:** 1280px  
**Problema da risolvere:** Sidebar filtri + griglia card; filtri visibili sempre su desktop; header categoria con breadcrumb.  
**Layout Figma consigliato:**
- Layout 2 colonne: sidebar filtri 280px sinistra, griglia card destra (fill rimanente).
- Sidebar: accordion filtri (categoria, prezzo, feature, rating), sticky top 80px.
- Griglia: 3 colonne a 1280px, gap 24px.
- Header: breadcrumb + titolo categoria + contatore risultati + ordinamento (select).
- Card: layout verticale standard, hover con elevation/raised.
**Auto-layout:** Horizontal per layout principale; vertical per sidebar; grid per card.  
**Spacing:** space/4 gap card; space/6 tra filtri; space/8 padding sezione.  
**Safe-area:** Container max-width 1280px o 1440px.  
**Componenti coinvolti:** Input, Button, Card/Tool Card, Accordion, Select.  
**Stati da rappresentare:** default / filters-active / empty-results / loading-skeleton  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Sidebar troppo larga (>320px); card troppo piccole (<280px); filtri che spariscono su scroll.  
**Priorità:** P0  
**QA Figma:** Verificare altezza sidebar vs viewport; verificare scroll interno se filtri eccedono; verificare griglia a 1024px (2 colonne ok).

---

## Desktop Section: Tool Detail
**Viewport:** 1280px  
**Problema da risolvere:** Contenuto editoriale ricco in layout a colonna larga; CTA prominenti; tabs per sezioni; sidebar con info meta e tool simili.  
**Layout Figma consigliato:**
- Layout 2 colonne: contenuto principale ~70% sinistra, sidebar ~30% destra.
- Header: logo grande + titolo h1/display + badge + meta.
- CTA row: button salva + button confronta + share, prominente sotto titolo.
- Tabs: full-width del contenuto principale, underline style.
- Body: testo editoriale, immagini, tabelle specifiche.
- Sidebar: info box (prezzo, rating, link), "Tool simili" 2–3 card compact.
- Sezione "Tool simili" anche in fondo pagina.
**Auto-layout:** Horizontal 2-col per layout; vertical stack per contenuto; vertical per sidebar.  
**Spacing:** space/6 tra blocchi contenuto; space/4 tra elementi sidebar; space/8 tra sezioni.  
**Safe-area:** Container max-width 1280px.  
**Componenti coinvolti:** Tabs, Button, Card/Tool Card, Badge, Tooltip, Avatar.  
**Stati da rappresentare:** default / saved / loading / error / signed-out (CTA auth)  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Colonna contenuto troppo larga (>800px, difficile leggibilità); sidebar troppo stretta (<240px); tabs che wrappano.  
**Priorità:** P0  
**QA Figma:** Verificare line-length testo (max 75 caratteri); verificare che la sidebar non venga spinta sotto il contenuto su 1024px; verificare sticky behavior se applicato.

---

## Desktop Section: Compare / Arena
**Viewport:** 1280px  
**Problema da risolvere:** Confronto side-by-side di 2–4 tool; tabella feature comparativa; azioni per ogni tool.  
**Layout Figma consigliato:**
- Header: titolo + selector numero tool.
- Tabella: colonne uguali per ogni tool + colonna fissa sinistra per nomi feature.
- Ogni cella: valore (testo, badge, icona check/cross), allineato.
- Header colonna: logo tool + nome + button rimuovi.
- Riga highlight: winner per categoria evidenziato con bordo accent.
- CTA bottom: "Confronta altri" o "Salva confronto".
**Auto-layout:** Vertical stack per pagina; horizontal per riga tabella; vertical per cella.  
**Spacing:** space/4 tra righe; space/6 padding; space/3 gap colonne.  
**Safe-area:** Container max-width 1280px; tabella può scrollare orizzontalmente se >4 colonne.  
**Componenti coinvolti:** Compare Row, Button, Badge, Card/Tool Card.  
**Stati da rappresentare:** default / 2-tools / 3-tools / 4-tools / empty  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Più di 4 colonne su 1280px (card troppo strette); mancata colonna fissa per nomi feature; allineamento inconsistente tra celle.  
**Priorità:** P1  
**QA Figma:** Verificare leggibilità a 1024px con 3 colonne; verificare scroll orizzontale se necessario; verificare highlight winner visibile.

---

## Desktop Section: Shortlist / Salvati
**Viewport:** 1280px  
**Problema da risolvere:** Grid di card salvate; azioni di bulk (confronta selezionati, rimuovi tutti); stato vuoto.  
**Layout Figma consigliato:**
- Header: titolo + contatore + azioni bulk (se selezione multipla).
- Grid: 3–4 colonne card, gap 24px.
- Card: stesso componente Tool Card con stato selected visibile.
- Stato vuoto: centrato, illustrazione + testo + CTA discovery.
- Sidebar opzionale: "Aggiungi ai salvati da" con suggerimenti.
**Auto-layout:** Vertical stack; grid per card.  
**Spacing:** space/4 gap card; space/6 padding; space/8 tra header e grid.  
**Safe-area:** Container max-width 1280px.  
**Componenti coinvolti:** Card/Tool Card, Button/Primary, Button/Destructive.  
**Stati da rappresentare:** default / empty / selected / loading  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Grid che si allarga troppo senza limite; mancata azione bulk; card senza indicazione selected.  
**Priorità:** P1  
**QA Figma:** Verificare griglia a 1024px (2–3 colonne); verificare stato selected visibile.

---

## Desktop Section: Editorial Article
**Viewport:** 1280px  
**Problema da risolvere:** Layout editoriale con lettura confortevole; immagini full-bleed o contenute; byline; articoli correlati.  
**Layout Figma consigliato:**
- Layout a colonna singola centrata, max-width 720px per testo.
- Header: titolo h1/display, sottotitolo lead, byline con avatar + data.
- Immagine hero: full-bleed del container o max-width 1280px.
- Body: testo body, immagini intermezzo, quote block.
- Sidebar destra (opzionale): indice articolo sticky, articoli correlati.
- Fine articolo: tag, share, articoli correlati in griglia 3 colonne.
**Auto-layout:** Vertical stack; horizontal per byline; vertical per sidebar.  
**Spacing:** space/4 tra paragrafi; space/6 tra sezioni; space/8 prima/after immagini.  
**Safe-area:** Container max-width 1280px; colonna testo max-width 720px.  
**Componenti coinvolti:** Avatar, Badge, Button, Card/Editorial Card.  
**Stati da rappresentare:** default / loading / error  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Colonna testo troppo larga (>720px); immagini che sforzano il layout; mancato byline.  
**Priorità:** P1  
**QA Figma:** Verificare line-length (max 75ch); verificare contrasto quote block; verificare immagini responsive.

---

## Desktop Section: Service / Positioning
**Viewport:** 1280px  
**Problema da risolvere:** Landing servizio/editoriale con blocchi alternati, CTA forti, trust signals.  
**Layout Figma consigliato:**
- Hero: titolo display + sottotitolo + CTA primario + CTA secondario, centrato o 2-col.
- Blocchi feature: 2 colonne alternate (immagine | testo).
- Trust: loghi clienti/recensioni in row.
- Pricing/Offerte: 2–3 card affiancate.
- CTA finale: banner full-width.
**Auto-layout:** Vertical stack; horizontal 2-col per blocchi feature.  
**Spacing:** space/12 tra sezioni; space/6 padding.  
**Safe-area:** Container max-width 1280px.  
**Componenti coinvolti:** Button, Card, Badge.  
**Stati da rappresentare:** default  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Blocchi troppo densi; CTA non prominenti; mancata disclosure affiliate.  
**Priorità:** P1  
**QA Figma:** Verificare gerarchia visiva; verificare CTA visibili above the fold.

---

## Desktop Section: Footer
**Viewport:** 1280px  
**Problema da risolvere:** 4–5 colonne di link, newsletter, social, legal.  
**Layout Figma consigliato:**
- Container max-width 1280px.
- Top: 4 colonne link + colonna newsletter.
- Bottom: social icons + legal links + copyright.
- Affiliate disclosure: riga separata, testo caption.
**Auto-layout:** Horizontal 5-col per top; horizontal space-between per bottom.  
**Spacing:** space/6 tra colonne; space/4 tra link; space/8 tra top e bottom.  
**Safe-area:** Container centrato.  
**Componenti coinvolti:** Input, Button, Icon.  
**Stati da rappresentare:** default / hover-link  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Colonne troppo strette (<160px); link troppo vicini; mancata disclosure.  
**Priorità:** P1  
**QA Figma:** Verificare allineamento colonne; verificare tap target anche se desktop (mouse + touch hybrid).

---

## Riepilogo Layout Desktop

| Sezione | Viewport | Classificazione | Priorità |
|---------|----------|-----------------|----------|
| Header / Nav | 1280px | Figma-SoT | P0 |
| Home | 1280px | Figma-SoT | P0 |
| Tool Discovery | 1280px | Figma-SoT | P0 |
| Tool Detail | 1280px | Figma-SoT | P0 |
| Compare / Arena | 1280px | Figma-SoT | P1 |
| Shortlist / Salvati | 1280px | Figma-SoT | P1 |
| Editorial Article | 1280px | Figma-SoT | P1 |
| Service | 1280px | Figma-SoT | P1 |
| Footer | 1280px | Figma-SoT | P1 |

---

**RICHIESTA NON APPLICATA — documentata solo per handoff Figma. Nessuna modifica codice eseguita.**

---

*Fine del report layout desktop.*
