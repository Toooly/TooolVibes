# REPORT FIGMA — Implementation Priority

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## FASE 1 — Foundations e Token
**Cosa fare:**
- Creare pagina `02_Tokens` con tutte le Figma Variables: Color, Typography, Spacing, Radius, Elevation, Motion.
- Definire naming convention §5-bis (`color/bg/base`, `space/4`, etc.).
- Mappare ogni token al corrispettivo CSS variable e Tailwind key.
- Creare pagina `01_Foundations` con grid, breakpoint, principi accessibilità.

**Perché prima:** Senza token, ogni primitiva costruita dopo avrà valori liberi (hex/px) che violano il framework. È il gating item per tutto il resto.

**Dipendenze:** Nessuna.

**Rischio se skippata:** Drift immediato Figma/codice; impossibile bindare primitive; designer usa valori ad-hoc; reconciliation fallita.

**Output atteso:**
- Variabili Figma per tutti i token P0 e P1.
- Documento mapping Figma → CSS → Tailwind.

**Criterio di completamento:**
- [ ] Tutte le variabili `02_Tokens` create e nominate correttamente.
- [ ] Nessun valore libero nei frame successivi (verifica spot-check su 3 primitive di test).

---

## FASE 2 — Componenti primitivi
**Cosa fare:**
- Creare pagina `03_Primitives` con i 11 componenti: Button, Badge, Card (base), Input, Tooltip, Modal, BottomSheet, Toast, Avatar, Tabs, Accordion.
- Ogni primitiva: anatomy, variants, states, sizes, tokens used, code counterpart, do/don't.
- Priorità interna: Button → Input → Badge → Card → Modal → Tabs → Toast → Avatar → Tooltip → BottomSheet → Accordion.

**Perché dopo token:** Ogni primitiva deve bindarsi a variabili già esistenti. Costruire primitive prima dei token = rework garantito.

**Dipendenze:** FASE 1 completata.

**Rischio se skippata:** Primitive senza token = valori liberi = violazione §9 del framework. Hero pages costruite su fondamenta instabili.

**Output atteso:**
- 11 pagine primitive, ognuna con spec completa.
- Ogni variante usa solo token da `02_Tokens`.

**Criterio di completamento:**
- [ ] Tutte le primitive P0 hanno spec completa.
- [ ] Checklist `figma_component_checklist.md` §2 passata per ogni primitiva P0.

---

## FASE 3 — Componenti core TooolVibes
**Cosa fare:**
- Creare pagina `04_Components` con: Tool Card, Editorial Card, Compare Row, Header/Nav, Footer.
- Ogni componente: variants per viewport, stati, token binding.
- Tool Card è la più critica; costruirla per prima.

**Perché dopo primitive:** I componenti compositi sono istanze delle primitive + spaziatura. Senza primitive stabili, i compositi si slegano.

**Dipendenze:** FASE 2 completata.

**Rischio se skippata:** Card costruite da zero invece che da primitive = inconsistenze visive; header/nav diverso da button/badge usati altrove.

**Output atteso:**
- 5 componenti compositi con variants mobile/desktop.
- Tool Card con stato selected/hover/loading.

**Criterio di completamento:**
- [ ] Tool Card approvata da second reviewer.
- [ ] Header/Nav ha varianti scrolled/default/mobile.

---

## FASE 4 — Layout mobile
**Cosa fare:**
- Creare pagina `06_Pages_Mobile` con le 7 hero pages a 375px.
- Ordine: Tool Detail → Discovery → Home → Compare → Shortlist → Editorial → Service.
- Ogni pagina: stati default, empty, loading, error.

**Perché mobile prima di desktop:** Se il layout mobile non regge, il desktop è solo un wrapper più largo. Inoltre, vincoli più stretti (spazio, tap target) forzano decisioni di design che influenzano il desktop.

**Dipendenze:** FASE 3 completata.

**Rischio se skippata:** Desktop costruito prima = adattamento forzato e brutto a mobile; possibile necessità di rifare entrambi.

**Output atteso:**
- 7 frame mobile, ognuno con almeno 3 stati.
- Nessun overflow orizzontale; tap target 44px rispettato.

**Criterio di completamento:**
- [ ] Tool Detail mobile completa con tutti gli stati.
- [ ] Spot-check su 320px: nessun elemento tagliato.

---

## FASE 5 — Layout desktop
**Cosa fare:**
- Creare pagina `07_Pages_Desktop` con le 7 hero pages a 1280px.
- Riutilizzare la struttura contenuto dalle versioni mobile (stessi stati, stesse sezioni).
- Aggiungere varianti 1024px e 1440px per le pagine più critiche (Tool Detail, Discovery).

