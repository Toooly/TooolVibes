# Wave H0 — Community Experiences architecture gate

**Status:** H0–H6 implemented on `feature/authenticated-value-layer-h-community`. H7 in progress (`17-H7-STATUS.md`).  
**Date:** 2026-08-29  
**Baseline:** `main` = `origin/main` = `a81035806f5512089f1b6ad1b4bf6f3c696185c9`  
**Worker at gate:** `bbc591ff-d143-4816-87cd-40ee26c04361`  
**Parent package:** `audits/authenticated-value-layer-2026-08-28/` (A–G released; `11-COMMUNITY-EXPERIENCES-SPEC.md` was DESIGN ONLY)

This package makes Wave H **implementation-safe**. It does **not** create SQL, tables, UI, endpoints, or deploys.

---

## Verdict

**WAVE H IMPLEMENTATION: GO**

H1 may start only as a **schema + RLS + SQL-contract-tests** pass. Public write stays dark until H3 (moderation queue) exists and flags are explicitly enabled.

No H0 blocker remains on: ownership, RLS shape, moderation path, rate limiting, author privacy, published/pending separation.

---

## Product

**Esperienze**, not recensioni.

Public knowledge from authenticated usage. One Experience per user per tool. Guests read published rows. Authenticated users write/manage their own. Founder admin moderates.

Not a social network. No stars. No comments. Not WorkspaceStateV1.

---

## Package

| File | Contents |
|---|---|
| `01-CURRENT-COMMUNITY-STATE.md` | Forensic: identity, admin, RLS, catalog, UGC today |
| `02-EXPERIENCE-DATA-MODEL.md` | Fields, limits, tables, indexes, unique, status machine |
| `03-RLS-AUTHORIZATION-SPEC.md` | Policies, service-role, AUTHZ matrix |
| `04-MODERATION-SPEC.md` | Pending-first, edit/delete, reports, admin queue |
| `05-API-VALIDATION-RATE-LIMIT.md` | Routes, Zod, rate limits, CSRF/CORS, idempotency |
| `06-PRIVACY-SECURITY-THREAT-MODEL.md` | XSS, spam, PII, account deletion, retention, legal flags |
| `07-UX-ACCESS-SPEC.md` | Tool page, AuthSheet, form, owner/report UX, a11y, SEO |
| `08-ROLL-OUT-ROLLBACK.md` | Flags, sequence, cache, rollback |
| `09-TEST-PLAN.md` | AUTHZ / XSS / spam / moderation / privacy / perf / QA |
| `10-IMPLEMENTATION-PLAN.md` | H1–H7, files, migrations (not created) |

---

## Locked decisions (30)

1. One Experience per `(auth.uid(), tool_slug)` — database unique.
2. Public read of `status = published` only.
3. Write requires authenticated Supabase user.
4. Pending-first: inserts are always `pending`. Client cannot self-publish.
5. Owner edit of a **published** Experience returns it to `pending`.
6. Owner delete is **hard delete**. Moderator hide/reject keeps the row.
7. Public attribution = `display_name` snapshot + duration. Never email, never `auth.uid()`.
8. **No public profile page.** No `public_profiles` table in V1.
9. Reports require auth.
10. Helpful reactions **deferred**.
11. Comments / replies **forbidden** V1.
12. Fields: see `02`.
13. Limits: see `02`.
14. Duration enum: `under_1_month | months_1_3 | months_3_6 | months_6_12 | year_plus`.
15. `switched_from_slug` if in public catalog; else optional `switched_from_label`; slug wins if both present.
16. Tables: `community_experiences`, `community_experience_reports` only.
17. Indexes: published-by-tool, author ownership, pending queue, open reports.
18. Unique: `UNIQUE (author_id, tool_slug)`.
19. RLS FORCE + **no client GRANTs** (no anon/authenticated SELECT/INSERT/UPDATE/DELETE). Owner SELECT policy is defense-in-depth only. Writes and public reads via server + service role (H2/H4). Prevents `author_id` column leak.
20. Server API (Bearer JWT), not browser Supabase mutations. Admin = existing cookie + server actions.
21. Rate limits: create 5/h/user + 10/h/IP; update 20/h/user; report 10/h/user + 20/h/IP. Fail-closed.
22. Moderation role = existing founder admin cookie. No new RBAC.
23. Admin queue at `/admin/experiences` (Community group), clone suggestions pattern.
24. Public sort: `published_at DESC, id DESC`.
25. Pagination: first 8 SSR, cursor load-more.
26. SEO: published text may be in tool-page HTML; **no** schema.org Review / stars. Pending never indexed.
27. Account deletion still absent: owner Experience delete is the V1 erasure path; future account-delete must hard-delete authored rows.
28. Retention: owner-deleted gone immediately; hidden/rejected + resolved reports purge after 180 days.
29. Flags default **off**: `TOOOLVIBES_COMMUNITY_READ_ENABLED`, `TOOOLVIBES_COMMUNITY_WRITE_ENABLED`.
30. Rollout: schema → API → admin queue → public read → gated write → reports → security smoke. No public write before moderation.

---

## Explicitly out of H0 / H V1

SQL files · migrations applied · UI · endpoints · deploy · Realtime · email on moderate · notification center · stars · followers · DMs · community homepage · `/users/:username` · Markdown HTML · auto-link · “Publish private note” · WorkspaceStateV1 keys · `schemaVersion` bump · FK to `public.tools` (catalog is directory in prod) · new vendor analytics · AI moderation.

---

## GO conditions for H1+

- Do not apply migrations until H1 tests exist as SQL-string contracts.
- Do not enable write flag until H3 queue is usable.
- Do not SSR pending/rejected/hidden.
- Do not put draft Experience text in PendingAuthIntent or WorkspaceStateV1.
