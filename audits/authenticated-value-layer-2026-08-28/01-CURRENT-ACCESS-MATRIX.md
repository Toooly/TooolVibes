# 01 — Current Access Matrix

**Status:** CURRENT (repo-grounded at `1e4c7a2`)  
**Not:** target architecture. For TARGET see `02-TARGET-ACCESS-MATRIX.md`.

Legend:

| Access | Meaning |
|---|---|
| PUBLIC | No identity required |
| GUEST-LOCAL | Works logged-out; durable only in guest `localStorage` |
| AUTH-ONLY | UI and/or server requires a session |
| AUTH-CAPABLE-BUT-NOT-GATED | Works logged-out; syncs if/when attached |
| INTERNAL | Admin / ops |
| LEGACY / DEAD | Redirect, unused, or retired |

Persistence keys (CURRENT):

- Guest: `localStorage` `tooolvibes:workspace:v1`
- Auth device: `tooolvibes:workspace:v1:account:{userId}`
- Auth remote: Supabase `viewer_workspaces.workspace_state` JSONB via CAS RPC `sync_viewer_workspace_v1` (service-role only)
- Compare objective session: `tooolvibes:compare-objective:v1` (not in V1, not synced)
- IndexedDB: unused

There is **no** product capability registry today. Closest: `lib/config/release-features.ts` kill switches.

---

## Matrix

