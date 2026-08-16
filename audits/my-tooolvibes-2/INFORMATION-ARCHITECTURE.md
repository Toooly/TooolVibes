# Information architecture

## Surfaces

| ID | Label | Job |
|---|---|---|
| riprendi | Riprendi | Continuity: one next-best action + 2–3 quiet signals |
| biblioteca | Biblioteca | Saved pipeline, search/filter, mature-scale list |
| stack | Stack | Private named stacks |
| decisioni | Decisioni | Decision Journal |
| segnale | Segnale | Level, SP, missions, marks, records — supporting, not first |
| attivita | Attività | Grouped recents to resume work |
| impostazioni | Impostazioni | `/account/settings` control surface |

Auth stays `/account` unauthenticated → AuthPage. Workspace is authenticated-only.

## Navigation

- Mobile: compact segmented control / select inside the workspace. No second global bottom nav.
- Tablet/desktop: same segments, more columns.
- Settings is a separate route (already exists).

## Riprendi (home)

Priority order for the single primary action:

1. Open compare with ≥2 tools → "Continua il confronto"
2. Deferred decision past revisit / 90 days → "Rivedi questa decisione"
3. Top/candidato without verdict → "Chiudi la decisione"
4. Saved item untouched ≥ 30 days → "Valuta questo candidato"
5. Incomplete profile context → "Imposta focus" (secondary)
6. Else empty-state: save first tool / open a collection

Never lead with email, XP, or three decorative stats.

Hero becomes identity-light: "Il tuo spazio" + persistence chip. Email lives in Settings.

## Biblioteca pipeline

Storage stays `saved | review | top` + `decision.outcome`.

UI grammar:

| UI | Storage |
|---|---|
| Salvato | stage=saved, no outcome |
| Da valutare | stage=review, no outcome |
| Candidato | stage=top, no outcome |
| Scelto | outcome=selected |
| Scartato | outcome=rejected |
| Rimandato | outcome=deferred |

Moving in the pipeline writes existing actions (`tool/stage`, `tool/decision`). No destructive migration.

## Stack

Create / rename / archive / add / remove / reorder / description. Private. Not Collections.

## Decisioni

Fast path: outcome + optional one-line because.

Disclosed: use case, alternatives (auto Traccia), related stack, revisit date, pin.

## Segnale

Compact on Riprendi (level mark + next milestone). Full map/cabinet on Segnale tab.

## Empty vs mature

Empty: one guided action, no zero-stat graveyard.

Mature: search, stage filters, grouping by category/stack, virtual-feeling density (not 50 full cards).

## Auth

Keep AuthPage continuity copy ("Riprendi da dove avevi lasciato") + live saved/compare counts. That is already the right guest story.


## Settings sections (rebuild `/account/settings`)

Today: email, logout, recovery, submissions.

Target:

1. **Account** — email, logout
2. **Personalizzazione** — focus, goal (existing enums, always editable)
3. **Segnale** — quiet mode + existing preference toggles (no implementation jargon)
4. **Spazio** — optional: default pipeline view, compact density (only if cheap)
5. **Contributi** — submissions (keep)
6. **Ripristino** — recovery (keep)
7. Privacy copy only if already true; no fake controls

Do not show sync internals when healthy.
