# REPORT FIGMA — Page-by-Page Changes

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## Regola di classificazione applicata

Le 7 hero pages sono **Figma-SoT** (Tool Detail, Tool Discovery, Home, Compare, Shortlist, Editorial article, Service).  
Tutte le altre pagine sono **Figma-Reference** (snapshot leggero) o **Code-Only** (nessuna rappresentazione Figma), secondo il decision tree del framework.

---

## Pagina: Home
**Figma changes requested:**
- Hero section: titolo display, sottotitolo lead, CTA primario, search bar. Layout 2-col desktop, stack mobile.
- Sezione Catalogo: griglia 3–4 colonne card, filtri rapidi.
- Sezione Radar: struttura visiva radar (blob/cerchi), leggenda. **Nota:** animazione e logica dinamica del radar = Code-Only.
- Sezione Editorial: 2–3 Editorial Card.
- Stati: default, loading skeleton, first-visit.
**Components da creare/aggiornare:** Button/Primary, Input/Search, Card/Tool Card, Card/Editorial Card.
**Tokens involved:** color/bg/base, color/accent/primary, color/ink/primary, space/4, space/6, space/8, type/size/display, type/size/lead, type/size/body.
**Mobile layout:** 375px, stack verticale, hero compatta.
**Desktop layout:** 1280px, 2-col hero, griglia card.
**Classification:** Figma-SoT — hero page #3 per dipendenza.
**Priorità:** P0 (dipende da Tool Detail e Discovery).
**Operational notes per designer:**
- Il Radar va rappresentato come struttura visiva statica (cerchi, etichette, colori). Timing, animazione, logica punteggio = Code-Only.
- Non creare varianti Radar per ogni combinazione di tool; basta una rappresentazione esemplificativa.

---

## Pagina: Hero (landing)
**Figma changes requested:** Frame hero autonomo, simile a Home hero ma focalizzato su conversione.
**Components da creare/aggiornare:** Button, Input.
**Tokens involved:** Accent, display type.
**Mobile layout:** 375px stack.
**Desktop layout:** 1280px 2-col.
**Classification:** Figma-Reference — landing one-off, il codice guida.
**Priorità:** P2.
**Operational notes:** Snapshot post-release; non bloccare il design system.

---

## Pagina: Intro
**Figma changes requested:** Testo e immagini esplicative.
**Classification:** Figma-Reference — contenuto one-off.
**Priorità:** P2.
**Operational notes:** Content layout variabile; non tokenizzare come primitiva.

---

## Pagina: Catalogo
**Figma changes requested:** Griglia card con filtri sidebar.
**Components da creare/aggiornare:** Card/Tool Card, Input, Accordion (filtri).
**Tokens involved:** Tutti i token di base.
**Mobile layout:** 375px, 1 colonna, bottom sheet filtri.
**Desktop layout:** 1280px, sidebar 280px + griglia 3 col.
**Classification:** Figma-SoT — parte della hero page "Tool Discovery".
**Priorità:** P0.
**Operational notes:** Riutilizzare lo stesso frame Tool Discovery; Catalogo è la vista base di Discovery.

---

## Pagina: Radar
**Figma changes requested:** Struttura visiva radar, legende, tooltip annotati.
**Components da creare/aggiornare:** Nessuna primitiva dedicata; usa Badge, Tooltip annotati.
**Classification:** Both Figma + Code — struttura visiva in Figma, logica dinamica e animazione in codice.
**Priorità:** P1.
**Operational notes:**
- Rappresentare in Figma solo la struttura visiva: cerchi concentrici, assi, colori aree, legende.
- Lasciare timing, easing, calcolo punteggi, interattività drag = Code-Only.
- Non creare componente Radar come primitiva riutilizzabile; è una visualizzazione specifica.

---

## Pagina: Search / Cerca
**Figma changes requested:** Risultati search in lista/griglia, input search prominente.
**Components da creare/aggiornare:** Input/Search, Card/Tool Card.
**Classification:** Figma-Reference — la UI è riutilizzata da Discovery; snapshot sufficiente.
**Priorità:** P2.
**Operational notes:** Non richiede frame dedicato in Figma-SoT; usare frame Discovery con stato search attivo.

---

