# REPORT_AGENT_MASTER_AUDIT_EXECUTION_PLAN

Modalita: AUDIT / PLANNING read-only. Questo piano non esegue `PROMPTS/06_surgical_ui_fix.md`.

## Stato esecuzione

1. Lettura completa dei 25 file Markdown agent/checklist/prompt: completata.
2. Inventario e classificazione modalita: completata.
3. Ispezione statica route/componenti/token: completata.
4. Report specialistici `REPORT_AGENT_*`: completati in questa cartella.
5. Screenshot runtime Playwright/mobile/desktop: non eseguiti in questa passata; richiesti per confermare layout, overlap e scroll.

## Route matrix consigliata per prossima verifica runtime

| Priorita | Route | Viewport |
|---:|---|---|
| P0 | `/posts/[slug]` con related tool e affiliate URL | 320, 375, 1280 |
| P0 | `/toools/[slug]` con CTA esterna | 320, 375, 1280, 1440 |
| P1 | `/archivio` catalogo con filtri e card | 320, 375, 414, 768, 1280 |
| P1 | `/compare` con 2, 4 e 5 tool | 375, 768, 1024, 1280, 1440 |
| P1 | `/shortlist` vuota e popolata | 320, 375, 1280 |
| P2 | `/` home gated e home con gate aperto | 375, 1280, 1440 |
| P2 | `/shop`, `/chi-siamo`, `/metodo`, `/affiliati` | 375, 1280 |

## Sequenza safe per interventi futuri

1. Risolvere disclosure affiliate/trust vicino ai CTA commerciali.
2. Definire campi di trust: `last_reviewed_at`, reviewer/byline, source/citation model.
3. Normalizzare primitives mobile: input/select/button target minimi e stati focus.
4. Consolidare token in una SoT CSS/Tailwind/Figma.
5. Ridurre compare a 2-4 tool consigliati o introdurre modalita overflow progettata.
6. Solo dopo, usare `PROMPTS/06_surgical_ui_fix.md` per una fix alla volta.

## Stop boundaries

- Non toccare Supabase, auth, RLS, API route, middleware, sync account o data model senza conferma umana.
- Non introdurre nuove dipendenze UI.
- Non correggere contemporaneamente trust, token e state management nello stesso diff.
