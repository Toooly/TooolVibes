# Design — Tool Battle refinement

**Data:** 2026-07-04  
**Scope:** mobile e desktop. Solo rifinitura grafica, layout, background e leggibilità. Nessuna modifica alla logica di gameplay o scoring.  
**Goal:** Trasformare la sezione Tool Battle da una composizione caotica/animata in un’arena game credibile, ordinata e leggibile, mantenendo l’identità spaziale/arcade di TooolVibes.

---

## Direzione scelta

**Arena HUD coerente — approccio game/arcade forte ma ordinato.**

Si mantiene la metafora dello scontro, ma si riduce il rumore visivo: sfondo unico, fighter come avatar identitari, HUD chiaro, CTA pulito, matrix leggibile. Si aggiunge un layout desktop dedicato a due colonne.

I veri personaggi di videogioco (forme, armi, poteri diversi per categoria) sono rimandati a un passo successivo; in questo intervento si prepara il componente `ToolFighter` come slot estensibile.

---

## Audit dei problemi chiave (riassunto)

- **Background patchwork**: hero, arena e footer usano gradienti diversi e non comunicanti.
- **Eccesso di layer decorativi**: orbs, anelli, raggi, nuvole, fulmini, aure tutti animati contemporaneamente.
- **Fighter troppo complessi**: sprite corpo-mani-spada-scudo rendono il logo illeggibile.
- **Sovrapposizioni**: footer fisso coperto dalla bottom nav mobile; fighter sovrapposti al CTA.
- **Readability bassa**: nomi tool piccoli e troncati, score poco gerarchico, matrix poco contrastata.
- **Matrix senza affordance**: scroll orizzontale nascosto.
- **No desktop view**: la pagina renderizza solo il componente mobile.
- **Reduced motion incompleto**: alcune animazioni CSS rispettano il setting, ma non tutte.

---

## Design

### 1. Struttura e layout

#### Componenti

| Componente | Responsabilità |
|------------|----------------|
| `ToolBattleView` *(nuovo)* | Orchestratore responsive: sceglie `MobileCompareView` o `DesktopCompareView` tramite `useIsMobile`. |
| `MobileCompareView` *(refactor)* | Arena verticale per mobile: HUD, griglia fighter, CTA, matrix. |
| `DesktopCompareView` *(nuovo)* | Layout a due colonne per desktop: arena a sinistra, dati/matrix a destra. |
| `ToolFighter` *(nuovo)* | Avatar fighter estensibile. Per ora variante `default` (orb + base). Slot per future varianti per categoria. |
| `Compare3DHero` *(modifica)* | Hero pagina compare alleggerito: header testuale/grafico al posto del canvas 3D. |

#### Layout mobile

1. Hero compare (leggero, max 40vh).
2. Arena stage:
   - HUD in alto: titolo “Arena” + stato.
   - Griglia fighter (2-5 tool) disposti in semicerchio/piramide.
   - Barra salute e nome sotto ogni fighter.
   - CTA “Combatti” centrato.
3. Footer azioni fisso, sopra la bottom nav.
4. Matrix confronto scrollabile orizzontalmente con indicatore.

#### Layout desktop

- Due colonne:
  - **Sinistra (~60%)**: arena stage grande con HUD, fighter, CTA.
  - **Destra (~40%)**: scorecard, diff, matrix.
- Footer azioni integrato sotto l’arena, non fixed.

### 2. Stile visivo

#### Sfondo

- Colore base pagina `#06060E`.
- Gradiente radiale morbido `#0B0B18` → `#06060E` centrato sull’arena.
- Pavimento arena: linea/orizzonte sottile, opaca.
- Micro-stelle statiche (riutilizzare pattern hero mobile).
- Rimuovere overlay dotted/sheen e gradienti sparsi.

#### Hero pagina compare

- Titolo: “Tool Battle”
- Sottotitolo: “Metti i tool sul ring e scegli il vincitore.”
- Niente canvas 3D pesante.

#### ToolFighter (variante default)

- Base/platform sottile sotto l’orb.
- Orb con logo del tool, bordo colorato con accent tool.
- Glow leggero su fighter attivo/vincitore.
- Nome tool leggibile (max 2 righe), barra salute sottile, punteggio.
- Prop `variant?: string` per future classi/arma/poteri.

