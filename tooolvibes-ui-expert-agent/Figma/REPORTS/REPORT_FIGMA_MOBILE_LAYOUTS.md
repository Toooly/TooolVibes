# REPORT FIGMA — Layout Mobile

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## Viewport di riferimento

- **Base:** 375px (iPhone standard)
- **Stretto:** 320px (small Android)
- **Largo mobile:** 414px (iPhone Plus/Max)
- **Tablet:** 768px (iPad portrait)

---

## Mobile Section: Header / Nav
**Viewport:** 320–414px  
**Problema da risolvere:** La nav desktop collassa in hamburger menu; search bar richiede spazio limitato; auth state cambia visibilità.  
**Layout Figma consigliato:**
- Riga superiore: logo sinistra, hamburger destra.
- Search bar sotto il header o espandibile da icona.
- Menu aperto: overlay full-screen o drawer da destra, link stack verticali, tap target 48px.
**Auto-layout:** Horizontal space-between per header riga; Vertical stack per menu aperto.  
**Spacing:** Padding orizzontale 16px (space/4); gap link 8px (space/2); tap target minimo 44px, target 48px.  
**Safe-area:** rispettare notch (padding-top minimo 44px se header fixed).  
**Componenti coinvolti:** Header/Nav, Button/icon-only (search, hamburger, close), Avatar (auth).  
**Stati da rappresentare:** default / scrolled (compact) / menu-open / auth / anonimo  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Menu a due livelli (troppo complesso per mobile); link troppo piccoli; header con troppi elementi visibili contemporaneamente.  
**Priorità:** P0  
**QA Figma:** Verificare che nessun elemento ecceda 414px; verificare tap target 44px su ogni elemento interattivo; verificare contrasto link su sfondo menu.

---

## Mobile Section: Home Hero
**Viewport:** 375px  
**Problema da risolvere:** Il contenuto hero (titolo display, sottotitolo, CTA, search) deve stare in viewport iniziale senza scroll eccessivo; testo display deve scalare.  
**Layout Figma consigliato:**
- Stack verticale centrato o allineato sinistra.
- Titolo: size h1 o display ridotto (max 36px), line-height tight.
- Sottotitolo: body/lead, max 2 righe.
- CTA primario: button lg, full-width o quasi.
- Search bar: sotto CTA o integrata in hero, full-width.
**Auto-layout:** Vertical stack, gap 16px (space/4), padding 24px (space/6) verticale.  
**Spacing:** space/4 tra elementi; space/6 padding sezione.  
**Safe-area:** padding orizzontale 16px minimo.  
**Componenti coinvolti:** Button/Primary, Input/Search.  
**Stati da rappresentare:** default / loading (skeleton hero) / first-visit  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Testo display troppo grande (>40px su 375px); CTA troppo piccola; più di 1 CTA primaria visibile.  
**Priorità:** P0  
**QA Figma:** Verificare che il contenuto hero stia entro ~600px altezza totale; verificare leggibilità titolo a 320px.

---

## Mobile Section: Tool Discovery (Filters + Grid)
**Viewport:** 375px  
**Problema da risolvere:** Filtri multipli non possono stare in riga; grid card deve adattarsi a 1 colonna; bottom sheet per filtri avanzati.  
**Layout Figma consigliato:**
- Filtri rapidi: scroll orizzontale di chip/pill, hug height.
- Button "Filtri": apre BottomSheet con filtri completi.
- Grid: 1 colonna, card full-width, gap 16px verticale.
- Card: layout verticale (logo sopra, info sotto, CTA visibili).
**Auto-layout:** Vertical stack per pagina; horizontal scroll per chip filtri; vertical stack per grid.  
**Spacing:** space/4 tra card; space/3 tra chip filtri; space/6 tra sezioni.  
**Safe-area:** padding 16px orizzontale.  
**Componenti coinvolti:** BottomSheet, Input/Select, Button/Chip, Card/Tool Card.  
**Stati da rappresentare:** default / filters-open / empty-results / loading-skeleton  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Grid 2 colonne su 375px (card troppo strette); filtri in accordion visibili sempre (occupano troppo spazio); mancato stato empty.  
**Priorità:** P0  
**QA Figma:** Verificare larghezza card minima 343px su 375px (375 - 16*2 - gap); verificare tap target 44px su chip filtri.

---

