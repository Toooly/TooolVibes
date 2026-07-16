# Public tool source cutover

## Current release configuration

Production and production builds use:

```text
TOOOLVIBES_TOOLS_SOURCE=directory
```

This preserves the current 30-record canonical public catalog. While this value
is active, publishing a tool in the Supabase CMS does not make it public.

Posts and Collections remain temporarily pinned to the named read-only adapter
`lib/data/legacy-editorial-tool-repository.ts`. Its baseline is 8 legacy tools,
5 public collections, 21 expected collection slots and 21 resolved slots. The
canonical directory and legacy mock inventories overlap on 0 slugs, so do not
remap editorial slugs or remove this adapter before DATA-203 content bootstrap.

## Safe shadow comparison

In a non-production rehearsal environment:

```text
TOOOLVIBES_TOOLS_SOURCE=directory
TOOOLVIBES_TOOLS_COMPARE_SOURCE=supabase
TOOOLVIBES_TOOLS_FALLBACK=none
```

Review aggregate server telemetry only. A comparison never changes the active
catalog and never merges sources.

## Cutover checklist

1. Import the 30-record directory inventory into staging Supabase without
   changing slugs.
2. Bootstrap Posts and Collections against the imported canonical tool IDs;
   do not infer mappings between the disjoint 8- and 30-slug inventories.
3. Confirm every intended public record is published and every draft is absent.
4. Run DATA-203 parity tests for catalog, detail, related, API, sitemap and
   static params.
5. Verify every public collection has its reviewed expected slot count and
   every editorial tool link resolves to a canonical detail route.
6. Confirm duplicate slug tests fail closed.
7. Confirm canonical field mismatches are reviewed and intentional.
8. Rehearse `TOOOLVIBES_TOOLS_SOURCE=supabase` in staging.
9. Verify API and sitemap return 503 when Supabase is unavailable.
10. Verify an intentionally empty source is reported as `empty`, not fallback.
11. Remove all imports of `legacy-editorial-tool-repository.ts`, migrate its
    three consumers to ToolPublic, and delete the adapter and warning.
12. Replace the transitional 8/5/21/21 count test with a certified staging
    parity fixture covering Posts and Collections.
13. Record owner, evidence and rollback window.
14. Change the production build variable and Wrangler variable together.
15. Rerun typecheck, lint, unit tests, production build and editorial route
    smoke tests after the adapter removal.

The cutover is not accepted if the environment variable changes while the
legacy adapter, its warning, unresolved collection slots or broken editorial
tool links remain.

## Rollback

Set `TOOOLVIBES_TOOLS_SOURCE=directory` in both the build environment and
Wrangler, redeploy, and verify the 30 expected canonical slugs. Restore the last
certified editorial content snapshot if the DATA-203 migration changed Posts or
Collections. Do not enable a production fallback and do not merge directory
records into Supabase output.

## DATA-203 local contract and staging evidence

The repository now owns a deterministic local contract for the CMS publication
lifecycle. The contract covers draft exclusion, publish, field update,
unpublish, duplicate-slug failure, catalog/detail/static-param/API/sitemap
parity, related-tool recalculation, and the complete cache invalidation target
set. These tests use an in-memory disposable CMS fixture and never create a
service-role client.

This local coverage does **not** certify the source cutover. The tracked
production source remains `directory`, and the transitional editorial adapter
must remain active until real staging content passes every checklist item.

Use the blocked template as a new evidence file; never mark the tracked template
as certified:

```powershell
Copy-Item docs/runbooks/public-tool-cutover-evidence.template.json C:\tmp\tooolvibes-tool-cutover-staging.json
npm run tools:cutover:inventory -- C:\tmp\directory-tool-public.json
npm run tools:cutover:inventory -- C:\tmp\candidate-tool-public.json
npm run tools:cutover:verify -- C:\tmp\tooolvibes-tool-cutover-staging.json
```

The two inventory commands accept either a canonical `ToolPublic[]` export or a
repository snapshot containing `tools`. Copy their aggregate `published` and
`draftSlugs` output into the evidence manifest. The commands read local files
only; they do not connect to Supabase or accept service-role credentials.

The verifier is read-only and accepts only explicit staging evidence. It checks:

- exact directory/candidate published slug sets and at least one draft sentinel;
- per-record `sha256:` fingerprints using profile
  `tool-public-release-semantics-v1`;
- catalog, detail 200/404, static params, API and sitemap slug parity;
- related edges that resolve only to published canonical tools;
- reviewed fingerprint mismatches with owner and rationale;
- reviewed collection/post expected-versus-resolved tool links;
- removal of the legacy adapter and its warning;
- publish/update/unpublish cache rehearsals across every dependent surface;
- rollback rehearsal, owner, timestamps and evidence references.

The fingerprint profile covers `schemaVersion`, `slug`, `name`, publication
status, URLs, taxonomy, content, editorial evidence, score, attributes, media
and flags. It intentionally excludes publication timestamps, lifecycle fields
and provenance because those are source-specific. Any remaining fingerprint
mismatch must be reviewed explicitly; it is never merged or accepted silently.

### External gate still open

DATA-203 and the Supabase cutover remain blocked until staging supplies all of
the following real evidence:

1. the 30 directory records imported without slug changes;
2. canonical fingerprint parity or an owned review for every mismatch;
3. a real draft sentinel excluded from every public surface;
4. publish, update and unpublish cache invalidation observed after separate
   requests/build boundaries;
5. Posts and Collections rebuilt against reviewed canonical tool IDs, without
   inferred mappings from the disjoint eight-slug legacy inventory;
6. every editorial link and expected slot resolved;
7. the 8/5/21/21 transitional guard replaced by the certified fixture;
8. the legacy adapter and warning removed only after points 1-7 pass;
9. source-unavailable, intentionally-empty and rollback rehearsals;
10. owner, evidence references and rollback window recorded.

A synthetic passing fixture exists only to test the verifier itself. It is not
release evidence and must never be copied into a staging or production record.
