# 03 — Desktop Audit

> **Use when:** you want a focused desktop-only audit (≥ 1024px viewports).

---

## Prompt (copy-paste)

> **Self-contained** — paste as a single user message; system + developer context already loaded.

```
You are the Tooolvibes UI Expert Agent in AUDIT mode (read-only), desktop-only.

Pre-flight:
- Mode: AUDIT (read-only). Dimension: desktop.
- Working directory: <repo root>.
- Tooling available: <browser yes/no, devtools yes/no, screenshots at 1024/1280/1440/1920 yes/no>.

Task:
Desktop-only audit at viewports 1024 / 1280 / 1440 / 1920.

Desktop axes (UI_AUDIT_FRAMEWORK.md §C):
- Sticky filter rail on discovery pages — exists? scroll behavior correct?
- Compare table — sticky first column + sticky header behavior.
- Tool detail — 2-column (content + sidebar) at ≥ 1024.
- Header / nav density — scales gracefully 1024 → 1920.
- Side panels on Compare / Account / Editorial article.
- Card row balance — equal height, consistent gutters, predictable rhythm.
- Hover states — used appropriately, no over-animation.
- Density vs. scanning — too dense or too sparse?
- Keyboard navigation — tab order through nav / cards / filters.
- Wide-screen whitespace — hero phrases well, not empty patches.
- Sidebar collapse / persistence.
- Scroll snap on long editorial pages (P2/P3 only).

Required output (UI_AUDIT_FRAMEWORK.md §D, scoped to desktop):
1. Header + reading plan (4–6 bullets).
2. Findings, every one with Evidence + Severity + Effort + viewport-specific QA check.
3. Findings grouped by surface, desktop-only.
4. **Cross-impact callout** — for every fix, "this does not regress mobile because <reason>."
5. Desktop-only top 3 ship-this-week.
6. Assumptions made.
7. Open questions for the human.
8. Confidence re-stated.

Hard rules:
- Every finding includes a viewport width.
- Hover is allowed; flag only when overdone or misleading.
- No new dependency. No Supabase / RLS / auth / routing edits.
- Wide viewports (≥ 1440) get their own findings, not collapsed with 1280.

For verification, walk through CHECKLISTS/desktop_qa_checklist.md after this audit.

Begin.
```

---

## Pre-conditions

- Screenshots at 1024 / 1280 / 1440 / 1920 are best. If unavailable, code review only and state so.

## Expected length

~ 30–60 desktop-specific findings.

## Success looks like

- Every finding includes a viewport width.
- Compare & Tool Detail pages are scrutinized at the 2-column layout level.
- Sticky behavior issues (filter rail, compare header, editorial progress) are clearly called out.

## Suggested follow-ups

- `CHECKLISTS/desktop_qa_checklist.md` for verification.
- `06_surgical_ui_fix.md` per top-3 picks.
