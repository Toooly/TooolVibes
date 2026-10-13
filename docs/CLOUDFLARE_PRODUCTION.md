# Cloudflare production configuration

TooolVibes uses Workers Paid (Standard). The configuration lives in the two
Wrangler files; dashboard edits must be reflected there to survive deployment.

| Worker | CPU per invocation | Invocation logs | Traces |
| --- | ---: | ---: | ---: |
| `tooolvibes` | 3,000 ms | 100% | 5% |
| `tooolvibes-security-state` | 1,000 ms | 100% | 5% |

These CPU limits cap individual runaway requests; they are not monthly spending
caps or network timeouts. The October 13, 2026 pre-change 24-hour metrics showed
987 ms P99 CPU for successful site requests, 1.8 ms for the security service,
and 12 site invocations ending with `exceededResources`. CPU quantiles from
Cloudflare GraphQL are reported in microseconds. The limits provide headroom
without allowing the default 30 seconds of CPU per request.

Retain the OpenNext release-scoped static cache and static-assets binding. Never
cache authenticated responses or replace the public HTML `no-store` contract
with a blanket CDN cache rule. Keep existing security-state bindings and SQLite
Durable Object migrations unchanged.

Both Workers upload server-side source maps to Cloudflare for readable exception
stacks. OpenNext's generated server bundle limits how far maps resolve back to
original application source; these are not public browser source maps. Full
invocation logs preserve evidence for rare failures at current traffic levels.
Traces sample 5% of requests to show backend and service-binding timings.

## Release

Work on clean `main`, commit explicit paths, and push `origin main`. Deploy the
site with `npm run cloudflare:deploy`; this builds the exact Git SHA and verifies
`/api/release`. Deploy security-service configuration with:

```sh
npx wrangler deploy --config workers/security-state/wrangler.jsonc
```

That command is for the separate security Worker only. Its source and Durable
Object migration history must be reviewed before deployment. The site's
unguarded deploy commands remain disabled.

After deployment, read both Workers' live settings and confirm their CPU limits,
source-map upload, log and trace configuration, service bindings, and release
identity. Run guest navigation smoke checks and inspect recent Workers metrics
for `exceededResources` and exceptions. Use a short real-time tail when reproducing
an issue rather than raising CPU limits without evidence.

## Usage and cost

The $5 monthly Workers base includes 10 million dynamic requests and 30 million
CPU milliseconds; static-asset requests remain free. Workers Logs currently
includes 20 million events per month. Additional usage is billable: these limits
do not guarantee a total bill of $5. Review account usage and lower log sampling
when traffic warrants it. Cloudflare changes observability pricing on December 1,
2026; review the current pricing before estimating future log and trace costs.

This configuration does not subscribe to additional Cloudflare products. Do not
enable Smart Placement for the public Worker without latency measurements: its
static cache is intentionally served near users, while backend access is only
part of its workload.

References: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[CPU limits](https://developers.cloudflare.com/workers/platform/limits/#cpu-time),
[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/),
[traces](https://developers.cloudflare.com/workers/observability/traces/),
[source maps](https://developers.cloudflare.com/workers/observability/source-maps/).
