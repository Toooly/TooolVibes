# 16 — H6 status

Status: **IMPLEMENTED / ACCEPTED** (not released). Report flag default OFF. No deploy. H7 not started.

## Flags

| Flag | Env | Default |
|---|---|---|
| `community.read` | `TOOOLVIBES_COMMUNITY_READ_ENABLED` | OFF |
| `community.write` | `TOOOLVIBES_COMMUNITY_WRITE_ENABLED` | OFF |
| `community.report` | `TOOOLVIBES_COMMUNITY_REPORT_ENABLED` | OFF |

Report UI requires read + report + authenticated viewer. Reporting does not require write. No AuthSheet / no pending-intent for reports: guests simply see no action.

## Report API

`POST /api/community/experiences/[id]/report` — Bearer JWT reporter (no client ids), strict `{ reason, details? }` (details required for `other`), target must be `published` (else 404 without state reveal), self-report rejected 400 `CANNOT_REPORT_OWN_EXPERIENCE`, duplicate 409 `EXPERIENCE_ALREADY_REPORTED` (DB unique reporter+experience), rate 10/h/user + 20/h/IP fail-closed, no Turnstile V1. Response `201 { id, status: "open" }` only.

No auto-hide, no counters, no public metadata. Reports never mutate the Experience.

## Admin

`/admin/experiences/reports` (sidebar/mobile nav, Community group). Filters Aperte | Risolte | Ignorate, 20/page, open oldest-first, resolved/dismissed newest-resolved-first. Projection excludes reporter id (never selected). Actions: Risolvi / Ignora (server actor `founder-admin`), and Nascondi esperienza reusing the canonical H3 hide transition (report stays open until deliberately resolved).

Schema note: H1 `community_experience_reports.status` is `open | resolved` only. "Ignorata" is stored as `resolved` with the `resolution_note` convention `Ignorata...` (prefixed admin note or default `Ignorata dopo revisione.`). The scope filters are data-backed by that convention. If a true third state is wanted, that is an H7 SQL decision (new migration), not H6.

## QA

Flag-ON rendered QA closed for H4/H5/H6 via fresh dev server with all three flags + the new dev-only `TOOOLVIBES_COMMUNITY_QA_FIXTURE=1` public-read fixture (radar QA-fixture precedent). Playwright with seeded Supabase session + /mine + report mocks:
- guest: section + 3 fixture cards, NO Segnala (all sizes, overflow 0)
- auth: Segnala on 2 non-owned cards, none on own card; dialog → Spam → submit → "Segnalazione inviata."
- H5 debt closed: owner states none/form/pending/published (edit warning present)/rejected/hidden + long form at 390, overflow 0

Evidence: `.tmp-qa/community-h6/` (untracked).

## Not in H6

Comments, replies, helpful votes, ratings, stars, social graph, notifications, auto-hide, AI moderation, reopen, telemetry ingest, SQL, production migration, deploy.
