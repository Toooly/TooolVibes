# Tooolvibes UI Expert Agent

A reusable, opinionated UI/UX audit + design-system agent purpose-built for the **Tooolvibes** platform. It audits the current frontend, prescribes concrete fixes, decides what must move into Figma as a source of truth, and guides coding agents through surgical UI closure.

---

## What this package is

A standalone agent system (prompt + framework + prompts + checklists + specialist roles) that can be loaded into any coding or design tool to:

1. **Audit** the live Tooolvibes UI with P0–P3 severity.
2. **Prescribe** concrete fixes (location, why, how, classification, QA check).
3. **Decide Figma vs. code** — what becomes a Figma source-of-truth component, what is a visual reference only, and what stays code-only.
4. **Drive the final UI closure pass** without rewriting working code or breaking Supabase/auth/data logic.

It is opinionated, operational, and front-end aware — not a generic "make it cleaner" rubric.

---

## When to use it

Trigger this agent whenever you need any of the following for Tooolvibes:

- Full UI audit (desktop + mobile).
- Component / design system audit.
- Figma extraction plan (what must be redesigned in Figma).
- Surgical UI fixes (small, safe, isolated changes).
- Final UI closure pass before launch or milestone.
- Specialist sub-reviews (visual, UX flow, system, mobile, conversion, Figma handoff, frontend review).

Do **not** use it to rewrite backend, auth, database, billing, or non-UI logic. It is purely UI/UX + design-system scoped.

---

## How to use it across tools

### MiniMax Code (Mavis / OpenCode / Cursor-like)
- Drop the contents of `TOOOLVIBES_UI_EXPERT_AGENT.md` into the agent's system prompt slot.
- Optionally also append `TOOOLVIBES_PRODUCT_CONTEXT.md`, `UI_AUDIT_FRAMEWORK.md`, `FIGMA_HANDOFF_FRAMEWORK.md`, and `IMPLEMENTATION_PLAYBOOK.md` for full context.
- Then load a prompt from `PROMPTS/` as the user message.

### Codex / Kimi / other coding agents
- Same procedure: copy the same prompt set into the model's system + developer + user slots.
- The prompts are tool-agnostic and do not assume MiniMax-only syntax.

### OpenCode / Aider / Devin / Gemini CLI
- Treat this folder as the agent definition. The package is plain markdown — no proprietary format.

### Best-practice wiring
- **System slot:** `TOOOLVIBES_UI_EXPERT_AGENT.md` + `TOOOLVIBES_PRODUCT_CONTEXT.md`.
- **Developer slot (or always-on context):** `UI_AUDIT_FRAMEWORK.md` + `FIGMA_HANDOFF_FRAMEWORK.md` + `IMPLEMENTATION_PLAYBOOK.md`.
- **User slot:** one prompt from `PROMPTS/` plus the relevant `CHECKLISTS/*.md` inline or referenced.
- **Optional:** enable specialist files in `AGENT_TEAM/` when you want to delegate a single dimension (e.g. only mobile, only conversion).

---

## Folder map

```
tooolvibes-ui-expert-agent/
├── README.md                          ← this file
├── TOOOLVIBES_UI_EXPERT_AGENT.md      ← main system prompt (load this first)
├── TOOOLVIBES_PRODUCT_CONTEXT.md      ← product & brand context
├── UI_AUDIT_FRAMEWORK.md              ← audit method + severity model
├── FIGMA_HANDOFF_FRAMEWORK.md         ← Figma vs. code classification
├── IMPLEMENTATION_PLAYBOOK.md         ← coding-agent rules of engagement
├── PROMPTS/
│   ├── 01_full_ui_audit.md
│   ├── 02_mobile_audit.md
│   ├── 03_desktop_audit.md
│   ├── 04_component_system_audit.md
│   ├── 05_figma_extraction_plan.md
│   ├── 06_surgical_ui_fix.md
│   ├── 07_final_ui_closure_pass.md
│   └── 08_agent_team_mode.md
├── CHECKLISTS/
│   ├── mobile_qa_checklist.md
│   ├── desktop_qa_checklist.md
│   ├── figma_component_checklist.md
│   └── final_ui_closure_checklist.md
└── AGENT_TEAM/
    ├── visual_design_director.md
    ├── ux_flow_auditor.md
    ├── design_system_architect.md
    ├── mobile_ui_specialist.md
    ├── figma_handoff_specialist.md
    ├── frontend_implementation_reviewer.md
    └── conversion_and_trust_reviewer.md
```

---

## How the agent thinks — quick orientation

| Layer                  | Document                                | Purpose                                                                          |
| ---------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| Identity & voice       | `TOOOLVIBES_UI_EXPERT_AGENT.md`         | Who the agent is, how it speaks, hard limits.                                    |
| Product truth          | `TOOOLVIBES_PRODUCT_CONTEXT.md`         | What Tooolvibes is, who it serves, what the brand must feel like.                |
| Audit method           | `UI_AUDIT_FRAMEWORK.md`                 | Severity model, scoring axes, output format per finding.                         |
| Design -> code mapping | `FIGMA_HANDOFF_FRAMEWORK.md`            | Decides whether a thing is Figma source-of-truth, Figma reference, or code-only. |
| Coding discipline      | `IMPLEMENTATION_PLAYBOOK.md`            | Surgical edits, no rewrites, isolate mobile vs. desktop.                          |
| Workload               | `PROMPTS/*.md`                          | Copy-pasteable prompts for each common task.                                     |
| Verification           | `CHECKLISTS/*.md`                       | Manual QA — what to eyeball / click / screenshot before declaring done.          |
| Specialist subdivision | `AGENT_TEAM/*.md`                       | Sub-agent definitions for parallel / focused review passes.                       |

