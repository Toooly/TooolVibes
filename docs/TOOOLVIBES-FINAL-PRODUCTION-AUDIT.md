# TooolVibes final production audit

Date: 21 September 2026  
Branch: `main`  
Implementation commit: `42634fa67aa10dad06870e80f40ec15bfb95ed91` (`fix(ui): production pass for shell, ads, auth, and surfaces`)  
Docs commit that recorded that SHA: `5c297de5a0d794c554696ee63f55903e69fa52c4`  
HEAD at the start of this release-candidate verification: `5c297de`  
HEAD at the start of the implementation pass: `ea42458`

This is a consolidation pass, not a redesign. Identity preserved. System fixed.

## A. Executive summary

Public chrome is one `MarketingChrome` tree. Remaining production defects were geometry contracts, empty ad shells, OAuth copy that invented providers, a mega Home footer, and surface-level density/semantics.

This pass:

- Makes iOS safe-area real (`viewportFit: cover`)
- Unsticks stacking so consent can sit above the portaled nav
- Reserves bottom chrome once, in the footer, including measured compare tray height
- Collapses CompareDock by default and portals it to `document.body`
- Collapses TinyAdz to zero height until a painted `iframe.inlined-ta-ad` ≥ 32px
- Uses one utility footer on every marketing route (Home included)
- Renders only OAuth providers GoTrue actually enables (production currently enables none)
- Ships a production magic-link HTML/text template on the live Resend path
- Compresses Home / catalog / tool detail / guides / collections / Salvati without new art direction

Not production-ready for OAuth social login: production GoTrue has `external.google|apple|github === false`. Magic link is the working auth path. TinyAdz fill still depends on vendor + dashboard. Supabase Dashboard email template must be pasted separately.

## B. Architecture / components before vs after

| Area | Before | After |
|---|---|---|
| Viewport | no `viewport-fit=cover` | `viewportFit: "cover"` |
| Shell stacking | `.marketing-shell` `isolate` + `z-index: 2` trapped consent | isolate/z-index removed; consent already portaled |
| Bottom reserve | JS 58px ignoring safe-area; pages also padded; tray token dead | `--tv-bottom-nav-total: 3.625rem`; CSS adds `env(safe-area)` once; footer includes `--tv-tray-height` |
| Compare dock | always expanded, inside overflow-x-clip shell | collapsed default, portaled, measured height |
| TinyAdz | labeled PUBBLICITÀ shell after consent | waiting/empty height 0; label only when filled |
| Footer | Home launchpad “Continua da qui.” | one `tv-utility` footer |
| OAuth | Google force-prepended | list === GoTrue `external[id]===true` |
| Magic link email | plain inline HTML | shared `lib/auth/magic-link-email.ts` |
| Home STACK | 3-col diagram on 390px | vertical `01 LABEL / tool` ≤767px |
| Catalog counts | triple “30 tool” | one eyebrow |
| Tool actions | Confronta / Salva / Visita | Confronta / Visita / Salva |
| Trade-off | highlights junk | markdown trade-off only |

## C. Components consolidated

- One footer: `SiteFooterV2` utility (LaunchpadFooter deleted from render)
- One OAuth list hook: `useEnabledOAuthProviders` (buttons + identities)
- One magic-link template module used by Resend
- Archive TinyAdz insert owns its `<li>` via `asGridItem`
- CompareDock publishes `--tv-tray-height`
- Consent banner publishes `--tv-consent-banner-height`

Canonical primitives (`Button` / `Chip` / `Card`) were **not** force-adopted. Surfaces still own local CSS; swapping them would be a redesign.

## D. Legacy components removed

- `LaunchpadFooter` render path (Home no longer stacks a second ending)
- Decorative catalog CSS `01/02` counters
- Generic `buildAlternativeWhy` filler copy
- Maestoso `.v-auth-page` min-height/padding fight

Dead launchpad CSS remains in `styles/shell.css` / `visual-character.css` (unused markup). Not a second DOM footer.

## E. Public routes audited

Standalone production build on `:3010` (gate off). Overflow = `max(scrollWidth) - clientWidth`.

Routes: `/`, `/archivio`, `/toools/blink`, `/radar`, `/collections`, `/collections/ai-stack-solo-founders`, `/posts`, `/posts/omi-app-ai`, `/shortlist`, `/compare`, `/account`, `/metodo`.

