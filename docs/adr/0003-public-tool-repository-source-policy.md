# ADR 0003 — Public tool repository source policy

## Status

Accepted for DATA-202. Supabase and editorial cutover remain blocked by
DATA-203 (B15).

## Context

The legacy public catalog is split across two disjoint inventories:

- the static directory contains 30 published tool slugs;
- the current mock dataset contains 8 published tool slugs;
- the two sets have 0 overlapping slugs.

The editorial transition is coupled to the 8-record inventory: the five public
mock collections contain 21 tool slots and all 21 currently resolve against
those eight records. Resolving them against the 30-record directory produces
zero slots. Legacy tool writeups use the same ToolRecord contract.

Switching production to Supabase or mock by default would therefore replace the
visible catalog without a reviewed migration. Merging records by slug would
also hide source gaps and could silently enrich CMS records with unrelated
legacy presentation fields.

## Decision

`ToolPublic` is the only canonical public tool domain record. The server
repository exposes one active source at a time:

- `directory`;
- `supabase`;
- `mock`.

Production requires an explicit `TOOOLVIBES_TOOLS_SOURCE`. The tracked build and
Wrangler configuration select `directory` until staging certifies the CMS
import. Missing or invalid production configuration is unavailable and fails
closed. Production never falls back.

Mock data is available only when it is explicitly selected and
`TOOOLVIBES_ALLOW_MOCK_DATA=1`. Development can use one explicit fallback. An
empty, valid source remains empty and does not activate fallback.

Directory-only presentation metadata (`toolOfWeek`, reading time, CTA copy and
accent colors) is attached only while adapting that same directory record. It
is never joined to Supabase or mock records by slug. Missing presentation data
stays nullable and UI-only defaults must not enter the domain record.

Optional comparison telemetry reports only source names and aggregate counts:
overlap, source-only records and canonical field mismatch count. It does not
log slugs, request data or user data.

## Editorial consumers

Posts and Collections are canonical `ToolPublic` consumers. Tool writeups are
derived from published records only when they have a factual publication or
lifecycle date; checked-in guide content remains explicitly authored content.
Collections resolve their reviewed slot list against the same canonical source.
No public consumer may import a second tool repository, merge inventories by
slug, or silently enrich a record with unrelated presentation fields.

## Consequences

- Home, catalog, tags, detail, related tools, static params, public tool API,
  tool sitemap URLs, shortlist, compare, client search and account resolve the
  same published canonical set.
- Posts and Collections resolve the same canonical source as the catalog,
  detail, API and sitemap surfaces.
- Drafts are filtered once at the canonical repository boundary.
- Duplicate slugs invalidate the entire canonical source instead of using
  last-write-wins.
- API and sitemap return 503 for unavailable canonical sources; valid empty
  sources stay distinguishable.
- Publishing in the CMS is not live while production source is `directory`.
- `Shortlist3DWrapper` is not reachable from the application tree and remains a
  documented legacy cleanup candidate; it is not part of the DATA-202 surface.

## Supabase and editorial cutover gate

Do not change production to `supabase` until DATA-203 verifies import counts,
slug and canonical-field parity, draft exclusion, route/API/sitemap parity,
cache invalidation and rollback in staging.

DATA-203 is also not complete until staging verifies the canonical import,
every editorial link resolves and the certified canonical parity fixture passes.

## DATA-203 local contract status

B15 now provides local, deterministic lifecycle and cross-surface contract tests
plus a read-only staging evidence verifier. This closes the repository-side test
harness only. It does not certify Supabase content, editorial bootstrap, cache
behavior across deployed requests, rollback, or adapter removal.

Accordingly this ADR keeps the production source at `directory` and keeps the
transitional editorial exception in force. The Supabase/editorial cutover stays
blocked until `docs/runbooks/public-tool-source-cutover.md` is completed with a
real manifest that passes `npm run tools:cutover:verify -- <evidence.json>`.
Synthetic fixtures are validator tests, not release evidence.
