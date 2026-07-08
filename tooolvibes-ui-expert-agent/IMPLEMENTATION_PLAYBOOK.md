# Implementation Playbook — Tooolvibes UI

> **Bind this to every coding agent that touches Tooolvibes UI.** It is the contract between the audit/Figma side and the engineering side. The goal: ship UI improvements without regressing working code, data, or auth.

---

## 1. The five principles

1. **Audit before modifying.** Read the relevant files and rendered output before writing a single line.
2. **Smallest diff that fixes the issue.** If a 2-line CSS edit resolves it, do not refactor the file.
3. **Preserve behavior, accessibility, and styling for everything not in scope.** Regressions are bugs, not side effects.
4. **Mobile and desktop changes isolated when the codebase supports it.** No cross-contamination.
5. **Never touch data, auth, RLS, or routing logic** unless explicitly asked, and even then only with a safety note.

---

## 2. Pre-flight checklist (run before every change)

Hard rule: **you do not start editing until every box below is verified.** If any box fails, your first action is to gather the missing information — not to edit speculatively.

- [ ] **Read the file(s) in full** that you intend to modify. Never edit a file you have not fully read.
- [ ] **Capture a screenshot** of the current state at the relevant viewport(s), before the edit, if the agent has screenshot capability. Save it to `.ui-evidence/<finding-id>-before.png`.
- [ ] **Read the parent layout / shared CSS / token file.** Confirm whether the fix belongs in a token, a primitive, or the call site.
- [ ] **Confirm the file path and route map** with `package.json`, `app/`, or `pages/`.
- [ ] **Confirm there is no shared component** that already does what you need. If there is, use it.
- [ ] **Confirm the rendered output** in a browser at the target viewport(s). If the agent has no browser, state so explicitly and reduce confidence.
- [ ] **Confirm the change does not bleed across breakpoints** (mobile 320 / 375 / 414 / 768, desktop 1024 / 1280 / 1440 / 1920 — list the ones you actually checked).
- [ ] **Confirm the change does not require a new dependency** (see §8).
- [ ] **Confirm the change does not modify any Supabase call, RLS policy, auth handler, route handler, server action, middleware, or shared state store** (see §7).
- [ ] **Confirm no brand decision is involved** (accent color, type pair, radius, shadow name, spacing scale). If yes → §12.
- [ ] **Capture a "before" snippet** of the exact CSS / JSX / config you are about to change, so the diff is reversible by `git checkout` alone.
- [ ] **Run lint and (if fast) build before declaring done.** If neither is feasible in the current environment, state that.

If any of those cannot be confirmed, stop and ask one targeted question. Do not edit.

---

## 3. The 8 rules of surgical edits

### Rule 1 — Touch the smallest surface

If the bug is in `ToolCard.tsx`, do not edit its parent `DiscoveryGrid.tsx` "while you're there". File a follow-up.

### Rule 2 — Diff by intent, not by aesthetics

Write the commit message and PR description **before** writing the code. If you cannot articulate the intent in one sentence, the change is too big.

### Rule 3 — Tokenize first, restyle second

If the existing code uses hex values inline and you need to change them, **first** introduce a token (CSS variable, Tailwind theme entry, JS export) and **then** reference it. Never inline a new hex.

### Rule 4 — Preserve accessibility contract

Do not remove ARIA, focus styles, keyboard handlers, or skip-to-content. Re-test them after the change.

### Rule 5 — Do not delete a class to fix a layout

If the issue is a layout bug, fix it via the existing class or add a new one. Removing classes often breaks other call sites.

### Rule 6 — One CSS rule = one purpose

If a rule is doing five things, split it. If a layout can't be expressed in one rule, that's a sign of a missing token or missing component — surface this.

### Rule 7 — Reusable > bespoke

If you write the same media-query block twice, abstract it. If you find yourself writing it three times, the abstraction belongs in a tokens file.

### Rule 8 — Never disable a lint rule to make a fix go through

Fix the lint, don't silence it.

---

## 4. Pattern: introducing a token

Step-by-step for adding a design token (color, space, radius, shadow) to an existing codebase.

1. **Locate the token home.** Check `tailwind.config.*`, `theme.*`, `globals.css`, `:root` variables, `tokens.ts`.
2. **Add the token** with a semantic name, not a visual one.
   - ✅ `color-surface-raised`, `--radius-md`, `--space-3`
   - ❌ `--purple-blue`, `--roundy-corner`, `--spacing-15px`
3. **Reference the token** at the call site.
4. **Refactor one file at a time** — do not bulk-rename.
5. **Visually verify** the change is a no-op (token == old value).
6. **Commit.** Then move to the next file.

Never refactor and apply a visual change in the same commit.

---

## 5. Pattern: introducing a primitive component

1. **Audit existing call sites.** Find every place that renders the same primitive today (e.g. button).
2. **Extract** to a new file in `components/ui/` or equivalent.
3. **Migrate call sites one at a time.**
4. **Render diff visually identical** at each step. The migration is a refactor; visuals must not change.
5. **Once all sites use the primitive**, *then* (and only then) ship a visual refresh on top.

The principle: **first unify, then refine.** Do not redesign while unifying.

---

## 6. Mobile vs. desktop isolation

Different codebases express this differently. The pattern the agent should aim for:

```ts
// Pseudo
const isMobile = useBreakpoint('< 768');
// OR
// Route-level: components/ToolCard.mobile.tsx + components/ToolCard.desktop.tsx
```

Hard rules:

- A change to mobile-specific code must not affect the desktop render.
- A change to desktop-specific code must not affect the mobile render.
- If the codebase lacks an explicit split, prefer using **CSS media queries** in a shared component over duplicating the component file. If duplication is unavoidable, document it.

