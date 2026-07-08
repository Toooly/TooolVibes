# 08 — Agent Team Mode

> **Use when:** you want to fan out a UI review across specialist sub-agents in parallel (visual, UX flow, design system, mobile, Figma, frontend review, conversion).

---

## How this prompt works

Rather than issuing one giant audit, you spawn 2–7 specialist agents in parallel, each given:

- this `TOOOLVIBES_UI_EXPERT_AGENT.md` as the system prompt,
- the relevant context documents,
- one specialist file from `AGENT_TEAM/`,
- one focused prompt from `PROMPTS/` (typically `01_full_ui_audit.md` scoped to their dimension),
- a constraint to produce a single, sortable report.

Then **you, the orchestrator**, merge the outputs into a unified backlog with P0–P3 prioritization and Figma-SoT extraction.

### Per-tool invocation recipe

The exact invocation differs by coding agent. Pick the one that matches your tooling.

#### Recipe A — MiniMax Code / OpenCode / agents with native sub-agent spawn

```
// Pseudo — adapt to your tool's exact API
spawn_agent(
  system_prompt = <contents of TOOOLVIBES_UI_EXPERT_AGENT.md>,
  context_docs   = <contents of TOOOLVIBES_PRODUCT_CONTEXT.md,
                    UI_AUDIT_FRAMEWORK.md,
                    FIGMA_HANDOFF_FRAMEWORK.md,
                    IMPLEMENTATION_PLAYBOOK.md,
                    AGENT_TEAM/<specialist>.md>,
  user_prompt    = "Run a focused audit for the <specialist> dimension only.
                    Limit your findings to <list from AGENT_TEAM/<specialist>.md>.
                    Use UI_AUDIT_FRAMEWORK.md §D output format exactly.
                    Stay strictly within your dimension.
                    End with: top 3 shippable fixes, top 3 Figma-SoT candidates,
                    open questions, and the Confidence line."
)
```

Repeat for each chosen specialist, in parallel.

#### Recipe B — Codex / Codex CLI / Aider (no native sub-agent spawn)

Run each specialist as an independent prompt, then merge by hand:

1. Open chat A with system = TOOOLVIBES_UI_EXPERT_AGENT.md + context docs + AGENT_TEAM/visual_design_director.md.
2. Paste the user prompt above.
3. Save the report as `audits/visual_<date>.md`.
4. Repeat for `ux_flow_auditor`, `design_system_architect`, `mobile_ui_specialist`, `figma_handoff_specialist`, `frontend_implementation_reviewer`, `conversion_and_trust_reviewer`.
5. Merge the seven reports into `audits/backlog_<date>.md` per the dedup + severity-bump rules below.

#### Recipe C — Kimi / Gemini CLI (sub-agent via tool calls)

Use the model's tool-call surface if it supports dispatching parallel reviewers. Otherwise fall back to Recipe B.

---

## Prompt (copy-paste — orchestrator)

