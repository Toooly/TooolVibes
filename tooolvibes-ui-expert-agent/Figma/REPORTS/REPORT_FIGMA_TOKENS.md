# REPORT FIGMA — Tokens

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## Naming Convention Mapping (§5-bis)

Ogni token deve mappare 1:1 tra Figma Variables, CSS variables e Tailwind keys.

| Concetto | Figma Variable | CSS variable | Tailwind key |
|----------|---------------|--------------|--------------|
| Background base | `color/bg/base` | `--color-bg-base` | `bg.base` |
| Surface raised | `color/surface/raised` | `--color-surface-raised` | `surface.raised` |
| Ink primary | `color/ink/primary` | `--color-ink-primary` | `ink.primary` |
| Ink secondary | `color/ink/secondary` | `--color-ink-secondary` | `ink.secondary` |
| Ink muted | `color/ink/muted` | `--color-ink-muted` | `ink.muted` |
| Accent primary | `color/accent/primary` | `--color-accent-primary` | `accent.primary` |
| Accent hover | `color/accent/hover` | `--color-accent-hover` | `accent.hover` |
| Accent pressed | `color/accent/pressed` | `--color-accent-pressed` | `accent.pressed` |
| Success | `color/status/success` | `--color-status-success` | `status.success` |
| Warning | `color/status/warning` | `--color-status-warning` | `status.warning` |
| Danger | `color/status/danger` | `--color-status-danger` | `status.danger` |
| Info | `color/status/info` | `--color-status-info` | `status.info` |
| Focus ring | `color/focus/ring` | `--color-focus-ring` | `focus.ring` |
| Space-3 | `space/3` | `--space-3` | `space.3` |
| Radius md | `radius/md` | `--radius-md` | `radius.md` |
| Elevation raised | `elevation/raised` | `--elevation-raised` | `elevation.raised` |
| Duration fast | `motion/duration/fast` | `--motion-duration-fast` | `motion.duration.fast` |

**Regole vincolanti:**
1. Lowercase, slash-separated in Figma; dash-separated in CSS.
2. Semantico, mai visuale (`accent.primary` ✅, `violet.500` ❌).
3. Ruolo prima, poi stato (`ink.primary`, `ink.muted`).
4. Nessun `#`, `px`, `kg` nei nomi token.
5. Un token = un valore. Modalità dark/light gestita via Figma Modes / CSS `data-theme`.
6. Vietato usare valori liberi in Figma: ogni hex deve avere un token.

---

## Token: color/bg/base
**Categoria:** Color — Background  
**Uso previsto:** Sfondo pagina di default, canvas dell'app.  
**Dove applicarlo in Figma:** Variabile `color/bg/base`, applicata a tutti i frame pagina in modalità default.  
**Dove si vede nel progetto:** Ogni pagina TooolVibes (Home, Discovery, Tool Detail, etc.).  
**Classificazione:** Figma-SoT  
**Priorità:** P0 — bloccante per ogni altra primitiva.  
**Note handoff:** Deve esistere in entrambe le modalità light/dark se il tema dark è confermato. Se il progetto usa un Tailwind theme esistente con nomi diversi, aggiungere uno shim di traduzione e segnalare migration backlog P1.

---

## Token: color/surface/raised
**Categoria:** Color — Surface  
**Uso previsto:** Card, modal, dropdown, ogni elemento che galleggia sopra il background base.  
**Dove applicarlo in Figma:** Variabile `color/surface/raised`, usata in Card, Modal, BottomSheet, Toast.  
**Dove si vede nel progetto:** Tool Card, Editorial Card, Offer Card, Compare Row, modali.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Differenziare da `color/bg/base` per garantire leggibilità in overlay. Verificare contrasto WCAG AA contro `ink.primary`.

---

## Token: color/ink/primary
**Categoria:** Color — Ink (testo)  
**Uso previsto:** Testo principale, titoli, label primarie.  
**Dove applicarlo in Figma:** Variabile `color/ink/primary`, usata in tutti i testi heading e body principali.  
**Dove si vede nel progetto:** Titoli Tool Detail, descrizioni, label input, badge testo.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Contrasto minimo 4.5:1 su `color/bg/base` e `color/surface/raised`.

