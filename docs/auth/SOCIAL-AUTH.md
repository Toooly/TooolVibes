# Social auth (Google / Apple / Microsoft / GitHub)

Canonical flow (same Supabase SSR/PKCE stack as magic-link, no second auth system):

1. UI (`OAuthButtons` in `AuthPage` / `AuthSheet`) calls the ONE service
   `signInWithSocialProvider()` in `lib/auth/social-auth.ts`.
2. Service maps public id → Supabase SDK id (`microsoft` → `azure`, others
   identical), builds `redirectTo = /auth/callback?next=<safe>` and calls
   `signInWithOAuth()`. Minimal scopes only (Google: `prompt=select_account`).
3. Provider → Supabase → `/auth/callback` → `exchangeCodeForSession()` →
   cookie session → safe `next` destination (validated by `isSafeReturnTo`;
   external URLs fall back to `/account?connected=1`).
4. `AuthContinuationProvider` replays the pending intent (Saved / Compare /
   Decisions / Account / note / search / radar / community) after
   `workspaceReadyForIntentReplay`, so OAuth returns to the original context.
5. Settings → "Metodi di accesso" links extra identities via
   `linkSocialIdentity()` (same redirect model). Supabase remains the
   identity-linking authority; the app never merges users by email.

## PRODUCTION ACTIVATION STATE (2026-09-30, verified live via GoTrue `/auth/v1/settings`)

- Project ref: `pjyasxaebxvvmcjxvnno` → `https://pjyasxaebxvvmcjxvnno.supabase.co`
- Identity-provider callback (IdP dashboards point HERE):
  `https://pjyasxaebxvvmcjxvnno.supabase.co/auth/v1/callback`
- Application redirect (Supabase `redirectTo`, code does `oauthRedirectTo(next)`):
  `https://tooolvibes.eu/auth/callback` (+ `?next=<safe-path>`)
- Site URL: `https://tooolvibes.eu` — Redirect allowlist: `https://tooolvibes.eu/auth/callback`
- Live provider flags: `google: true`, `github: true`, `azure: false`, `apple: false`, `email: true`.

| Provider | IdP resource | Supabase | Live | Real E2E |
|---|---|---|---|---|
| Google | GCP project `tooolvibes`, Web client `TooolVibes Web`, origin `https://tooolvibes.eu`, redirect = Supabase callback; consent External/Test, test user added | client ID + secret set, enabled | `true` | PASS (login → `/account?connected=1` → workspace, reload persists, settings shows Google Collegato) |
| GitHub | OAuth App `TooolVibes` (org `Toooly`), homepage `https://tooolvibes.eu`, callback = Supabase callback, email-read scope | client ID + secret set, enabled + allow-missing-email | `true` | PASS (authorize → callback → logged workspace, reload persists, settings shows GitHub Collegato) |
| Microsoft/Azure | SKIPPED per owner decision (Entra tenant friction) | disabled | `false` | not attempted — code path (`microsoft`→`azure`) implemented + unit-tested, UI hidden until enabled |
| Apple | BLOCKED: Sign in with Apple web requires paid Apple Developer Program membership (Services ID + Key + Team ID); owner declined enrollment | disabled | `false` | not possible without membership — code path + normalization (private-relay safe) implemented + unit-tested, UI hidden until enabled |

Secrets live ONLY in Supabase provider config. No secret in repo/docs/screenshots/logs.
Google consent is in Test mode: only added test users can log in until the app is published/verified.
GitHub App is org-owned (`Toooly`); authorization shows its org name — expected.

## What OpenCode configured automatically

- Provider mapping + `azure` alias, safe `next` handling, hardened callback
  (clears code/token from the URL), loading/disabled/focus states, inline
  brand icons (no new deps), 4-up responsive grid, Italian error copy.
- `lib/auth/profile-normalization.ts`: deterministic displayName /
  first-last / avatar / email / provider chain. Apple private-relay
  (email-only) and missing GitHub public email are safe; avatars accept
  https only.
- Viewer/workspace model untouched: social users hydrate the SAME
  `viewer_profiles` account row keyed by `auth_user_id`; guest → account
  attach/merge and logout paths are shared with magic-link.
- Tests: provider mapping, redirectTo/next validation, service
  loading/error, callback, normalization, email preservation, gates.

## External actions still required (objectively impossible to automate here)

1. Create OAuth client credentials at each IdP (Google Cloud Console,
   Apple Developer, Microsoft Entra, GitHub) — interactive consent required.
2. In Supabase Dashboard (or Management API with an access token, unavailable
   here): enable each provider, paste client ID/secret, confirm Site URL
   `https://tooolvibes.eu` and redirect `https://tooolvibes.eu/auth/callback`.
3. Real provider redirect can only be end-to-end tested after (1)+(2).
