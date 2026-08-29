# 06 — Privacy and security threat model

---

## 1. Trust boundaries

| Boundary | Public? |
|---|---|
| Published Experience fields (DTO in `02`) | Yes, by design |
| Pending / rejected / hidden | No |
| `author_id`, email, JWT, admin email | No |
| WorkspaceStateV1 (notes, Filo, stacks, decisions, insights) | **Never auto-copied** |
| Guest localStorage | Unrelated |

**Community ≠ publishing personal memory.**

Lock: **no** “Pubblica la nota privata”, **no** prefill from note / DecisionSheet reason / Filo / Stack / Personal Insights.

---

## 2. XSS (S10)

Store plain text. Render with React text children (auto-escape).

Forbidden V1: `dangerouslySetInnerHTML` for UGC, markdown, `rehype-raw`, GFM autolink, `javascript:` links.

Do not turn URLs into `<a>`. URLs may appear as text.

Tests XSS-01…08 in `09`.

---

## 3. Link / phishing

No clickable links. Reduces spam value. Users can still paste URLs as text; moderators see them in pending.

---

## 4. Personal data in body

Users may paste email, phone, client names, API keys.

Mitigations: UX guidance on the form; report reason `personal_data`; hide/reject; owner delete. **No** AI PII scanner V1.

---

## 5. Spam (S9)

| Control | V1 |
|---|---|
| Auth required to write | yes |
| One row per user/tool | yes (unique) |
| Pending-first | yes |
| Rate limits | yes |
| Min body 80 + required limits[] | yes |
| No clickable links | yes |
| Guest cannot report-flood | reports auth-only |
| Unique report pair | yes |
| Captcha on create | yes (Turnstile) |

---

## 6. Abuse / harassment / defamation

Hide/reject + reason. No public confrontation UI. No reply thread. Operational/legal risk: UGC claims about companies — moderation can remove; **do not write legal policy here**.

---

## 7. Author privacy

Public: `display_name` + duration only.  
Never: email, `auth.uid()`, viewer id, workspace id, `user_metadata` dump.

SSR/HTML/JSON-LD/OG/telemetry must not include uid/email.

---

## 8. Account deletion

**CURRENT:** no account deletion.

V1: owner **hard-delete** Experience is the erasure path.  
When account deletion is built: **CASCADE / app delete all rows where author_id = uid**. Do not anonymize-and-keep in V1 (that preserves public text without consent path).

Export today is workspace JSON only — does **not** include Experiences (correct; different store). FUTURE: include authored Experiences in export if legally required.

---

## 9. Retention

| Record | After |
|---|---|
| Owner delete | immediate hard delete (+ cascaded reports) |
| published | until owner delete or hide |
| hidden / rejected | 180 days then scheduled purge (service job FUTURE; document; V1 may keep until job exists) |
| resolved reports | 180 days |
| open reports | until resolved or parent deleted |

Do not keep UGC forever by default. V1 may ship without the purge cron **if** documented as follow-up (P1, not GO-blocker). Hide is enough for public safety.

---

## 10. Cache / leak

- Public GET may cache 60s.
- After hide, `revalidatePath` tool page immediately; accept ≤60s CDN staleness on the JSON API.
- Static tool HTML: first 8 published only. Never pending.

---

## 11. Legal / policy impact (checklist, not legal text)

Must update before **write flag on production**:

- Privacy Policy: public UGC, display name, retention, deletion
- Terms: user-generated content, license to display, prohibition of illegal/defamatory/spam, moderation rights
- Cookie page: no change expected (no new tracking cookies)
- Optional short community/content note on the form, not a new legal page V1

Do not draft the legal language in this package.

---

## 12. P0 / P1 risks

**P0 if implemented wrong**

- Self-publish via client status
- Pending HTML on `force-static` tool page
- `author_id` / email in public DTO
- Service role in browser
- Auto-prefill from private note
- Markdown HTML XSS

**P1**

- 60s stale after hide
- No purge cron at launch
- No account deletion cascade yet
- Directory slug drift vs CMS
- Single founder admin (bus factor, not authz hole)
- Turnstile skipped in dev