---

## Token: color/ink/secondary
**Categoria:** Color — Ink (testo)  
**Uso previsto:** Testo secondario, sottotitoli, meta-informazioni.  
**Dove applicarlo in Figma:** Variabile `color/ink/secondary`, usata per byline editoriali, timestamp, breadcrumb.  
**Dove si vede nel progetto:** Autore articolo editorial, data recensione, breadcrumb navigazione.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Non usare per testo disabilitato (usare `ink/muted`).

---

## Token: color/ink/muted
**Categoria:** Color — Ink (testo)  
**Uso previsto:** Placeholder, testo disabilitato, caption, meta-info di bassa priorità.  
**Dove applicarlo in Figma:** Variabile `color/ink/muted`, usata in placeholder input, caption, testo disabilitato.  
**Dove si vede nel progetto:** Placeholder search bar, caption form, stati disabilitati.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Contrasto minimo 3:1 su sfondo base (AA per large text, non richiesto per caption molto piccole ma preferibile).

---

## Token: color/accent/primary
**Categoria:** Color — Accent  
**Uso previsto:** CTA primari, link principali, indicatori di selezione, badge accent.  
**Dove applicarlo in Figma:** Variabile `color/accent/primary`, usata in Button/Primary, link attivi, badge accent, icona salvataggio attiva.  
**Dove si vede nel progetto:** Bottone "Confronta", "Salva", link "Scopri di più", badge "Editor's Choice".  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** `HANDOFF → visual_design_director`: confermare hue esatto dell'accento (attualmente non specificato nei file sorgente). Verificare contrasto 4.5:1 su sfondo bianco/chiaro.

---

## Token: color/accent/hover
**Categoria:** Color — Accent  
**Uso previsto:** Stato hover dei CTA primari.  
**Dove applicarlo in Figma:** Variabile `color/accent/hover`, usata in stato hover di Button/Primary e link.  
**Dove si vede nel progetto:** Hover su "Salva", "Confronta", link navigazione.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Non applicare manualmente darken/lighten; il valore deve essere un token esplicito.

---

## Token: color/accent/pressed
**Categoria:** Color — Accent  
**Uso previsto:** Stato active/pressed dei CTA primari.  
**Dove applicarlo in Figma:** Variabile `color/accent/pressed`, usata in stato pressed di Button/Primary.  
**Dove si vede nel progetto:** Click attivo su button primary.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Distinguere da hover per feedback tattile chiaro.

---

## Token: color/status/success
**Categoria:** Color — Status  
**Uso previsto:** Conferme, stati positivi, toast di successo.  
**Dove applicarlo in Figma:** Variabile `color/status/success`, usata in Badge/Success, Toast/Success, messaggi conferma.  
**Dove si vede nel progetto:** Conferma salvataggio tool, messaggio "Tool aggiunto alla shortlist".  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Non usare come colore accent principale.

---

## Token: color/status/warning
**Categoria:** Color — Status  
**Uso previsto:** Avvisi, azioni che richiedono attenzione.  
**Dove applicarlo in Figma:** Variabile `color/status/warning`, usata in Badge/Warning, Toast/Warning.  
**Dove si vede nel progetto:** Alert "Login richiesto per salvare", avvisi form.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Verificare accessibilità per utenti con protanopia (rosso/verde).

---

## Token: color/status/danger
**Categoria:** Color — Status  
**Uso previsto:** Errori, azioni distruttive, rimozione dati.  
**Dove applicarlo in Figma:** Variabile `color/status/danger`, usata in Button/Destructive, Badge/Danger, Toast/Error, messaggi validazione.  
**Dove si vede nel progetto:** Bottone "Rimuovi dalla shortlist", "Elimina account", errori form.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Distinguere semanticamente da warning; danger = irreversibile.

---

