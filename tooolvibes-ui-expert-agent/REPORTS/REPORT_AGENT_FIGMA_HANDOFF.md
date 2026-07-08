# REPORT_AGENT_FIGMA_HANDOFF

Modalita: planning. Nessun export Figma eseguito.

## Figma-SoT

Questi elementi devono vivere come sorgente di verita in Figma perche sono token, primitive o pattern ripetuti:

- Core tokens: color, type, spacing, radius, shadow, focus.
- Button, IconButton, Input, Select, Badge, Card/Panel, EmptyState.
- Header desktop, mobile menu, mobile bottom nav.
- ToolCard con stati: default, compact, scan, saved, compared, sponsored/trust.
- Discovery filters/search/chips.
- Tool detail trust block: source, last reviewed, reviewer, affiliate disclosure, CTA.
- Compare board: mobile cards, mobile matrix, desktop table.
- Editorial article block: byline, source, related tool CTA.

## Figma-Reference

Questi elementi possono essere referenze visuali, non componenti governanti:

- Home 3D hero, radar scene, gamification shell, cinematic intro.
- Shop/offers page finche policy commerciale non e stabile.
- Chi siamo/metodo/affiliati come pagine narrative.
- Collections special layouts e one-off editorial feature.
- Admin dashboard UI.
- 404/error se non riusati come system pattern.

## Code-Only

- Supabase/auth/callback, middleware, gate cookie, API routes.
- Local storage/account sync e Zustand stores.
- Data mapping, affiliate URL selection, validation rules.
- Animation timing, sound/music toggles, game/radar runtime behavior.
- Skeleton timing and request/loading orchestration.

## Hero pages max 7 per file Figma

1. Home.
2. Discovery / Archivio.
3. Tool Detail.
4. Compare.
5. Shortlist.
6. Editorial Post.
7. Metodo / Trust / Service page.

## Acceptance criteria Figma

- Ogni componente ha mobile e desktop states.
- Nessun token duplicato con nomi paralleli.
- CTA affiliate ha variante disclosure.
- Compare ha regole visuali per 2, 3, 4 e overflow.
- Componenti non sono detached per costruire pagine principali.
- One-off e 3D sono etichettati `Reference`, non `SoT`.