| CAPABILITY | ROUTE / COMPONENT | GUEST CURRENT | AUTH CURRENT | PERSISTENCE | SERVER ENFORCEMENT | CLIENT GATING | KNOWN GAP | SOURCE FILES |
|---|---|---|---|---|---|---|---|---|
| Catalog browse | `/archivio` · `definitive-archive.tsx` | PUBLIC full | same | catalog SSR; personal actions → V1 | none | none | none — correctly public | `app/(marketing)/archivio/page.tsx`, `components/archive/definitive-archive.tsx`, `lib/data/public-tools.ts` |
| Tool page public | `/toools/[slug]` · `tool-detail-final-page.tsx` | PUBLIC editorial + save + compare | same + stack names if any | SSR editorial; actions → V1 | none | none | no private-note slot on this page | `components/tool-detail-final/*` |
| Radar public | `/radar` · `radar-experience.tsx` | PUBLIC PH periods | **identical** — no personalization | PH payload, not V1 | `/api/product-hunt` public | none | relationship-aware Radar is TARGET, not current | `components/radar/radar-experience.tsx`, `app/api/product-hunt/route.ts` |
| Search basic | `/archivio?q=` + palette | PUBLIC in-memory catalog tokens | same engine | none (catalog snapshot) | none | none | correctly public | `lib/search/tool-search.ts`, `catalog-controller.ts` |
| Command palette | `GlobalCommandPalette` ⌘K | Trova catalog + salvati name match + Vai Salvati/Catalogo/Radar | + Home/Stack/Settings; personal aliases (`rimandati`, `in uso`, …); named stacks | volatile UI; reads V1 | none | Vai dests filter `authOnly` | **personal aliases always `workspaceFocusHref("salvati")` → `/account?view=salvati` even for guests (dead-end AuthPage)**. Aliases are keywords, not a DSL | `components/app/global-command-palette.tsx`, `workspace-model.ts` |
| Save | Speed 1 `shortlist-toggle` / hold overflow | GUEST-LOCAL | local + remote | V1 `saved` | PUT workspace requires Bearer | none on save | login not required at first save (intentional) | `components/tools/shortlist-toggle.tsx`, `save-overflow.tsx`, `lib/account/workspace-actions.ts` |
| Shortlist (guest board) | `/shortlist` · `mobile-shortlist-board.tsx` | GUEST-LOCAL library | auth redirected to Salvati 2.0 | guest V1 | none | `ShortlistRouteGate` replaces auth users | dual library chrome; guest board ≠ Salvati 2.0 | `shortlist-route-gate.tsx`, `app/(marketing)/shortlist/page.tsx` |
| Salvati 2.0 | `/account?view=salvati` · `WorkspaceBiblioteca` | no (AuthPage) | AUTH-ONLY UI | V1 + remote | AccountGate client-only; data via workspace PUT | `AccountGate` | guests cannot see relationship filters / Filo / ⋯ menu | `workspace-biblioteca.tsx`, `lib/account/salvati-relationship.ts` |
| Compare basic | `/compare` · `ToolBattleView` | PUBLIC 2–5 + objective + Fast Decide | same | V1 `compare`; objective separate LS | none | none | Deep Compare layer does **not** exist | `components/tools/tool-battle-view.tsx`, `lib/compare/*` |
| DecisionSheet | overlay, sources compare/salvati/home/shortlist | AUTH-CAPABLE-BUT-NOT-GATED (Fast + optional why/use/revisit) | same + sync | V1 `toolStates.decision` + `events` | none on write | none | intentional: Fast Decide public | `components/account/workspace/decision-sheet.tsx` |
| Stack create | `StackPickOrCreate` · `/account?view=stack` | **UI hidden** (`allowCreate=false`); no Accedi CTA | AUTH-ONLY UI | V1 `personalStacks` | **none** — reducer accepts create for any owner | `allowCreate={owner.kind==="account"}` | **S22 not built: no contextual auth continuation.** Server does not enforce create | `stack-pick-or-create.tsx`, `workspace-stacks.tsx`, `workspace-actions.ts` |
| Stack edit / membership | same | add-to-existing only if local stacks already exist (rare) | full create/rename/archive/reorder | V1 | none | UI | leftover guest stacks possible after account session on same browser | same |
| Editorial collections | `/collections` | PUBLIC read | PUBLIC read | `collections` tables | public read | none | not personal stacks | `components/collections/*`, `lib/data/public-collections.ts` |
| Filo UI | Salvati 2.0 rows · `filo.tsx` | events may be written if guest decides; **no UI** | AUTH-ONLY UI | V1 `events[]` max 200 | none | only mounted in biblioteca | data/UI split | `lib/account/workspace-filo.ts` |
| Review / revisit | DecisionSheet chips; Home queue | can set `revisitAt` locally; no Home queue | Home “Da rivedere” + Salvati filter | V1 `revisitAt` + events | none | Home is AccountGate | review **queue** is auth UI; field write is not | `workspace-pipeline.ts`, `workspace-riprendi.tsx` |
| Notes | guest board sheet; Salvati 2.0 inline | GUEST-LOCAL scratch on `/shortlist` | Salvati 2.0 form; **not on Tool Page** | `toolStates.note` max 2000 | none | none | **not** a unified searchable private-note layer; no Tool Page composer; no `noted` event type | `mobile-shortlist-board.tsx`, `workspace-biblioteca.tsx`, `setWorkspaceNote` |
| Pins | guest sheet; Salvati ⋯ | GUEST-LOCAL | yes | `toolStates.pinned` | none | none | not a conversion lever | same |
| Usage | boards + tool page “Lo sto usando” if selected | AUTH-CAPABLE-BUT-NOT-GATED | + Home confirm | `usage` / `replacedBy` | none | none | Software Memory **data** exists; not a destination | `workspace-actions.ts` |
| Replacement | Salvati / guest usage line | AUTH-CAPABLE-BUT-NOT-GATED | yes | `replacedBy` + event `replaced` | none | successor must already be saved | not a graph table | same |
| Events / Software Memory data | reducer | written locally on decide/use | merged + synced | `events[]` | JSON validator on RPC | Filo UI auth-only | no `noted` in SQL enum | `lib/discovery/types.ts`, `supabase/migrations/20260828000000_workspace_state_v1_events.sql` |
| Home 2.0 | `/account` default `view=riprendi` | AuthPage | AUTH-ONLY resume workspace | derived from V1 + PH pulse | AccountGate client-only | `AccountGate` | magazine `/` is a different public home | `workspace-riprendi.tsx`, `workspace-shell.tsx` |
| Settings | `/account/settings` | AuthPage | AUTH-ONLY | signal prefs + export | submissions GET Bearer | AccountGate | no account deletion | `account-settings-page.tsx` |
| Export | settings | no | AUTH-ONLY JSON export | local snapshot | none extra | settings | workspace-only | `lib/account/workspace-export.ts` |
| Workspace APIs | `/api/workspace-state` GET/PUT; attach/release | GET without token → **200 empty local**; PUT 401 | Bearer JWT; CAS service role | remote JSONB | PUT/attach/release 401 without Bearer | persistence provider no-op without token | GET 200-empty is an inconsistent auth contract; not a data leak | `app/api/workspace-state/route.ts`, `canonical-remote-workspace.ts` |
| Workspace health | `/api/workspace-account/health` | PUBLIC | PUBLIC | none | **none** | none | **unauthenticated metadata** (`has_service_role`, `enabled`). Debt — do not fix in this docs pass | health route |
| Auth | `/account` `AuthPage`; `/auth/callback`; magic-link API | full-page login | session | Supabase Auth | magic-link rate limit + origin allowlist | `AccountGate` | **no contextual AuthSheet; no PendingAuthIntent** | `auth-page.tsx`, `account-provider.tsx`, `app/api/auth/magic-link/route.ts` |
| Guest→auth merge | `attachWorkspaceToAccount` → `mergeGuestWorkspaceContribution` | n/a | on login | union lists; **account toolStates wholesale win** | attach Bearer | AccountProvider | **overlapping slug guest note/decision/usage/revisit can be discarded**; no pending-intent replay | `lib/discovery/workspace-sync.ts`, `guest-account-merge-contract.test.ts` |
| Personalization helper | `recommendWorkspaceTools` | unused | **unused** — no UI import | reads V1 + catalog hints | none | none | **not a shipped Personal Insights surface** | `lib/account/personalization.ts` |
| Analytics | sponsor ingest | anonymous sponsor events | same | `/api/sponsor-analytics` | rate limit best-effort | none | **no product analytics vendor; no `auth_gate_*` events** | `lib/analytics/sponsor-events.ts` |
| Community | `/community` → `/contributi` | PUBLIC editorial contribute + email | same + submissions list | tool-request rows | public submit captcha | none | **no Experiences, comments, reviews, or `community.write`** | community redirect, `app/api/tool-requests` |
| Signal / gamification | flags default OFF | inert | APIs 401 without token; flags off → 404 | signal tables | Bearer | client skip | not this workstream | `lib/signal-progression/*` |
| Premium collections | `lib/premium/access.ts` | always `has_full_access` | same | n/a | none | none | DEAD paywall copy vs open access | `lib/premium/access.ts` |
| Notifications | none | none | none | n/a | n/a | n/a | no inbox — DEFERRED | — |
| Admin | `/admin*` | n/a | n/a | admin cookie | middleware | — | INTERNAL; separate from user auth | `middleware.ts`, `lib/admin/*` |

