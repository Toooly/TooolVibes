# 05 — API, validation, rate limits

---

## 1. Direct Supabase vs server

**Locked: server-controlled writes** (Next App Router). RLS is defense in depth.

Why not browser + RLS only:

- Column-level status (self-publish) is hard to lock in RLS
- Rate limits, catalog slug check, Turnstile, idempotency live in the app today
- Matches workspace + tool_requests

Admin stays **server actions** + `requireAdminSession()`, not Bearer.

---

## 2. HTTP surface (user)

Prefix `/api/community/experiences`

| Method | Path | Auth | Flag |
|---|---|---|---|
| GET | `?tool=&cursor=&limit=` | public | `communityRead` |
| GET | `/mine?tool=` | Bearer | `communityWrite` or read+auth |
| POST | `/` | Bearer | `communityWrite` |
| PATCH | `/:id` | Bearer | `communityWrite` |
| DELETE | `/:id` | Bearer | `communityWrite` |
| POST | `/:id/report` | Bearer | `communityRead` (auth) |

`limit` default 8, max 20. Cursor: `published_at|id` opaque.

404 if flags off (like signal routes), not 500.

Public GET Cache-Control: `public, s-maxage=60, stale-while-revalidate=300`. Owner GET/mutations: `no-store`.

On publish/hide/reject/delete: `revalidatePath('/toools/'+slug)` and purge is enough; HTTP cache is 60s.

No Realtime.

---

## 3. Validation (Zod)

Reuse Zod (already on magic-link, workspace, public submissions). Strict objects. Extra keys rejected.

POST body:

```
{
  toolSlug, displayName, useCase, body,
  pros: string[], limits: string[],
  durationBucket,
  switchedFromSlug?, switchedFromLabel?
}
```

No `status`, `authorId`, `id`.

PATCH: same fields optional; at least one content field. `updatedAt` required for concurrency (`ISO`).

Server: NFC trim, length checks from `02`, catalog membership via `getPublicToolViews()`, unique catch.

---

## 4. Rate limits (locked)

New namespaces via `consumeRateLimit` (HMAC + Durable Object). Fail-closed 503.

| Action | Identifiers | Limit | Window |
|---|---|---|---|
| create | `userId` | 5 | 1 h |
| create | IP | 10 | 1 h |
| update | `userId` | 20 | 1 h |
| report | `userId` | 10 | 1 h |
| report | IP | 20 | 1 h |
| public GET | IP | 120 | 1 min |

Do not use workspace 90/min. Do not copy sponsor-analytics (unenforced).

Turnstile: **on** POST create (public UGC even if authed). Action string `community_experience`. Skip on PATCH/DELETE. Report: no Turnstile V1 (auth + unique + rate limit).

Honeypot: not needed on Bearer JSON APIs.

---

## 5. Idempotency / double-click

- Unique `(author_id, tool_slug)` → POST duplicate = **409** `already_exists` with existing id (no second row).
- UI: disable submit while in-flight.
- Optional header `Idempotency-Key` deferred V1; unique is the backstop.
- Publish action idempotent.

---

## 6. Concurrency

PATCH must send `updatedAt`. If DB `updated_at` ≠ token → **409** `conflict`. Last-write-wins if client refetches. No CRDT.

---

## 7. Errors (user-visible, no silent loss)

| Code | HTTP | Copy key |
|---|---|---|
| unauthenticated | 401 | Accedi per continuare |
| forbidden_flag | 404 | — |
| invalid | 422 | field map |
| rate_limited | 429 | Riprova più tardi |
| already_exists | 409 | Hai già un’esperienza su questo tool |
| conflict | 409 | Aggiorna la pagina |
| not_found | 404 | — |
| invalid_transition | 409 | — |
| catalog_unknown | 422 | toolSlug |

---

## 8. Admin actions

`app/(admin)/admin/actions/experiences.ts` — `"use server"`:

- `publishExperienceAction(id)`
- `rejectExperienceAction(id, reason)`
- `hideExperienceAction(id, reason)`
- `resolveExperienceReportAction(id, note)`

Each: `requireAdminSession()`, validate UUID, load row, transition, `revalidatePath`.

---

## 9. Capability + intent (H5, not H0)

When write UI ships:

- `community.write`: `authPromptKey: "community.write"`, `continuation: true`
- `community.read` stays public (flag-gated)
- `PendingAuthCapability` += `"community.write"`
- Payload **`{ toolSlug }` only** (like notes). No draft text. `returnTo: /toools/{slug}`
- Flip INTENT-07 to a different unknown id
- `requestCommunityWrite({ toolSlug, origin })`
- Replay: open blank form, **do not insert**

AuthSheet copy (locked):

- Headline: **Condividi la tua esperienza**
- Body: **Racconta come usi davvero questo tool e aiuta altri a valutarlo meglio.**
- CTA: **Continua con il tuo account**
- Dismiss: Non ora

---

## 10. Telemetry (first-party, no vendor, no bodies)

`experience_view` (optional later)  
`experience_write_open`  
`experience_submit`  
`experience_edit`  
`experience_delete`  
`experience_report`  
`auth_gate_*` with capability `community.write`

Fields: name, toolSlug (public), origin. **No** body, email, uid, displayName.

Dev console only until an ingest exists; do not extend sponsor allowlist with UGC names unless a dedicated route is added. Prefer auth-gate style (dev log) for V1 rather than new public ingest.
