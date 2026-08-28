# 11 — Community Experiences Spec

**Status:** DESIGN ONLY. Wave H. **Do not implement in waves A–G.**  
This is not an implementation-ready shortcut. New tables, RLS, moderation, and abuse controls are mandatory before any write path.

**CURRENT:** no community product. `/community` → `/contributi` (editorial + email). Tool/affiliate request forms. Radar “commenti” are Product Hunt counts. No user Experiences, comments, reviews, or `community.write`.

---

## Positioning

**Esperienze**, not recensioni, not 5-star ratings.

Private notes (`note.private`) ≠ public Experiences.

| | Private note | Experience |
|---|---|---|
| Audience | only the author | public when `published` |
| Store | `toolStates.note` in V1 | **new tables** (not V1) |
| Shape | free text ≤2000 | structured fields below |
| Moderation | none (private) | required |

---

## Access (TARGET when H is approved)

| ID | Access |
|---|---|
| `community.read` | FUTURE PUBLIC — published only |
| `community.write` | authenticated — one Experience per user per tool |

Guest: may **read** published Experiences (when they exist). May not write. Write CTA → AuthSheet (not in A–G).

---

## Potential V1 record

```
Experience {
  id
  toolSlug
  authorUserId
  displayName          // minimal attribution, not a social profile
  useCase              // how do you use it?
  experience           // short experience
  pros
  limits
  durationBucket       // usedSince / duration, enum TBD at implementation
  switchedFromSlug?    // optional
  status               // pending | published | hidden | rejected
  createdAt
  updatedAt
}
```

One Experience per `(authorUserId, toolSlug)`. Owner may edit/delete own row (edit returns to `pending` if published copy changed — decide at implementation; default recommendation: **edit of published stays published unless moderation flags**).

No star ratings.

---

## Moderation and safety (required before ship)

| Need | Rule |
|---|---|
| Status | pending / published / hidden / rejected |
| Report | authenticated report action, rate limited |
| Owner edit/delete | yes |
| Rate limit | create/edit/report |
| Anti-spam | server-side; no trusting the client |
| RLS | author read own; public select `status=published` only; no service-role browser writes |
| XSS | store text, render escaped; no markdown HTML V1 |
| Abuse | hide/reject without deleting audit |

Admin tooling: reuse admin cookie world, not the product capability registry.

---

## Attribution / trust

Minimal identity: display name (from account metadata / email local-part) + contribution count.  

NO public profile network. NO followers. NO feeds as a social product. NO DMs. NO social graph.

---

## What H is not

Not comments. Not a forum. Not notifications. Not Salvati/Home redesign to show a social feed.

---

## Implementation gate

Wave H starts only after explicit product approval **after** A–G (or a subset) has shipped. Architecture here is intentionally incomplete on duration enum, admin UI, and copy — those are implementation-time.

---

## Forbidden until that approval

DB migrations for experiences. UI on tool pages. `community.write` in the shipped registry UI. Any public write.