---

## Explicit CURRENT findings (do not blur with TARGET)

1. Command palette personal aliases currently **dead-end guests into `/account`**.
2. Stack create is **UI-gated** (`allowCreate`) but **no contextual auth continuation** exists. Guests with 0 stacks see **nothing** (no Accedi). Source comment: “S22 Accedi-to-create is not built.”
3. Guest **Fast Decide remains intentionally public** (DecisionSheet on compare + shortlist).
4. Guest **local scratch notes remain intentionally possible** on `/shortlist`.
5. Guest `toolStates` for slugs already on the account **can be lost** during attach (`toolStates: { ...guest, ...account }`).
6. There is **no pending-intent continuation system**.
7. `recommendWorkspaceTools` exists as a helper and is **not** a shipped Personal Insights surface.
8. **No community system** exists (no Experiences, no `community.write`).
9. Deep Compare, personal search DSL, relationship-aware Radar, AuthSheet, tool-page private notes are **not current**.
10. Filo **data** can exist for guests; Filo **UI** is auth-only.
11. Named stack create is **not server-enforced**.
12. `/account*` is **not** middleware-protected; `AccountGate` is client-only.

---

## CURRENT Guest doctrine (as lived)

Discover the catalog. Save locally. Compare 2–5. Fast Decide. Scratch note / pin / usage / revisit on the legacy board. No Home, no Stack tab, no Salvati 2.0, no Filo UI, no cloud.

## CURRENT Auth doctrine (as lived)

Everything the guest can write, plus: cloud CAS sync, Home 2.0, Salvati 2.0, named Stacks, Filo UI, Review queue, Settings/export. **Not** a personal OS of search/insights/deep compare/community.

---

## Auth detection (CURRENT)

| Layer | Guest | Authenticated |
|---|---|---|
| `useAccount().status` | `"guest"` | `"authenticated"` |
| `getActiveWorkspaceOwner()` | `{ kind: "guest" }` | `{ kind: "account", userId }` |
| SSR user | none | none (client session after paint) |

Three unrelated gates also exist: optional coming-soon `publicGate` (default OFF), admin cookie, and user magic-link. Product routes are public to middleware.