## Token: color/status/info
**Categoria:** Color — Status  
**Uso previsto:** Informazioni neutre, tooltip informativi.  
**Dove applicarlo in Figma:** Variabile `color/status/info`, usata in Badge/Info, Toast/Info.  
**Dove si vede nel progetto:** Tooltip "Come funziona il confronto", info box editorial.  
**Classificazione:** Figma-SoT  
**Priorità:** P2  
**Note handoff:** Spesso dimenticato; includere per completezza status.

---

## Token: color/focus/ring
**Categoria:** Color — Accessibility  
**Uso previsto:** Anello di focus visibile per navigazione tastiera e accessibilità.  
**Dove applicarlo in Figma:** Variabile `color/focus/ring`, usata in stato focus di Button, Input, Link, Card cliccabili.  
**Dove si vede nel progetto:** Ogni elemento interattivo focusable.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Separato da accent; spesso l'accento non ha contrasto sufficiente su tutti gli sfondi. `HANDOFF → design_system_architect` se il codice usa un diverso colore focus.

---

## Token: font/ui/family
**Categoria:** Typography — UI  
**Uso previsto:** Tutto il testo UI: bottoni, label, input, navigazione, badge.  
**Dove applicarlo in Figma:** Stile testo `font/ui/family`, default Inter.  
**Dove si vede nel progetto:** Ogni elemento UI tranne heading editoriali.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Pesi richiesti: 400, 500, 600. Verificare che il font sia caricato nel progetto.

---

## Token: font/ui/weight/400
**Categoria:** Typography — UI Weight  
**Uso previsto:** Body text, descrizioni, placeholder.  
**Dove applicarlo in Figma:** Stile testo con weight 400.  
**Dove si vede nel progetto:** Paragrafi descrizione tool, testo card.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Mappare esplicitamente; non usare "Regular" generico.

---

## Token: font/ui/weight/500
**Categoria:** Typography — UI Weight  
**Uso previsto:** Label, button text, nav item, tab attiva.  
**Dove applicarlo in Figma:** Stile testo con weight 500.  
**Dove si vede nel progetto:** Label form, testo button, tab attiva.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Distinguere da 400 per gerarchia chiara.

---

## Token: font/ui/weight/600
**Categoria:** Typography — UI Weight  
**Uso previsto:** Button primary, header nav active, badge bold, emphasis inline.  
**Dove applicarlo in Figma:** Stile testo con weight 600.  
**Dove si vede nel progetto:** Button CTA primario, nav item attivo.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Non usare per heading display (usare display family).

---

## Token: font/display/family
**Categoria:** Typography — Display  
**Uso previsto:** Heading editoriali, titoli hero, titoli articoli.  
**Dove applicarlo in Figma:** Stile testo `font/display/family`, default GT Sectra o Fraunces.  
**Dove si vede nel progetto:** Titolo Tool Detail, titolo Home hero, titolo articolo editorial.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** `HANDOFF → visual_design_director`: confermare scelta finale tra GT Sectra e Fraunces. Pesi: 400 e 600 (o 400 only).

---

## Token: type/size/caption
**Categoria:** Typography — Size Scale  
**Uso previsto:** Caption, meta-info, footnote.  
**Dove applicarlo in Figma:** Stile testo caption.  
**Dove si vede nel progetto:** Timestamp, crediti, disclaimer affiliate.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Valore tipico ~12px/0.75rem, line-height tight.

---

## Token: type/size/body
**Categoria:** Typography — Size Scale  
**Uso previsto:** Corpo testo principale.  
**Dove applicarlo in Figma:** Stile testo body.  
**Dove si vede nel progetto:** Descrizioni tool, paragrafi editoriali.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Valore tipico ~16px/1rem, line-height normal.

---

## Token: type/size/lead
**Categoria:** Typography — Size Scale  
**Uso previsto:** Intro/lead paragraph, testo evidenziato.  
**Dove applicarlo in Figma:** Stile testo lead.  
**Dove si vede nel progetto:** Sottotitolo hero Home, abstract articolo.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Valore tipico ~18-20px, line-height normal/loose.

---

