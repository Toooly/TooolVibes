# 02 — Experience data model

**Locked for V1.** No SQL in this pass.

Community data **does not** live in WorkspaceStateV1. `schemaVersion` stays **1**.

---

## 1. Product object

One row = one person’s structured experience with one catalog tool.

Not a review score. Not a comment. Not a private note.

---

## 2. Fields (canonical)

| Field | DB column | Type | Null | Notes |
|---|---|---|---|---|
| id | `id` | uuid PK | no | `gen_random_uuid()` |
| tool | `tool_slug` | text | no | Catalog slug; regex-checked |
| author | `author_id` | uuid | no | `auth.users.id`; **never public** |
| display name | `display_name` | text | no | Public snapshot |
| use case | `use_case` | text | no | How they use it |
| body | `body` | text | no | Main narrative (`experience` in product copy) |
| pros | `pros` | jsonb | no | `string[]` |
| limits | `limits` | jsonb | no | `string[]` |
| duration | `duration_bucket` | text | no | Enum below |
| switched from (catalog) | `switched_from_slug` | text | yes | Other catalog slug |
| switched from (other) | `switched_from_label` | text | yes | Off-catalog name |
| status | `status` | text | no | Enum below |
| created | `created_at` | timestamptz | no | `now()` |
| updated | `updated_at` | timestamptz | no | trigger |
| published | `published_at` | timestamptz | yes | Set on first publish; kept if later hidden |
| moderation time | `moderated_at` | timestamptz | yes | |
| moderator | `moderated_by` | text | yes | Admin email snapshot, not uid |
| moderation reason | `moderation_reason` | text | yes | Required on reject/hide |
| last owner submit | `submitted_at` | timestamptz | no | Create or resubmit |

No star, no score, no helpful count, no reply_to, no parent_id.

---

## 3. Limits

| Field | Min | Max | Extra |
|---|---|---|---|
| `display_name` | 2 | 80 | Trim; no `@`; no URL-looking tokens |
| `use_case` | 4 | 80 | Concise free text. **Not** a taxonomy project |
| `body` | 80 | 2000 | Blocks “Great app!”; matches note cap |
| `pros` | 1 item | 5 items | each 8–180 chars |
| `limits` | 1 item | 5 items | each 8–180 chars (honesty) |
| `switched_from_slug` | — | 120 | Same slug regex; ≠ `tool_slug` |
| `switched_from_label` | 2 | 80 | Only if slug absent |
| `moderation_reason` | 4 | 500 | Server/admin |
| `tool_slug` | 1 | 120 | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |

Empty/whitespace → reject. Store trimmed text, never `""`. JSON arrays stored as JSON text strings, not HTML.

Unicode: NFC normalize on server. Reject if stripped length fails. Control chars `U+0000–U+001F` except newline in `body` only (`\n` allowed, max 30 newlines). RTL marks allowed but not a separate renderer.

---

## 4. Duration enum (locked)

```
under_1_month
months_1_3
months_3_6
months_6_12
year_plus
```

Italian UI:

| Value | Label |
|---|---|
| `under_1_month` | Meno di 1 mese |
| `months_1_3` | 1–3 mesi |
| `months_3_6` | 3–6 mesi |
| `months_6_12` | 6–12 mesi |
| `year_plus` | Più di 1 anno |

No free-text duration. No exact dates (false precision).

---

## 5. switchedFrom rule

1. Prefer `switched_from_slug` when the previous tool is in **current public catalog**.
2. Else `switched_from_label` for tools outside TooolVibes.
3. Both optional. If both sent, **slug wins**; label discarded.
4. `switched_from_slug` must be a live catalog slug **and** ≠ `tool_slug`.
5. Do not invent similarity; this is a user-declared switch.

---

## 6. Status machine

```
INSERT ──► pending
pending ──publish──► published
pending ──reject───► rejected
published ──hide───► hidden
hidden ──publish──► published
rejected ──owner edit──► pending   (resubmit)
published ──owner content edit──► pending
ANY ──owner DELETE──► (row gone)
```

Illegal: client sets `published` / `hidden` / `rejected`. Owner cannot set moderator fields. Moderator cannot change `author_id`, `tool_slug`, or content except via hide/reject/publish (content stays; status changes).

**Pending-first:** every INSERT `status = pending`, `published_at = null`.

**Edit published → pending:** any change to `display_name`, `use_case`, `body`, `pros`, `limits`, `duration_bucket`, switched-from fields. V1 does not diff “substantive”; all content edits resubmit. `updated_at` / `submitted_at` refresh. Previous `published_at` retained for history but public SELECT requires `status = published`, so the text leaves the site until re-approved.

