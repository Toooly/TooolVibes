# Figma Implementation Report

Data: 2026-07-08
Branch: `main`
Commit/push: non eseguiti.

## Riepilogo implementazione

Questa fase introduce un primo layer Figma-to-code sicuro per TooolVibes: token CSS ufficiali, scope visuale dark premium, primitive aggiornate, pagina interna `/dev/design-system` e componenti preview per validare layout e stati senza riscrivere il sito.

Figma live non era piu accessibile per limite MCP del piano Starter. La replica e basata sui file locali `tooolvibes-design-handoff/*` e sui report `tooolvibes-ui-expert-agent/Figma/REPORTS/*`.

## Componenti creati

- `components/ui/avatar.tsx`: Avatar image/fallback con size `sm`, `md`, `lg`.
- `components/dev/figma-design-system-showcase.tsx`: tavola interna con token, primitive, compositi, radar e stati.
- `app/dev/design-system/page.tsx`: route interna non indicizzata.
- `styles/figma-implementation.css`: token e layer visivo Figma scoped.

## Componenti modificati

- `components/ui/button.tsx`: aggiunto stato `loading`, aria busy, spinner e token alignment.
- `components/ui/badge.tsx`: aggiunte varianti semantiche `neutral`, `accent`, `danger`.
- `components/ui/input.tsx`: altezza/padding/radius allineati alla primitiva Figma.
- `app/layout.tsx`: aggiunte font token `Inter` e `Fraunces` come CSS variables.
- `app/(marketing)/layout.tsx`: aggiunto scope `tv-figma-theme`.
- `app/globals.css`: import del nuovo stylesheet Figma.
- `middleware.ts`: aggiunta esclusione `dev-only` per `/dev/*`, cosi la pagina interna e accessibile in locale senza aprirla in produzione.

## Pagine aggiornate

- `/dev/design-system`: nuova pagina interna per QA token e componenti.
- Tutte le pagine sotto `app/(marketing)` ereditano lo scope `tv-figma-theme`, con override controllati per header, footer, bottoni, input, card, superfici, tool detail e focus ring.

## Mapping Figma -> codice

- Design tokens -> `styles/figma-implementation.css`
- Button -> `components/ui/button.tsx`
- Badge -> `components/ui/badge.tsx`
- Input -> `components/ui/input.tsx`
- Avatar -> `components/ui/avatar.tsx`
- Modal preview -> `/dev/design-system` static modal block
- BottomSheet / FilterSheet preview -> `/dev/design-system` static sheet block
- Toast preview -> `/dev/design-system` toast preview block
- ToolCard preview -> `ToolCardPreview` in `components/dev/figma-design-system-showcase.tsx`
- EditorialCard preview -> `EditorialCardPreview`
- CompareRow preview -> `CompareRowPreview`
- RadarPreview -> CSS/SVG-like HTML/CSS radar preview
- ShortlistCard preview -> `ShortlistCardPreview`

## Token implementati

- `--tv-bg-base`
- `--tv-surface-raised`
- `--tv-surface-elevated`
- `--tv-ink-primary`
- `--tv-ink-secondary`
- `--tv-ink-muted`
- `--tv-accent-primary`
- `--tv-accent-hover`
- `--tv-accent-pressed`
- `--tv-status-success`
- `--tv-status-warning`
- `--tv-status-danger`
- `--tv-status-info`
- `--tv-focus-ring`
- spacing, radius, elevation e motion token derivati dal handoff.

## Differenze note rispetto a Figma

- Nessun frame live specifico e stato estratto dal file Figma in questo turno per limite MCP.
- La replica completa di tutte le pagine mobile/desktop non e una riscrittura totale: questa fase applica un layer visuale e una tavola design-system verificabile.
- Radar pubblico mantiene la logica/canvas esistente; la pagina dev mostra una versione stabile CSS coerente col brief.
- Compare pubblico mantiene la logica esistente; la pagina dev introduce il selettore obiettivo come pattern pronto.

## Bug preesistenti trovati

- Warning Node engine: locale `v24.14.0`, richiesto `>=22 <23`.
- 16 warning ESLint preesistenti nel baseline.
- Figma MCP bloccato dal limite Starter dopo il tentativo di ispezione.

## Test eseguiti

- `npm run build`: passato. La nuova route `/dev/design-system` viene generata correttamente.
- `npm run lint`: passato con 16 warning preesistenti e 0 errori.
- `npm run test`: passato, 3 file test e 19 test completati.
- Browser QA: `/dev/design-system` verificata a 1440px e 375px, senza overflow orizzontale. Contrasto del bottone secondary ricontrollato dopo patch.

## Rischi residui

- Alcune pagine hanno stili inline chiari e CSS preesistente molto specifico: il layer dark scoped puo richiedere pass visuale per micro-contrasto.
- Il design Figma reale potrebbe contenere dettagli non presenti nei file di handoff locali.
- Una replica completa page-by-page resta un lavoro incrementale ampio e va completata in fasi.

## Prossimi step consigliati

- Riaprire Figma live quando il limite MCP si resetta o con un piano abilitato.
- Estrarre node specifici delle 7 pagine e confrontare screenshot con `/dev/design-system`.
- Migrare gradualmente le pagine pubbliche verso componenti compositi isolati invece di override CSS.
- Correggere warning ESLint preesistenti in una PR separata.
