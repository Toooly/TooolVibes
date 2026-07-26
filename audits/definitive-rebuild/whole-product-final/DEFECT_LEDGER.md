# Defect and closure ledger

## Closed in this reconstruction

| Area | Defect | Closure |
| --- | --- | --- |
| Global shell | desktop search was decorative | bound to the real command palette |
| Global shell | mobile search had no product action | opens the command palette |
| Global shell | sound/music controls did not expose reliable state changes | functional toggles with accessible labels |
| Mobile navigation | inconsistent order and non-canonical destinations | Home, Catalogo, Radar, Salvati, Confronto |
| Fixed surfaces | bottom navigation remained visible under search | overlay suppression and entrance-animation cancellation |
| Hydration | page transition could produce server/client entrance divergence | initial transition disabled on hydration |
| Home | duplicated/ad-hoc score logic and simulated score bars | canonical editorial score and factual winner facts |
| Archive | URL query/group/level were not restored into the client owner | complete initial-state binding |
| Archive/tablet | filter chips could shrink or clip | non-shrinking 44px controls and controlled wrapping |
| Compare | battle score and editorial score were visually conflated | both retain their own explicit scale |
| Saved | suggestion form competed with the primary empty/populated state | collapsed native disclosure |
| Collections | generic cards were too tall inside collection slots | compact collection card variant |
| Account | wide layout lacked decision context | functional form plus contextual desktop split |
| Typography | metadata and generated labels fell below the 12px floor | token and local owner corrections |
| Intro | cinematic could mount outside Home | route-scoped mount contract |

## Remaining non-product conditions

- The full unit suite has 24 inherited expectation failures across seven legacy
  groups. The final run collected 1,014 tests and introduced no new failure
  group; one prior typography-floor failure is now fixed. Details are in
  `VALIDATION_LEDGER.md`.
- The preferred `agent-browser` executable is absent; Playwright was used for
  equivalent rendered-browser validation.
- An untracked internal Visual Lab prototype imports an untracked missing CSS
  file and blocks repository-wide builds if included by Next. It was moved only
  for the build process and restored byte-for-byte. It is excluded from staging
  and production.
- Live deployment evidence is recorded separately in
  `DEPLOYMENT_SNAPSHOT.md`.

No unresolved defect was found in the reconstructed public journey during the
final responsive, interaction, keyboard or visual passes.