**Perché dopo mobile:** La struttura contenuto è già definita; si tratta solo di adattare il layout a più spazio.

**Dipendenze:** FASE 4 completata.

**Rischio se skippata:** Incertezza su come il contenuto si adatti; possibile inconsistenze tra mobile e desktop.

**Output atteso:**
- 7 frame desktop a 1280px.
- Container max-width definito; griglie card coerenti.

**Criterio di completamento:**
- [ ] Tool Detail desktop ha sidebar e 2-col layout.
- [ ] Line-length testo ≤75 caratteri.

---

## FASE 6 — Stati interattivi
**Cosa fare:**
- Aggiungere stati mancanti: hover, focus, disabled, loading, error, selected, saved.
- Aggiornare primitive e compositi con stati completi.
- Verificare che ogni stato sia bindato a token (es. `color/accent/hover`, `elevation/raised`).

**Perché dopo layout:** Gli stati devono applicarsi a layout già stabili; altrimenti le interazioni si sovrappongono a strutture in movimento.

**Dipendenze:** FASE 5 completata.

**Rischio se skippata:** Componenti senza stati = handoff incompleto; frontend dev deve indovinare gli stati = drift.

**Output atteso:**
- Ogni primitiva ha almeno rest/hover/focus/disabled.
- Button ha anche loading; Input ha error/valid.

**Criterio di completamento:**
- [ ] Checklist stati passata per tutte le primitive P0.
- [ ] Focus ring visibile su tutti gli elementi interattivi.

---

## FASE 7 — Prototype flow
**Cosa fare:**
- Creare pagina `08_Prototype_Flows` con flussi interattivi: Save→Shortlist, Compare Flow, Auth Flow.
- Collegare frame dalle pagine `06` e `07` con transizioni prototipo.
- Annotare decision points (es. "se non autenticato, redirect a login").

**Perché dopo stati:** I flussi prototipo dipendono da frame stabili e stati definiti.

**Dipendenze:** FASE 6 completata.

**Rischio se skippata:** Review cross-team senza prototipo = incomprensione dei flussi; errori UX scoperti tardi.

**Output atteso:**
- 3 flussi prototipo navigabili.
- Annotazioni su decision points e stati condizionali.

**Criterio di completamento:**
- [ ] Flow Save→Shortlist navigabile end-to-end.
- [ ] Annotazioni su stati condizionali presenti.

---

## FASE 8 — QA e handoff finale
**Cosa fare:**
- Eseguire checklist `figma_component_checklist.md` per ogni token, primitiva, hero page.
- Verificare three-way reconciliation: Figma Variables vs CSS variables vs Tailwind keys.
- Produrre handoff artifact per ogni primitiva e hero page (template §6 di FIGMA_HANDOFF_FRAMEWORK.md).
- Second human review su ogni Figma-SoT frame.
- Archiviare snapshot in `09_Archive`.

**Perché ultima:** QA senza asset completi è inutile.

**Dipendenze:** FASE 7 completata.

**Rischio se skippata:** Handoff a frontend con spec incomplete = implementazione errata; drift immediato.

**Output atteso:**
- Checklist firmata per ogni asset.
- Handoff artifact per ogni primitiva e hero page.
- Report reconciliation con eventuali mismatch documentati.

**Criterio di completamento:**
- [ ] Tutte le checkbox §10 di FIGMA_HANDOFF_FRAMEWORK.md tickate.
- [ ] Second reviewer ha firmato in commento Figma per ogni primitiva P0.
- [ ] Handoff artifact consegnato al frontend team.

---

## Timeline stimata

| Fase | Durata stimata | Cumulativo |
|------|---------------|------------|
| FASE 1 — Token | 2–3 giorni | 2–3 gg |
| FASE 2 — Primitive | 4–5 giorni | 6–8 gg |
| FASE 3 — Compositi | 3–4 giorni | 9–12 gg |
| FASE 4 — Mobile | 4–5 giorni | 13–17 gg |
| FASE 5 — Desktop | 3–4 giorni | 16–21 gg |
| FASE 6 — Stati | 2–3 giorni | 18–24 gg |
| FASE 7 — Prototype | 2 giorni | 20–26 gg |
| FASE 8 — QA Handoff | 2–3 giorni | 22–29 gg |

**Totale stimato:** 3–4 settimane per un designer dedicato.

---

**RICHIESTA NON APPLICATA — documentata solo per handoff Figma. Nessuna modifica codice eseguita.**

---

*Fine del report implementation priority.*
