# 11 — H1 status

**H1:** schema implemented · RLS implemented · dark production migration pending (CLI not in PATH at authoring) · **no API** · **no UI** · **no public write**

## Corrections to H0

| Topic | H0 draft | H1 lock |
|---|---|---|
| Client SELECT | GRANT published SELECT to anon/authenticated | **No client GRANTs.** Row RLS cannot hide `author_id`. |
| Public read | Direct PostgREST | H2/H4 server API / RSC, safe columns only |
| `pros` / `limits` | jsonb | `text[]` (repo convention) |
| `author_id` / `reporter_id` | uuid, optional FK | `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `published_at` | optional | **included** (public order) |
| `moderated_by` | text | text ≤120, **not** auth.users FK (admin is cookie) |
| Reports client read | optional own SELECT | **none** |

## Rollback (empty / dark tables only)

```sql
drop table if exists public.community_experience_reports;
drop table if exists public.community_experiences;
```

Do not run after real UGC exists.
