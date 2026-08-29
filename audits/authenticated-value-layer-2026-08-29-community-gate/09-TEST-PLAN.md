# 09 — Test plan

H0 does not add tests. H1+ must. Copy existing patterns:

- SQL string contracts: `__tests__/lib/supabase/public-submission-migration-contract.test.ts`
- Optional live RLS: `__tests__/integration/public-submission-rls.test.ts` (`TOOOLVIBES_RUN_SUPABASE_SECURITY_TESTS=1`)
- API mocked admin client: `__tests__/app/api/tool-requests/route.test.ts`

---

## 1. Migration contracts (H1)

Assert SQL text (normalized) contains:

- `create table public.community_experiences`
- `unique (author_id, tool_slug)`
- status/duration check lists
- `enable row level security` + `force`
- `revoke` insert/update/delete from anon/authenticated
- published SELECT policy `status = 'published'`
- own SELECT `author_id = auth.uid()`
- reports table without public SELECT grant
- **no** `drop table tools` / workspace tables
- **no** `schemaVersion` rewrite

---

## 2. AUTHZ matrix

| ID | Claim | Evidence |
|---|---|---|
| AUTHZ-01 | Guest cannot insert | PostgREST/API 401; SQL revoke |
| AUTHZ-02 | Cross-user update | 404 |
| AUTHZ-03 | Cross-user delete | 404 |
| AUTHZ-04 | Self-publish | POST status ignored; row pending |
| AUTHZ-05 | Author spoof | author_id from JWT only |
| AUTHZ-06 | Moderator spoof | user cannot set moderated_by/status hidden |
| AUTHZ-07 | Pending not public | GET list / SSR HTML omit |
| AUTHZ-08 | Rejected not public | same |
| AUTHZ-09 | Report enumeration | GET reports 404/401 for user; no list |
| AUTHZ-10 | Unauthenticated service misuse | admin actions redirect; user API without bearer 401 |

---

## 3. XSS matrix

Render published card from stored payload; assert **text**, no DOM nodes from payload.

| ID | Payload |
|---|---|
| XSS-01 | `<script>alert(1)</script>` |
| XSS-02 | `<img onerror=alert(1) src=x>` |
| XSS-03 | `javascript:alert(1)` |
| XSS-04 | `&lt;script&gt;` |
| XSS-05 | long combining marks / Zalgo within cap |
| XSS-06 | RTL override + body |
| XSS-07 | 50k paste → 422 |
| XSS-08 | `' OR 1=1 --` as useCase |

---

## 4. Spam matrix

| ID | Claim |
|---|---|
| SPAM-01 | 6th create / hour → 429 |
| SPAM-02 | create on many tools still capped by 5/h |
| SPAM-03 | duplicate user+tool → 409 not second row |
| SPAM-04 | 11th report / hour → 429 |
| SPAM-05 | double-click POST → one row |
| SPAM-06 | retry same body → 409 already_exists |

---

## 5. Moderation matrix

| ID | Claim |
|---|---|
| MOD-01 | insert pending |
| MOD-02 | publish → public GET contains |
| MOD-03 | reject → public GET omits; owner sees reason |
| MOD-04 | hide published → public omits |
| MOD-05 | owner edit published → pending, public omits |
| MOD-06 | hide from pending → 409 |
| MOD-07 | reject without reason → 422 |
| MOD-08 | `moderated_by` set from admin session, not client |

---

## 6. Privacy tests

| ID | Claim |
|---|---|
| PRIV-H-01 | email never in public DTO/HTML |
| PRIV-H-02 | auth uid never in public DTO/HTML |
| PRIV-H-03 | `toolStates.note` not prefilled / not imported |
| PRIV-H-04 | DecisionSheet reason not auto-copied |
| PRIV-H-05 | Filo not auto-copied |
| PRIV-H-06 | Stack names not auto-copied |
| PRIV-H-07 | owner delete removes row; public GET empty |

SSR: `ToolDetailFinalPage` HTML with read flag on and only pending rows → no body text.

---

## 7. Capability / AuthSheet (H5)

- `canUse("community.write", guest) === false`
- `canUse("community.read", guest) === true` (flag still may hide UI)
- INTENT: `{ toolSlug }` valid; extra keys / body text rejected
- AuthSheet copy exact strings in `05`
- Replay opens form, row count unchanged

---

## 8. Performance plan

Fixtures: 0 / 3 / 10 / 50 published on one slug.

- Tool page TTFB not regressed when flag off
- First 8 SSR; 50 does not dump all
- Admin pending list indexed (explain optional in staging)
- Zero extra round-trips per card for author (denormalized name)

---

## 9. Responsive / a11y QA (H7)

Rendered: 390 / 768 / 1024 / 1280 empty + 3 cards + form + report dialog.  
Keyboard, labels, axe on section+form. AuthSheet 390 sheet / 1280 dialog unchanged.

---

## 10. Regression keep-green

Guest save/compare/decide, notes, personal search, deep compare, insights, radar, workspace merge, `schemaVersion === 1`, no new SQL validator keys on V1 blob.
