# REPORT FIGMA — Master Handoff

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  
> **Data:** 2026-01-12  
> **Progetto:** TooolVibes  

---

## 1. Panoramica Generale

Il progetto TooolVibes ha spedito codice senza un sistema Figma-first. Questo report definisce il piano di estrazione Figma secondo il framework `FIGMA_HANDOFF_FRAMEWORK.md`: cosa diventa **Figma-SoT** (Source of Truth), cosa resta **Figma-Reference** (snapshot), cosa è **Code-Only**.

---

## 2. File .md letti (fonte unica)

I seguenti 4 file sono stati letti e usati come unica fonte per questi report:

1. `figma_handoff_specialist.md` — Definizione agente, responsabilità, output format.
2. `FIGMA_HANDOFF_FRAMEWORK.md` — Decision tree, classificazione, token naming, handoff workflow.
3. `figma_component_checklist.md` — Checklist per token, primitive, hero pages.
4. `05_figma_extraction_plan.md` — Prompt e struttura del piano di estrazione.

---

## 3. Obiettivo dei report

Produrre 11 documenti operativi che un designer Figma possa usare domani senza ulteriore input per:
- Costruire il design system tokenizzato.
- Creare le primitive Figma-SoT.
- Costruire le 7 hero pages in 3 viewport.
- Mantenere la coerenza Figma ↔ codice tramite three-way reconciliation.

---

## 4. Struttura consigliata del file Figma

```
Tooolvibes Design System
├── Cover
├── 00 — Tokens (Figma Variables)
│   ├── Color
│   ├── Typography
│   ├── Spacing
│   ├── Radius
│   ├── Elevation
│   └── Motion
├── 01 — Primitives (Figma-SoT)
│   ├── Buttons
│   ├── Badges
│   ├── Cards
│   ├── Inputs
│   ├── Modal / Sheet
│   └── Tooltip / Toast
├── 02 — Components (composed)
│   ├── Tool Card
│   ├── Editorial Card
│   ├── Compare Row
│   ├── Header / Nav
│   └── Footer
├── 03 — Pages (Figma-SoT hero pages)
│   ├── Tool Detail
│   ├── Discovery
│   ├── Home
│   ├── Compare
│   ├── Shortlist
│   ├── Editorial article
│   └── Service
├── 04 — Patterns
│   ├── Empty states
│   ├── Loading states
│   └── Error states
└── 99 — Snapshots (Figma-Reference only)
    ├── /shop
    ├── /404
    └── /account
```

---

## 5. Ordine consigliato di modifica in Figma

| Fase | Contenuto | Dipendenze |
|------|-----------|------------|
| 1 | Token (color, type, space, radius, elevation, motion) | Nessuna |
| 2 | Primitive (Button, Badge, Card, Input, Tooltip, Modal, BottomSheet, Toast, Avatar, Tabs, Accordion) | Token pronti |
| 3 | Componenti compositi (Tool Card, Editorial Card, Compare Row, Header/Nav, Footer) | Primitive pronte |
| 4 | Hero pages — Tool Detail | Primitive + compositi |
| 5 | Hero pages — Discovery, Home, Compare, Shortlist, Editorial, Service | Tool Detail come riferimento |
| 6 | Reference snapshots (404, Shop, About, Affiliate) | Dopo ogni release |
| 7 | Prototype flows | Dopo hero pages stabilizzate |
| 8 | QA finale e handoff | Tutto sopra |

---

## 6. Principali priorità

1. **Token prima di tutto.** Nessuna primitiva può essere dichiarata Figma-SoT se i token non sono bound.
2. **Tool Detail è la pagina più importante.** È la più visitata e più editoriale; la sua struttura guida tutte le altre.
3. **Mobile 375px prima del desktop.** Se la struttura mobile non regge, il desktop è solo un wrapper.
4. **Naming convention §5-bis è vincolante.** Ogni deviazione va segnalata come `HANDOFF → design_system_architect`.
5. **Drift detection settimanale.** Un file Figma inattivo per 6 mesi è peggio che nessun Figma.

---

## 7. Elementi da portare in Figma (Figma-SoT)

### Token (tutti)
- Color: background, surface, ink (primary/secondary/muted), accent (primary/hover/pressed), status (success/warning/danger/info), focus ring.
- Typography: UI family (Inter 400/500/600), Display family (GT Sectra o Fraunces), size scale, line-heights, tracking.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128.
- Radius: sm / md / lg / pill.
- Elevation: rest / raised / modal.
- Motion: duration fast/base/slow, easing standard/emphasis.

### Primitive (11 componenti)
- Button, Badge, Card (Tool/Editorial/Offer), Input, Tooltip, Modal, BottomSheet, Toast, Avatar, Tabs, Accordion.

### Hero Pages (7 pagine)
1. Tool Detail
2. Tool Discovery
3. Home
4. Compare
5. Shortlist
6. Editorial article
7. Service

---

## 8. Elementi da NON portare in Figma (Code-Only)

- Microcopy e testi dinamici.
- Timing di animazione hover/focus/transizioni.
- Skeleton di loading specifici per singola rotta.
- Coreografia animazioni per surface.
- Focus-ring customizzati per rotta.
- Messaggi di validazione form.
- Logica dinamica del Radar (struttura visiva in Figma, logica in codice).

---

## 9. Rischi di incoerenza Figma/codice

| Rischio | Livello | Mitigazione |
|---------|---------|-------------|
| Token non bound (valori liberi in Figma) | **Alto** | Checklist §1: rifiutare ogni hex/px libero |
| Naming drift (es. `violet-500` invece di `accent.primary`) | **Alto** | Regola §5-bis: nomi semantici, mai visuali |
| Figma-SoT senza code counterpart | **Alto** | Ogni primitiva deve linkare a `components/ui/<Nome>.tsx` |
| Componente in codice ma non in Figma-SoT | **Medio** | Documentato in `REPORT_FIGMA_COMPONENTS_TO_UPDATE.md` |
| Hero page non in 3 viewport | **Medio** | Accettazione: mobile 375, tablet 768, desktop 1280 |
| Drift non gestito | **Medio** | Reconciliation settimanale Figma ↔ token-source ↔ code |
| Dark/light theme non confermato | **Basso** | Domanda aperta in `REPORT_FIGMA_OPEN_QUESTIONS.md` |

---

## 10. Handoff ad altri specialisti

Per i seguenti item, il compito del `figma_handoff_specialist` si ferma e il finding viene passato:

- Visual hierarchy / typography / color drift → `HANDOFF → visual_design_director`
- Token / primitive inconsistencies → `HANDOFF → design_system_architect`
- Mobile-only Figma gaps → `HANDOFF → mobile_ui_specialist`
- Code-side drift (shipped code diverso da Figma) → `HANDOFF → frontend_implementation_reviewer`
- Trust / dark-pattern concerns → `HANDOFF → conversion_and_trust_reviewer`
- Save / Compare flow mapping → `HANDOFF → ux_flow_auditor`

---

## 11. Conferma operativa

**RICHIESTA NON APPLICATA — documentata solo per handoff Figma. Nessuna modifica codice eseguita.**

- Nessun file di codice è stato modificato.
- Nessun componente React è stato alterato.
- Nessun file CSS/Tailwind è stato toccato.
- Nessuna configurazione è stata cambiata.
- Nessun commit è stato eseguito.
- Nessun push è stato eseguito.
- Nessun deploy è stato eseguito.
- Tutte le modifiche/richieste sono documentate esclusivamente nei report Markdown per il team Figma.

---

*Fine del report master.*
