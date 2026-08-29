# 04 — Moderation spec

---

## 1. Doctrine: pending-first

**Option A (locked):** every new Experience and every content edit of a published Experience is `pending` until a founder admin publishes.

| | Burden | Safety |
|---|---|---|
| A pending-first | Human review per submit | Launch-safe; catalog is small; write volume will be low |
| B auto-publish + post-mod | Faster authors | Spam/XSS/defamation hits Google/CDN immediately (`force-static` / cache) |
| C hybrid (trusted users) | Needs reputation | No identity graph to hang trust on |

Operational burden is acceptable: one admin cookie, ~30 tools, one Experience per user per tool.

**Do not auto-publish in V1.**

---

## 2. Operator workflow (minimum)

1. Open `/admin/experiences?status=pending` (oldest `submitted_at` first).
2. Read tool, display name, fields, switched-from.
3. Publish **or** Reject with reason (required).
4. Open reports queue; Hide published if needed (reason required).
5. Hidden can be re-published after review.
6. No email to the author in V1 (deferred). Owner sees status on the tool page.

No SLA number. No bulk-publish in V1.

---

## 3. Admin UI

Clone `/admin/suggestions`:

- Route: `app/(admin)/admin/(protected)/experiences/page.tsx`
- Nav: `{ href: "/admin/experiences", label: "Esperienze", group: "Community" }` — **also add to desktopNavItems** (suggestions missed desktop; do not repeat that)
- Filters: pending / published / hidden / rejected / all
- Card: tool slug+name, display_name (not email/uid), submitted_at, body excerpt, pros/limits, duration, switched-from, current status
- Actions: Pubblica, Rifiuta (reason modal), Nascondi (if published), reason required
- Reports subfilter or `/admin/experiences/reports`
- `requireAdminSession()` on **every** server action
- Idempotent: publish on already-published = 200 no-op; reject on rejected = 200 no-op if reason unchanged

**Do not** show `author_id` in the default card. Optional “reveal id” is unnecessary V1. Admin may need email to fight repeat abuse: **lock: do not show email in V1 queue** (no ban system anyway). If abuse repeats, hide + rate limit is the tool.

---

## 4. Transitions (server)

| From | Action | To | Requires reason | Sets |
|---|---|---|---|---|
| pending | publish | published | no | `published_at` (if null, now), `moderated_at/by`, clear `moderation_reason` |
| pending | reject | rejected | yes | moderated_* |
| published | hide | hidden | yes | moderated_* |
| hidden | publish | published | no | moderated_*, clear reason |
| rejected | (owner edit via user API) | pending | — | `submitted_at`; **not** an admin action |
| * | owner delete | gone | — | user API |

Invalid → 409 with code `invalid_transition`.

Admin cannot: change author, change tool_slug, edit body, hard-delete V1 (privacy delete is owner). If illegal content must vanish and owner is gone: **lock V1 exception:** admin **hide** is enough; add admin hard-delete only if legal demand appears (FUTURE).

---

## 5. Owner-facing status copy

| Status | Owner label | Public |
|---|---|---|
| pending | In revisione | not listed |
| published | Pubblicata | listed |
| rejected | Non pubblicata | not listed; show `moderation_reason` |
| hidden | Nascosta | not listed; optional generic copy, not internals |

Do not expose `moderated_by`.

---

## 6. Reports

- Auth required. Guest: AuthSheet is **not** required for report in V1? **Lock: report requires auth.** Guest sees “Segnala” → AuthSheet `community.write` is wrong capability. Use **no continuation** or a tiny `community.report`? Keep V1 simple: Segnala hidden for guests; visible for auth. Reduces report spam. Guest can still read.

Reasons: `spam | abuse | misleading | personal_data | other`  
Optional details 500.

Cannot report own Experience. Cannot report non-published. One open/closed unique per (reporter, experience). Rate limited.

Admin resolves: `resolved` + note. Does **not** auto-hide; operator chooses Hide separately (explicit).

---

## 7. Helpful / comments

**Deferred / forbidden.** No UI, no columns.

---

## 8. Automated moderation

**No third-party AI.** V1 heuristics (server, fail-open to pending — never auto-publish):

- Reject create if `body` equals another of the same author’s previous bodies (N/A with one-per-tool except edits)
- Count URLs in text (`https?://`) — if ≥ 3, still allow but **do not extra-flag in V1** (pending-first is enough)
- Empty arrays already invalid

Do not shadow-ban.

---

## 9. Email / notifications

**Deferred.** No “your experience was published” mail. No in-app notification center.

---

## 10. Banned users

Absent today. FUTURE. Repeat abuse: hide content + magic-link IP/email rate limits already exist. Do not build bans in H.