| Viewport | Overflow | Bottom nav |
|---|---|---|
| 375×812 | 0 all routes | present |
| 390×844 | 0 | present |
| 768×1024 | 0 | present |
| 1024×768 | 0 | present |
| 1280×800 | 0 | absent (desktop command bar) |
| 1440×900 | 0 | absent |
| 1728×1117 | 0 | absent |

Home STACK at 390: `.tv-workflow-card__flow` is `display:flex` / `grid-template-columns:none` (vertical). Method CTA is “Apri il catalogo”, not “Continua da Scopri”. Footer is utility (“Parliamone / Esplora / TooolVibes”), not “Continua da qui.”

Stale `next dev` on `:3000` was **not** used as evidence (webpack `Cannot find module './5611.js'` 500s). QA used `npm run build` + standalone.

## F. Auth flows

Live probe of production GoTrue `GET {supabase}/auth/v1/settings` on 21 Sep 2026:

| Provider | GoTrue `external.*` | UI | Status |
|---|---|---|---|
| Google | `false` | not rendered | **Blocked externally.** Code no longer invents the button. Enable in Supabase Auth providers + Google Cloud OAuth client, then the existing `signInWithOAuth` path will show it. |
| Apple | `false` | not rendered | **Blocked externally.** Same. |
| GitHub | `false` | not rendered | **Blocked externally.** Same. |
| Magic link | email `true` | Accedi / Crea spazio / Recupera | **Code complete** on Resend + `generate_link` + `/auth/callback?token_hash&type=email`. Not an in-session inbox E2E in this pass (no mailbox takeover). Callback logic is unit-tested (`complete-auth-callback`). |

Copy no longer names Google/Apple/GitHub unless a button exists. Auth page title: “Entra nel tuo spazio”. `/account` keeps public chrome (nav + footer). Callback `/auth/callback` stays chrome-free.

## G. Guest → account persistence tests

Untouched. `lib/discovery/workspace-sync.ts` `mergeGuestWorkspaceContribution` remains the contract.

`__tests__/lib/discovery/guest-account-merge-contract.test.ts` — 31 passed (saved union, compare cap/account-first, decisions newer `updatedAt`, guest `clearedAt` cannot wipe).

## H. Logged-in surfaces audited

- Spazio (`riprendi`) unchanged structurally (resume-first).
- Salvati `LibraryRow`: one status + note excerpt + primary CTA; extra facts in overflow.
- DecisionSheet already overlay z 80/90 above nav 50 — not rewritten.
- Settings not redesigned.
- Personal Stack vs editorial Raccolte still distinct.

No authenticated session was created against production in this pass (OAuth off; magic-link email not intercepted).

## I. CompareDock changes

- Hidden at 0 slugs and on `/compare`
- Collapsed by default (`n/5` + Confronta / Aggiungi un altro)
- Expand is a real control; list unmounted while collapsed
- Portaled to `document.body` (escapes `.marketing-shell { overflow-x: clip }`)
- `--tv-tray-height` measured from painted box
- Guides keep the compact dock when a comparison is live (74px observed; does not cover nav)
- Observed 390 catalog: dock bottom 778px, nav top 800px, no overlap

## J. Bottom-nav / safe-area changes

- `viewportFit: "cover"`
- `.mobile-bottom-shell` owns geometry (`bottom: 0`, safe-area in padding)
- `--tv-bottom-nav-total` excludes safe-area; consumers add `env(safe-area-inset-bottom)` once
- `html, body` `scroll-padding-bottom` = nav + tray + safe-area
- Public IA: HOME / CATALOGO / RACCOLTE / SALVATI
- Auth remap: SPAZIO / CATALOGO / DECISIONI / SALVATI
- Exactly four destinations

## K. Tiny Ads findings

**Root cause:** after consent the slot always painted a labeled “Pubblicità” shell. No fill observer. Matrix comment said collapse-to-null; implementation never unmounted. Archive always emitted a full-row `<li>`.

**Frontend fix:**

- Consent still required to mount
- Waiting/empty: height 0, no label
- Fill = `iframe.inlined-ta-ad` painted height ≥ 32px (MutationObserver + ResizeObserver)
- Timeout 8s → `empty`, host stays mounted (late fills still have a node)
- Archive: probe mount until filled, then `<li class="ar4-grid__item--ad">`

