# REPORT_AGENT_MARKDOWN_INVENTORY

Stato: completo. Modalita: AUDIT / PLANNING read-only.

Tutti i file `.md` presenti in `tooolvibes-ui-expert-agent/` sono stati letti e classificati. Il file `PROMPTS/06_surgical_ui_fix.md` e classificato come EDIT mode, ma non e stato eseguito.

## Vincoli trasversali rilevati

- Nessuna modifica a codice, Supabase, auth, API, middleware, routing o dati.
- Evidenza obbligatoria per ogni finding; in assenza di evidenza, marcare come ipotesi.
- Mobile e desktop separati per viewport e priorita.
- Figma SoT solo per token, primitive e pattern riusati; one-off in Figma Reference; logica e runtime in Code Only.
- `PROMPTS/08_agent_team_mode.md` richiede coordinamento tra specialisti e deduplica severita.

## Inventario file

| File | Modalita | Ruolo | Richiesta principale | Dipendenze operative |
|---|---:|---|---|---|
| `README.md` | READ | Entry point | Spiega struttura, ordine d'uso e principi | Tutti i prompt e checklist |
| `TOOOLVIBES_UI_EXPERT_AGENT.md` | READ | Agent constitution | Regole read-only, severita, output e confini | Product context, audit framework |
| `TOOOLVIBES_PRODUCT_CONTEXT.md` | READ | Product brief | Posizionamento, audience, superfici, trust model | Tutti gli audit |
| `UI_AUDIT_FRAMEWORK.md` | READ | Finding framework | Severity P0-P3, assi di audit, formato evidenza | Tutti i report di audit |
| `FIGMA_HANDOFF_FRAMEWORK.md` | READ | Figma policy | Figma SoT, Reference, Code Only, naming token | Figma reports |
| `IMPLEMENTATION_PLAYBOOK.md` | READ | Dev guardrails | Audit prima di modifiche, diff minimo, stop boundaries | Prompt 06 e backlog |
| `PROMPTS/01_full_ui_audit.md` | READ | Full UI audit | Audit completo per route, componenti, stati e trust | Framework + product context |
| `PROMPTS/02_mobile_audit.md` | READ | Mobile audit | Viewport 320/375/414/768, tap target, sticky, sheets | Mobile checklist |
| `PROMPTS/03_desktop_audit.md` | READ | Desktop audit | 1024/1280/1440/1920, compare, header, density | Desktop checklist |
| `PROMPTS/04_component_system_audit.md` | READ | Component audit | Token, primitive, varianti, divergenze | Figma framework |
| `PROMPTS/05_figma_extraction_plan.md` | READ | Figma plan | Cosa estrarre in Figma SoT/Reference/Code Only | Figma checklist |
| `PROMPTS/06_surgical_ui_fix.md` | EDIT, NOT RUN | Surgical fix | Una sola fix UI, con preflight e QA | Implementation playbook |
| `PROMPTS/07_final_ui_closure_pass.md` | READ | Closure gate | Pass/fail finale, residui, score | Final checklist |
| `PROMPTS/08_agent_team_mode.md` | READ | Team mode | Simulare specialisti, deduplicare, sintetizzare | AGENT_TEAM |
| `CHECKLISTS/mobile_qa_checklist.md` | READ | QA checklist | Touch, scroll, sticky, forms, overlays, states | Mobile audit |
| `CHECKLISTS/desktop_qa_checklist.md` | READ | QA checklist | Header, compare, keyboard, whitespace, hover | Desktop audit |
| `CHECKLISTS/figma_component_checklist.md` | READ | Figma checklist | Tokens, variants, states, naming, detachment | Figma plan |
| `CHECKLISTS/final_ui_closure_checklist.md` | READ | Release checklist | Go/no-go criteria | Closure pass |
| `AGENT_TEAM/visual_design_director.md` | READ | Specialist | Brand, hierarchy, visual polish, AI-slope risk | Visual report |
| `AGENT_TEAM/ux_flow_auditor.md` | READ | Specialist | Discovery, decision, compare, save, account flows | UX flow report |
| `AGENT_TEAM/design_system_architect.md` | READ | Specialist | Tokens, primitives, component governance | DS/component reports |
| `AGENT_TEAM/mobile_ui_specialist.md` | READ | Specialist | Mobile-first ergonomics and viewport issues | Mobile report |
| `AGENT_TEAM/figma_handoff_specialist.md` | READ | Specialist | Figma SoT/Reference/Code Only split | Figma report |
| `AGENT_TEAM/frontend_implementation_reviewer.md` | READ | Specialist | Frontend risk and implementation safety | Frontend risk report |
| `AGENT_TEAM/conversion_and_trust_reviewer.md` | READ | Specialist | Trust, affiliate, source, conversion clarity | Trust report |

## Output generato

Tutti i report sono stati creati in `tooolvibes-ui-expert-agent/REPORTS/` e iniziano con `REPORT_AGENT_`.