#### HUD

- Titolo “Arena” in alto a sinistra, bold.
- Stato in pill: “Pronti”, “Scontro…”, “Vincitore: [Nome]”.

#### Score e diff

- Score numerico grande, tabular, bianco.
- Diff vs #1 come badge piccolo `+n` / `-n`.
- Rank in piccolo orb.

#### CTA “Combatti”

- Grande, `rounded-full`, colore brand (viola/ciano), testo bianco.
- Glow morbido su hover/active.
- Stato disabled durante lo scontro con label “In corso…”.

#### Matrix

- Celle: sfondo `rgba(255,255,255,0.05)`, bordi `rgba(255,255,255,0.08)`.
- Header sticky con offset per header sito.
- Testo chiaro e contrastato.
- Indicatore scroll orizzontale (fade/freccia) su mobile.
- Rimuovere il doppio label “Punti forti”.

### 3. Interazioni e stati

**Stati**: `idle` → `fighting` → `result`.

- **Idle**: fighter pulse soft, CTA attivo.
- **Fighting**: CTA disabled, fighter shake breve, flash al centro, numeri aggiornati.
- **Result**: glow vincitore, badge “Vincitore”, CTA diventa “Riguarda” / “Nuovo scontro”, confetti ridotto.

**Reduced motion**
- Se `prefers-reduced-motion: reduce`: niente shake, flash, confetti; transizioni istantanee.

### 4. Responsive

- Breakpoint `md` (768 px) per passare al layout desktop.
- Mobile: colonna unica.
- Desktop: due colonne.

---

## Implementazione

### File coinvolti

- `components/tools/tool-battle-view.tsx` *(nuovo)*
- `components/tools/desktop-compare-view.tsx` *(nuovo)*
- `components/tools/tool-fighter.tsx` *(nuovo)*
- `components/tools/mobile-compare-view.tsx` *(modifica)*
- `components/3d-maestoso/compare-3d-hero.tsx` *(modifica)*
- `app/(marketing)/compare/page.tsx` *(modifica)*
- `styles/compare.css` *(modifica)*
- `styles/vibes-3d-maestoso.css` *(modifica)*

### Strategia

1. Creare `ToolFighter` con variante `default` e prop `variant` per future estensioni.
2. Creare `ToolBattleView` come wrapper responsive.
3. Refactor `MobileCompareView`: nuova arena, footer corretto, matrix con scroll indicator, usa `ToolFighter`.
4. Creare `DesktopCompareView` con layout a due colonne.
5. Sostituire `Compare3DHero` con hero testuale leggero.
6. Aggiornare `page.tsx` per usare `ToolBattleView`.
7. Pulire `compare.css`: rimuovere stili obsoleti/caotici, aggiungere nuove classi.
8. Allineare sfondo in `vibes-3d-maestoso.css` se necessario.

### Isolamento

- Nessuna modifica a `lib/gamification/battle-engine.ts`, `use-arena-battle.ts`, `actions.ts`.
- Nessun impatto su backend, login, Supabase, routing, API.
- Componenti gamification unused (`ArenaBattleStage`, etc.) non toccati.

---

## Acceptance criteria

- [ ] Sfondo `/compare` coerente dall’hero al footer, senza patchwork.
- [ ] Layout mobile senza sovrapposizioni tra footer, bottom nav e contenuti.
- [ ] Fighter visivamente più ordinati (avatar identitario, non sprite caotico).
- [ ] Nomi tool leggibili, score gerarchico, matrix contrastata.
- [ ] Matrix scrollabile orizzontale con indicatore visivo su mobile.
- [ ] Layout desktop a due colonne funzionante.
- [ ] Animazioni leggere e stato-driven; reduced motion supportato.
- [ ] Build, lint e test passano.

---

## Riferimenti

- `app/(marketing)/compare/page.tsx`
- `components/tools/mobile-compare-view.tsx`
- `components/3d-maestoso/compare-3d-hero.tsx`
- `styles/compare.css`
- `styles/vibes-3d-maestoso.css`
- `docs/superpowers/specs/2026-06-08-tooolvibes-gamification-design.md`
