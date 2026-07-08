# REPORT FIGMA — Design System Structure

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## Struttura proposta del file Figma

```
Tooolvibes Design System
├── 00_Cover
├── 01_Foundations
│   ├── Design Principles
│   ├── Accessibility Guidelines
│   └── Grid & Breakpoints
├── 02_Tokens
│   ├── Color
│   ├── Typography
│   ├── Spacing
│   ├── Radius
│   ├── Elevation
│   └── Motion
├── 03_Primitives
│   ├── Buttons
│   ├── Badges
│   ├── Cards
│   ├── Inputs
│   ├── Modal / Sheet
│   └── Tooltip / Toast
├── 04_Components
│   ├── Tool Card
│   ├── Editorial Card
│   ├── Compare Row
│   ├── Header / Nav
│   └── Footer
├── 05_Sections
│   ├── Hero
│   ├── Filters
│   ├── Grid
│   ├── CTA Banner
│   └── Editorial Body
├── 06_Pages_Mobile
│   ├── Tool Detail — 375px
│   ├── Discovery — 375px
│   ├── Home — 375px
│   ├── Compare — 375px
│   ├── Shortlist — 375px
│   ├── Editorial — 375px
│   └── Service — 375px
├── 07_Pages_Desktop
│   ├── Tool Detail — 1280px
│   ├── Discovery — 1280px
│   ├── Home — 1280px
│   ├── Compare — 1280px
│   ├── Shortlist — 1280px
│   ├── Editorial — 1280px
│   └── Service — 1280px
├── 08_Prototype_Flows
│   ├── Save → Shortlist
│   ├── Compare Flow
│   └── Auth Flow
├── 09_Archive
│   ├── 99 — Snapshots (Figma-Reference)
│   │   ├── /shop — post-release
│   │   ├── /404
│   │   ├── /account
│   │   └── /login
│   └── Deprecated Components
```

---

## Dettaglio per pagina Figma

### 00_Cover
**Cosa contiene:** Titolo progetto, versione file, data ultimo aggiornamento, owner, link documentazione.  
**Cosa NON deve contenere:** Frame di design, componenti, token.  
**Naming convention:** `00_Cover` — numerazione a 2 cifre con underscore.  
**Ordine consigliato:** 1° — sempre visibile all'apertura.  
**Dipendenze:** Nessuna.

---

### 01_Foundations
**Cosa contiene:** Principi di design TooolVibes (breve), linee guida accessibilità (contrasto minimo, touch target), definizione griglia e breakpoint (375 / 768 / 1280 / 1920).  
**Cosa NON deve contenere:** Token specifici (sono in 02_Tokens), componenti, frame di pagina.  
**Naming convention:** `01_Foundations`  
**Ordine consigliato:** 2° — dopo cover.  
**Dipendenze:** Nessuna.

---

### 02_Tokens
**Cosa contiene:** Tutte le Figma Variables organizzate per categoria: Color, Typography, Spacing, Radius, Elevation, Motion. Ogni variabile deve seguire la naming convention §5-bis (`color/bg/base`, `space/4`, etc.).  
**Cosa NON deve contenere:** Componenti, frame di pagina, valori liberi senza token.  
**Naming convention:** `02_Tokens`  
**Ordine consigliato:** 3° — bloccante per tutto il resto.  
**Dipendenze:** Nessuna (è il fondamento).  
**QA:** Verificare che non esista alcun valore libero (hex/px) nei frame successivi che non sia bindato a una variabile qui definita.

---

### 03_Primitives
**Cosa contiene:** I 11 componenti primitivi Figma-SoT: Button, Badge, Card (base), Input, Tooltip, Modal, BottomSheet, Toast, Avatar, Tabs, Accordion. Ogni primitiva ha la sua pagina con anatomy, variants, states, sizes, tokens used, code counterpart, do/don't.  
**Cosa NON deve contenere:** Componenti compositi (Tool Card, etc.), frame di pagina, contenuto editoriale.  
**Naming convention:** `03_Primitives / <Nome>`  
**Ordine consigliato:** 4° — dopo token.  
**Dipendenze:** `02_Tokens` deve essere completo.  
**QA:** Ogni variante deve usare solo variabili da `02_Tokens`; nessun valore hardcoded.

---

### 04_Components
**Cosa contiene:** Componenti compositi TooolVibes: Tool Card, Editorial Card, Offer Card, Compare Row, Header/Nav, Footer. Ogni componente ha variants per viewport e stato.  
**Cosa NON deve contenere:** Primitive già in `03_Primitives` (riusare istanze), frame di pagina completa.  
**Naming convention:** `04_Components / <Nome>`  
**Ordine consigliato:** 5° — dopo primitive.  
**Dipendenze:** `03_Primitives` pronto.  
**QA:** Verificare che i componenti compositi usino solo istanze delle primitive, non copie slegate.