---

## Recommended sequence (first time onboarding)

1. **Read** `TOOOLVIBES_PRODUCT_CONTEXT.md` once to calibrate expectations.
2. **Run** `PROMPTS/01_full_ui_audit.md` against the current codebase to get a baseline.
3. **Score** findings into P0–P3 and load them into your issue tracker.
4. **Pick** the 3–5 highest-leverage Figma pieces using `PROMPTS/05_figma_extraction_plan.md`.
5. **Execute** UI fixes with `PROMPTS/06_surgical_ui_fix.md`, alternating with `CHECKLISTS/` validations.
6. **Close** with `PROMPTS/07_final_ui_closure_pass.md` once P0/P1 are clear.

For deep parallel review, fan out using `PROMPTS/08_agent_team_mode.md` and the `AGENT_TEAM/*.md` specialists.

---

## First-run checklist (do these 5 steps before the first audit)

- [ ] **Confirm the tool stack** — `package.json` shows Next.js + CSS Modules / Tailwind + Supabase + (state lib if any). Note the styling strategy so the agent respects it.
- [ ] **Confirm the test/build commands** — `npm run lint`, `npm run typecheck` (if TS), `npm run build`. Capture screenshots if `dev:browser` is available.
- [ ] **Answer (or `ASSUME:`) the 8 brand questions in `TOOOLVIBES_PRODUCT_CONTEXT.md §10`** — at minimum: accent color, light/dark default, type pair, anonymous shortlist policy.
- [ ] **Mark your read-only/edit boundary** — decide whether the first run is AUDIT-only (recommended) or includes EDIT-mode surgical fixes via `PROMPTS/06`.
- [ ] **Identify where audits will be archived** — e.g. `audits/<surface>_<round>_<date>.md`. The framework's §H assumes this path exists.

---

## Per-tool wiring recipe (copy-paste)

### MiniMax Code / OpenCode / Cursor (native sub-agents)

```
system_prompt = <contents of TOOOLVIBES_UI_EXPERT_AGENT.md>
developer_context = <contents of TOOOLVIBES_PRODUCT_CONTEXT.md> +
                    <contents of UI_AUDIT_FRAMEWORK.md> +
                    <contents of FIGMA_HANDOFF_FRAMEWORK.md> +
                    <contents of IMPLEMENTATION_PLAYBOOK.md>
user_message    = <copy a prompt from PROMPTS/*.md, replace <placeholders>>
```

If your tool supports sub-agent spawning for `08_agent_team_mode.md`, see `PROMPTS/08_agent_team_mode.md § "Per-tool invocation recipe"` for the exact spawn call.

### Codex / Codex CLI

- Paste `TOOOLVIBES_UI_EXPERT_AGENT.md` into the system slot.
- Stack the four context documents into the developer/always-on slot.
- Paste the chosen `PROMPTS/<n>_*.md` as the user message. Filled placeholders are required, not optional.

### Kimi / Kimi Code

- Same as Codex. Kimi reads system prompt + developer context natively.
- For `08_agent_team_mode.md`, dispatch each specialist as a separate chat (Recipe B in the prompt file).

### OpenCode / Aider / Devin / Gemini CLI

- Treat the package as plain markdown. Load via the tool's "system prompt" or "agent definition" file input.
- For agents without native sub-agent spawning, run specialists one by one and merge by hand (Recipe B).

---

## What the agent does NOT do

To set expectations:

- Does not write production code unless you are running `PROMPTS/06_surgical_ui_fix.md`.
- Does not build Figma frames (it produces the spec; a human designer builds).
- Does not alter Supabase / RLS / auth / routing / server actions / middleware / state stores — even in edit mode.
- Does not invent brand decisions; it states `ASSUMPTION:` instead.
- Does not produce vague findings ("improve spacing", "make it cleaner"); every finding has Evidence + Severity + Effort + Classification + QA check.

---

## Operating principles (always-on)

- **No vague advice.** Every recommendation must be implementable in a single CSS / component edit.
- **No full rewrites.** Preserve working code. Surface regressions loudly, never silently.
- **Severity always.** No bare "looks off" — every observation gets a P0–P3 tag.
- **Front-end aware.** Every fix must respect the existing stack (CSS Modules / Tailwind / Next.js / Supabase / etc. depending on what Tooolvibes actually uses; the agent should inspect `package.json` and routing before commenting).
- **Figma is a tool, not a religion.** Only recreate in Figma what needs to be a source of truth. Visual reference-only and code-only are valid outcomes.
- **Trust first.** Tool discovery platforms die from low trust. Conversion + editorial quality are weighted above purely visual polish.

---

## Out of scope

- Backend / database / API / auth rewrites.
- Marketing copy rewrites (the agent flags *where* copy needs work, but does not write the copy itself unless asked).
- SEO strategy beyond on-page UI implications.
- Full Figma file construction (this agent produces the *plan* and the *spec*; a human designer executes the Figma frames).

---

## Versioning

This is v1.0 of the agent package. Update by editing files in place and bumping the version footer of `TOOOLVIBES_UI_EXPERT_AGENT.md`.

