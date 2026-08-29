# 03 — RLS and authorization

**Law:** UI `canUse` is never security. Hidden buttons are not authorization.  
**Pattern:** match hardened workspace / public submissions.

---

## 1. Ownership

`author_id` is assigned **only** server-side:

```
Bearer access_token → createAdminSupabaseClient().auth.getUser(token) → user.id
```

Never trust `author_id` in JSON. Never use `viewer_profiles.id`. Never use workspace owner.

Admin cookie identity is **not** an Experience author. Admins moderate; they do not write Experiences as users unless they also have a magic-link session (separate).

---

## 2. Privilege matrix

| Actor | Published SELECT | Own pending/rejected/hidden SELECT | INSERT | UPDATE content | UPDATE status | DELETE | Reports INSERT | Reports SELECT |
|---|---|---|---|---|---|---|---|---|
| anon | yes | no | no | no | no | no | no | no |
| authenticated other user | yes | no | no | no | no | no | own report only | no list |
| author | yes | yes | own, forced pending | own, via API | no (except resubmit via API) | own, via API | yes | own report row optional |
| browser service_role | n/a | n/a | **forbidden** (no key in browser) | — | — | — | — | — |
| Next API + service_role after JWT | yes | yes | yes | yes | no (moderation is admin path) | yes | yes | — |
| Admin cookie + server action + service_role | yes (all statuses) | yes | no (not an author path) | no content edit V1 | publish/reject/hide | no hard-delete V1 (owner only) | resolve | all |

---

## 3. Grants (H1 correction)

`ENABLE` + `FORCE ROW LEVEL SECURITY`.

**H0 draft granted SELECT to anon/authenticated. H1 retracts that.**

Postgres RLS filters **rows**, not **columns**. A published-row SELECT policy plus `GRANT SELECT` would let anon read `author_id` (auth uid). That violates “no auth uid public”.

**Locked H1:**

```
REVOKE ALL ON community_experiences FROM PUBLIC, anon, authenticated;
REVOKE ALL ON community_experience_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON both tables TO service_role;
```

No client SELECT. Public content is still public **through H2/H4 server projection** of safe columns only.

Defense-in-depth: owner `FOR SELECT TO authenticated USING (author_id = auth.uid())` exists but is inert without GRANT. If SELECT is ever granted later, authenticated users would see **own** rows only — not others’ published `author_id`. There is **no** public published SELECT policy on the base table.

---

## 4. Policies — `community_experiences`

### No public published SELECT on the base table

A `status = 'published'` policy plus table SELECT would leak `author_id`. H1 does **not** create that policy.

### SELECT own (authenticated) — defense in depth, no GRANT

```
FOR SELECT TO authenticated
USING (author_id = auth.uid())
```

Quoted name: `"Users can read own community experiences"`.

Inert until someone GRANTs SELECT. Then users see **own** rows only.

### No INSERT/UPDATE/DELETE policies for anon/authenticated

Absence + REVOKE is the write control. Server forces `status`.

### service_role

`"Service role can manage community experiences"` FOR ALL. `service_role` also typically BYPASSRLS. H2 still authorizes in Next before using the admin client.

---

## 5. Policies — `community_experience_reports`

No client policies except service_role FOR ALL.

No anon/authenticated SELECT or INSERT. H2 writes reports after auth + rate limit. Admin reads via service_role.

---

## 6. Server authorization (API)

| Route | Authz |
|---|---|
| `GET` public list | Flag `communityRead`; query `status=published` only; pagination |
| `GET` mine | Bearer `getUser`; `author_id = user.id` |
| `POST` create | Flag `communityWrite`; Bearer; force `author_id`, `status=pending`; catalog slug check; unique catch 409 |
| `PATCH` | Bearer; load row; must be author; apply state machine; never copy `status` from client except implicit pending on content edit |
| `DELETE` | Bearer; author only |
| `POST` report | Flag read+write or dedicated; Bearer; target must be `published`; cannot report own V1? **Lock: may report own? NO.** |
| Admin actions | `requireAdminSession()` then service_role; validate transition |

---

## 7. Self-publish / spoof (must fail)

- Body `{ status: "published" }` on POST → ignored; stored pending.
- Body `{ author_id: victim }` → ignored.
- PATCH moderator fields as user → stripped.
- Guest POST → 401.
- Cross-user PATCH/DELETE → 404 (do not leak existence of others’ pending) or 403. **Lock: 404** for non-owned ids.

---

## 8. Service-role policy

- Import only from `server-only` modules (`lib/supabase/admin-client.ts`).
- Wave H must not add a new browser client with elevated key.
- Do not create a SECURITY DEFINER RPC that takes `p_author_id` from the client (forgery). If an RPC is used, it must use `auth.uid()` internally **or** only be EXECUTE-granted to service_role and called after Next already set author from JWT.
- **Recommendation:** no RPC for V1. Next API + admin client insert/update/delete. Simpler tests. RLS still blocks direct PostgREST.

---

## 9. CSRF / CORS

- User APIs: `Authorization: Bearer`. Not cookie CSRF.
- Admin: existing `SameSite=lax` HttpOnly cookie + Next server actions (origin check). Do not add a public cookie-auth community endpoint.
- No `Access-Control-Allow-Origin` on these routes. Same-origin.

---

## 10. AUTHZ test ids (see `09`)

AUTHZ-01 guest insert  
AUTHZ-02 cross-user update  
AUTHZ-03 cross-user delete  
AUTHZ-04 self-publish  
AUTHZ-05 author spoof  
AUTHZ-06 moderator spoof (user sets moderated_by)  
AUTHZ-07 pending public leak  
AUTHZ-08 rejected public leak  
AUTHZ-09 report enumeration  
AUTHZ-10 service-role endpoint without session
