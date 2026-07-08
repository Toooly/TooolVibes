# TooolVibes — Mobile Layouts (375px)

## Viewport
- **Base:** 375px (iPhone standard)
- **Stretto:** 320px (small Android)
- **Largo:** 414px (iPhone Plus/Max)
- **Tablet:** 768px (iPad portrait)

## Header / Nav — P0
- Riga: logo sinistra, hamburger destra
- Search: sotto header o espandibile da icona
- Menu aperto: overlay full-screen o drawer da destra, link stack verticali, tap target 48px
- Padding orizzontale: 16px (space/4)
- Safe-area: padding-top 44px se header fixed

## Home Hero — P0
- Stack verticale centrato o allineato sinistra
- Titolo: h1 o display ridotto (max 36px), line-height tight
- Sottotitolo: body/lead, max 2 righe
- CTA: button lg, full-width o quasi
- Search bar: sotto CTA, full-width
- Contenuto hero entro ~600px altezza totale

## Tool Discovery — P0
- Filtri rapidi: scroll orizzontale di chip/pill
- Button "Filtri": apre BottomSheet
- Grid: 1 colonna, card full-width, gap 16px verticale
- Card: layout verticale, logo sopra, info sotto, CTA visibili
- Stati: default, filters-open, empty-results, loading-skeleton

## Tool Detail — P0 (Hero Page #1)
- Header: logo tool + titolo h2/h3 + meta (categoria, badge)
- CTA row: salva + confronta, sticky bottom o sotto header
- Tabs: scroll orizzontale, underline style
- Contenuto: stack verticale, testo body, liste, quote
- "Tool simili": horizontal scroll di card compact
- Stati: default, saved, loading, error, first-visit
- Safe-area bottom: 34px padding per iPhone X+

## Compare — P1
- Header: titolo + numero tool
- Toggle: tabs o segmented control
- Tabella: righe impilate verticalmente
- Max 3 tool su mobile
- Stati: default, 2-tools, 3-tools, empty

## Shortlist — P1
- Header: titolo + contatore
- Lista: card verticali full-width
- Swipe-left per rimuovi o button icon-only visibile
- Stato vuoto: illustrazione + testo + CTA discovery
- Stati: default, empty, selected, loading

## Footer — P1
- Logo + tagline
- Colonne link: stack verticale
- Newsletter: input full-width + button full-width sotto
- Social: row centrata, gap 16px
- Legal: stack verticale, testo piccolo
- Disclosure affiliate: caption in fondo