## Mobile Section: Tool Detail
**Viewport:** 375px  
**Problema da risolvere:** Contenuto editoriale ricco (titolo, meta, descrizione, tabs, recensione, tool simili) in colonna singola; CTA salva/confronta sticky o prominenti.  
**Layout Figma consigliato:**
- Header: logo tool + titolo h2/h3 + meta (categoria, badge).
- CTA row: button salva (icon-only o testo) + button confronta, sticky bottom oppure sotto header.
- Tabs: scroll orizzontale, underline style.
- Contenuto tab: stack verticale, testo body, liste, quote.
- Sezione "Tool simili": horizontal scroll di card compact.
**Auto-layout:** Vertical stack per contenuto; horizontal scroll per card simili.  
**Spacing:** space/4 tra blocchi; space/6 tra sezioni; space/3 tra elementi interni.  
**Safe-area:** padding 16px; se CTA sticky bottom, padding-bottom aggiuntivo per safe-area (34px iPhone X+).  
**Componenti coinvolti:** Tabs, Button, Card/Tool Card, Badge, Tooltip.  
**Stati da rappresentare:** default / saved / loading / error / first-visit  
**Classificazione:** Figma-SoT  
**Cosa evitare:** CTA sticky che copre contenuto senza padding compensativo; tabs wrappate su più righe; immagini troppo larghe che forzano overflow orizzontale.  
**Priorità:** P0  
**QA Figma:** Verificare nessun overflow orizzontale; verificare che tabs siano scrollabili senza wrap; verificare safe-area bottom per CTA sticky.

---

## Mobile Section: Compare / Arena
**Viewport:** 375px  
**Problema da risolvere:** Confronto side-by-side impossibile su 375px; serve scroll orizzontale o stack verticale con toggle.  
**Layout Figma consigliato:**
- Header: titolo + numero tool confrontati.
- Se toggle tra tool: tabs o segmented control in alto.
- Tabella: righe impilate verticalmente, ogni riga mostra valore per tool attivo; swipe/tab per cambiare tool.
- Alternativa: scroll orizzontale della tabella con prima colonna sticky (feature name).
**Auto-layout:** Vertical stack; tabella con colonne in auto-layout orizzontale.  
**Spacing:** space/4 tra righe; space/6 tra sezioni.  
**Safe-area:** padding 16px.  
**Componenti coinvolti:** Tabs, Compare Row, Button/Icon-only (rimuovi tool).  
**Stati da rappresentare:** default / 2-tools / 3-tools / empty (nessun confronto)  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Tabella troppo larga che forza zoom; confronto con più di 3 tool su mobile; mancata indicazione di quale tool è visibile.  
**Priorità:** P1  
**QA Figma:** Verificare leggibilità a 320px; verificare che lo swipe/tab sia chiaramente indicato.

---

## Mobile Section: Shortlist / Salvati
**Viewport:** 375px  
**Problema da risolvere:** Lista di card salvate; azioni rapide (confronta, rimuovi); stato vuoto.  
**Layout Figma consigliato:**
- Header: titolo + contatore.
- Lista: card verticali full-width, swipe-left per azioni (rimuovi) oppure button icon-only visibile.
- CTA bottom: "Confronta selezionati" (se multi-selezione abilitata).
- Stato vuoto: illustrazione + testo + CTA discovery.
**Auto-layout:** Vertical stack, gap space/4.  
**Spacing:** space/4 tra card; space/6 padding sezione.  
**Safe-area:** padding 16px; bottom CTA con safe-area.  
**Componenti coinvolti:** Card/Tool Card, Button/Primary, Button/Destructive.  
**Stati da rappresentare:** default / empty / selected / loading  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Card orizzontali su mobile (troppo strette); mancato stato vuoto; azioni nascoste dietro long-press senza indicazione visiva.  
**Priorità:** P1  
**QA Figma:** Verificare tap target su azioni rimuovi; verificare stato vuoto con CTA chiara.

---

## Mobile Section: Footer
**Viewport:** 375px  
**Problema da risolvere:** Molte colonne di link devono collassare in stack verticale; newsletter input + button in colonna.  
**Layout Figma consigliato:**
- Logo + tagline.
- Colonne link: stack verticale, ogni colonna come sottosezione espandibile (accordion) o semplice stack.
- Newsletter: input full-width + button full-width sotto.
- Social icons: row centrata, gap 16px.
- Legal: stack verticale, testo piccolo.
- Affiliate disclosure: testo caption in fondo.
**Auto-layout:** Vertical stack per tutto; horizontal per social icons.  
**Spacing:** space/6 tra sezioni; space/3 tra link; space/4 tra input e button.  
**Safe-area:** padding 16px; padding-bottom safe-area.  
**Componenti coinvolti:** Input, Button, Icon.  
**Stati da rappresentare:** default / hover-link  
**Classificazione:** Figma-SoT  
**Cosa evitare:** Colonne affiancate su 375px (troppo strette); link troppo piccoli; mancata disclosure affiliate.  
**Priorità:** P1  
**QA Figma:** Verificare tap target link 44px; verificare disclosure visibile.

---

## Riepilogo Layout Mobile

| Sezione | Viewport | Classificazione | Priorità |
|---------|----------|-----------------|----------|
| Header / Nav | 320–414px | Figma-SoT | P0 |
| Home Hero | 375px | Figma-SoT | P0 |
| Tool Discovery | 375px | Figma-SoT | P0 |
| Tool Detail | 375px | Figma-SoT | P0 |
| Compare / Arena | 375px | Figma-SoT | P1 |
| Shortlist / Salvati | 375px | Figma-SoT | P1 |
| Footer | 375px | Figma-SoT | P1 |

---

**RICHIESTA NON APPLICATA — documentata solo per handoff Figma. Nessuna modifica codice eseguita.**

---

*Fine del report layout mobile.*
