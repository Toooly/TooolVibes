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

## Configuration state (verified 2026-09-30)

- Production Supabase `https://pjyasxaebxvvmcjxvnno.supabase.co` `GET /auth/v1/settings`:
  `external = { google: false, apple: false, azure: false, github: false, email: true }`.
  All four social providers are currently DISABLED server-side.
- Local `supabase/config.toml` scaffolds `[auth.external.{google,apple,azure,github}]`
  as `enabled = false` (no secrets committed) and adds the production
  `https://tooolvibes.eu/auth/callback` redirect URL.
- `/api/auth/config` derives UI availability from live GoTrue `external`
  state, so a provider never renders as usable unless Supabase reports it
  enabled. `parseEnabledOAuthProviders` maps `azure` → `microsoft`.
- Supabase CLI is not installed here (`supabase: command not found`) and no
  `SUPABASE_ACCESS_TOKEN` exists in env, so server-side enablement + IdP
  OAuth client credentials could NOT be automated — see external blockers.

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
