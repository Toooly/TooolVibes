# Signal Progression Test Runbook

## Prerequisites

- Docker / Colima running
- Supabase CLI 2.x
- Node 22.23.1

## Local environment

```bash
cd Tooolvibes
npx supabase start
npx supabase status  # verify local only
```

## Run live integration tests

```bash
TOOOLVIBES_RUN_SIGNAL_INTEGRATION_TESTS=1 \
TOOOLVIBES_SIGNAL_TEST_DB_URL=http://127.0.0.1:54321 \
TOOOLVIBES_SIGNAL_TEST_ANON_KEY=<from supabase status> \
TOOOLVIBES_SIGNAL_TEST_SERVICE_KEY=<from supabase status> \
npx vitest run __tests__/integration/signal-progression-live.test.ts
```

## Safety guard

The test refuses to run against any non-local host. The guard checks for
`127.0.0.1`, `::1`, or `localhost` in the URL. Any other host — including
production — immediately throws.

## Run all signal progression tests

```bash
npx vitest run __tests__/lib/signal-progression __tests__/integration/signal-progression-live.test.ts
```

## Stop local Supabase

```bash
npx supabase stop
```

## Quick manual RPC test

```bash
# Get ANON_KEY from `npx supabase status`
curl -s http://127.0.0.1:54321/rest/v1/rpc/accept_signal_engagement \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}' | jq .
```
