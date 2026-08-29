# 08 — Rollout and rollback

---

## 1. Feature flags

Reuse `lib/config/release-features.ts`. Defaults **false**.

| Flag | Env | Default | Effect |
|---|---|---|---|
| `communityRead` | `TOOOLVIBES_COMMUNITY_READ_ENABLED` | false | Tool page section + public GET |
| `communityWrite` | `TOOOLVIBES_COMMUNITY_WRITE_ENABLED` | false | CTA, form, owner mutations, AuthSheet |

Write flag must not enable if read is off (server: write implies read for owner preview). Admin queue **ignores** public flags (staff can moderate before launch).

No new flag platform.

---

## 2. Safe sequence (locked)

| Step | What | Public write? |
|---|---|---|
| 1 H1 | Schema + RLS + SQL contract tests. **Do not expose UI.** | no |
| 2 H2 | Server APIs + validation + rate limits. Flags still off (404). | no |
| 3 H3 | Admin queue live (cookie). Seed **zero** fake users. | no |
| 4 H4 | Enable **read** in preview/staging. Empty state only. | no |
| 5 H5 | Write UI behind flag, still off in prod. | no |
| 6 | Staging security smoke (AUTHZ/XSS). | staging only |
| 7 H6 | Reports | staging |
| 8 H7 | Prod: schema already on; enable **read**; verify empty; then **write**; smoke | yes |
| 9 | Policy pages updated **before** step 8 write | — |

**No public write before moderation path exists.**

---

## 3. Migration order (design only — do not create files in H0)

1. `community_experiences` + checks + unique + indexes + RLS + grants + `updated_at` trigger  
2. `community_experience_reports` + FK + unique + indexes + RLS + grants  

Prefer **one** migration if reviews are easier; two is OK. No data backfill. No `schemaVersion` touch.

Rollback of schema: if no rows, `DROP TABLE … CASCADE`. If rows exist, **do not drop in prod** without a privacy decision; instead disable flags (UI rollback).

---

## 4. Cache

Publish/hide/reject/delete → `revalidatePath('/toools/'+slug)` (and sitemap only if we add experience URLs — **we do not**; tool URL already in sitemap).

Public GET `s-maxage=60`. Accept short stale after hide.

---

## 5. Rollback (product)

1. Set `TOOOLVIBES_COMMUNITY_WRITE_ENABLED=false` → no new submits; existing published still visible if read on.  
2. Set read false → section gone; data retained.  
3. Hide individual rows in admin.  
4. Schema drop only if never produced public content **or** after legal-approved purge.

Workers deploy remains the canonical stamp path; this package does not deploy.

---

## 6. Dark launch

Admin + API can ship in production with flags off. RLS still denies client writes. Public HTML unchanged while `communityRead` is false.
