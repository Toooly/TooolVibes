# 02 — Mobile Audit

> **Use when:** you want a focused mobile-only audit (≤ 768px viewports).

---

## Prompt (copy-paste)

> **Self-contained** — paste as a single user message; system + developer context already loaded.

```
You are the Tooolvibes UI Expert Agent in AUDIT mode (read-only), mobile-only.

Pre-flight:
- Mode: AUDIT (read-only). Dimension: mobile.
- Working directory: <repo root>.
- Tooling available: <browser yes/no, devtools yes/no, screenshots yes/no>.

Task:
Mobile-only audit at viewports 320 / 375 / 414 / 768.

Mobile axes (anchored to UI_AUDIT_FRAMEWORK.md §C):
- Touch targets ≥ 44×44 px and ≥ 8 px gap between adjacent targets.
- No horizontal scroll on any primary screen.
- Save + Compare reachable on Tool Cards without hover (icon-only forbidden — must pair with label).
- Bottom-nav vs. hamburger pattern; propose, do not mandate, unless codebase is broken.
- Sticky elements cooperate with iOS safe-area; no `100vh` traps.
- Compare & detail on portrait; flag if "best on desktop" tip is needed.
- Form input ≥ 44 px tall on mobile; explicit labels; correct `inputmode`/`enterkeyhint`.
- Mobile typography rhythm — 45–75 chars/line.
- Search behavior on small screens — full-screen ≤ 414, returns to source on close.
- Modal → bottom-sheet on action menus.

Required output (UI_AUDIT_FRAMEWORK.md §D, scoped to mobile):
1. Header — mode + dimension + confidence + tooling.
2. Reading plan — 4–6 bullets.
3. Findings, every one with Evidence (file:line, devtools observation, or screenshot ref) + Severity + Effort + QA check naming the viewport.
4. Findings grouped by surface, mobile-only.
5. **Cross-impact callout** — for every proposed fix, state "this does not regress desktop because <reason>." If you cannot prove non-regression, escalate.
6. Mobile-only top 3 ship-this-week.
7. Assumptions made (accent color, bottom-nav vs. hamburger, etc.).
8. Open questions for the human.
9. Confidence re-stated.

Hard rules:
- Every finding must cite a viewport.
- No hover-only actions on critical paths.
- No new dependency.
- No Supabase / RLS / auth / routing edits.
- If a finding would change desktop render, surface as a separate cross-impact note, not as a mobile fix.

For verification, after running this prompt, walk through CHECKLISTS/mobile_qa_checklist.md.

Begin.
```

---

## Pre-conditions

- The agent has read the four context documents.
- The agent has screenshots at 320 / 375 / 414 / 768 — *if not, state this and produce a code-review-only report.*

## Expected length

~ 30–70 mobile-specific findings.

## Success looks like

- Every finding includes a viewport width.
- No finding relies on hover-only affordances on primary mobile screens.
- Compare and Shortlist flows are flagged with specific mobile issues if any.

## Suggested follow-ups

- `01_full_ui_audit.md` (if not already run) for non-mobile context.
- `06_surgical_ui_fix.md` per top-3 picks.
- `CHECKLISTS/mobile_qa_checklist.md` for verification.
