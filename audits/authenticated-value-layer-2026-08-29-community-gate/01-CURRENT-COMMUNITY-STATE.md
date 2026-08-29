# 01 — Current community state (forensic)

**HEAD:** `a81035806f5512089f1b6ad1b4bf6f3c696185c9`  
**Read-only.** Wave H is **not** implemented.

---

## 1. What exists today

| Surface | Reality |
|---|---|
| `/community` | `permanentRedirect("/contributi")` |
| `/contributi` | Editorial mailto. No UGC product. |
| Tool/affiliate requests | Public forms → service-role RPC → admin queues |
| Radar “commenti” | Product Hunt counts |
| `community.write` / `community.read` | Registry **stubs**. `authPromptKey: null`, `continuation: false` |
| PendingAuthIntent | **Rejects** `community.write` (INTENT-07) |
| AuthSheet | No community copy (falls through to stack.create) |
| Experiences tables | **None** |
| Comments / reviews / stars / profiles | **None** |
| Account deletion | **None** (“non disponibile in questo ciclo”) |
| Bans | **None** |

WorkspaceStateV1 `schemaVersion` remains **1**. Community must not add root keys.

---

## 2. Identity model

Two private layers, **no public author**:

| Layer | Key | Public? |
|---|---|---|
| Supabase Auth | `auth.users.id` via `getSession()` / `admin.auth.getUser(token)` | Never |
| Viewer / workspace | `viewer_profiles.id` + cookie `tooolvibes-viewer` | Never |

- `viewer_profiles`: `id`, `access_token`, `kind`, `auth_user_id` (no FK to `auth.users`), timestamps. **No name columns.**
- Register `first_name` / `last_name` live only in `user_metadata` (magic-link `options.data`). Settings identity is **email local-part**. Copy: “Nessun profilo sociale.”
- Email appears on private `/account/settings` and submissions lookup. Not on public pages.
- **Do not use workspace owner or `viewer_profiles.id` as public identity.**

There is no `getDisplayName` helper. Wave H must snapshot a safe display string onto the Experience row (see `02`).

---

## 3. Admin / moderator

**Independent of Supabase Auth.** Single founder cookie `tooolvibes_admin` (HMAC, 8h, `requireAdminSession()`).

Roles in the product: anon, authenticated, service_role, admin (cookie), guest viewer. **No editor/moderator RBAC.**

Existing UGC-ish queues to clone:

- `/admin/suggestions` — tool_requests (received/reviewing/approved/rejected)
- `/admin/affiliates` — affiliate_requests

`collection_transition_reviews` is CMS, not user content.

Wave H moderation **reuses this cookie world**. Do not invent `canUse("moderate")`. Admin identity stored on rows as text (session email), not `auth.uid()`.

---

## 4. Catalog persistence (tool reference)

Production wrangler: `TOOOLVIBES_TOOLS_SOURCE=directory`.

Live catalog = `lib/data/tooolvibes-directory.ts` (~30 tools, `id === slug`). `public.tools` exists for CMS but **is not the live catalog**.

Stable public identifier: **slug** (`^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1–120). Tool pages `/toools/[slug]`, `dynamic = force-static`.

**Do not FK Experience → `public.tools(slug)`.** That would accept CMS-only slugs and reject directory slugs. Validate `tool_slug` at the API against `getPublicToolViews()`. If a slug later leaves the catalog: keep the row for admin; public tool page 404s anyway.

Slug rename: no redirect table today. Experiences stay on the stored slug.

---

## 5. RLS / write patterns to copy

Hardened public writes (`tool_requests`, `affiliate_requests`, `waitlist`, workspace blob):

- FORCE RLS
- REVOKE INSERT/UPDATE/DELETE from `anon` / `authenticated`
- GRANT ALL `service_role` (or SECURITY DEFINER RPC EXECUTE service_role only)
- Next.js route: validate → (JWT `getUser` if auth) → service-role persist
- Browser never receives `SUPABASE_SERVICE_ROLE_KEY` (`server-only` admin client; Cloudflare build deletes the env from client)

Authenticated product APIs use **Bearer JWT**, not cookies. Admin CMS uses **cookie + server actions**.

**No CORS** on `app/api`. Same-origin only.

CSRF: Bearer APIs are not cookie-session; admin is `SameSite=lax` HttpOnly. No CSRF token in repo.

---

## 6. Rate limit infrastructure (reuse)

`lib/security/distributed-state.ts` → Cloudflare Durable Object (`SECURITY_STATE`).

- HMAC-opaque keys, fixed-window counter
- Prod fail-closed (503 if store down)
- IP from `cf-connecting-ip`

Do **not** reuse `guardPublicSubmission` closed union (`tool_request | affiliate_request | waitlist`) as-is. Add a dedicated community guard that still calls `consumeRateLimit`.

Turnstile + honeypot exist on **anonymous** public POSTs only. Authenticated workspace/signal writes do not use CAPTCHA. Wave H create/report: rate limit + pending-first + one-per-tool; Turnstile **optional** on create (recommended on) because UGC is public.

---

## 7. Sanitization / XSS

- No DOMPurify / sanitize-html
- `react-markdown` + `rehype-raw` + `rehype-sanitize` is **editorial only** (GFM can autolink `https://`)
- App `dangerouslySetInnerHTML`: **only** JSON-LD with `<` escaped
- Legal pages: React text children

**UGC V1: plain text, React children, no markdown renderer, no auto-link.**

---

## 8. Feature flags

`lib/config/release-features.ts` boolean registry. No `TOOOLVIBES_COMMUNITY_*` today. Pattern: defaultEnabled + env `1/true/on/yes`. Copy `compareDecision`.

---

## 9. Tool page insertion

`components/tool-detail-final/tool-detail-final-page.tsx` section order: Hero → Score → Nav → Editorial → Extended → Ad → Information → Signal → **Alternatives** → Partner → Footer.

Least-redesign slot: **after Signal, before Alternatives**. Anchor `#td-final-experiences`. Add one DecisionNav link. Write CTA may also sit in the client action surface (pattern: Nota privata / Per te).

JSON-LD today: `SoftwareApplication` + `BreadcrumbList`. **No Review.** Keep it that way.

---

## 10. Privacy / legal

`/privacy`, `/termini`, `/cookie` do **not** mention public UGC. Release checklist must update policy (see `06`). Do not write legal text in H0.

---

## 11. Implications for H

1. Author = `auth.uid()` from server `getUser(token)`, never client `author_id`.
2. Display name is a **row snapshot**, not a profile table.
3. Writes follow workspace/submissions harden: Next API + service role + RLS deny client mutations.
4. Tool reference is **slug + API catalog check**, not SQL FK.
5. Admin queue clones `/admin/suggestions`.
6. Registry stub must gain `authPromptKey` + `continuation` when H5 ships; INTENT-07 must flip.
7. Experiences are **not** V1 blob data.
