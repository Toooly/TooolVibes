# CI quality gates runbook

## Purpose

The `Quality gates` workflow blocks merges when lint, types, unit tests, the
Next.js build, or the OpenNext/Cloudflare build fails. It does not deploy and
does not mutate application data.

## Runtime contract

- Node: `22.23.1` (`.nvmrc` / `.node-version`)
- npm: `10.9.2` (`packageManager` / `engines`)
- Install: `npm ci`; a lockfile change during install is a failure.

The workflow runs on pull requests, pushes to `main`, and manual dispatches.
Concurrent runs for the same ref are cancelled in favour of the latest commit.

## Local reproduction

From the repository root, activate the declared Node version and run:

```sh
npm install --global npm@10.9.2
npm run check:runtime
npm ci
npm run quality
npm run build
npm run build:cloudflare
```

`npm run quality` is the fast local aggregate for zero-warning lint,
typechecking, and unit tests. The two production builds remain explicit because
they are slower and produce separate evidence.

## Gates and ownership

| Gate | Command | Failure means |
| --- | --- | --- |
| Runtime | `npm run check:runtime` | Local/CI toolchain differs from the release contract. |
| Locked install | `npm ci` | Lockfile or dependency graph is not reproducible. |
| Lint | `npm run lint:ci` | Any ESLint error or warning exists. |
| Types | `npm run typecheck` | TypeScript cannot prove the application contract. |
| Unit | `npm run test:unit` | A deterministic unit test failed. |
| Next | `npm run build` | The production Next bundle cannot be produced. |
| OpenNext | `npm run build:cloudflare` | The Cloudflare release artifact cannot be produced. |

The author of the failing change owns diagnosis. Do not weaken a gate, update a
snapshot blindly, or add a global lint suppression to make the run green.

## Evidence

GitHub retains the complete step logs. Every run also uploads
`quality-evidence-<run-id>` for seven days with the command logs and any build
manifests that were produced before success or failure. The upload step uses
`if: always()` so partial evidence survives a red gate.

## Failure triage

1. Open the first failing step; later failures may be consequences.
2. Download the quality evidence artifact when the console log is truncated.
3. Reproduce the exact command locally on Node 22.23.1/npm 10.9.2.
4. Fix the cause in the smallest owning batch.
5. Re-run the failed command, then `npm run quality` and both builds.
6. Re-run the workflow; never bypass a required check for release work.

For OpenNext-only failures, compare `next-build.log` with
`opennext-build.log`; a green Next build and red OpenNext build usually points
to the Cloudflare adapter or runtime compatibility, not UI code.

## Controlled failure check

Use only a disposable branch or draft pull request:

1. Add one deliberate unused local variable to a test-only file.
2. Confirm `npm run lint:ci` exits non-zero and the workflow is red.
3. Confirm the evidence artifact contains `lint.log`.
4. Revert the deliberate change completely.
5. Confirm the next run is green.

Never merge or retain the deliberate failure. This exercise verifies branch
protection separately; repository administrators must configure `Quality gates
/ Lint, types, tests and builds` as a required check in GitHub.

## Temporary image suppressions

Nine legacy runtime `<img>` sites carry a local, one-line suppression for
`@next/next/no-img-element`. Each suppression references `TODO(B66)` and exists
only until the canonical image contract is implemented. Global rule disables
are prohibited.

## Rollback

Revert only `.github/workflows/quality.yml`, this runbook, and the four added
package scripts. Removing the workflow does not change the runtime UI or data.