## Token: type/size/h3
**Categoria:** Typography — Size Scale  
**Uso previsto:** Sezione heading, card title.  
**Dove applicarlo in Figma:** Stile testo h3.  
**Dove si vede nel progetto:** Titolo sezione "Recensione", titolo card tool.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Valore tipico ~20-24px.

---

## Token: type/size/h2
**Categoria:** Typography — Size Scale  
**Uso previsto:** Page section heading.  
**Dove applicarlo in Figma:** Stile testo h2.  
**Dove si vede nel progetto:** "Scopri i tool", "Tool simili".  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Valore tipico ~28-32px.

---

## Token: type/size/h1
**Categoria:** Typography — Size Scale  
**Uso previsto:** Page title (non hero).  
**Dove applicarlo in Figma:** Stile testo h1.  
**Dove si vede nel progetto:** Titolo pagina "Il nostro approccio" (Company).  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Valore tipico ~36-40px.

---

## Token: type/size/display
**Categoria:** Typography — Size Scale  
**Uso previsto:** Hero title, mega-heading.  
**Dove applicarlo in Figma:** Stile testo display.  
**Dove si vede nel progetto:** Titolo hero Home, titolo hero Tool Detail (editoriale).  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Valore tipico ~48-64px, line-height tight, tracking tight.

---

## Token: type/line-height/tight
**Categoria:** Typography — Line Height  
**Uso previsto:** Heading, display, badge.  
**Dove applicarlo in Figma:** Line-height 1.1–1.2.  
**Dove si vede nel progetto:** Titoli, display text.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Non usare per body text (troppo stretto).

---

## Token: type/line-height/normal
**Categoria:** Typography — Line Height  
**Uso previsto:** Body text, lead.  
**Dove applicarlo in Figma:** Line-height 1.5–1.6.  
**Dove si vede nel progetto:** Paragrafi, descrizioni.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Standard per leggibilità.

---

## Token: type/line-height/loose
**Categoria:** Typography — Line Height  
**Uso previsto:** Editorial long-form, articoli.  
**Dove applicarlo in Figma:** Line-height 1.7–1.8.  
**Dove si vede nel progetto:** Articoli editoriali, blog post.  
**Classificazione:** Figma-SoT  
**Priorità:** P2  
**Note handoff:** Evitare in UI compatta.

---

## Token: type/tracking/tight
**Categoria:** Typography — Tracking  
**Uso previsto:** Display, large headings.  
**Dove applicarlo in Figma:** Letter-spacing -0.02em.  
**Dove si vede nel progetto:** Titolo hero.  
**Classificazione:** Figma-SoT  
**Priorità:** P2  
**Note handoff:** Usare con cautela sui piccoli size.

---

## Token: type/tracking/default
**Categoria:** Typography — Tracking  
**Uso previsto:** Default per tutto il testo.  
**Dove applicarlo in Figma:** Letter-spacing 0em.  
**Dove si vede nel progetto:** Maggior parte del testo.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Implicito se non specificato.

---

## Token: type/tracking/wide
**Categoria:** Typography — Tracking  
**Uso previsto:** Label uppercase, badge, caption all-caps.  
**Dove applicarlo in Figma:** Letter-spacing 0.05em–0.1em.  
**Dove si vede nel progetto:** Label "CATEGORIA", badge testo maiuscolo.  
**Classificazione:** Figma-SoT  
**Priorità:** P2  
**Note handoff:** Abbinare sempre a uppercase per label.

---

## Token: space/1
**Categoria:** Spacing  
**Uso previsto:** Micro-gap, icona-testo stretto.  
**Dove applicarlo in Figma:** 4px.  
**Dove si vede nel progetto:** Gap icona-label in button sm.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Scala 4-based.

---

## Token: space/2
**Categoria:** Spacing  
**Uso previsto:** Piccolo padding interno.  
**Dove applicarlo in Figma:** 8px.  
**Dove si vede nel progetto:** Padding interno badge, gap tra elementi compatti.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:**

---

## Token: space/3
**Categoria:** Spacing  
**Uso previsto:** Gap standard componenti.  
**Dove applicarlo in Figma:** 12px.  
**Dove si vede nel progetto:** Gap tra icona e label in button md.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:**

