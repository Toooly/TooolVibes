# Magic-link email

## Live path

Production (and any deployed environment running this app) sends magic-link
mail through **Resend**, from `POST /api/auth/magic-link`.

Flow:

1. The route calls GoTrue admin `generate_link` (`type: magiclink`).
2. It builds the confirm URL as `/auth/callback?token_hash=…&type=email`.
3. It sends HTML + text from `lib/auth/magic-link-email.ts`
   (`getMagicLinkHtml` / `getMagicLinkText`).
4. Subject is `Entra in TooolVibes`.

This is live when the application code is deployed. It does **not** read
`supabase/templates/*` at runtime.

## Dashboard templates — not live from this repo

`supabase/templates/magic-link.html`, `magic-link.txt`, and
`magic-link.subject.txt` match the same design for **manual paste** into
Supabase. Committing them here does **not** update the dashboard.

They become live only if someone pastes them into:

**Supabase Dashboard → Authentication → Email Templates → Magic Link**

Paste locations:

| Dashboard field | File |
| --- | --- |
| Subject | `supabase/templates/magic-link.subject.txt` |
| HTML body | `supabase/templates/magic-link.html` |
| Plain-text body (if the dashboard shows one) | `supabase/templates/magic-link.txt` |

Keep this callback shape so the app can verify the one-time token:

```text
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
```

Confirm signup (`supabase/templates/confirm-signup.*`) is a separate dashboard
template. The live magic-link route does not use it.

This document does not claim the production Supabase dashboard was updated.