**External / dashboard still needed:**

- Confirm TinyAdz site id + campaign fill on production
- `NEXT_PUBLIC_TINYADZ_ENABLED` / `NEXT_PUBLIC_TINYADZ_SITE_ID` already used
- This pass cannot create vendor demand. Empty slots now consume ~0px instead of a labeled hole.

Local standalone QA: ads array empty (consent not granted / TinyAdz off in that env). No PUBBLICITÀ text.

## L. Sponsor / ad taxonomy

Unchanged product split:

- Partner Experience / Sponsorizzato = first-party paid partner
- TinyAdz = programmatic, unlabeled until fill
- Open Slot = acquisition when no paid sponsor on a partner mount

No house-ad fallback was invented on top of TinyAdz (would collide with Partner Experience). Collapse-to-nothing is the empty state.

## M. Footer restoration / refinement

- Git `719048e` stacked launchpad + core — do not restore
- `ea42458` exclusive Home launchpad **or** utility — this pass goes further: **utility everywhere**
- Ivory-era `.site-footer-v2 h3 { color: var(--tv-ink-inverted) !important }` was still painting Parliamone / Esplora / TooolVibes as `#08080a` on night. Changed to `--tv-ink-primary !important`.
- Scrivici uses `tv-utility__contact` (not inverted ivory button)

## N. Copy removed / merged

- “Continua da Scopri/Valuta/Confronta/…” → Apri il catalogo / confronto / decisioni / salvati
- Catalog intro data rail + grid “N tool nel catalogo” (unfiltered)
- Trade-off junk from highlights (“Dal prompt all’app”)
- Generic “Profilo complementare…” alternative why
- Generic Pricing accordion body
- OAuth sentence “Google, Apple, GitHub — oppure un link…”
- Auth identity-conflict “collega Google…” → “collega un account dalle impostazioni”

## O. Mobile responsive matrix

375 / 390: nav present, overflow 0, STACK vertical, dock above nav, auth form titled “Entra nel tuo spazio”, no invented OAuth names.

## P. Tablet responsive matrix

768 / 1024: nav still present (<1280), overflow 0.

## Q. Desktop responsive matrix

1280 / 1440 / 1728: command bar, no bottom nav, overflow 0. Not a stretched 390 layout (catalog grid, collection long-form, article measure 66ch).

## R. Accessibility fixes

- Auth context title: visually hidden on mobile, not `display:none` (keeps `aria-labelledby`)
- Compare `aria-controls` only while expanded
- TinyAdz label first in DOM
- Footer headings readable vs night field
- Catalog search uses primary ink (no disabled-looking inverted field)

Decision sheet focus trap was already `ui/sheet`. Not re-audited with a keyboard in this pass beyond existing tests.

## S. Interaction test results

| Interaction | Result |
|---|---|
| Add Blink to compare (390 catalog) | Dock 74px collapsed, no nav overlap |
| Expand dock | Shows Blink chip + Aggiungi un altro |
| Home STACK tab | Vertical flex, overflow 0 |
| Guide `/posts/omi-app-ai` with live compare | Dock compact, no PUBBLICITÀ, overflow 0 |
| Auth `/account` | Magic-link only (providers empty), nav present |

## T. Automated tests

- Vitest scoped (layout, ads, account, home, archive, tool-detail, collections, auth, styles, guest merge): **734 passed / 95 files**
- Footer heading contract added
- Playwright overflow spec: `tests/e2e/horizontal-overflow.spec.ts` on projects overflow-375/768/1280/1440
- Equivalent overflow matrix run against standalone `:3010` (gate off): **0 overflow** on 12 routes × 7 viewports (desktop leftover run completed after a Chromium close on the first 1280 pass)

`npx playwright test` full visual matrix was **not** re-snapshotted (would churn baselines unrelated to this pass).

## U. Build / lint / typecheck status

| Check | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| eslint on touched TS/TSX | 0 errors |
| `npm run build` (`scripts/next-release-build.mjs`) | pass (151 pages) |
| vitest scoped | 734 passed |

## V. Before / after screenshot gallery

Before: product-owner PDF pack (52 mobile shots, 21 Sep 2026) — evidence of overlap, empty ads, launchpad footer, desktop-on-mobile stacks.

