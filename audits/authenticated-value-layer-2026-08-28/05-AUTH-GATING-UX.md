# 05 — Auth Gating UX

**Status:** TARGET. Not built.  
**CURRENT:** full-page `AuthPage` at `/account` (`components/account/auth-page.tsx`). Solid raised card, not Liquid Glass. Loop header “Accedi” routes to `/account`. No overlay, no pending intent, no benefit prompts per capability.

Keep `AuthPage` for **direct** `/account` visits (user chose to sign in).  
Add **one** contextual AuthSheet for identity-dependent **actions**.

Do not create many bespoke modal systems.

---

## One sheet

Name: **AuthSheet**

Capability: `auth.sheet` (infra, Wave A)

Visual grammar: **Liquid Glass** as used on Home 2.0 / Salvati 2.0 — not the current solid `.v-auth-card`. Exact token composition is **OPEN QUESTION 2**. Required: existing CSS variables (`--tv-surface-*`, `--tv-ink-*`, glass blur already in workspace), no new design system.

### Anatomy

| Region | Content |
|---|---|
| Eyebrow | short context label (optional), not “Account” |
| Headline | capability benefit headline (Italian) |
| Body | one or two sentences of benefit, not “questa funzione richiede login” as primary |
| Live counts | if guest has saved/compare, reuse AuthPage’s live counts pattern |
| Primary CTA | “Continua con il tuo account” — opens magic-link email field in-sheet or steps to it |
| Secondary | Dismiss (“Non ora”) |
| Footer | tiny secondary: magic-link explanation; legal consent only on register step |
| States | idle, email-entry, sending, link-sent, error, offline |

Magic-link remains the only auth method (CURRENT). Do not add passwords.

---

## Canonical prompts (locked)

| capability | Headline | Context |
|---|---|---|
| `stack.create` | Crea il tuo spazio di lavoro | Gli Stack restano sincronizzati con il tuo account e raccolgono i tool che usi insieme. |
| `note.private` | Ricordalo nel tempo | Le note entrano nella tua Software Memory e restano collegate al tool. |
| `search.personal` | Cerca nel tuo spazio | Cerca tra catalogo, salvati, stack, decisioni e note. |
| `insight.personal` | Vedi cosa significa per te | Accedi agli insight basati sui tool che hai salvato, confrontato e usato. |
| `compare.deep` | Confrontalo con ciò che già usi | Relazioni, note e decisioni restano sul confronto. |
| `review.remember` | Ricordati di rivalutarlo | La data di revisione resta nel tuo spazio. |

Primary CTA always: **Continua con il tuo account**  
Avoid primary copy: **Registrati per continuare.**

---

## Layout / a11y

| Surface | Behavior |
|---|---|
| Desktop (≥1024) | floating centered/right sheet, glass, focus trap, Esc dismisses |
| Mobile | bottom sheet, same content, 44px targets |
| Keyboard | Tab cycles CTA / email / dismiss; Esc = dismiss |
| Focus | move focus into sheet on open; restore trigger on close |
| ARIA | `role="dialog"`, `aria-modal="true"`, labelled by headline |
| Reduced motion | no enter/exit animation beyond opacity; honor `useReducedMotion` |
| Scroll lock | background inert while open |

Do not use padlock icons on catalog cards. The sheet is the only gate chrome.

---

## PendingAuthIntent (critical missing piece)

**CURRENT:** none. After magic-link the user lands on `/account?connected=1` with no action resume.

**TARGET:** ephemeral intent, **not** in `WorkspaceStateV1`.

### Shape

```ts
type PendingAuthIntent = {
  capability: string;      // registry id, e.g. "stack.create"
  payload: Record<string, unknown>; // capability-specific, validated on replay
  returnTo: string;        // path + query only, same-origin
  createdAt: string;       // ISO
  expiresAt: string;       // ISO, default createdAt + 2 hours
  origin?: string;         // component/route for telemetry
};
```

### Storage

**CURRENT architecture draft said `sessionStorage`.** Runtime evidence **rejects** that.

Magic-link email is `{AUTH_REDIRECT_ORIGIN}/auth/callback?token_hash=…&type=email`. Email clients open a **new tab**. `sessionStorage` is tab-scoped and would be empty on the callback document. `/auth/callback` is outside `AccountProvider`. The session already persists in **`localStorage`** (supabase-js default). Guest workspace already persists in **`localStorage`**.

**TARGET storage: `localStorage`** key `tooolvibes:pending-auth-intent:v1`

Same-origin, TTL, one-shot consume after attach on `/account` (or any marketing route with `AccountProvider`).

