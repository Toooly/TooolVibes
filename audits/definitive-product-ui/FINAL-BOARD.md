# FINAL-BOARD — definitive product UI

Date: 2026-08-16
Branch: `ui/definitive-product-system`
Lane: `.slim/worktrees/definitive-product-system`
Base at start: `348287916a30b71adf3b5036105e74b80f7a557e`

## Commits

1. `9ffa6c3` refactor(ui): unify TooolVibes visual system
2. `19190b4` refactor(ui): migrate account and Control Center legacy surfaces
3. `23805a3` refactor(ui): migrate Control Center editors and commercial surfaces
4. leftover-surface commit (this working tree): admin-login / universe canvas / shortlist+compare empty

## Claim

One dark product system across public chrome, account/auth, and Control Center. Ivory remains only on intentional Decision Desk surfaces (home editorial, archivio, guides, `.ivory-surface`).

## Evidence

### Gates (Node 22.23.1)

- `npm run typecheck` pass
- `npm run lint:ci` pass (`--max-warnings=0`)
- `npm run check:styles` pass
- `npm test` 1861 passed / 32 skipped
- `npm run build` Next 15.5.22 standalone pass

### Screenshot matrix

Local standalone `http://127.0.0.1:3000` after rebuild. Files in `audits/definitive-product-ui/shots/` (untracked binaries).

| Surface | 390 ivory | 768 ivory | 1440 ivory | Verdict |
|---|---:|---:|---:|---|
| home | 0.9% | 0.1% | 3.4% | dark cockpit kept |
| shortlist empty | 0.1% | 0.0% | 0.0% | fossil removed (was ~60%) |
| compare empty | 2.2% | 5.8% | 1.8% | fossil removed (was ~20%) |
| account/auth | 0.1% | 0.0% | 0.0% | dark |
| admin-login | 0.0% | 0.0% | 0.0% | dark (was lavender wash) |
| radar | 0.8% | 0.1% | 0.0% | dark |
| posts | 0.0% | 0.5% | 5.1% | dark + small editorial |
| archivio | 36.7% | 17.6% | 20.6% | accepted Decision Desk |
| collections | 21.0% | 30.3% | 29.9% | accepted public desk |

### What was left on purpose

- `--tv-color-surface-inverted: #f4f0e7` stays the ivory Decision Desk token
- `public-routes.css` still force-ivory `.brand-panel` / `.stat-block` inside `.marketing-shell`
- `archive-v4.css`, `definitive-home.css`, `guides.css` ivory editorial cards
- No `class="dark"` on `<html>` (would activate conflicting shadcn `.dark` tokens)

### Limits

- Authenticated Control Center was not re-shot locally: `TOOOLVIBES_ADMIN_*` lives in worker secrets, not `.env.local`. Do not write those values into git/env/audits.
- `cloudflare:build` re-patches `next/dist/server/next-server.js` (OpenNext). Local standalone QA used official Next 15.5.22.
- Cookie consent first paint can inflate ivory %; matrix measured after dismiss / without the dialog in tree.

## Residual risk

Globals still contain unused/legacy lavender rules for old mobile home/catalog classes. They are overridden on current home (measured dark). Full `globals.css` history purge was not done to avoid rewriting live Decision Desk CSS.