After (local, not committed binaries): `artifacts/final-production-pass-2026-09-21/`

Notable:

- `375-home-top.png` / `390-home-stack.png` — hero preserved; STACK vertical
- `390-home-footer.png` — utility footer, no Continua da qui
- `390-account.png` — compact auth, no invented providers
- `390-compare-dock-collapsed.png` — compact dock above nav
- `390-guide-mid.png` — cream article, no labeled empty ad

## W. Remaining known issues

Genuine external blockers only for “not done”:

1. **OAuth:** production GoTrue has Google/Apple/GitHub disabled. UI correctly shows none.
2. **Supabase Dashboard magic-link template** is not the live path (Resend is). Dashboard HTML matches the repo but is stale until pasted.
3. **TinyAdz fill** depends on vendor campaigns; frontend no longer lies with a labeled hole.
4. Launchpad CSS leftover in `shell.css` (unused).
5. Salvati kebab still mixes a few status rows with actions (P2, not overlapping content).
6. Auth page still double-reserves nav (page pad + footer pad) — extra space, not overlap.
7. Local `next dev` on `:3000` was a stale webpack cache; restart it before using it as evidence.

Do **not** call OAuth “production ready”. Magic-link + guest merge + public chrome **are** ready pending the dashboard paste and Resend env already used in production.

## X. Exact commits

| Role | SHA |
|---|---|
| Implementation | `42634fa67aa10dad06870e80f40ec15bfb95ed91` |
| Docs SHA record (verification base) | `5c297de5a0d794c554696ee63f55903e69fa52c4` |

`5c297de` changes only this audit file. It does not change product code.

## Y. Exact manual external actions required

1. **Supabase → Authentication → Providers:** enable Google / Apple / GitHub only after console credentials exist. Until then, showing buttons would be dishonest.
2. **Google Cloud / Apple / GitHub OAuth apps:** callback `{AUTH_REDIRECT_ORIGIN}/auth/callback`.
3. **Supabase → Authentication → Email Templates → Magic Link:** paste `supabase/templates/magic-link.html` + `.txt` + subject from `supabase/templates/README.md`. Live users already get Resend HTML from `lib/auth/magic-link-email.ts`. Dashboard paste matters for any native Supabase mailer send.
4. **TinyAdz dashboard:** confirm site id, units, and fill. Frontend empty state is now zero height.
5. **Do not deploy from this agent.** Ship when the owner is ready.

## Stop-condition check

| Condition | State |
|---|---|
| Fixed UI covers content | Not observed on standalone matrix |
| CompareDock covers content | Not observed (dock above nav) |
| Empty ad labeled hole | Frontend collapsed |
| Auth provider shown but broken | Providers not shown |
| Magic-link callback code | Tested; inbox E2E not run here |
| Guest state lost | Contract tests pass; merge untouched |
| Horizontal overflow | 0 on audited routes |
| Dark-on-dark footer h3 | Fixed (`--tv-ink-primary`) |
| Desktop stretched mobile | Not observed at 1280+ |
| Mobile stack collide | Vertical flex |
| Build / tsc / lint / critical tests | Pass |

## RELEASE CANDIDATE STATUS

Verified on repository HEAD `5c297de` (product code = `42634fa`). Standalone production build of that HEAD, gate off, port 3010. Not deployed.

| Check | Result |
|---|---|
| Build | **PASS** — `npm run build` baked `TOOOLVIBES_RELEASE_SHA=5c297de5a0d794c554696ee63f55903e69fa52c4`, 151 pages |
| Typecheck | **PASS** — `tsc --noEmit` |
| Lint | **PASS** — `eslint . --max-warnings=0` |
| Relevant tests | **PASS** — 545 tests / 75 files (shell, ads, account, auth, guest merge, tool detail, collections, catalog, home) |
| Responsive QA | **PASS** — Chromium and WebKit, instant scroll to document end |
| Auth code flow | **PASS** (code) — providers empty when GoTrue says off; callback `verifyOtp` unit-tested |
| Guest persistence | **PASS** (logic) — `guest-account-merge-contract` 31 tests. No live inbox session. |
| TinyAdz frontend fallback | **PASS** |
| OAuth providers | **EXTERNAL** — production and local `/api/auth/config` both return `providers: []`. GoTrue `external.google/apple/github` are false. |
| TinyAdz real fill | **EXTERNAL** |

