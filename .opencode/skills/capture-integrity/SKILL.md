# capture-integrity

Prevent stale-server / wrong-SHA evidence errors.

Every screenshot MUST have a JSON sidecar with:

- git_sha (from `git rev-parse HEAD`)
- runtime_sha (from /api/release or harness marker)
- route, viewport (e.g. 390x844), scrollY (must be 0 for first-viewport)
- timestamp, server_pid, server_port
- state/entity (production, visual-harness fixture, auth state)
- evidence_type (production | visual-harness)
- page errors (console/pageerror list, empty expected)

## Invariants

- CODE STATE = BUILD = RUNTIME = SCREENSHOT.
- One server only; verify the port is free before starting.
- Confirm runtime_sha == git_sha before capturing release evidence.
- Never silently reuse files: new SHA -> new captures.
