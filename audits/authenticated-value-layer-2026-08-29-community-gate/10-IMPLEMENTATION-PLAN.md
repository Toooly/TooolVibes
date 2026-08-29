# 10 — Implementation plan (H1–H7)

**H0 (this package): documentation only. STOP after docs.**

Do not start H1 in the same pass as H0.

---

## H1 — Schema + RLS + contract tests

- Add migration files (not in H0)
- SQL contracts
- Optional live RLS behind env flag
- No UI, no public routes yet (or routes 404 via flags)

**Exit:** AUTHZ-01/04/05/07 expressible as SQL + 404 APIs.

---

## H2 — Server API + validation + rate limit

- `lib/community/*` (schema, repository, policy)
- `/api/community/experiences` GET/POST/PATCH/DELETE/report
- `consumeRateLimit` namespaces
- Turnstile on create
- Flags default off

**Exit:** mocked API tests; unique 409; rate 429.

---

## H3 — Admin moderation queue

- `/admin/experiences` + reports
- server actions + `revalidatePath`
- Nav Community group + desktop item

**Exit:** MOD-01…08 against mocked repo; founder cookie only.

---

## H4 — Public read UI

- `ExperienceSection` + `ExperienceCard` on tool page slot
- Empty state
- Pagination load-more
- `communityRead` flag
- SSR published-only

**Exit:** PRIV-H-01/02/07; guest HTML; no Review JSON-LD.

---

## H5 — Authenticated write/edit/delete

- Form, owner actions, dirty confirm
- Registry continuation + AuthSheet copy + pending intent `{ toolSlug }`
- Replay blank form
- `communityWrite` flag
- **No** private-note prefill

**Exit:** AUTH-copy tests; INTENT payload; owner edit → pending.

---

## H6 — Report flow

- Auth overflow Segnala
- Unique + rate limit
- Admin resolve (no auto-hide)

**Exit:** SPAM-04; AUTHZ-09.

---

## H7 — Security QA + release

- Full AUTHZ/XSS/spam/moderation/privacy
- 390–1280 QA
- Policy checklist
- Enable read then write on prod
- Canonical deploy stamp
- Guest smoke: section empty or published-only; write CTA → AuthSheet
- Auth persist smoke **required** for H (unlike A–G deferral): one real pending submit on staging

---

## Proposed files (later, not created now)

```
supabase/migrations/YYYYMMDDHHMMSS_community_experiences.sql
lib/community/schema.ts
lib/community/repository.ts
lib/community/policy.ts
app/api/community/experiences/route.ts
app/api/community/experiences/[id]/route.ts
app/api/community/experiences/[id]/report/route.ts
app/(admin)/admin/(protected)/experiences/page.tsx
app/(admin)/admin/actions/experiences.ts
components/community/experience-section.tsx
components/community/experience-card.tsx
components/community/experience-form.tsx
components/community/experience-report-action.tsx
```

Plus: registry/intent/AuthSheet/continuation/release-features/tool-detail-final-page/decision-nav.

---

## Recommended next pass

**H1 only.** Schema + RLS + SQL-string tests. No UI. No deploy required if migration is not applied to prod until H7.

Do not merge write-enabled UI in the same PR as the first migration.
