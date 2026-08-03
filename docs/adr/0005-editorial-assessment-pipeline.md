# ADR 0005: Editorial assessment pipeline (canonical score resolver)

- Status: Accepted
- Date: 2026-08-03
- Decision scope: runtime score resolution, single source of truth, editorial approval workflow

## Context

`DirectoryTool` (the static directory) has no defensible score input, so per
ADR 0001 (DATA-201) its `ToolPublic.score` is `null` even when the tool is
`featured` or `advanced`. This is correct: it prevents synthetic public scores
from being created from `level`, `featured`, popularity, or marketing copy
(commit `ab5ae91 fix(trust): remove synthetic public scores and paid claims`).

Confronto and Arena need a single, verifiable source of truth for the public
score. The previous UI work exposed this gap: 4 surfaces (Archive, Tool
Detail, Compare, Arena) used different adapters and each one independently
re-evaluated the score, so a verified score (e.g. Blink 8.4) could be visible
in some surfaces and not in others.

A canonical resolver must:

1. Produce a single `ToolPublic.score` per slug.
2. Be `verified` (not `derived`, not `draft`) when published.
3. Carry full provenance: source field, methodology version, assessor,
   assessment date, evidence, limitations.
4. Reject synthetic, legacy, fixture, mock and draft inputs.
5. Be approval-gated: no draft may flow into production without a
   TooolVibes Editorial sign-off.

The full methodology (scoring scale, weights, formula, rounding, tie
threshold, validity, process) is editorial, not technical. It belongs in
the editorial workspace, not in the application repository.

## Decision

### Single canonical resolver

A new directory `lib/data/editorial-assessments/` becomes the single
source of truth for verified scores. Only assessments with
`approvalStatus: "approved"` and all required metadata enter the runtime.

The resolver is `getApprovedAssessmentBySlug(slug)`. It returns the
approved `ApprovedEditorialAssessment` or `null`. The slug is the only
lookup key.

### Wire-up

`adaptDirectoryToolToPublic` in `lib/data/tool-public-adapters.ts`
calls the resolver and applies the approved score to the `ToolPublic`
**only if** the assessment is `approved`. All 4 surfaces (Archive, Tool
Detail, Compare, Arena) read the same `ToolPublic.score` from the same
canonical path. Verified scores are identical everywhere.

`getDirectoryMissingFields` excludes `score` from the missing-field
diagnostic when an approved assessment exists for the tool.

### Rehydration

`localStorage` continues to store only slugs or IDs. The compare store
rehydrates by calling the canonical resolver, never from a stored
snapshot. There are no editorial snapshots in the client store.

### Runtime contract (4 states)

`CompareAssessmentState` distinguishes:

| State | Publicable as a total? | Conditions |
|---|---|---|
| `verified` | yes | `ToolPublic.score` with all 7 conditions (slug, value, verdict, limitationsAssessed, inputs, provenance) |
| `derived_from_verified_scorecard` | yes (reserved) | scorecard 6/6 verified + versioned mapping; no tool in production today |
| `draft_review_required` | no | not yet approved by TooolVibes Editorial |
| `not_assessed` | no | no editorial data; UI shows "Valutazione editoriale in preparazione" |

### Rejection of legacy / synthetic / mock inputs

The runtime must not accept as a public score:

- scorecards without `methodologyVersion`, `assessedAt`, `assessor`,
  evidence, limitations, verdict, or `approvalStatus === "approved"`;
- scorecards derived from `level`, `featured`, popularity, or marketing
  copy;
- mock fixtures (e.g. `lib/data/mock-tools.ts`);
- drafts that have not been approved.

Test coverage in `__tests__/lib/data/editorial-assessments.test.ts`
and `__tests__/lib/compare/compare-score.test.ts` enforces this contract.

### Editorial workspace delegation

The methodology (scoring scale, weights, formula, rounding, tie
threshold, validity period, update criteria, review process) is owned
by `TooolVibes Editorial` and lives in the editorial workspace:

```
/Users/gianmariacaltagirone/Tooolvibes-copy-audit/docs/editorial-methodology/
├── README.md
└── drafts/
    ├── vibecode-draft.md
    └── weweb-draft.md
```

The application repository keeps only the **runtime contract** (this
ADR + the resolver code in `lib/data/editorial-assessments/`) and
**approved assessments** (e.g. `blink.ts`). Drafts, in-flight reviews,
and rejected assessments stay in the editorial workspace until
approval.

A new assessment becomes runtime-visible only when it is migrated
from a draft in the editorial workspace to an approved file in
`lib/data/editorial-assessments/` AND added to the
`approvedAssessments` array in `lib/data/editorial-assessments/index.ts`.

## Migration steps for a new approved assessment

1. Editor compiles a draft in
   `Tooolvibes-copy-audit/docs/editorial-methodology/drafts/<slug>-draft.md`
   with scorecard (6/6), evidence (file/field), limitations, verdict,
   confidence per dimension.
2. Second editor reviews and approves via the workflow defined in the
   methodology.
3. Engineering creates
   `lib/data/editorial-assessments/<slug>.ts` with
   `approvalStatus: "approved"`, `approvedAt`, `approvedBy`, the full
   `ToolPublic.score` payload, and `limitations[]`.
4. Engineering adds the slug to `approvedAssessments` in
   `lib/data/editorial-assessments/index.ts`.
5. Tests verify parity: Archive == Tool Detail == Compare == Arena
   for the same tool.

## Consequences

Positive:

- Verified scores are byte-identical across all 4 surfaces.
- Synthetic / mock / legacy / draft scores cannot reach the runtime.
- Scorecard updates require a bump of `methodologyVersion`.
- The runtime stays decoupled from editorial process details (the
  methodology can evolve without code changes).

Costs:

- New tools need a draft in the editorial workspace before they can
  appear as `verified` in the Confronto/Arena. Until then, they show
  the fallback "Valutazione editoriale in preparazione".
- A bump of methodology requires re-issuing all approved assessments.

## Rejected alternatives

- Computing a score from `level` or `featured`: forbidden by DATA-201.
- Storing the score in the static `DirectoryTool` dataset: blurs
  source data and editorial judgment.
- Letting each surface re-evaluate independently: caused the
  "verified here, not_assessed there" gap this ADR closes.
- Keeping the methodology in the app repo: editorial drafts do not
  belong in the runtime code; their review is editorial, not
  engineering.

## Out of scope

- This ADR does not migrate existing tool records to verified scores.
- This ADR does not change the visual layout of Confronto or Arena.
- This ADR does not alter ADR 0001 (DATA-201).
- The full scoring methodology (scale, weights, formula, rounding,
  threshold tie, validity, process) lives in the editorial workspace
  and is intentionally not duplicated here.