**Reject/hide** require `moderation_reason`. Publish clears reason or leaves last reason (lock: **clear reason on publish**).

---

## 7. Tables

### `public.community_experiences`

See field table. Constraints:

- `CHECK (status IN ('pending','published','hidden','rejected'))`
- `CHECK (duration_bucket IN (...))`
- `CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 80)`
- same for use_case 4–80, body 80–2000
- `CHECK (jsonb_typeof(pros) = 'array')` + length 1–5 (SQL helper or app+check)
- `CHECK (switched_from_slug IS NULL OR switched_from_slug <> tool_slug)`
- `CHECK (NOT (switched_from_slug IS NOT NULL AND switched_from_label IS NOT NULL))` — slug XOR label, both null OK
- `UNIQUE (author_id, tool_slug)` — **one row per user per tool including pending/rejected/hidden**
- No FK to `tools` (catalog is directory in production)
- No FK to `auth.users` required (Supabase often omits; still store uuid). Optional FK `author_id REFERENCES auth.users(id) ON DELETE CASCADE` **if** available — **recommended** so future account deletion cascades. If auth schema FK is painful, document app-level cascade in account-delete when it exists.

`updated_at` trigger: follow existing table convention (several CMS tables already use triggers; match `viewer_profiles` / editorial style).

### `public.community_experience_reports`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | uuid PK | no | |
| `experience_id` | uuid | no | FK `community_experiences(id) ON DELETE CASCADE` |
| `reporter_id` | uuid | no | `auth.uid()` |
| `reason` | text | no | `spam \| abuse \| misleading \| personal_data \| other` |
| `details` | text | yes | 0–500 |
| `status` | text | no | `open \| resolved` default `open` |
| `created_at` | timestamptz | no | |
| `resolved_at` | timestamptz | yes | |
| `resolved_by` | text | yes | admin email |
| `resolution_note` | text | yes | max 500 |

- `UNIQUE (reporter_id, experience_id)` — one report per reporter per experience (reopen by admin only, V1: no reopen; unique blocks duplicates)
- Reporter cannot see other reports
- CASCADE delete when owner hard-deletes Experience (reports go with content — privacy). Admin should resolve/hide **before** needing the report if investigating. Operational note: hide first, then optional delete is owner-only.

---

## 8. Indexes

| Name | On | Purpose |
|---|---|---|
| `community_experiences_published_tool_idx` | `(tool_slug, published_at DESC, id DESC)` **WHERE status = 'published'** | Public list |
| `community_experiences_author_idx` | `(author_id, updated_at DESC)` | Owner “mine” |
| `community_experiences_pending_idx` | `(submitted_at ASC)` **WHERE status = 'pending'** | Mod queue |
| `community_experiences_hidden_rejected_idx` | `(status, moderated_at)` **WHERE status IN ('hidden','rejected')** | Retention purge |
| `community_experience_reports_open_idx` | `(created_at ASC)` **WHERE status = 'open'** | Report queue |
| `community_experience_reports_experience_idx` | `(experience_id)` | Admin lookup |

Unique indexes above already cover `(author_id, tool_slug)` and `(reporter_id, experience_id)`.

---

## 9. Public DTO (never leak)

Public card JSON / SSR props:

```
id, toolSlug, displayName, useCase, body, pros, limits,
durationBucket, switchedFromSlug, switchedFromLabel,
publishedAt
```

Never: `author_id`, email, `moderated_by`, `moderation_reason`, `status` (implied published), reporter ids.

Owner DTO may add: `status`, `moderation_reason` (if rejected/hidden), `updatedAt`, `submittedAt`. Still no `author_id` in client if the session already knows “mine”.

---

## 10. Display name derivation (no profile table)

At create/update, server sets `display_name` from form field (required). Prefill UI from:

1. `user.user_metadata.first_name` + `last_name` (trimmed)
2. else `emailLocalPart` (existing `workspace-model.ts` helper)

User may override in the form. Snapshot stays on the row if they later change metadata.

Contribution count **deferred** (reduces identity surface). Card line: `{displayName} · {duration label}`.

---

## 11. Tool deletion / rename

| Event | Experience |
|---|---|
| Slug removed from directory | Row kept; public tool page 404; admin still sees it |
| Slug renamed in directory | Old slug orphaned (no redirect table today). Ops: migrate slugs in a later script if needed |
| CMS `tools` unpublished | Irrelevant while source=directory |

---

## 12. Not in V1

`public_profiles` · avatars · usernames · helpful votes · comments · version history table · markdown · attachments · geo · company name.