```
You are the orchestrator. Spawn the Tooolvibes UI Expert Agent in team mode.

Inputs:
- TOOOLVIBES_UI_EXPERT_AGENT.md
- TOOOLVIBES_PRODUCT_CONTEXT.md
- UI_AUDIT_FRAMEWORK.md
- FIGMA_HANDOFF_FRAMEWORK.md
- IMPLEMENTATION_PLAYBOOK.md

Working directory: <repo root or path>.

Tasks:

1. Spawn N sub-agents in parallel, each with:
   - System prompt: the contents of TOOOLVIBES_UI_EXPERT_AGENT.md
   - Context docs: TOOOLVIBES_PRODUCT_CONTEXT.md, UI_AUDIT_FRAMEWORK.md, FIGMA_HANDOFF_FRAMEWORK.md, IMPLEMENTATION_PLAYBOOK.md
   - Specialist file: one of AGENT_TEAM/<name>.md
   - Scoped prompt: a copy of 01_full_ui_audit.md trimmed to that specialist's dimension + the additional "what to inspect" list from the specialist file.

2. Use these specialist slots, picking by need:
   - AGENT_TEAM/visual_design_director.md
   - AGENT_TEAM/ux_flow_auditor.md
   - AGENT_TEAM/design_system_architect.md
   - AGENT_TEAM/mobile_ui_specialist.md
   - AGENT_TEAM/figma_handoff_specialist.md
   - AGENT_TEAM/frontend_implementation_reviewer.md
   - AGENT_TEAM/conversion_and_trust_reviewer.md

3. Each sub-agent must:
   - Cover ONLY its specialist dimension.
   - Produce findings in the UI_AUDIT_FRAMEWORK.md §D format.
   - End with: top 3 shippable fixes, top 3 Figma-SoT candidates, open questions.

4. Aggregate the findings:
   - Deduplicate (same root cause across specialists → one finding, multiple tags).
   - Re-score severity: a finding raised by ≥ 2 specialists bumps P2 → P1, P1 → P0.
   - Cross-check Figma-SoT candidates against FIGMA_HANDOFF_FRAMEWORK.md decision tree.
   - Produce a consolidated report (single markdown file).

5. Output deliverables:
   - Consolidated backlog: <path>/audits/backlog_<date>.md
   - Top 5 P0s: <path>/audits/top5_<date>.md
   - Figma extraction seed (subset of 05_figma_extraction_plan.md): <path>/audits/figma_seed_<date>.md

Hard rules:
- Specialists cannot contradict each other without a human-escalation flag.
- Aggregator does not add findings — only dedupes, scores, and orders.
- Conflicts in scope (e.g. mobile vs. desktop disagreement) → escalate to the human.
```

---

## Spawning pattern (per specialist sub-agent)

### System prompt

```
<contents of TOOOLVIBES_UI_EXPERT_AGENT.md>
```

### Developer / always-on context (paste in this order)

```
<contents of TOOOLVIBES_PRODUCT_CONTEXT.md>
<contents of UI_AUDIT_FRAMEWORK.md>
<contents of FIGMA_HANDOFF_FRAMEWORK.md>
<contents of IMPLEMENTATION_PLAYBOOK.md>
<contents of AGENT_TEAM/<specialist>.md>
```

### User prompt

```
You are the Tooolvibes UI Expert Agent in AUDIT mode (read-only), scoped to the <specialist> dimension only.

Pre-flight (state in your header):
- Mode: AUDIT (read-only). Dimension: <specialist>.
- Working directory: <repo root>.
- Confidence target: HIGH / MEDIUM / LOW.

Limit your findings to the "what to inspect" list in AGENT_TEAM/<specialist>.md. Anything outside that list, file as a single line:
"OUT-OF-DIMENSION: <observation> — refer to <other specialist or visual_design_director or design_system_architect>."

Use UI_AUDIT_FRAMEWORK.md §D output format exactly. Every finding needs:
- Evidence (file:line, grep, screenshot).
- Severity P0–P3 + Classification + Effort + QA check.

End with:
- Top 3 shippable fixes (smallest viable diff).
- Top 3 Figma-SoT candidates within your dimension.
- Open questions for the human.
- Confidence re-stated at the end.

Hard rules:
- Never edit code.
- Never propose new dependencies.
- Never alter Supabase / RLS / auth / routing.
- If you find density (≥ 30% in one component), surface as a P1 architectural note.

Begin.
```

---

## Recommended fan-outs

### Small team (3 agents)
- design_system_architect
- mobile_ui_specialist
- conversion_and_trust_reviewer

### Full team (7 agents)
- All seven specialists, in parallel, then aggregate.

### Periodic review
- 2-agent pulse: visual_design_director + design_system_architect. Run weekly.

---

## Success looks like

- Consolidated report deduplicated, with cross-specialist findings visibly tagged.
- Figma seed is Figma-SoT-only and respects the dependency order (tokens → primitives → hero pages).
- Top 5 P0s ship in 1–2 weeks.
