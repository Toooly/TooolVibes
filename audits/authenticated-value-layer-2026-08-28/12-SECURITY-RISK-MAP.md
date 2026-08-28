# 12 — Security Risk Map

**Status:** TARGET architecture + CURRENT debt. **Do not fix debt in this documentation pass.**

Personal workspace content must never leak between accounts. Hidden UI is not authorization.

Likelihood/impact: L / M / H.

---

## Risks

| ID | Risk | Impact | Likelihood | Mitigation | Wave | Test requirement |
|---|---|---|---|---|---|---|
| S1 | Cross-user workspace leak | H | L (CURRENT CAS + owner keys) | Keep service-role RPC only; Bearer `getUser`; never return another viewer’s JSON; owner-scoped localStorage | keep; regression in B attach tests | attach/load with two users; assert isolation (`workspace-account-isolation.test.ts` exists — keep green) |
| S2 | Private note exposure | H | L if notes stay in blob; H if later public column | Notes only in V1; never on public tool SSR; never LLM; never `community` | C | tool page SSR fixture has no note text for guests; auth sees own only |
| S3 | Unsafe pending-intent replay | H (unwanted writes) | M if naive | Validate schema, expiry, same-origin `returnTo`; one replay; clear intent; no-op if invalid; merge **before** replay | A/B | malformed, expired, duplicate, foreign returnTo — see 14 |
| S4 | Intent tampering | M | M (sessionStorage attacker = same browser) | Treat payload as **untrusted**. Slugs must exist in catalog; do not accept arbitrary stack dumps; ignore unknown keys | A/B | tampered slug / extra keys |
| S5 | AuthSheet bypass | M | M (CURRENT: createPersonalStack ungated in reducer) | UI `canUse`; no guest writer path in UI; remote persist still Bearer. Document reducer still client-local for guests — **acceptable** because guest cannot CAS. Do not add a remote guest stack API | B | guest cannot see create; guest reducer create if called only affects guest key, never remote |
| S6 | Guest/auth merge corruption | H | **H CURRENT** (wholesale toolStates) | Field-level merge doctrine in 10 | B | overlapping note/decision tests |
| S7 | Personal search leakage | H | L if client-only | No search API V1; do not log queries with notes to third parties; no LLM | D | no network on personal filter apply (except existing workspace PUT debounce unrelated to search) |
| S8 | Insight leakage | H | L | Client-derived; do not SSR personal insights into public cache (`dynamic = force-static` tool pages must stay public-only) | F | cached tool HTML has no personal copy |
| S9 | Community spam | H | H if shipped naive | Wave H: rate limit, pending status, captcha/report, RLS | H only | not in A–G |
| S10 | Community XSS/injection | H | H if HTML | Escaped text; no raw markdown HTML V1 | H | render test |
| S11 | Service-role misuse | H | M if new endpoints copy admin client | Workspace writes stay RPC `service_role` server-side only; never expose service key; browser uses user JWT | all | no `SUPABASE_SERVICE_ROLE_KEY` in client bundles (existing discipline) |
| S12 | Rate-limit abuse | M | M | Magic-link already limited; do not add unbounded intent replay writes; community later | A (reuse magic-link limits) | existing magic-link tests stay |
| S13 | Health metadata exposure | L–M | **CURRENT** | `/api/workspace-account/health` unauthenticated (`has_service_role`, `enabled`) | **DEBT — do not fix in this pass** | document only |
| S14 | GET `/api/workspace-state` 200 empty without Bearer | L | CURRENT | Not a leak; inconsistent contract. Optional later 401 — **not this pass** | debt | — |
| S15 | Magic-link + publicGate conflict | H if gate ON | L (gate default OFF) | If `publicGate` enabled, `/auth/callback` and `/api/auth/*` are not allowlisted — CURRENT footgun. Out of scope to fix here | debt | — |

---

## Privacy

- Notes, Filo, usage, decisions are **user-owned workspace**, not public SEO.
- Telemetry `auth_gate_*`: capability, origin, returnTo path. No email, no note body, no workspace JSON.
- No new analytics vendor.
- Community FUTURE: published text is public; pending is not.

---

## Authorization model (TARGET)

| Layer | Role |
|---|---|
| `canUse` | UI eligibility |
| AuthSheet | conversion, not security |
| Bearer + CAS | server backstop for the workspace blob |
| RLS / new tables | required only when data leaves the blob (Wave H) |

Do not rely on hidden buttons.

---

## Performance constraints (security-adjacent)

Do not “just send the workspace to a model” to skip indexing. That is both a privacy leak and a cost bomb.

One derived index per V1 revision. Lazy insights. No N+1. No LLM per route.

---

## Explicit non-fixes this pass

- Health endpoint
- GET workspace-state 200-empty
- publicGate vs auth allowlist
- Account deletion
- Reducing service-role surface of CAS (keep as-is unless a later security pass)