### Responsive matrix

Viewports: 375×812, 390×844, 430×932, 768×1024, 1280×800, 1440×900, 1728×1117.

Routes sampled: `/`, `/archivio`, `/toools/blink`, `/radar`, `/collections`, `/collections/ai-stack-solo-founders`, `/posts`, `/posts/omi-app-ai`, `/shortlist`, `/compare`, `/account`, `/metodo`.

- Body overflow: 0
- Bottom nav present below 1280, absent at 1280+
- At scroll end, visible footer links/headings are not under the nav
- Footer h3 computed color `rgb(244, 240, 231)` (ivory), not `rgb(8, 8, 10)`
- No visible `PUBBLICITÀ` label and no filled-state ad gap
- Home TOOL / STACK / RADAR switch with overflow 0
- Catalog card readable (`AgentX`, `Ideale per: Creare agenti AI specializzati`)
- CompareDock after adding Blink: 74px, above nav, no overlap
- Guide with a live compare: dock stays compact; the only layout-box intersection was `aria-hidden` locked copy, not painted reading text
- Collection section nav (after account hydration): `position: sticky`, scroller `overflow-x: auto`, list wider than scroller, body overflow 0
- Auth title `Entra nel tuo spazio`; no Google/Apple/GitHub buttons; form does not intersect the nav (Chromium and WebKit)

### Auth

- Google OFF => no Google button. Confirmed in the browser and in `oauth-buttons` tests.
- Apple OFF => no Apple button.
- GitHub OFF => no GitHub button.
- Magic-link request schema rejects unknown keys (400). With local GoTrue down (`127.0.0.1:54321` connection refused) a valid email returns **503** `Accesso email non disponibile in questo momento` (fail closed). Callback exchange is covered by `__tests__/lib/auth/complete-auth-callback.test.ts` (`token_hash` + `type=email` => `verifyOtp`).
- **Limitation:** no mailbox was used. Production email delivery was not sent from this machine.

### Guest -> account

`mergeGuestWorkspaceContribution` tests cover saved union, compare cap/account-first, and newer decision timestamps. Account attach orchestration tests passed. A browser login through a delivered magic link was **not** run, because local GoTrue/Mailpit are down and a production inbox send was not attempted.

### TinyAdz

**A. Frontend:** consent denied/unknown/disabled/missing site id renders nothing. Waiting and empty states are `height: 0`. Fill requires `iframe.inlined-ta-ad` ≥ 32px before the label appears. Timeout leaves the host mounted but collapsed. Archive waiting state is a probe, not a grid row. Script unavailable follows the same no-fill collapse. Unit tests: `__tests__/components/ads/tinyadz-inline-slot.test.tsx` (20).

**B. Vendor fill:** not proven in this pass. No campaign creative was painted. Treat real fill as an external dashboard check, not a frontend bug.

### Magic-link templates

`supabase/templates/magic-link.html`, `.txt`, and `.subject.txt` match the live Resend module. One CTA. Callback shape is `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` (`&amp;` in HTML). No script URLs. These files are **not** the live send path until pasted in the Supabase dashboard. Live send is `lib/auth/magic-link-email.ts` via Resend.

### Logged-in surfaces

`/dev/workspace-qa` returns 404 on the production standalone server (by design). No authenticated browser session was created. Usability of Spazio / Salvati / Decisioni and the decision sheet (focus, escape, internal scroll, bottom offset `--tv-bottom-nav-total`, safe-area padding) is **PASS via component tests**, not a live login.

### Exact manual actions still required

1. Supabase → Authentication → Providers: enable Google, Apple, and/or GitHub only after the matching console credentials exist. Until then the UI correctly shows none.
2. Add `https://tooolvibes.eu/auth/callback` to Supabase redirect URLs if it is not already there. Set Site URL to that origin so `{{ .SiteURL }}` is production-safe.
3. Optional: paste `supabase/templates/magic-link.*` into Supabase → Authentication → Email Templates → Magic Link. Required only for the native mailer. Resend does not read those files.
4. After deploy, send one real magic link and open it once. This pass did not.
5. TinyAdz dashboard: confirm site id and that a campaign can fill. Empty fill must stay collapsed; that part is already in the frontend.
6. Do not treat OAuth or vendor fill as done.

### Deployment

Not deployed from this verification.