---

## Token: space/4
**Categoria:** Spacing  
**Uso previsto:** Padding componente standard.  
**Dove applicarlo in Figma:** 16px.  
**Dove si vede nel progetto:** Padding card interno, padding input.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:**

---

## Token: space/6
**Categoria:** Spacing  
**Uso previsto:** Spazio tra sezioni interne.  
**Dove applicarlo in Figma:** 24px.  
**Dove si vede nel progetto:** Gap tra sezioni in Tool Detail.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:**

---

## Token: space/8
**Categoria:** Spacing  
**Uso previsto:** Spazio sezione-card.  
**Dove applicarlo in Figma:** 32px.  
**Dove si vede nel progetto:** Gap tra card in grid, margini sezione.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:**

---

## Token: space/12
**Categoria:** Spacing  
**Uso previsto:** Spazio tra sezioni pagina.  
**Dove applicarlo in Figma:** 48px.  
**Dove si vede nel progetto:** Spazio tra hero e contenuto in Home.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:**

---

## Token: space/16
**Categoria:** Spacing  
**Uso previsto:** Grande spazio sezione.  
**Dove applicarlo in Figma:** 64px.  
**Dove si vede nel progetto:** Spazio tra blocchi editoriali.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:**

---

## Token: space/24
**Categoria:** Spacing  
**Uso previsto:** Spazio hero/sezione.  
**Dove applicarlo in Figma:** 96px.  
**Dove si vede nel progetto:** Padding verticale sezione hero.  
**Classificazione:** Figma-SoT  
**Priorità:** P2  
**Note handoff:**

---

## Token: space/32
**Categoria:** Spacing  
**Uso previsto:** Spazio massimo pagina.  
**Dove applicarlo in Figma:** 128px.  
**Dove si vede nel progetto:** Raramente, solo in landing editoriali.  
**Classificazione:** Figma-SoT  
**Priorità:** P2  
**Note handoff:**

---

## Token: radius/sm
**Categoria:** Radius  
**Uso previsto:** Piccoli elementi: badge, tag, chip.  
**Dove applicarlo in Figma:** ~6px.  
**Dove si vede nel progetto:** Badge, tag categoria.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:**

---

## Token: radius/md
**Categoria:** Radius  
**Uso previsto:** Componenti standard: button, input, card.  
**Dove applicarlo in Figma:** ~10px.  
**Dove si vede nel progetto:** Button, input, card.  
**Classificazione:** Figma-SoT  
**Priorità:** P0  
**Note handoff:** Valore più usato; verificare coerenza con codice esistente.

---

## Token: radius/lg
**Categoria:** Radius  
**Uso previsto:** Modali, bottom sheet, pannelli grandi.  
**Dove applicarlo in Figma:** ~16px.  
**Dove si vede nel progetto:** Modal, bottom sheet.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:**

---

## Token: radius/pill
**Categoria:** Radius  
**Uso previsto:** Button pill, chip selezionabili, avatar.  
**Dove applicarlo in Figma:** 999px.  
**Dove si vede nel progetto:** Button "Scopri di più" pill, avatar.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Non usare per card o modal (sembra un bug visivo).

---

## Token: elevation/rest
**Categoria:** Elevation  
**Uso previsto:** Stato default di un elemento senza interazione.  
**Dove applicarlo in Figma:** Ombra/elevation minima o assente.  
**Dove si vede nel progetto:** Card a riposo, button a riposo.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Definire se è `none` o `0 1px 2px rgba(0,0,0,0.05)`.

---

## Token: elevation/raised
**Categoria:** Elevation  
**Uso previsto:** Card hover, dropdown aperto.  
**Dove applicarlo in Figma:** Ombra media.  
**Dove si vede nel progetto:** Hover su Tool Card, menu aperto.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  
**Note handoff:** Differenziare visivamente da `rest`.

---

