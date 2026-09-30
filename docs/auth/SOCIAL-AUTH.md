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

## PRODUCTION ACTIVATION STATE — FINAL (verified live)

- Project ref: `pjyasxaebxvvmcjxvnno` → `https://pjyasxaebxvvmcjxvnno.supabase.co`
- Identity-provider callback (IdP dashboards point HERE):
  `https://pjyasxaebxvvmcjxvnno.supabase.co/auth/v1/callback`
- Application redirect (`redirectTo`, code `oauthRedirectTo(next)`):
  `https://tooolvibes.eu/auth/callback` (+ `?next=<safe-path>`)
- Site URL: `https://tooolvibes.eu` — Redirect allowlist: `https://tooolvibes.eu/auth/callback`
- Live GoTrue flags: `google: true`, `github: true`, `azure: false`, `apple: false`, `email: true`.

### EMAIL / MAGIC LINK: LIVE
Unchanged, coexists with social. Guest UI: email field + `Invia link`.

### GOOGLE: LIVE / PRODUCTION (not test-only)
- GCP project `tooolvibes`, Web client `TooolVibes Web`, origin `https://tooolvibes.eu`,
  redirect = Supabase callback.
- Publishing status: **In produzione** (External). Test-user restriction lifted.
- Scopes: none configured beyond Supabase runtime defaults (`openid email profile`);
  Accesso-ai-dati tables empty; verification center: "La verifica non è richiesta".
- Branding: name `TooolVibes`, support email set, homepage/privacy (`/privacy`)/
  terms (`/termini`) links set, authorized domains `tooolvibes.eu` (+ Supabase
  callback host). No logo submitted (optional polish; submitting one would trigger
  verification — intentionally deferred).
- Public eligibility proof: non-test account (`info@tooolvibes.com`) passed the
  Testing-block and reached Google identity challenge (no `403 access_denied`);
  existing Google session login → `/account?connected=1` → workspace, reload
  persists, settings shows Google Collegato, logout → guest UI.

### GITHUB: LIVE
- OAuth App `TooolVibes` (org-owned `Toooly` — acceptable), homepage
  `https://tooolvibes.eu`, callback = Supabase callback, email-read scope.
- Supabase: ID + secret set, enabled, allow-missing-email ON.
- E2E: authorize → callback → logged workspace, reload persists, settings shows
  GitHub Collegato, logout → guest UI. Same-email Google+GitHub link into ONE
  canonical account (verified `info@tooolvibes.com` shows both Collegato).

### MICROSOFT: DISABLED BY PRODUCT DECISION
`azure: false`, button hidden. Implementation retained dormant for future use.

### APPLE: DISABLED — PAID APPLE DEVELOPER DEPENDENCY NOT ACCEPTED
`apple: false`, button hidden. Sign in with Apple web requires paid Developer
Program membership (Services ID + key + Team ID). Implementation + private-relay
normalization retained dormant. No paid account required for this release.

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