---

## 7. State and data safety

The agent must treat these areas as out of bounds unless the user has explicitly authorized editing them in the current task:

- **Supabase queries** — `supabase.from(...)`, `.insert`, `.update`, `.delete`, `.rpc(...)`, any client file calling supabase.
- **RLS policies** — any SQL or migration file under `supabase/`, `migrations/`, or wherever migrations live.
- **Auth flows** — `auth.signIn`, `useAuth`, session handling, OAuth callbacks.
- **API route handlers** — `app/api/**/route.ts`, `pages/api/**`, server actions (`"use server"`).
- **Middleware** — `middleware.ts`, `middleware.js`, Next.js config that intercepts requests.
- **State stores and mutation keys** — Zustand stores, Redux slices, React Query mutation keys, MobX, Jotai atoms that own persisted data.
- **Webhook handlers** — anything consuming external events.
- **Background jobs / cron entries** — including scheduled tasks that read or write data.

A UI change may *trigger* these (e.g. clicking "Save" calls a mutation) but must not *alter* them. If the UI change strictly requires altering one of these, see §12 — STOP and escalate.

Visual diagnostic commands are allowed (read-only `select`, no `update`/`delete`).

---

## 8. Dependency policy

No new dependencies for UI work unless one of the following is true:

- It replaces 200+ lines of bespoke code.
- It is a recognized industry-standard with a stable API (e.g. Headless UI, Radix, Framer Motion, Lucide, Tailwind).
- Its bundle impact is reviewed and approved.

When proposing a dependency, the agent must surface:

- Name + latest stable version
- Bundle weight (gzipped) and tree-shakeable
- License
- Maintenance signal (last commit, open issues count)
- Why nothing in the existing stack does the job

---

## 9. QA gates the coding agent must run

After every change:

1. **Lint** (`npm run lint` or equivalent).
2. **Type check** (if TypeScript): `tsc --noEmit` or `next build` dev-only.
3. **Build** when feasible (`next build` or `npm run build`).
4. **Manual visual check** at the relevant viewport(s).
5. **Keyboard + screen reader check** for any component with focusable / interactive elements.
6. **Screenshots** before/after for the change surface, attached to the PR.

If lint, type check, or build fails, fix it before handing off.

---

## 10. Reporting template (for a coding agent handing back to the human)

```md
# UI Change Report — <scope>

## What changed
- <file:line or component> — <intent>
- <file:line or component> — <intent>

## Why
- <one sentence tying back to the audit finding ID>

## What did NOT change
- <file(s) preserved as-is on purpose>

## Tokens touched
- <token name> — <source>

## QA performed
- [ ] Lint
- [ ] Type check
- [ ] Build
- [ ] Visual @ 375
- [ ] Visual @ 768
- [ ] Visual @ 1280
- [ ] Keyboard navigation
- [ ] Screenshots attached

## Risk / regressions
- <none, or a single-line note>

## Follow-ups
- <optional P2/P3 discovered during the fix>
```

If the change is more than 3 files, the report must include a 1-line summary of why a larger scope was unavoidable.

---

## 11. Refactor boundaries

When the agent is tempted to "clean up":

- A refactor must be in its own commit. UI logic changes never piggyback on a refactor.
- A refactor must be visually a no-op.
- A refactor must not exceed 1 day of work without a checkpoint with the human.
- If a refactor reveals a bug, file the bug separately. Do not fix it mid-refactor.

---

## 12. When to STOP and ask the human

The agent must stop and ask the human **before** continuing if any of the following is true:

- A **new dependency** is needed.
- A **Supabase / RLS / auth / API / route-handler / server-action / middleware / state-store** change is required.
- A **brand decision** conflicts with an existing human-made decision (e.g. "the brand accent should be violet, but the codebase already uses lime in 14 components — which wins?"). Do not silently override either side; ask.
- A **non-UI change** is needed to enable a UI change (e.g. a new schema column).
- The change **exceeds 50% of a single file**, **spans > 5 files**, or **crosses a folder boundary** (e.g. moves a primitive from one component folder to another).
- A **Figma-SoT acceptance criterion** (§10 in `FIGMA_HANDOFF_FRAMEWORK.md`) is missing on a primitive the change depends on.
- A **trust / dark-pattern concern** emerges (fake counts, deceptive CTAs). Pause and ask; do not ship.
- A **state store / server-action edit is the only way to ship** a UI change. The fix belongs in a different PR owned by backend, not in the UI PR.
- An **inconsistency between rendered output and Figma-SoT** is discovered that is not in scope. File it, do not fix it in this PR.

Otherwise: proceed, report, ship.

---

## 13. Brand-decision stop (specific case extracted from §12 for emphasis)

Brand decisions are decisions the human owns. The agent must stop and ask — not assume — when the proposed change touches any of these:

- Final accent color (e.g. is it violet or lime?).
- Light vs. dark default theme.
- UI vs. display type pairing and licensing.
- The set of radius values or the set of spacing values.
- Whether the brand allows gradients on functional UI.
- Whether the brand allows 3rd-party icon libraries (Lucide vs. Tabler vs. bespoke).
- Whether the brand uses badges to mark "Trending", "New", "Editor's pick", or "Sponsored".

For each of these, the agent's default is to **record a question, propose a token-bound placeholder (e.g. `--color-accent-primary: ASSUMPTION: violet — confirm`), and ship nothing** until the human confirms. Locking these answers is a precondition for closing P1 design decisions; see `TOOOLVIBES_PRODUCT_CONTEXT.md §10`.
