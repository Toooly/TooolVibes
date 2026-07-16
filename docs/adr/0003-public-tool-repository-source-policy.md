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

## Transitional editorial exception

Posts and Collections are explicitly outside the DATA-202 canonical consumer
cutover. Until DATA-203 bootstraps and certifies their content, they read through
`lib/data/legacy-editorial-tool-repository.ts` only. This adapter is server-only,
read-only, emits `legacy-editorial-tool-repository-active-until-data-203`, and
preserves the pre-DATA-202 Supabase/mock fallback and editorial overlay contract.
The canonical ToolPublic repository never imports it.

The only transitional consumers are:

- `lib/data/public-articles.ts`;
- `lib/data/public-collections.ts`;
- `app/(marketing)/posts/[slug]/page.tsx`.

The count guard is 8 legacy tools, 5 public collections, 21 expected slots and
21 resolved slots. This prevents a silent zero-slot release while avoiding an
unreviewed cross-inventory slug remap.

## Consequences

- Home, catalog, tags, detail, related tools, static params, public tool API,
  tool sitemap URLs, shortlist, compare, client search and account resolve the
  same published canonical set.
- Posts and Collections retain their named legacy repository until DATA-203;
  they are not evidence of canonical source parity.
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

DATA-203 is also not complete until Posts and Collections are migrated to
ToolPublic-backed content, the 8/5/21/21 editorial count guard is replaced by a
certified canonical parity fixture, every editorial link resolves, and
`legacy-editorial-tool-repository.ts` plus its warning are removed.
