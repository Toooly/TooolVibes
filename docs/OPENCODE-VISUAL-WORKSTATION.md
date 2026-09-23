# OpenCode Visual Workstation (TooolVibes)

## The vision path (proven)

The `read` file tool CANNOT ingest PNGs in this environment
(`Bun is not defined`, including for subagents). The working vision path is:

1. Serve the PNG over localhost: `python3 -m http.server <port> --directory <dir>`.
2. Load it with the `webfetch` tool (`format: text`).
3. The model receives the image pixels (verified: described layout, card
   geometry, nav labels, cream-vs-dark regions from pixels alone).

Golden Masters live project-local at `.opencode/golden-masters/`
(13 files, all 390x844). Never fabricate a missing reference.

## Browser control

- `agent-browser` CLI (v0.33.1, installed): open/snapshot/click/fill/
  screenshot/resize. Skill: `agent-browser` (registry).
- Project MCP `playwright` (`opencode.json`) points at
  `scripts/ui-workstation/playwright-mcp-stdio.mjs`, a stdio shim backed
  by agent-browser (no Playwright browser cache exists here, so the
  official `@playwright/mcp` cannot launch).
- Viewports: primary 390x844; QA 375x812, 430x932, 768x1024, 1440x1000.

## Scripts

- `scripts/ui-workstation/ui-capture.mjs`: deterministic capture
  (fonts/hydration wait, consent dismiss, sheet/footer actions) + JSON
  provenance sidecar (git_sha, runtime_sha, route, viewport, scrollY,
  timestamp, pid, port, state, evidence_type, page errors).
- `scripts/ui-workstation/ui-pair.mjs`: LEFT golden master / RIGHT
  implementation pair at identical size/scale (PIL, no stretching).
- `scripts/ui-workstation/playwright-mcp-stdio.mjs`: MCP server for
  browser_open/viewport/snapshot/click/screenshot/close.

## Loop

golden-master-ui -> visual-regression -> implement -> ui-capture ->
visual-reviewer compares -> iterate -> qa-reviewer (responsive +
accessibility + provenance) -> single-SHA evidence.

If image input fails at any point: STOP. No OCR/DOM substitution.
