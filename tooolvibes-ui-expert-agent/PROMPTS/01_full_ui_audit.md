# 01 — Full UI Audit

> **Use when:** you want the agent to inspect the entire Tooolvibes UI surface and produce a prioritized backlog.

---

## Prompt (copy-paste)

> **Self-contained** — paste as a single user message; system + developer context already loaded.

```
You are the Tooolvibes UI Expert Agent in AUDIT mode (read-only).

Pre-flight (state these in your header before any findings):
1. Mode: AUDIT (read-only).
2. Working directory: <repo root or path>.
3. Stack inferred from package.json: <paste excerpt or write "infer from repo">.
4. Tooling available: <browser yes/no, screenshots yes/no, lint command, build command>.
5. Confidence target: HIGH (file:line anchored) / MEDIUM / LOW.

Task:
Run a FULL UI audit of the Tooolvibes codebase.

Scope:
- Every primary route (home, discovery, tool detail, compare, shortlist, editorial, account, login, 404).
- Every primitive component in use (Button, Badge, Card, Input, Modal, Sheet, Tooltip, Toast, Tabs, Avatar).
- Viewports: 375 (mobile) and 1280 (desktop) where applicable; tablet 768 and wide 1440+ where the surface exists.
- Static analysis + rendered-output reasoning (no live browser unless available).
- Cross-check against the brand principles in TOOOLVIBES_PRODUCT_CONTEXT.md.

Required output (UI_AUDIT_FRAMEWORK.md §D format, exactly):
1. Header — mode + confidence + working dir + tooling.
2. Reading plan — 4–8 bullets of files/routes/greps you will inspect first.
3. Inventory snapshot — routes seen, components in use, tokens declared/used, stack inferred.
4. Executive summary — top 3 P0s, top 3 P1s, design-system gaps, effort bands.
5. Findings — every finding in the standard format. Include **Evidence** (file:line, grep, screenshot ref) and **Effort** (S/M/L) on each.
6. Findings grouped by surface.
7. Findings density flag — if ≥ 30% point to the same file/component, surface as a separate P1.
8. Recommendations — Top 3 this week, Top 3 this sprint, Top 3 polish.
9. Figma backlog — ordered, classified Figma-SoT / Figma-Reference / Code-Only.
10. Assumptions made (only if any).
11. Open questions for the human.
12. Confidence re-stated at the end.

Hard rules (binding — refuse to violate):
- No vague advice. Every finding must include a concrete element name, a number/ratio/pixel when relevant, and a "replace X with Y" fix.
- Every finding needs an Evidence anchor (file:line, grep result, or screenshot). Drop findings without evidence.
- Every finding gets P0–P3 + Classification + Effort + QA check.
- Do not modify code. You are in audit mode.
- Never propose a full rewrite, a new framework, or a new dependency.
- Never propose altering Supabase / RLS / auth / routing / server actions / middleware.
- If a brand decision is needed, raise an `ASSUMPTION:` line instead of guessing (accent, theme default, type pair, etc. — see TOOOLVIBES_PRODUCT_CONTEXT.md §10).

Begin. Output the audit in markdown.
```

---

## Pre-conditions

- The agent has read the four context documents.
- The agent has scanned `package.json`, `app/` (or `pages/`), `components/`, `styles/`, `tailwind.config.*`, `globals.*`.
- The agent has access to the rendered output (screenshots) — *if not, state this and produce a static-analysis-only report.*

## Expected length

~ 80–150 findings for a moderate-sized codebase. Trim ruthlessly — every finding must earn its place.

## Success looks like

- A human can open the report and pick the first 3 fixes to ship without further clarification.
- Every recommendation is implementable in a single PR or less.
- No category contains more than 30% of the findings without an "investigate cluster" callout.

## Suggested follow-ups

- `02_mobile_audit.md` if mobile-specific issues cluster.
- `03_desktop_audit.md` for desktop-only surfaces.
- `04_component_system_audit.md` if design-system issues are ≥ 25% of findings.
- `05_figma_extraction_plan.md` once F0/P1 are picked.
