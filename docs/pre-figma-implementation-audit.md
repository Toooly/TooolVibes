# Pre-Figma Implementation Audit

Data: 2026-07-08
Branch: `main`
Repository: `C:\Users\Mattia\Desktop\Tooolvibes-app\tooolvibes-app-main`
Figma file: `https://www.figma.com/design/43r4knT1MkUkwbby3Tubbv`

## Stato iniziale

- `git pull`: completato, repository gia aggiornato.
- `npm install`: completato. Warning preesistente: runtime locale Node `v24.14.0`, mentre `package.json` richiede `>=22 <23`.
- `npm run build`: completato con successo prima delle modifiche.
- `npm run lint`: completato con successo prima delle modifiche, con 16 warning e 0 errori.
- Accesso live a Figma: tentato via plugin. Il primo tentativo ha avuto errore di trasporto MCP; il secondo ha risposto con limite piano Starter raggiunto. Implementazione basata sui file di handoff Figma gia presenti nel repo.

## Warning preesistenti

- `components/3d-maestoso/arena-fighter.tsx`: `isWinner` e `isDefeated` non usati.
- `components/tools/unified-compare-board.tsx`: import/variabili non usate (`Gauge`, `Swords`, `Zap`, `getLeadTool`, `restTools`).
- Diversi warning `@next/next/no-img-element` in componenti radar, compare, spotlight e orbital preview.

## Struttura cartelle rilevante

- `app/(marketing)`: pagine pubbliche principali.
- `components/ui`: primitive UI condivise.
- `components/layout`: header, footer e bottom navigation.
- `components/tools`: compare, shortlist, tool card e workspace tool.
- `components/radar`, `components/desktop`: radar mobile/desktop.
- `components/directory`: catalogo/discovery e card archivio.
- `styles`: CSS specializzato per radar, compare, account, gamification e 3D.
- `tooolvibes-design-handoff`: token, componenti, layout mobile/desktop e struttura Figma locale.
- `tooolvibes-ui-expert-agent/Figma/REPORTS`: report operativi di handoff Figma.

## Componenti esistenti

- Primitive presenti: `Button`, `Badge`, `Input`, `Tabs`, `Dialog`, `Sheet`, `Toast/Sonner`, `Accordion`, `Tooltip`.
- Primitive mancanti prima dell'intervento: `Avatar`.
- Compositi presenti: `ToolCard`, `DirectoryToolCard`, `SiteHeaderV2`, `SiteFooterV2`, compare mobile/desktop, radar mobile/desktop, shortlist mobile.
- Compositi richiesti ma non isolati come primitive singole prima dell'intervento: `CompareRow`, `FilterSheet`, `RadarPreview`, `ShortlistCard`, `EditorialCard`.

## Pagine principali

- Home: `app/(marketing)/page.tsx`
- Discovery/archivio: `app/(marketing)/archivio/page.tsx`
- Tool detail: `app/(marketing)/toools/[slug]/page.tsx`
- Compare/Arena: `app/(marketing)/compare/page.tsx`
- Shortlist: `app/(marketing)/shortlist/page.tsx`
- Editorial: `app/(marketing)/posts` e `app/(marketing)/posts/[slug]`
- Service/marketing: `wishlist`, `metodo`, `affiliati`, `chi-siamo`, `shop`, `community`

## Rischi tecnici

- Il CSS globale e molto ampio e contiene molte regole `!important` per mobile, compare e radar.
- La UI pubblica usa gia layer 3D/orbital e classi custom estese; una riscrittura totale sarebbe ad alto rischio.
- Le pagine tool detail hanno molte superfici inline con gradienti chiari; lo scope dark deve usare override controllati.
- Auth, Supabase, API, gate e deploy config non vanno toccati per questa fase.
- Figma live non e consultabile oltre il limite MCP; la source of truth operativa in questa fase e il handoff locale.

## Piano di implementazione

1. Aggiungere token CSS Figma in uno stylesheet separato e importarlo nel global CSS.
2. Applicare uno scope `tv-figma-theme` al marketing layout senza cambiare routing o dati.
3. Allineare primitive UI: `Button`, `Badge`, `Input`, aggiungere `Avatar`.
4. Creare `/dev/design-system` con token, primitive, componenti compositi e stati.
5. Inserire preview mantenibili per `ToolCard`, `EditorialCard`, `CompareRow`, `FilterSheet`, `RadarPreview`, `ShortlistCard`.
6. Verificare build, lint e test.
7. Documentare differenze note, problemi preesistenti e prossimi step.