## Pagina: Tool Detail
**Figma changes requested:** Pagina più visitata e più editoriale.
**Components da creare/aggiornare:** Tabs, Button, Card/Tool Card, Badge, Avatar, Tooltip.
**Tokens involved:** Tutti i token.
**Mobile layout:** 375px, colonna singola, CTA sticky bottom.
**Desktop layout:** 1280px, 2-col (contenuto 70%, sidebar 30%).
**Stati:** default, saved, loading, error, signed-out.
**Classification:** Figma-SoT — hero page #1, priorità assoluta.
**Priorità:** P0 — prima hero page da costruire.
**Operational notes:**
- Costruire questa pagina per prima; le altre hero pages dipendono dalla sua struttura.
- Includere trust signals: "Ultima revisione", "Recensito da", badge affiliate.
- Sidebar: info meta, link esterni, "Tool simili".

---

## Pagina: Wishlist / Salvati
**Figma changes requested:** Lista card salvate, azioni bulk, stato vuoto.
**Components da creare/aggiornare:** Card/Tool Card, Button/Primary, Button/Destructive.
**Tokens involved:** color/accent/primary, color/status/danger, space/4.
**Mobile layout:** 375px, lista verticale.
**Desktop layout:** 1280px, griglia 3–4 colonne.
**Classification:** Figma-SoT — hero page #5.
**Priorità:** P1.
**Operational notes:**
- Stato vuoto obbligatorio: illustrazione + testo + CTA discovery.
- Selezione multipla: checkbox o stato selected sulla card.

---

## Pagina: Compare / Arena
**Figma changes requested:** Tabella confronto side-by-side.
**Components da creare/aggiornare:** Compare Row, Button, Badge.
**Tokens involved:** color/surface/raised, color/accent/primary, space/4.
**Mobile layout:** 375px, toggle tra tool o scroll orizzontale.
**Desktop layout:** 1280px, tabella multi-colonna.
**Stati:** 2-tools, 3-tools, 4-tools, empty.
**Classification:** Figma-SoT — hero page #4.
**Priorità:** P1.
**Operational notes:**
- Mobile: preferire tabs per switchare tool invece di tabella stretta.
- Highlight winner per categoria con token accent.

---

## Pagina: Suggerisci Tool
**Figma changes requested:** Form multi-step o singolo con campi input.
**Components da creare/aggiornare:** Input, Textarea, Button, Select.
**Classification:** Figma-Reference — form one-off, codice guida.
**Priorità:** P2.
**Operational notes:**
- Validazioni e messaggi errore = Code-Only.
- Rappresentare struttura form e stati default/disabled.

---

## Pagina: Collection
**Figma changes requested:** Griglia card simile a Discovery ma curata manualmente.
**Classification:** Figma-Reference — riusa Discovery.
**Priorità:** P2.
**Operational notes:** Snapshot post-release.

---

## Pagina: Discover
**Figma changes requested:** Esplorazione per categorie, tag, trending.
**Classification:** Figma-SoT — hero page #2 "Tool Discovery".
**Priorità:** P0.
**Operational notes:** Vedi frame Tool Discovery.

---

## Pagina: Gigs
**Figma changes requested:** Lista servizi/freelance.
**Classification:** Figma-Reference — sezione niche, codice guida.
**Priorità:** P2.
**Operational notes:** Snapshot leggero.

---

## Pagina: Shop / Offers
**Figma changes requested:** Card offerte, pricing, affiliate.
**Components da creare/aggiornare:** Card/Offer Card, Button.
**Classification:** Figma-Reference — landing one-off, affiliate heavy.
**Priorità:** P2.
**Operational notes:**
- Disclosure affiliate obbligatorio in frame.
- Non tokenizzare come primitiva riutilizzabile.

---

## Pagina: Editorial
**Figma changes requested:** Articoli, guide, recensioni.
**Components da creare/aggiornare:** Card/Editorial Card, Avatar.
**Classification:** Figma-SoT — hero page #6.
**Priorità:** P1.
**Operational notes:**
- Layout lettura: colonna centrale max 720px.
- Byline autore con avatar e data.

---

## Pagina: Company / Chi siamo
**Figma changes requested:** Contenuto testuale, team, mission.
**Classification:** Figma-Reference — contenuto one-off.
**Priorità:** P2.
**Operational notes:** Snapshot leggero; layout variabile.

---

## Pagina: Login
**Figma changes requested:** Form email + password, link reset, social auth.
**Components da creare/aggiornare:** Input, Button.
**Classification:** Figma-Reference — form auth standard, codice guida.
**Priorità:** P2.
**Operational notes:**
- Stati errore validazione = Code-Only.
- Rappresentare default e disabled.

