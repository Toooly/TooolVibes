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
