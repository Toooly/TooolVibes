# 12 — H2 status

**H2:** server API implemented · not released · no UI · no deploy

- Public GET: published rows only, explicit columns, `private, no-store`
- Owner writes: Bearer `getUser`, `author_id` from JWT, status forced pending
- Display name: explicit `displayName` (strategy B), never email local-part
- Turnstile action `community_experience` on POST create only
- No report/moderation routes
