# TooolVibes production release

22 September 2026

## A. Deployed commit SHA

`b6e01e9a4dc8d643274f7875ec756a25162263c9`

Confirmed by `https://tooolvibes.eu/api/release`.

## B. Production deployment identifier

Cloudflare Worker `tooolvibes`  
Version ID: `ee534676-b185-4a50-b785-1cca0afff390`  
Built at: `2026-09-22T06:55:24.211Z`  
Release name: TooolVibes GM — MVP v.1.0.0

## C. Production URL

https://tooolvibes.eu  
Worker preview: https://tooolvibes.staff-ffa.workers.dev

## D. Build / lint / typecheck / tests

| Check | Result |
|---|---|
| `npm run build` | PASS, SHA `b6e01e9` |
| `eslint . --max-warnings=0` | PASS |
| `tsc --noEmit` | PASS after the release build generated `.next/types` |
| Critical tests | PASS, 48 (shell, responsive, auth chrome, visual system, magic-link HTML, TinyAdz, CompareDock) |

Tracked tree was clean. Untracked local artifacts were not deployed.

## E. Mobile production visual QA

390×844 and 430×932 against production, one browser per shot.

Routes: Home TOOL / STACK / RADAR, Catalogue, tool detail, Guides list, Guide article, Collections list, Collection detail, Auth, footer.

- Body overflow: 0
- Fonts: `document.fonts.status = loaded`
- No `PUBBLICITÀ` label and no ad slot height
- Partner block present on Home
- OAuth buttons absent
- Painted footer text on Auth sits above the nav (about 29px at first paint, 39px at scroll end). A layout-box probe intersected the nav; hit-testing and pixels did not.
- No page errors recorded

## F. Desktop production visual QA

1440×900: Home TOOL / STACK / RADAR, Catalogue, tool detail, Guides, Guide article, Collection detail, Auth, footer.

- Overflow 0
- No bottom nav (desktop command bar)
- No empty ad reservation
- Partner present on Home

## G. Magic-link production test

Production Auth accepted a magic-link request. Success UI: link sent; open the mail and confirm. No token is recorded here.

Inbox open, CTA click, callback, and session creation were **not** completed from this environment. There is no mailbox access here.

## H. Session persistence

Not observed. Depends on the uncompleted inbox click.

## I. Guest → account merge

Not run on production, because authentication did not finish. Automated contract remains `__tests__/lib/discovery/guest-account-merge-contract.test.ts` (saved union, compare cap, newer decision timestamps). Not re-run in this deploy turn.

## J. Logged-in production areas

Not available. No production session was created. Spazio, Salvati, Decisioni, decision sheet, Stack, and Impostazioni were not exercised on production in this pass.

## K. OAuth provider status

`GET /api/auth/config` returned `providers: []`.

| Provider | Status |
|---|---|
| Google | DISABLED |
| Apple | DISABLED |
| GitHub | DISABLED |

Buttons were not rendered. This is provider configuration, not a frontend bug.

## L. TinyAdz status

Frontend: PASS. No labeled empty reservation and no slot height on the smoked routes.

Real vendor fill: NOT OBSERVED. No creative painted during the test.

## M. Production console / network

No uncaught page errors and no same-origin 4xx/5xx on the smoked routes. OpenNext duplicate-key warning during the Worker bundle is pre-existing and did not fail deploy.

## N. Fixes made after deploy

None. The auth footer rect overlap was clipped overflow, not painted text in the nav.

## O. Remaining external actions

1. Open the magic-link email just requested and confirm callback, session persistence, and guest merge.
2. Enable Google, Apple, and/or GitHub in Supabase only after console credentials exist.
3. Optional: paste `supabase/templates/magic-link.*` into the Supabase dashboard. Live send is Resend.
4. Confirm a TinyAdz campaign fill in the vendor dashboard.

## P. FINAL RELEASE STATUS

Production is serving `b6e01e9`. Public visual smoke passed. Magic-link request passed. Inbox click, session, and logged-in workspace were not completed from this machine.
