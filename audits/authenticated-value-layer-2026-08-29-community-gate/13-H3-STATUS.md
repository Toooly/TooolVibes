# 13 — H3 status

Status: **IMPLEMENTED / ACCEPTED** (not released). No production deploy. No public UI.

## Surface

- Route: `/admin/experiences`
- Nav: Community → Esperienze (desktop + mobile admin nav)
- Auth: `requireAdminSession()` on layout and every server action
- Actor: `founder-admin` (H1 `moderated_by text`, not `auth.users`, not email)

## State machine

Canonical helper: `planExperienceModeration` in `lib/community/moderation.ts`.

| From | Action | To | Reason | `published_at` |
|---|---|---|---|---|
| pending | publish | published | cleared | set now |
| pending | reject | rejected | required 4–500 | unchanged (null) |
| published | hide | hidden | required 4–500 | retained |
| hidden | republish | published | cleared | retained; set now only if null |
| published | publish | noop | — | no churn |
| rejected | reject | noop | — | no churn |
| hidden | hide | noop | — | no churn |
| published | republish | noop | — | no churn |
| rejected | publish / hide / republish | invalid | — | — |
| pending | hide / republish | invalid | — | — |
| published | reject | invalid | — | — |
| hidden | publish / reject | invalid | — | — |

Owner resubmit remains H2: any content edit → pending (not an admin action).

## Concurrency

`expectedUpdatedAt` must match `updated_at`. Stale admin tab → `EXPERIENCE_VERSION_CONFLICT` (notice=conflict). No silent publish of owner-edited content.

## Revalidation

After **applied** publish/hide/republish: `revalidatePath('/admin/experiences')` and `revalidatePath('/toools/{slug}')` with slug from stored row + `toolSlugSchema`. Reject: admin path only. No-op / auth / conflict: no revalidate.

## Not in H3

Reports queue, public Esperienze section, owner form, AuthSheet `community.write`, SQL, deploy.

## Carried debt

- H1 production migration pending
- H1 live RLS unrun
- H2 public GET limiter fail-open
- INFRA-P1 Cloudflare 1280 Worker resource-limit
- A–G real-auth production smokes pending
