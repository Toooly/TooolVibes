# 04 — Capability Registry Spec

**Status:** TARGET. Not built.  
**CURRENT:** no product ACL. Access is ad-hoc `owner.kind === "account"`, `AccountGate`, and Bearer checks on a few APIs.

Do **not** build RBAC. We need two product viewers: `guest` and `authenticated`. Admin/editor remain a **separate** cookie system (`lib/admin/*`) and must not be folded into this registry.

---

## Conceptual API

```ts
type ViewerKind = "guest" | "authenticated";

type CapabilityAccess = "public" | "guest-local" | "authenticated";

function canUse(capability: CapabilityId, viewer: ViewerKind): boolean;
```

UI eligibility uses `canUse`.  
Server authorization is a **separate** column (`serverEnforced`). Hidden UI is never security.

---

## Metadata per capability

| Field | Meaning |
|---|---|
| `id` | Stable string |
| `access` | `public` \| `guest-local` \| `authenticated` |
| `reason` | Why this access is natural |
| `authPrompt` | AuthSheet copy key (null if public) |
| `fallback` | What a guest sees instead |
| `continuation` | Whether a PendingAuthIntent may be stored |
| `telemetryKey` | `capability` value on `auth_gate_*` |
| `serverEnforced` | How the server must enforce, if at all |
| `wave` | A–H or `keep` |

---

## Registry (canonical)

### Public / guest-local (no AuthSheet)

| id | access | reason | authPrompt | fallback | continuation | telemetryKey | serverEnforced | wave |
|---|---|---|---|---|---|---|---|---|
| `catalog.browse` | public | discovery | null | page | no | — | none | keep |
| `tool.page.public` | public | SEO / understand | null | page | no | — | none | keep |
| `search.basic` | public | public catalog query | null | catalog search | no | — | none | keep |
| `radar.public` | public | public signal | null | `/radar` | no | — | none | keep |
| `alternatives.basic` | public | catalog fact | null | table | no | — | none | keep |
| `collections.editorial.read` | public | editorial stacks | null | `/collections` | no | — | public read RLS/source | keep |
| `compare.basic` | public | discovery compare | null | `/compare` | no | — | none | keep |
| `save.local` | guest-local | cheap capture | null | Speed 1 | no | — | none on local write | keep |
| `decide.fast` | guest-local | judgment ≠ identity | null | DecisionSheet | no | — | none on local write | keep |
| `note.local` | guest-local | on-device scratch | null | `/shortlist` sheet | no | — | none | keep |
| `usage.local` | guest-local | same as decide | null | boards | no | — | none | keep |

### Authenticated

| id | access | reason | authPrompt | fallback | continuation | telemetryKey | serverEnforced | wave |
|---|---|---|---|---|---|---|---|---|
| `stack.create` | authenticated | persistent working set | `stack.create` | AuthSheet; editorial collections as concept preview | **yes** (slug, optional name) | `stack.create` | CURRENT: none beyond blob CAS. TARGET: do not add a guest write path; cloud save already requires Bearer | B |
| `stack.edit` | authenticated | ownership | `stack.create` (same family) | none | no (already-auth flows) | `stack.edit` | blob CAS | B |
| `workspace.cloud` | authenticated | cross-device | login / AuthPage | local-only | attach merge | `workspace.cloud` | **CURRENT and TARGET:** Bearer PUT/attach/release | exists |
| `filo.read` | authenticated | time room | none (room is auth) | none | no | — | blob CAS | keep |
| `review.queue` | authenticated | remember over time | optional `review.remember` | none | optional FUTURE | `review.remember` | blob CAS | keep UI; sheet optional later |
| `note.private` | authenticated | personal memory | `note.private` | guest scratch remains on `/shortlist` | **yes** (slug, returnTo) | `note.private` | blob CAS | C |
| `search.personal` | authenticated | personal corpus | `search.personal` | `search.basic` | **yes** (query) | `search.personal` | client-side V1; no search API V1 | D |
| `compare.deep` | authenticated | personal context | `compare.deep` | `compare.basic` | **yes** (returnTo `/compare`) | `compare.deep` | none extra | E |
| `insight.personal` | authenticated | derived from workspace | `insight.personal` | public editorial insight | **yes** (slug) | `insight.personal` | client-side | F |
| `radar.personal` | authenticated | PH ∩ workspace | `insight.personal` family or dedicated | `radar.public` | **yes** (`/radar`) | `radar.personal` | client-side | G |
| `community.write` | authenticated | identity + moderation | FUTURE | public read FUTURE | later | `community.write` | **new tables + RLS + rate limit** | H design |
| `community.read` | public (FUTURE) | knowledge | null | published experiences | no | — | published-only select | H |
| `export.workspace` | authenticated | vault ownership | none (settings room) | AuthPage | no | — | session | exists |
| `auth.sheet` | infra | conversion UX | n/a | n/a | n/a | see telemetry | magic-link existing | A |
| `capability.registry` | infra | single source of truth | n/a | n/a | n/a | — | documents serverEnforced | A |

---

## UI eligibility vs server authorization

**CURRENT failure:** `createPersonalStack()` has no auth check. Guests cannot see “Nuovo stack”, but V1 would accept `personalStacks` for any owner. Remote sync would persist them if a guest payload were attached.

**TARGET rule:**

1. UI calls `canUse("stack.create", viewer)` before showing create.
2. If false, UI opens AuthSheet and stores PendingAuthIntent — it does **not** call the writer.
3. After auth, replay is the only guest-originated create path.
4. Cloud persistence remains Bearer + CAS (`workspace.cloud`). That is the server backstop for the blob as a whole.
5. Do not treat a hidden button as authorization.
6. Dedicated per-capability HTTP APIs are **not** required in V1 because personal stacks live inside the authenticated workspace blob. If a future API splits stacks out of the blob, it must check the session.

`search.personal`, `compare.deep`, `insight.personal`, `radar.personal` are **client-derived** from workspace the user already owns. Server enforcement is “do not leak another user’s workspace” (already the CAS/owner rule), not a new search endpoint.

`community.write` **cannot** ship without server enforcement. That is why it is Wave H.

---

## Telemetry

Reuse first-party ingest style (`lib/analytics/sponsor-events.ts` pattern). **No new vendor.**

Events (TARGET, not current):

| Event | When |
|---|---|
| `auth_gate_view` | AuthSheet opened |
| `auth_gate_continue` | Primary CTA |
| `auth_gate_dismiss` | Dismiss |
| `auth_success_from_gate` | Session established **from** a pending intent |

Payload fields: `capability` (telemetryKey), `origin` (route or component), `returnTo` (path only, no PII). Correlation: same anonymous/session discipline as sponsor events. Do not attach email or workspace JSON.

---

## Implementation sketch (Wave A — do not implement in this pass)

Proposed home: `lib/capabilities/` with a frozen registry array and `canUse`.  
Do not replace `releaseFeatures` (those are env kill switches).  
Do not replace admin session.

Viewer input: `getActiveWorkspaceOwner().kind` mapped to `guest | authenticated`. Treat `useAccount().status === "loading" | "unavailable"` as **not** authenticated (no false create).
