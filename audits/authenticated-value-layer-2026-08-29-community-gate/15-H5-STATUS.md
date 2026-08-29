# 15 — H5 status

Status: **IMPLEMENTED / ACCEPTED** (not released). No deploy. No H6.

## Flags

| Flag | Env | Default | Role |
|---|---|---|---|
| `community.read` | `TOOOLVIBES_COMMUNITY_READ_ENABLED` | OFF | public Esperienze section |
| `community.write` | `TOOOLVIBES_COMMUNITY_WRITE_ENABLED` | OFF | owner CTA / form / owner GET |

Write UI requires **both** flags (`isCommunityWriteUiEnabled`). Write ON does not enable read. Write ON + read OFF → no Community UI.

Flags are product exposure only. H2 still requires Bearer, Turnstile, rate limit, validation, ownership.

## Capability

`community.write`: authenticated, `authPromptKey: "community.write"`, continuation true.

## AuthSheet

Headline: Condividi la tua esperienza  
Body: Racconta come usi davvero questo tool e aiuta altri a valutarlo meglio.  
CTA: Continua con il tuo account

Guest CTA is additive. Public list stays visible.

## Pending intent

Capability `community.write`. Payload `{ toolSlug }` only. `returnTo` `/toools/{slug}`. No draft/body/displayName. TTL 30 min. One-shot.

Replay waits for workspace ready, then opens blank form. No mutation.

## Owner states

| status | label | actions |
|---|---|---|
| none | CTA Condividi | open form |
| pending | In revisione | Modifica, Elimina |
| published | Pubblicata | Modifica (warns: returns to review), Elimina |
| rejected | Non pubblicata | Modifica e invia di nuovo, Elimina |
| hidden | Nascosta | Modifica e invia di nuovo, Elimina |

Owner compact surface is not a second public card. Published public card remains in the list.

## Form

Inline on Tool Page (not a tiny sheet). Fields match H2. Display name explicit public. No email/local-part prefill. No private workspace prefill. Draft is in-memory + beforeunload. Dirty close confirms.

Create → pending. Success: “Esperienza inviata. La pubblicheremo dopo la revisione.”

## Revalidation

PATCH/DELETE call `revalidatePath(/toools/{slug})` after success. Client `router.refresh()`.

## Not in H5

Report flow, helpful, comments, ratings, public profile, notifications, telemetry ingest, SQL, prod migration, deploy.
