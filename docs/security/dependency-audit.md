# TooolVibes dependency security audit

## Scope

- Closure item: `SEC-101`
- Batch: `B08`
- Audit date: 2026-07-16
- Release runtime: Node.js `22.23.1`, npm `10.9.2`
- Deployment target: Next.js App Router on Cloudflare Workers through OpenNext

This record covers the direct release toolchain only. It does not authorize a
major-version upgrade or a broad dependency refresh.

## Installed baseline

| Package | Resolved version | Compatibility note |
| --- | ---: | --- |
| `next` | `15.5.20` | Exact patched maintenance release installed |
| `eslint-config-next` | `15.5.20` | Exact match with the Next.js patch |
| `react` | `19.2.4` | Satisfies the Next.js `^19.0.0` peer range |
| `react-dom` | `19.2.4` | Exact peer match with React |
| `@opennextjs/cloudflare` | `1.20.1` | Patched Cloudflare adapter; accepts Next.js 15.5.20 |
| `@opennextjs/aws` | `4.0.2` | Resolved transitively by OpenNext 1.20.1 |
| `wrangler` | `4.111.0` | Patched release; requires Node.js `>=22.0.0` |
| `@base-ui/react` | `1.6.0` | Latest stable 1.x; regression-tested with gate and dialogs |
| `@playwright/test` | `1.61.1` | Satisfies Next.js optional peer `^1.51.1` |

`npm ls react-server-dom-webpack react-server-dom-turbopack
react-server-dom-parcel --all` returns an empty tree. The React Server
Components implementation used by this application is bundled by Next.js, so
the Next.js patch is the controlling remediation.

## Audit evidence and limitation

The initial audit attempt ran while npm offline mode was active and reported
zero vulnerabilities. Registry lookups returned `ENOTCACHED`, so that result was
rejected as stale evidence and is not a release signal.

A fresh registry-backed `npm audit --json` after installing Next.js `15.5.20`
returned:

```text
info: 0
low: 2
moderate: 9
high: 10
critical: 0
total: 21
```

This fresh result is controlling. The direct Next.js middleware advisory is
patched, but the dependency graph is not release-clean. Affected families in
the audit included Wrangler/Miniflare and transitives such as Hono, Undici,
`ws`, `fast-uri` and PostCSS.

The compatible remediation was applied with the pinned runtime:

- `@opennextjs/cloudflare` `1.20.1`;
- `wrangler` `4.111.0`;
- `@base-ui/react` `1.6.0` after the Cloudflare bundle warning review;
- semver-safe transitive patches from `npm audit fix`, without `--force`.

After remediation, fresh registry-backed audits returned:

```text
full:       low 1, moderate 4, high 0, critical 0
production: low 0, moderate 4, high 0, critical 0
```

No high or critical advisory remains. The residual findings are explicitly
triaged:

- `postcss@8.4.31` is pinned inside Next.js 15.5.20. The advisory concerns CSS
  stringification; TooolVibes processes trusted repository CSS at build time
  and does not accept user-authored CSS. npm's proposed forced fix would
  downgrade Next.js to 9.3.3, so it is rejected. Track the next supported
  Next.js 15 maintenance patch that updates its internal PostCSS.
- `esbuild@0.27.3` is reached only through Vite in the development/test graph.
  Its low-severity advisory requires a Windows development server and is absent
  from `npm audit --omit=dev`; TooolVibes does not expose Vite as a production
  service. Track a Vite release compatible with esbuild 0.28.1 or later.

`npm audit fix --force` is forbidden for this release because its proposed
Next.js downgrade would reopen framework vulnerabilities and break the current
application contract.

A clean `npm ci` completed with Node.js 22.23.1/npm 10.9.2 and rebuilt 1,119
packages from the committed lockfile.

## Applicable official advisories

