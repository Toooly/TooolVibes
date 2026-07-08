# REPORT FIGMA — Componenti da Creare

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## Componente: Button
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Buttons  
**Perché serve:** CTA principale di tutta l'app (salva, confronta, scopri, login). Usato in ogni pagina.  
**Varianti da creare:** primary / secondary / ghost / destructive / icon-only  
**Stati da creare:** default / hover / focus / active (pressed) / disabled / loading  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Hug contents, padding orizzontale variante per size, gap 8px tra icona e label.  
**Constraints consigliati:** Scale per width, Hug per height.  
**Token da usare:** color/accent/primary, color/accent/hover, color/accent/pressed, color/surface/raised, color/ink/primary, color/ink/muted, color/status/danger, space/3, space/4, radius/md, radius/pill (per varianti pill), motion/duration/fast (annotazione)  
**Dipendenze:** Token color e spacing pronti.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note operative per Figma:**
- Creare variante `icon-only` con altezza fissa = larghezza, `aria-label` annotato nel frame spec.
- Stato loading: spinner 16px centrato, label opacizzata (non rimossa per accessibilità).
- Stato disabled: opacity 50%, cursor not-allowed (annotato, non visibile in Figma statico).
- Size sm/md/lg con altezze 32/40/48px.

---

## Componente: Badge
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Badges  
**Perché serve:** Indicatore di stato/categoria su card e listing (nuovo, popolare, gratis, editor's choice).  
**Varianti da creare:** neutral / accent / success / warning / danger / info  
**Stati da creare:** default / hover (se cliccabile)  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Hug contents, padding 4px 8px (space/1 space/2).  
**Constraints consigliati:** Hug x Hug.  
**Token da usare:** color/surface/raised, color/ink/primary, color/ink/muted, color/accent/primary, color/status/success, color/status/warning, color/status/danger, color/status/info, radius/sm, space/1, space/2, font/ui/weight/500  
**Dipendenze:** Token color, spacing, radius.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note operative per Figma:**
- Variante pill opzionale per badge filtro selezionato.
- Non usare badge per stati complessi (usare Toast o Alert).

---

## Componente: Card — Tool Card
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Tool Card  
**Perché serve:** Il workhorse dell'app. Rappresenta ogni tool in griglia/lista.  
**Varianti da creare:** default / compact / featured / horizontal (compare row)  
**Stati da creare:** default / hover (lift) / focus / selected (saved) / loading skeleton  
**Viewport:** mobile (verticale) / tablet / desktop  
**Auto-layout consigliato:** Vertical auto-layout, gap 12px interno, padding 16px. Mobile: logo sopra, testo sotto. Desktop: opzionale layout orizzontale.  
**Constraints consigliati:** Fill container (width), Hug (height).  
**Token da usare:** color/surface/raised, color/bg/base, color/ink/primary, color/ink/secondary, color/ink/muted, color/accent/primary, space/4, space/3, space/2, radius/md, elevation/rest, elevation/raised, type/size/body, type/size/h3  
**Dipendenze:** Badge, Button (icon-only per save/compare), Avatar.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note operative per Figma:**
- Creare variante mobile con layout verticale, logo sopra, testo sotto, CTA visibili, tap target minimo 44px per icona salva/confronta.
- Stato selected: bordo o sfondo accent con icona fill.
- Stato hover: elevation/raised (ombra maggiore), lift max 2px.
- Non includere logica dinamica del punteggio (Code-Only).

---

## Componente: Card — Editorial Card
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Editorial Card  
**Perché serve:** Articoli, guide, recensioni editoriali.  
**Varianti da creare:** default / featured (hero) / compact  
**Stati da creare:** default / hover / focus  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Vertical auto-layout, immagine aspect-ratio 16:9 o 3:2, testo sotto.  
**Constraints consigliati:** Fill container (width).  
**Token da usare:** color/surface/raised, color/ink/primary, color/ink/secondary, color/ink/muted, space/4, space/3, radius/md, type/size/h3, type/size/body, type/size/caption  
**Dipendenze:** Badge (opzionale), Avatar autore.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note operative per Figma:**
- Featured: immagine full-bleed top, testo overlay con gradient (tokenizzare gradient se possibile, altrimenti annotare).
- Caption per byline autore e data.

---

## Componente: Card — Offer Card
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Offer Card  
**Perché serve:** Offerte, affiliate, shop.  
**Varianti da creare:** default / highlighted / expired  
**Stati da creare:** default / hover / focus  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Vertical auto-layout con header prezzo, body descrizione, footer CTA.  
**Constraints consigliati:** Fill container (width).  
**Token da usare:** color/surface/raised, color/accent/primary, color/ink/primary, color/ink/muted, color/status/success, space/4, radius/md, type/size/h3, type/size/body  
**Dipendenze:** Button/Primary.  
**Classificazione:** Figma-Reference  
**Priorità:** P2  
**Note operative per Figma:**
- Offerte sono one-off; classificare come Figma-Reference perché il codice guida.
- Annotare placement disclosure affiliate (obbligo legale).

---

## Componente: Input
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Inputs  
**Perché serve:** Ricerca, form suggerisci tool, login, signup, filtri testuali.  
**Varianti da creare:** text / search / textarea / select / checkbox / radio / switch  
**Stati da creare:** default / hover / focus / active / disabled / error / valid  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Vertical auto-layout per label + input + helper; input interno Hug o Fill.  
**Constraints consigliati:** Fill container (width), Hug (height).  
**Token da usare:** color/bg/base, color/surface/raised, color/ink/primary, color/ink/muted, color/accent/primary, color/status/danger, color/focus/ring, space/3, space/4, radius/md, type/size/body, type/size/caption  
**Dipendenze:** Token color, spacing, radius.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note operative per Figma:**
- Search: icona lente incorporata, padding-left aumentato per icona.
- Textarea: min-height annotato, resize handle opzionale.
- Select: freccia dropdown come icona trailing fissa.
- Switch: stato on/off con token accent/surface, thumb posizione.
- Error: bordo color/status/danger, messaggio sotto in caption.

---

## Componente: Tooltip
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Tooltip  
**Perché serve:** Info contestuali su icone, filtri, feature.  
**Varianti da creare:** top / bottom / left / right  
**Stati da creare:** default (un solo stato visivo, posizione varia)  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Hug contents, padding 8px 12px.  
**Constraints consigliati:** Hug x Hug.  
**Token da usare:** color/ink/primary (invertito: sfondo scuro, testo chiaro), color/surface/raised, radius/sm, space/2, space/3, type/size/caption  
**Dipendenze:** Token color, spacing.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note operative per Figma:**
- Aggiungere freccetta/pointer verso l'elemento trigger.
- Mobile: considerare che i tooltip sono problematici; annotare alternativa (bottom sheet info).
- Non includere delay/timing (Code-Only).

---

## Componente: Modal
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Modal  
**Perché serve:** Confronto tool, conferme, form embedded.  
**Varianti da creare:** default / large / confirmation / form  
**Stati da creare:** default / entrance / exit (annotati, non animati in Figma)  
**Viewport:** mobile (fullscreen o quasi) / tablet / desktop  
**Auto-layout consigliato:** Vertical auto-layout per header/body/footer; body scrollable se necessario.  
**Constraints consigliati:** Max-width definito (es. 480px mobile, 640px desktop), centrato.  
**Token da usare:** color/surface/raised, color/ink/primary, color/ink/muted, color/accent/primary, elevation/modal, radius/lg, space/4, space/6, type/size/h3, type/size/body  
**Dipendenze:** Button, Input (se form).  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note operative per Figma:**
- Header: titolo + bottone chiusura (icon-only).
- Footer: azioni primarie allineate a destra (desktop), stack full-width (mobile).
- Backdrop annotato separatamente.
- Mobile: occupare quasi tutto lo schermo per evitare framing strano.

---

## Componente: BottomSheet
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Modal / Sheet  
**Perché serve:** Filtri mobile, menu azioni, selezione opzioni.  
**Varianti da creare:** default / expanded / peek  
**Stati da creare:** default / drag (annotato)  
**Viewport:** mobile (primario), tablet  
**Auto-layout consigliato:** Vertical auto-layout, handle drag visibile in alto.  
**Constraints consigliati:** Fill container (width), Hug/Fixed (height).  
**Token da usare:** color/surface/raised, color/ink/primary, elevation/modal, radius/lg (top-only), space/4  
**Dipendenze:** Token color, elevation.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note operative per Figma:**
- Handle bar: 40px larghezza, 4px altezza, centrato, radius/pill.
- Sheet non deve coprire interamente su tablet; lasciare margini visibili.
- Animazione drag/swipe = Code-Only.

---

## Componente: Toast
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Tooltip / Toast  
**Perché serve:** Feedback azioni (tool salvato, errore, conferma).  
**Varianti da creare:** success / error / warning / info  
**Stati da creare:** default / entrance / exit (annotati)  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Horizontal auto-layout, icona + testo + close, padding 12px 16px.  
**Constraints consigliati:** Hug x Hug, max-width 400px.  
**Token da usare:** color/surface/raised, color/status/success, color/status/danger, color/status/warning, color/status/info, color/ink/primary, radius/md, space/3, space/4, type/size/body  
**Dipendenze:** Token color, spacing.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note operative per Figma:**
- Mobile: posizione bottom-center con safe-area.
- Desktop: posizione top-right.
- Icona status obbligatoria, non solo colore (accessibilità).
- Close button icon-only opzionale.

---

## Componente: Avatar
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Avatar  
**Perché serve:** Autore articolo, reviewer, utente account.  
**Varianti da creare:** image / fallback (iniziali)  
**Stati da creare:** default / hover (se cliccabile)  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Fixed size, contenuto centrato.  
**Constraints consigliati:** Fixed x Fixed.  
**Token da usare:** color/accent/primary (fallback bg), color/ink/primary (fallback text), radius/pill, type/size/body  
**Dipendenze:** Token color, radius.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note operative per Figma:**
- Size sm/md/lg: 24/32/48px.
- Fallback: iniziali maiuscole, font weight 600.
- Bordo opzionale per stato online/verificato.

---

## Componente: Tabs
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Tabs  
**Perché serve:** Navigazione sezioni in Tool Detail, pagine con contenuto tabulato.  
**Varianti da creare:** default / pills / underline  
**Stati da creare:** default / hover / active (selected) / disabled  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Horizontal auto-layout per tab list, ogni tab Hug contents.  
**Constraints consigliati:** Hug x Hug per singolo tab, Fill per container.  
**Token da usare:** color/ink/primary, color/ink/muted, color/accent/primary, color/surface/raised, space/3, space/4, radius/sm, type/size/body, font/ui/weight/500  
**Dipendenze:** Token color, spacing, type.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  **Note operative per Figma:**
- Variante underline: linea accent sotto tab attiva, 2px.
- Variante pills: sfondo selected con radius/pill.
- Mobile: scroll orizzontale annotato, non wrappare.

---

## Componente: Accordion
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Accordion  
**Perché serve:** FAQ, dettagli tecnici tool, filtri avanzati (uso parsimonioso).  
**Varianti da creare:** default / bordered / filled  
**Stati da creare:** collapsed / expanded / hover / disabled  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Vertical auto-layout, header fixed, body Hug (espandibile).  
**Constraints consigliati:** Fill container (width).  
**Token da usare:** color/surface/raised, color/ink/primary, color/ink/muted, color/accent/primary, space/4, radius/md, type/size/body, type/size/h3  
**Dipendenze:** Token color, spacing.  
**Classificazione:** Figma-SoT  
**Priorità:** P2  
**Note operative per Figma:**
- Icona chevron ruota 180° in expanded (annotare, non animare in Figma).
- Non usare per navigazione principale (usare Tabs).
- Spacing interno body: space/4.

---

## Componente: Compare Row
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Compare Row  
**Perché serve:** Riga di confronto in pagina Compare/Arena.  
**Varianti da creare:** default / highlight-winner / category-header  
**Stati da creare:** default / hover  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Horizontal auto-layout, colonne uguali, gap 16px.  
**Constraints consigliati:** Fill container (width).  
**Token da usare:** color/surface/raised, color/ink/primary, color/ink/muted, color/accent/primary, space/4, space/6, radius/md, type/size/body  
**Dipendenze:** Tool Card (compact), Badge.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note operative per Figma:**
- Mobile: trasformare in stack verticale o scroll orizzontale; annotare breakpoint.
- Highlight-winner: bordo accent, sfondo leggermente tintato.
- Category-header: sfondo diverso, font weight 600, non cliccabile.

---

## Componente: Header / Nav
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Header / Nav  
**Perché serve:** Navigazione principale, search, auth.  
**Varianti da creare:** default / scrolled (elevated) / mobile (hamburger) / auth (user avatar)  
**Stati da creare:** default / hover / active / focus / mobile-open  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Horizontal auto-layout, space-between, padding 16px 24px.  
**Constraints consigliati:** Fill container (width), Hug (height).  
**Token da usare:** color/bg/base, color/surface/raised (scrolled), color/ink/primary, color/accent/primary, space/4, space/6, elevation/rest, elevation/raised, type/size/body  
**Dipendenze:** Button, Input (search), Avatar.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note operative per Figma:**
- Mobile: hamburger menu che apre overlay full-screen o drawer.
- Scrolled: aggiungere elevation/raised, sfondo opaco (non trasparente).
- Search bar integrata o espandibile.

---

## Componente: Footer
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Footer  
**Perché serve:** Link legali, social, newsletter, affiliate disclosure.  
**Varianti da creare:** default / minimal (landing page)  
**Stati da creare:** default / hover (link)  
**Viewport:** mobile / tablet / desktop  
**Auto-layout consigliato:** Vertical auto-layout per sezioni, horizontal per colonne link.  
**Constraints consigliati:** Fill container (width).  
**Token da usare:** color/bg/base, color/ink/primary, color/ink/muted, color/ink/secondary, space/6, space/8, type/size/body, type/size/caption  
**Dipendenze:** Token spacing, type.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note operative per Figma:**
- Mobile: stack verticale, link centrati o allineati sinistra.
- Annotare posizione disclosure affiliate (obbligatoria per compliance).
- Newsletter: input + button inline (desktop), stack (mobile).

---

## Riepilogo Componenti

| Componente | Categoria | Classificazione | Priorità |
|-----------|-----------|-----------------|----------|
| Button | primitive | Figma-SoT | P0 |
| Badge | primitive | Figma-SoT | P0 |
| Card — Tool Card | composite | Figma-SoT | P0 |
| Card — Editorial Card | composite | Figma-SoT | P1 |
| Card — Offer Card | composite | Figma-Reference | P2 |
| Input | primitive | Figma-SoT | P0 |
| Tooltip | primitive | Figma-SoT | P1 |
| Modal | primitive | Figma-SoT | P0 |
| BottomSheet | primitive | Figma-SoT | P1 |
| Toast | primitive | Figma-SoT | P1 |
| Avatar | primitive | Figma-SoT | P1 |
| Tabs | primitive | Figma-SoT | P1 |
| Accordion | primitive | Figma-SoT | P2 |
| Compare Row | composite | Figma-SoT | P1 |
| Header / Nav | composite | Figma-SoT | P0 |
| Footer | composite | Figma-SoT | P1 |

---

*Fine del report componenti da creare.*