---

### 05_Sections
**Cosa contiene:** Sezioni riutilizzabili di pagina: Hero, Filters, Grid, CTA Banner, Editorial Body. Ogni sezione è un assembly di componenti + spaziatura.  
**Cosa NON deve contenere:** Contenuto specifico di una pagina (testi reali possono essere esemplificativi, ma la sezione deve essere riutilizzabile).  
**Naming convention:** `05_Sections / <Nome>`  
**Ordine consigliato:** 6° — dopo componenti.  
**Dipendenze:** `04_Components` pronto.  
**QA:** Verificare responsive behavior tra 375px e 1280px.

---

### 06_Pages_Mobile
**Cosa contiene:** Le 7 hero pages in viewport mobile (375px): Tool Detail, Discovery, Home, Compare, Shortlist, Editorial, Service. Ogni pagina è assemblata da sections + componenti. Include stati empty, loading, error.  
**Cosa NON deve contenere:** Desktop layout (è in `07`), primitive isolate (sono in `03`), reference snapshots (sono in `09`).  
**Naming convention:** `06_Pages_Mobile / <Nome> — 375px`  
**Ordine consigliato:** 7° — dopo sections.  
**Dipendenze:** `05_Sections` pronto.  
**QA:** Verificare safe-area, tap target 44px, nessun overflow orizzontale.

---

### 07_Pages_Desktop
**Cosa contiene:** Le 7 hero pages in viewport desktop (1280px), stesse pagine di `06` ma con layout desktop.  
**Cosa NON deve contenere:** Mobile layout, primitive isolate.  
**Naming convention:** `07_Pages_Desktop / <Nome> — 1280px`  
**Ordine consigliato:** 8° — dopo mobile.  
**Dipendenze:** `06_Pages_Mobile` stabile (la struttura contenuto deve essere congelata prima).  
**QA:** Verificare container max-width, line-length testo, griglia card.

---

### 08_Prototype_Flows
**Cosa contiene:** Flussi prototipali interattivi: Save→Shortlist, Compare Flow, Auth Flow. Usa frame dalle pagine `06` e `07`.  
**Cosa NON deve contenere:** Frame nuovi non presenti nelle pagine; logica di business complessa (es. calcolo confronto).  
**Naming convention:** `08_Prototype_Flows / <Nome Flow>`  
**Ordine consigliato:** 9° — ultima fase.  
**Dipendenze:** `06` e `07` completi.  
**QA:** Verificare che i link prototipo non puntino a frame non esistenti.

---

### 09_Archive
**Cosa contiene:**
- `99 — Snapshots`: screenshot post-release di pagine Figma-Reference (Shop, 404, Account, Login).
- `Deprecated Components`: versioni vecchie di primitive obsolete, con data deprecazione.
**Cosa NON deve contenere:** Componenti attivi, token attivi, frame di lavoro in corso.  
**Naming convention:** `09_Archive / 99 — <Nome Snapshot>`  
**Ordine consigliato:** 10° — sempre in fondo.  
**Dipendenze:** Release completata per gli snapshot.  
**QA:** Gli snapshot devono essere bloccati (non editabili) e datati.

---

## Riepilogo struttura

| Pagina Figma | Contenuto | NON contenere | Dipendenze | Ordine |
|-------------|-----------|---------------|------------|--------|
| 00_Cover | Info file, versione | Design frames | Nessuna | 1 |
| 01_Foundations | Principi, grid, breakpoint | Token, componenti | Nessuna | 2 |
| 02_Tokens | Variables Figma | Componenti | Nessuna | 3 |
| 03_Primitives | 11 primitive Figma-SoT | Compositi, pagine | 02_Tokens | 4 |
| 04_Components | Compositi TooolVibes | Primitive isolate, pagine | 03_Primitives | 5 |
| 05_Sections | Sezioni riutilizzabili | Contenuto specifico | 04_Components | 6 |
| 06_Pages_Mobile | 7 hero pages @375px | Desktop layout | 05_Sections | 7 |
| 07_Pages_Desktop | 7 hero pages @1280px | Mobile layout | 06_Pages_Mobile | 8 |
| 08_Prototype_Flows | Flow interattivi | Frame nuovi | 06+07 | 9 |
| 09_Archive | Snapshots, deprecated | Componenti attivi | Release | 10 |

---

**RICHIESTA NON APPLICATA — documentata solo per handoff Figma. Nessuna modifica codice eseguita.**

---

*Fine del report design system structure.*
