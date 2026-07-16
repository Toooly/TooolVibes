# Distributed security state runbook

## Scope and release contract

`SEC-104` moves admin-login attempts, magic-link limits, public-gate attempts,
and admin-session revocations out of isolate-local `Map` instances. The Next.js
worker calls the internal `SECURITY_STATE` service binding. That worker routes
each opaque key to a SQLite-backed Durable Object, so increments and revocations
survive cold starts and are shared by all application isolates.

Production is fail-closed. A missing HMAC secret, binding, malformed service
response, or Durable Object failure denies the protected operation. The memory
adapter is accepted only in local development, plus the repository's explicitly
marked local E2E fixture. Never deploy `TOOOLVIBES_E2E_FIXTURES=1`.

## Bindings and variables

The application worker (`wrangler.jsonc`) requires:

- service binding `SECURITY_STATE` -> `tooolvibes-security-state`;
- `TOOOLVIBES_SECURITY_STATE_MODE=service`;
- secret `TOOOLVIBES_SECURITY_STATE_KEY_SECRET`, at least 32 random characters.

The state worker is configured by
`workers/security-state/wrangler.jsonc`. Its internal binding is
`SECURITY_STATE_DO`, class `SecurityStateDurableObject`, migration tag `v1`.
It has no `workers.dev` or preview URL. The HMAC secret belongs only to the
application worker: the state worker receives opaque keys and never raw IPs,
email addresses, or session tokens.

Allowed adapter modes are:

| Mode | Permitted use | Behavior |
|---|---|---|
| `service` | staging and production | Required distributed path |
| `memory` | local dev and local E2E fixture only | Process-local deterministic fallback |
| `deny` | emergency production kill switch | Denies every protected operation |

## Policies

| Surface | Namespace | Limit | Window | Counting rule |
|---|---|---:|---:|---|
| Admin login IP | `admin-login-ip` | 5 | 15 minutes | Failed attempts only; success clears |
| Magic-link email | `auth-magic-email` | 1 | 1 minute | Every accepted request |
| Magic-link IP | `auth-magic-ip` | 5 | 1 hour | Checked after email policy |
| Public gate IP | `public-gate-ip` | 5 | 15 minutes | Failed passwords only; success clears |
| Admin revocation | `admin-session-revoked` | n/a | Remaining token lifetime | Logout stores a token revocation |

An `identifiers` array is one canonical tuple, not multiple independent
policies. IP and email limits must use separate namespaces and separate atomic
calls. Cloudflare's `cf-connecting-ip` is authoritative in production. If it is
missing, all such requests use the shared fail-safe `unknown` key; forwarded
headers are accepted only outside production.

Denied JSON APIs return `429` with `Retry-After`, `RateLimit-Limit`,
`RateLimit-Remaining`, and `RateLimit-Reset`. Admin login preserves the native
HTML form: requests accepting `text/html` receive the existing `303` redirect
to `?error=rate-limited` with the same rate headers. Non-HTML admin clients
receive JSON `429`.

## First deployment

Run against the intended Cloudflare account and verify `wrangler whoami` first.

1. Deploy the state worker and its `v1` Durable Object migration:

   ```powershell
   npx wrangler deploy --config workers/security-state/wrangler.jsonc
   ```

2. Generate a dedicated random value of at least 32 characters and set it only
   on the application worker:

   ```powershell
   npx wrangler secret put TOOOLVIBES_SECURITY_STATE_KEY_SECRET --config wrangler.jsonc
   ```

3. For Git-connected Workers Builds, add the same secret to the application
   worker's build/deploy secrets. Do not add it to `vars` or commit it.
4. Rotate `TOOOLVIBES_SESSION_SECRET` during this cutover. This intentionally
   invalidates pre-cutover admin and gate cookies and prevents a formerly
   revoked in-memory admin token from becoming valid after the store switch.
5. Build and deploy the application worker only after the state worker exists:

   ```powershell
   npm run build:cloudflare
   npx wrangler deploy --config wrangler.jsonc
   ```

For a named staging environment, deploy a separately named state worker and
point staging's `SECURITY_STATE` binding at that exact service name. Never share
production state with staging.

## Staging verification

Capture timestamped evidence for all of the following:

1. Parallel requests from two independent clients share one counter; exactly
   the configured burst is accepted.
2. Gate and magic-link denial return `429` plus a positive `Retry-After`.
3. Admin HTML receives `303` with `Retry-After`; an `Accept: application/json`
   request receives `429` JSON.
4. A token copied to two browser contexts is denied in the second context after
   logout in the first.
5. After the policy window or token TTL, state expires and a new request works.
6. With `TOOOLVIBES_SECURITY_STATE_MODE=deny`, gate/login/magic-link are denied
   and existing admin sessions cannot pass verification.
7. Missing binding and a deliberately unavailable staging state worker produce
   controlled `503`/denial, never a permissive fallback and never PII in logs.

Restore `service` immediately after the failure drill. Do not perform the drill
against production.

## Rollback and incident handling

Prefer fix-forward. The safe emergency rollback is
`TOOOLVIBES_SECURITY_STATE_MODE=deny`; it blocks authentication-related
operations while public unaffected routes remain available. Do not switch a
production worker to `memory`.

If application code must be rolled back to a revision that does not read the
Durable Object, rotate `TOOOLVIBES_SESSION_SECRET` at the same time. Otherwise a
token revoked only in distributed state could be resurrected. Leave the state
worker deployed: alarm-backed records expire naturally and an unused binding is
harmless.

Rotating `TOOOLVIBES_SECURITY_STATE_KEY_SECRET` resets the keyspace. Treat that
as a security migration: rotate the session secret concurrently, expect all
rate windows to restart, and record the operator, reason, and timestamp.

Monitor application `429`/`503` rates, state-worker exceptions and Durable
Object latency. Alerts must never include request email, IP, password, cookie,
token, or opaque key.
