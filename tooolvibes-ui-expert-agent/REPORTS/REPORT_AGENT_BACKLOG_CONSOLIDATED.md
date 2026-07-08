# REPORT_AGENT_BACKLOG_CONSOLIDATED

Backlog consolidato da agent team mode. Non e una lista di fix autorizzate.

| ID | Sev | Area | Item | Evidence | Classificazione | Effort |
|---|---:|---|---|---|---|---:|
| TV-001 | P0 | Trust | Disclosure affiliate accanto a CTA commerciali | `posts/[slug]/page.tsx:297-302`, `lib/types/tool.ts:52` | Figma-SoT + Code-Only | M |
| TV-002 | P1 | Trust | Trust block con last reviewed e reviewer | `toools/[slug]/page.tsx:201`, `lib/types/tool.ts:39,55` | Figma-SoT + data | L |
| TV-003 | P1 | Mobile | Input/select/button min touch target | `components/ui/input.tsx:12`, `button.tsx:29-30`, `select.tsx:44` | Figma-SoT | M |
| TV-004 | P1 | Design system | Token radius/color/shadow canonici | `app/globals.css:89-120`, `:13245-13248` | Figma-SoT | L |
| TV-005 | P1 | Compare | Ridurre o guidare limite compare 5 tool | `tool-workspace-store.ts:23`, `compare-board.tsx:411-415` | SoT + Code-Only | M |
| TV-006 | P1 | State | Unificare compare/save store contract | `tool-workspace-store.ts:81-84`, `local-storage.ts:23-30` | Code-Only | M/L |
| TV-007 | P2 | Header | Search overlay mobile come sheet ottimizzata | `site-header-v2.tsx:248-260` | Figma-SoT | M |
| TV-008 | P2 | Nav | Menu mobile 85vw da verificare sotto 375 | `site-header-v2.tsx:283` | Figma-Reference/SoT | S |
| TV-009 | P2 | Components | Badge semantic variants per trust/status | `components/ui/badge.tsx:8-11` | Figma-SoT | S/M |
| TV-010 | P2 | Overlays | Policy dialog/sheet/drawer | `dialog.tsx:54-56`, `drawer.tsx:60-65` | Figma-SoT | M |
| TV-011 | P2 | Visual | Palette monotone + one accent | `globals.css:114-120`, `vibes-3d-maestoso.css:5-45` | Figma-SoT | L |
| TV-012 | P2 | App shell | Gate-aware QA mode | `layout.tsx:84-99`, `(marketing)/page.tsx:36-37` | Code-Only | M |
| TV-013 | P2 | UX | Distinguere search globale da catalog refine | `site-header-v2.tsx:243-260`, catalog search components | SoT | S/M |
| TV-014 | P2 | Accessibility | Skip link e keyboard route pass da verificare | no global skip trovato; focus globals `globals.css:276-280` | SoT + runtime | M |
| TV-015 | P3 | Docs | Aggiornare Figma extraction notes dopo screenshot | Tutti report | Planning | S |

## Sequenza raccomandata

1. TV-001.
2. TV-003.
3. TV-002.
4. TV-004.
5. TV-005/TV-006 insieme solo dopo decisione stato.