## Token: elevation/modal
**Categoria:** Elevation  
**Uso previsto:** Modal, bottom sheet, toast (overlay).  
**Dove applicarlo in Figma:** Ombra forte + backdrop.  
**Dove si vede nel progetto:** Modal confronto, bottom sheet filtri mobile.  
**Classificazione:** Figma-SoT  
**Priorità:** P1  **Note handoff:** Includere backdrop opacity separato (es. `bg-black/50`).

---

## Token: motion/duration/fast
**Categoria:** Motion  
**Uso previsto:** Micro-interazioni: hover color, focus ring.  
**Dove applicarlo in Figma:** 120ms.  
**Dove si vede nel progetto:** Hover button, focus input.  
**Classificazione:** Code-Only  
**Priorità:** P2  
**Note handoff:** Documentare in Figma come annotazione, ma il valore esatto vive in codice. Figma non gestisce durate native in modo robusto.

---

## Token: motion/duration/base
**Categoria:** Motion  
**Uso previsto:** Transizioni standard: apertura modal, toggle switch.  
**Dove applicarlo in Figma:** 180ms.  
**Dove si vede nel progetto:** Apertura modal, transizione tab.  
**Classificazione:** Code-Only  
**Priorità:** P2  
**Note handoff:**

---

## Token: motion/duration/slow
**Categoria:** Motion  
**Uso previsto:** Animazioni page-level, hero entrance.  
**Dove applicarlo in Figma:** 280ms.  
**Dove si vede nel progetto:** Animazione hero Home.  
**Classificazione:** Code-Only  
**Priorità:** P2  
**Note handoff:**

---

## Token: motion/easing/standard
**Categoria:** Motion  
**Uso previsto:** La maggior parte delle transizioni.  
**Dove applicarlo in Figma:** `cubic-bezier(.2,.0,.0,1)` annotato.  
**Dove si vede nel progetto:** Transizioni UI standard.  
**Classificazione:** Code-Only  
**Priorità:** P2  
**Note handoff:**

---

## Token: motion/easing/emphasis
**Categoria:** Motion  
**Uso previsto:** Transizioni che richiedono maggiore impatto.  
**Dove applicarlo in Figma:** `cubic-bezier(.4,.0,.2,1)` annotato.  
**Dove si vede nel progetto:** Apertura bottom sheet, toast entrance.  
**Classificazione:** Code-Only  
**Priorità:** P2  
**Note handoff:**

---

## Riepilogo Token

| Categoria | Token totali | P0 | P1 | P2 | Code-Only |
|-----------|-------------|----|----|----|-----------|
| Color | 12 | 5 | 6 | 1 | 0 |
| Typography — Family/Weight | 5 | 3 | 2 | 0 | 0 |
| Typography — Size | 7 | 1 | 5 | 1 | 0 |
| Typography — Line-height | 3 | 0 | 2 | 1 | 0 |
| Typography — Tracking | 3 | 0 | 1 | 2 | 0 |
| Spacing | 10 | 2 | 6 | 2 | 0 |
| Radius | 4 | 1 | 3 | 0 | 0 |
| Elevation | 3 | 0 | 3 | 0 | 0 |
| Motion | 5 | 0 | 0 | 0 | 5 |
| **Totale** | **52** | **12** | **30** | **7** | **5** |

---

## Token da creare
Tutti i token elencati sopra che non esistono ancora in Figma Variables. Priorità: P0 prima, poi P1.

## Token da correggere
- Se nel codebase esistono nomi tipo `violet-500`, `purple-blue`, `spacing-16px`: creare uno shim di traduzione e segnalare migration backlog P1. Non rinominare wholesale.
- Se il focus ring nel codice usa un colore diverso da quello proposto: `HANDOFF → design_system_architect`.

## Token da evitare
- Nomi visuali (`violet.500`, `blue-600`) → usare nomi semantici.
- Nomi con unità (`16px`, `1rem`) → usare scale astratte.
- Token dual-mode (`accent-light`, `accent-dark`) → usare Figma Modes / CSS `data-theme`.
- Valori liberi in Figma senza token corrispondente → automaticamente violazione spec.

---

*Fine del report tokens.*
