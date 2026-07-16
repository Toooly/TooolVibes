# ADR 0001: Canonical ToolPublic domain contract

- Status: Accepted for DATA-201
- Date: 2026-07-16
- Decision scope: public tool identity and source adaptation

## Context

TooolVibes currently exposes two independently evolved tool models:

- `ToolRecord`, used by the Supabase/mock repository and admin flows;
- `DirectoryTool`, used by the static directory and most current discovery UI.

They disagree on category vocabulary, publication state, dates, URL meaning,
editorial fields and score semantics. Local adapters currently fill gaps with
plausible values (for example, discovery date as publication date, a generated
route as editorial URL, or `featured` as editorial state). Those records look
complete but their provenance is unknowable.

DATA-201 establishes a canonical boundary without migrating consumers. Consumer
and repository migration belongs to B14/DATA-202.

## Decision

### Slug is the public identity

`ToolPublic.slug` is the only canonical public identity. It is runtime-validated
as lowercase alphanumeric segments separated by single hyphens. Legacy numeric
or source IDs remain in `provenance.sourceId`; they are not cross-source IDs.

A future repository must resolve duplicate slugs explicitly. It must not merge
records by display name or legacy ID.

### Publication is explicit

`publication.status` is `draft` or `published`.

- `ToolRecord.is_published` is an authoritative status field.
- `ToolRecord.date_discovered` remains `lifecycle.discoveredAt`; it is never
  relabeled as `publishedAt`.
- The current ToolRecord schema has no publication timestamp, so a published
  ToolRecord has `publishedAt: null` and records
  `publication.publishedAt` in `provenance.missingFields`.
- DirectoryTool has `publishedAt` but no publication status. Its adapter
  therefore requires an explicit `DirectoryToolPublicationContext` argument.
  There is no default status.
- A draft cannot carry a publication date. The runtime schema rejects it.

Dates accept valid ISO dates and ISO date-times, including Postgres fractional
seconds and timezone offsets. Invalid calendar dates are rejected.

### URLs preserve their meaning

The canonical model separates:

- `urls.website`: the vendor/product destination and a required HTTP(S) URL;
- `urls.affiliate`: the optional tracked destination;
- `urls.editorial`: the optional TooolVibes/source article.

Adapters never replace a missing field with another URL. In particular:

- ToolRecord maps `website_url`, `affiliate_url` and
  `tooolvibes_post_url` one-to-one.
- DirectoryTool maps `externalUrl`, `affiliateUrl` and
  `originalSourceUrl` one-to-one.
- DirectoryTool aliases `url`, `originalArticleUrl` and `fallbackUrl` are not
  canonical inputs.
- Non-HTTP protocols are rejected.

### Editorial evidence remains attributable

Editorial claims are represented as evidence entries with a `kind`, `text` and
`sourceField`. The adapter preserves the exact source field for every review,
rationale, strength, caution or highlight. Missing editorial material produces
an empty array plus a missing-field diagnostic; no generic marketing copy is
inserted.

### Score requires inputs and provenance

`score` is either null or contains:

- explicit dimension/level inputs;
- provenance kind;
- source field;
- methodology version;
- nullable assessment timestamp.

The ToolRecord adapter maps only explicit `editorial_scorecard` entries and
labels the legacy method `legacy-editorial-scorecard-v1`. It does not infer
missing dimensions. DirectoryTool has no defensible score input, so its score is
null even when it is featured or advanced.

DATA-201 intentionally defines no overall winner or numeric score. Objective,
weights, confidence and comparison methodology belong to FLOW-602.

### Missing data is visible

The schema has no implicit defaults. Adapters must provide every canonical key
with a source value, `null`, or an empty list. Known source gaps are listed in
`provenance.missingFields`.

Directory taxonomy is preserved as source category and label. Its
`canonicalCategory` remains null until a product-owned mapping is approved;
category guesses based on segment names are forbidden.

### Runtime validation is the boundary

`toolPublicSchema` is strict at every object level. Both adapters finish by
calling `parseToolPublic`, so an invalid slug, URL, date, duplicate list value or
duplicate score dimension fails at the boundary instead of reaching a route or
UI.

## Source mapping

| ToolPublic field | ToolRecord | DirectoryTool |
| --- | --- | --- |
| `slug` | `slug` | `slug` |
| `publication.status` | `is_published` | explicit adapter context |
| `publication.publishedAt` | `null` (not available) | `publishedAt` only when context is published |
| `urls.website` | `website_url` | `externalUrl` |
| `urls.affiliate` | `affiliate_url` | `affiliateUrl` |
| `urls.editorial` | `tooolvibes_post_url` | `originalSourceUrl` |
| `taxonomy.canonicalCategory` | `category` | `null` (unmapped) |
| source category/label | `category` / `category` | `category` / `categoryLabel` |
| summary | `short_description_it` | `shortDescription` |
| description | `description_it` | `longDescription` |
| best for | `best_for` | `idealUseCase` |
| use cases | `use_cases` | `useCases` |
| evidence | explicit editorial fields | `editorialReview`, `whyItMatters`, `highlights` |
| score | explicit `editorial_scorecard` only | `null` |
| cover image | `cover_image_url` | `null` (not available) |
| lifecycle dates | discovery/create/update fields | `null` except publication date |

## Consequences

Positive:

- static, database, API and UI layers can target one runtime-valid contract;
- publication and URL mistakes become test failures;
- partial data is distinguishable from editorially assessed data;
- score displays can inspect provenance before presenting a claim.

Costs:

- DirectoryTool records remain partial until category, media and score inputs
  receive owned data;
- published ToolRecord rows cannot expose a publication date until the database
  owns one;
- B14 must migrate consumers deliberately rather than casting between legacy
  types.

## Rejected alternatives

- Extending either legacy type: preserves source-specific semantics and moves
  the ambiguity into every consumer.
- Overlaying mock editorial fields onto Supabase rows: hides which source owns
  the displayed claim.
- Deriving score from category, text, order, level or featured flags: creates a
  persuasive number with no defensible provenance.
- Defaulting every DirectoryTool to published inside the adapter: turns an
  absent source field into an invisible policy decision.

## Out of scope

This ADR does not change database schema or data, route/repository selection,
UI components, compare methodology, publication workflow, or source priority.
Those changes are assigned to DATA-202/DATA-203 and FLOW-602.