Do **not** persist into `WorkspaceStateV1`.  
Do **not** put secrets, email, JWT, workspace JSON, or notes in the intent.  
Do **not** use `sessionStorage` for this round trip.

Cross-device (email opened on another device): localStorage of the requesting browser is invisible. Then: authenticate → attach/merge → **do not invent stack state**. Land on Home/Stack. Accepted limitation of magic-link + device-local intent.

### Lifecycle

1. Guest clicks identity-dependent action.
2. `canUse` is false → AuthSheet opens → `auth_gate_view`.
3. On CTA (`auth_gate_continue`) or on sheet open (either is acceptable; **lock: write intent when CTA is pressed, so dismiss leaves no stale intent**): write PendingAuthIntent.
4. Magic-link send (in-sheet).
5. User authenticates (`/auth/callback`).
6. `AccountProvider` attach/merge canonical workspace (existing path).
7. After attach success: read intent → validate → replay **ONE** safe action → clear intent → `auth_success_from_gate`.
8. Dismiss (`auth_gate_dismiss`) clears any uncommitted intent (none if write-on-CTA).

### Validation before replay

Reject and **clear** without mutating if any of:

- missing/malformed JSON
- unknown `capability`
- `expiresAt` in the past
- `returnTo` not a same-origin relative path starting with `/` (no `//`, no `javascript:`)
- payload fails per-capability schema (unknown keys stripped; required keys missing → invalid)
- viewer is still guest
- workspace attach failed / remote unavailable
- capability no longer makes sense (e.g. `stack.create` but `MAX_PERSONAL_STACKS` already reached)

On reject: navigate to a relevant authenticated destination **without mutating**:

| capability | Safe landing |
|---|---|
| `stack.create` | `/account?view=stack` |
| `note.private` | tool page or Salvati focus if slug still saved |
| `search.personal` | Home or Salvati |
| `compare.deep` | `/compare` if tray ≥1 else Catalogo |
| `insight.personal` | tool page if slug valid |
| `radar.personal` | `/radar` |

### Replay rules (one, idempotent/resumable)

| capability | payload | replay |
|---|---|---|
| `stack.create` | `{ slug: string, name?: string }` | ensure slug saved; if `name` create stack + add; if no name open Stack pick/create with slug preselected — **must be idempotent** (existing membership = no-op) |
| `note.private` | `{ slug: string }` | navigate to tool or Salvati focus and **open composer** — do not write an empty note |
| `search.personal` | `{ query: string }` | open palette or Salvati with query restored — no write |
| `compare.deep` | `{ }` or `{ slugs?: string[] }` | open `/compare`; do not rebuild tray from untrusted slugs unless they already exist in workspace compare |
| `insight.personal` | `{ slug: string }` | open tool personal layer — no write |
| `radar.personal` | `{ }` | open `/radar` — no write |

**Never replay twice.** Clear intent **before** or **immediately after** a successful replay in the same tick; guard with an in-memory “replayed” flag for Strict Mode double-mount.

Duplicate replay of `stack.create` must not create a second stack with the same name if membership already exists; creating two stacks with identical names is acceptable only if the user explicitly creates again later — for intent replay, if a stack with that exact name already contains the slug, no-op.

---

## Magic-link transition (in-sheet)

Reuse CURRENT magic-link API (`POST /api/auth/magic-link`). States:

- email invalid → inline error
- sending → disable CTA
- link-sent → “Controlla la tua email” (CURRENT AuthPage pending pattern)
- API error → retry
- offline → banner, no send

Register vs login: sheet defaults to **continue** (one email field). Do not force the three-tab AuthPage inside the sheet. Name/consent can remain on full `AuthPage` for explicit “Crea spazio”. Sheet is continuation, not full registration IA.

---

## Already-authenticated user

If `canUse` is true, never open AuthSheet. Run the writer directly.

If AuthSheet is somehow open and session becomes authenticated (another tab), close sheet and run validation/replay.

---

## Guest verbs that must NOT open the sheet

Save, unsave, add to compare, Fast Decide, guest scratch note, catalog search, Radar public, opening `/account` via Accedi (that is AuthPage, not AuthSheet).

Stack **add to existing** remains available if guest local stacks exist (rare). Only **create** opens the sheet.

---

## Telemetry

See `04-CAPABILITY-REGISTRY-SPEC.md`. Fire view/continue/dismiss/success with `capability`, `origin`, `returnTo`.

---

## What this is not

- Not a login wall on Catalogo or Compare.
- Not padlocks.
- Not a second auth vendor.
- Not persisted workspace state.