---

## Pagina: Signup
**Figma changes requested:** Form registrazione.
**Components da creare/aggiornare:** Input, Button.
**Classification:** Figma-Reference — form auth standard.
**Priorità:** P2.
**Operational notes:** Vedi Login.

---

## Pagina: Account
**Figma changes requested:** Dashboard utente, impostazioni, shortlist personale.
**Components da creare/aggiornare:** Tabs, Input, Button, Avatar.
**Classification:** Figma-Reference — funzionalità utente, codice guida.
**Priorità:** P2.
**Operational notes:** Snapshot leggero; layout tab-based.

---

## Pagina: Admin
**Figma changes requested:** Interfaccia amministrativa, tabelle dati.
**Classification:** Code-Only — admin backend, non serve rappresentazione Figma per review cross-team.
**Priorità:** n/a.
**Operational notes:** Nessun frame Figma richiesto.

---

## Pagina: Footer
**Figma changes requested:** Colonne link, newsletter, social, legal.
**Components da creare/aggiornare:** Input, Button, Icon.
**Classification:** Figma-SoT — componente condiviso, parte del design system.
**Priorità:** P1.
**Operational notes:**
- Disclosure affiliate in fondo, testo caption.
- Mobile: stack verticale.

---

## Pagina: Header / Navbar
**Figma changes requested:** Nav orizzontale, search, auth.
**Components da creare/aggiornare:** Header/Nav.
**Classification:** Figma-SoT — componente condiviso.
**Priorità:** P0.
**Operational notes:** Vedi REPORT_FIGMA_COMPONENTS_TO_CREATE.md.

---

## Pagina: Empty states
**Figma changes requested:** Stati vuoti per ogni sezione (shortlist, confronto, ricerca, discovery).
**Components da creare/aggiornare:** Nessuna primitiva dedicata; illustrazione + testo + CTA.
**Classification:** Figma-SoT — parte delle hero pages.
**Priorità:** P1.
**Operational notes:**
- Creare frame empty state per ogni hero page.
- Non usare colori tristi; mantenere brand voice.

---

## Pagina: Error states (404, 500)
**Figma changes requested:** Pagina errore con messaggio, illustrazione, CTA.
**Classification:** Figma-Reference — snapshot one-off.
**Priorità:** P2.
**Operational notes:**
- 404: link a Home, search.
- 500: messaggio generico, CTA retry.

---

## Riepilogo classificazione per pagina

| Pagina | Classificazione | Priorità | Note |
|--------|----------------|----------|------|
| Home | Figma-SoT | P0 | Hero page |
| Hero (landing) | Figma-Reference | P2 | One-off |
| Intro | Figma-Reference | P2 | One-off |
| Catalogo | Figma-SoT | P0 | Parte di Discovery |
| Radar | Both Figma + Code | P1 | Struttura in Figma, logica in code |
| Search / Cerca | Figma-Reference | P2 | Riusa Discovery |
| Tool Detail | Figma-SoT | P0 | Hero page #1 |
| Wishlist / Salvati | Figma-SoT | P1 | Hero page |
| Compare / Arena | Figma-SoT | P1 | Hero page |
| Suggerisci Tool | Figma-Reference | P2 | Form one-off |
| Collection | Figma-Reference | P2 | Riusa Discovery |
| Discover | Figma-SoT | P0 | Hero page #2 |
| Gigs | Figma-Reference | P2 | Niche |
| Shop / Offers | Figma-Reference | P2 | Affiliate one-off |
| Editorial | Figma-SoT | P1 | Hero page |
| Company / Chi siamo | Figma-Reference | P2 | Content one-off |
| Login | Figma-Reference | P2 | Auth form |
| Signup | Figma-Reference | P2 | Auth form |
| Account | Figma-Reference | P2 | User dashboard |
| Admin | Code-Only | n/a | Backend |
| Footer | Figma-SoT | P1 | Componente condiviso |
| Header / Navbar | Figma-SoT | P0 | Componente condiviso |
| Empty states | Figma-SoT | P1 | Parte hero pages |
| Error states | Figma-Reference | P2 | Snapshot |

---

**RICHIESTA NON APPLICATA — documentata solo per handoff Figma. Nessuna modifica codice eseguita.**

---

*Fine del report page-by-page.*
