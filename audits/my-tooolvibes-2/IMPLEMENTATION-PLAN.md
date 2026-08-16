# Implementation plan

Worktree only: `.slim/worktrees/my-tooolvibes-2` on `feature/my-tooolvibes-2`.

Do not edit main checkout product files.

## Phase overview (review gates = ds4-review when routing returns)

0. Archaeology + specs — IN PROGRESS (primary agent)
1. Persistence-safe schema + actions + tests (stacks, journal extras, merge)
2. Workspace IA/UI: Riprendi, Biblioteca, Stack, Decisioni, Attività, Settings
3. Signal visuals + cabinet + map + quiet personalization + resurfacing
4. Fixtures, visual/functional QA, gates, commit series

## Phase 1 files

- lib/discovery/types.ts, schema.ts, workspace-contract.ts
- lib/stores/tool-workspace-store.ts (rebase new fields)
- tests: workspace-contract, guest merge, decision memory
- lib/account/workspace-pipeline.ts (pure mapping + resurfacing + activity derive)
- lib/account/personalization.ts (explainable recs)
- dev fixtures under lib/account/test-fixtures.ts (not production)

## Phase 2 files

- Rebuild components/account/account-panel.tsx as workspace shell
- New components/account/workspace/* (do not create a parallel /account-v2 route)
- Rebuild account-settings-page.tsx
- Remove XP mount from account; leave lib/gamification for Radar/Arena
- Update account-panel tests to authenticated workspace, not dead guest dashboard
- CSS in app/(marketing)/account/account.css (avoid styles/account.css !important)

## Phase 3 files

- components/signal/marks/* SVG system
- Rebuild badge cabinet + signal section
- Settings personalization + quiet mode
- Optional Signal Map if it survives 390px

## Verification claims

1. Existing saved/compare/notes survive normalize + merge after schema extend.
2. Guest merge still unions slugs; new stacks union by id.
3. Authenticated /account shows Riprendi, never XP, never email-first.
4. Pipeline writes only existing stage/decision semantics.
5. Signal UI never invents SP when flags off or hub null.
6. 390 / 768 / 1440: no horizontal overflow, 44px targets, focus visible.

## Subagents to respawn after routing

- Explore: leftover CSS/route confirmation
- Pro implement: phases 1–3
- Pro review: after each implementation phase

## Commit series (when asked / at end)

1. feat(account): establish personal decision workspace
2. feat(signal): unify progression and Signal visual system
3. feat(account): add stacks decision journal and personalization
4. fix(account): close responsive persistence and accessibility QA