The previously installed `next@15.5.15` was inside the affected range of
[GHSA-26hh-7cqf-hhc6](https://github.com/vercel/next.js/security/advisories/GHSA-26hh-7cqf-hhc6):

- severity: high, CVSS 7.5;
- affected: `>=15.2.0 <15.5.18`;
- patched: `15.5.18`;
- impact: the initial segment-prefetch middleware fix did not cover
  `middleware.ts` with Turbopack.

It is also inside the affected range of the original segment-prefetch bypass
[GHSA-267c-6grr-h53f](https://github.com/vercel/next.js/security/advisories/GHSA-267c-6grr-h53f)
and the dynamic route parameter bypass
[GHSA-492v-c6pp-mqqv](https://github.com/vercel/next.js/security/advisories/GHSA-492v-c6pp-mqqv).

This is directly applicable to TooolVibes. `middleware.ts` is an authorization
boundary for:

- `/admin`, through the signed admin session cookie;
- the public access gate, through the gate session cookie;
- all routes covered by its matcher except explicitly allowed assets and APIs.

A transport-specific route that bypasses the middleware could expose content
without the expected admin or public-gate check. Route-level authorization
remains required, but it does not remove the need to patch the framework.

The official
[Next.js 15.5.18 release](https://github.com/vercel/next.js/releases/tag/v15.5.18)
contains the follow-up middleware fix and the cumulative May 2026 security
bundle:

- 7 high-severity advisories;
- 4 moderate-severity advisories;
- 2 low-severity advisories.

The current maintenance backport is
[Next.js 15.5.20](https://github.com/vercel/next.js/releases/tag/v15.5.20).
It is cumulative with 15.5.18 and also restores publication of
`@next/swc-wasm-web`. Next.js 15 remains in Maintenance LTS, so this audit does
not recommend moving the release closure to Next.js 16.

## Remediation decision

Applied direct patch:

```diff
- "next": "^15.5.15"
+ "next": "15.5.20"

- "eslint-config-next": "^15.5.15"
+ "eslint-config-next": "15.5.20"
```

`package-lock.json` was regenerated with the release runtime. React, React DOM
and Playwright were not broadly refreshed; direct changes were limited to the
reviewed release toolchain and Base UI stable 1.x.

Compatibility confirmed after the patch:

- Next.js `15.5.20` builds with OpenNext `1.20.1` / AWS adapter `4.0.2`;
- React and React DOM `19.2.4` satisfy the Next.js React 19 peer range;
- Wrangler `4.111.0` validates the generated worker;
- Node.js `22.23.1` satisfies Next.js, OpenNext and Wrangler engines;
- Playwright `1.61.1` satisfies the Next.js optional peer range;
- Base UI `1.6.0` passes SSR, gate, dialog and cross-browser regression tests.

## Required test matrix

| Gate | Command or check | Acceptance |
| --- | --- | --- |
| Lock integrity | Clean `npm ci` on Node.js 22.23.1/npm 10.9.2 | Install succeeds with no peer or engine errors; resolved Next.js and ESLint config are exactly `15.5.20` |
| Fresh full audit | `npm audit --json` with offline mode disabled and current registry data | No untriaged advisory; no applicable high or critical |
| Fresh production audit | `npm audit --omit=dev --json` with current registry data | No applicable high or critical in the production graph |
| Dependency tree | `npm ls next react react-dom @opennextjs/cloudflare wrangler @playwright/test --depth=0` | Single valid top-level resolution; no `invalid` or `extraneous` marker |
| Static quality | `npm run quality` | Lint, typecheck, and unit tests all pass |
| Next.js build | `npm run build` | Production build passes without new warning or route regression |
| Cross-browser smoke | `npm run test:e2e:smoke` | Chromium, Firefox, and WebKit pass |
| Middleware boundary | Anonymous requests to `/admin` and gated routes, including RSC/prefetch transport headers and route variants | Admin remains redirected to `/admin/login`; gated content remains inaccessible without its cookie |
| Auth callback | Existing auth callback/login smoke | Success and invalid/expired paths preserve their expected outcome |
| Image path | Exercise a representative `/_next/image` request for an allowed source | Response succeeds; invalid or oversized source fails safely |
| OpenNext build | `npm run build:cloudflare` | Worker and assets build successfully with no unsupported Next.js feature |
| Cloudflare dry-run | `wrangler deploy --dry-run` against the generated OpenNext worker | Bundle validates without upload or production mutation |

Observed local evidence:

- clean `npm ci`: pass (1,119 packages from lockfile);
- lint/typecheck: pass; Vitest: 12 files and 79 tests pass;
- Next.js production build and OpenNext build: pass;
- official core + security cross-browser smoke: 34/34 pass;
- Wrangler dry-run: pass without upload.

Wrangler reports one non-fatal duplicate `popupElement` key originating in Base
UI's dialog initial state. Base UI 1.6.0 retains the identical-null duplicate;
SSR, dialog and browser tests pass, so this is tracked as an upstream warning.

## Release status

`SEC-101` is **LOCALLY COMPLETE / STAGING EVIDENCE PENDING**. All applicable
high and critical advisories are closed, residual low/moderate findings are
triaged, and the local compatibility matrix is green. A valid real-Supabase auth
callback and the deployed edge response still require the B75-B77 disposable
staging rehearsal; the local matrix covers the invalid callback path, gate
transport variants, image optimization and generated Cloudflare artifact. No
production deployment or production database action was performed.
