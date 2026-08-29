# 07 — UX and access spec

No UI code in H0. Implementation in H4–H6.

---

## 1. Language

Use: Esperienze · Condividi la tua esperienza · Come lo usi? · La tua esperienza · Cosa funziona bene? · Quali limiti hai trovato? · Da quanto lo usi? · Da cosa sei passato? · Segnala · In revisione · Pubblicata

Avoid: Recensisci · Vota · Lascia 5 stelle · Commenti · Community feed.

Optional one-line trust: “Esperienze di chi usa il tool, non voti della redazione.”

---

## 2. Read surface

Primary: Tool Page section **Esperienze** after Signal, before Alternatives.

- Guest: published cards
- Auth: published cards + owner card/status + write/edit CTA
- Empty: “Nessuna esperienza pubblicata ancora.”
- Auth empty CTA: “Condividi la tua esperienza”
- Guest empty: same CTA → AuthSheet
- **No fake seed users.** Editorial content stays editorial and visually distinct if ever shown (V1: don’t mix).

Sort: newest `published_at`. Page size 8. “Carica altre” cursor.

Do **not** add `/community` product, `/esperienze` index, Home/Salvati feeds, or profile routes.

---

## 3. Card (public)

- displayName · duration label
- useCase
- body
- Pros list, Limits list
- Optional switched-from: “Passato da {name}”
- Overflow: Segnala (auth only)

No avatar. No uid. No “N esperienze” count V1.

---

## 4. Write UX

Authenticated CTA **Condividi la tua esperienza** opens a **structured form** (not a comments box).

Placement: section header and/or action surface. Prefer section (does not clutter hero). On 390, form is in-page below the section, not a giant modal. Desktop ≥1024 may use a right sheet **or** in-page; **lock: in-page on mobile, sheet/dialog on ≥1024** matching DecisionSheet breakpoint — but form is longer, so **in-page for all viewports V1** (affiliati pattern). Safer keyboard / no lost fields behind overlay.

Fields (labels):

1. Come lo usi? (`useCase`)
2. La tua esperienza (`body`)
3. Cosa funziona bene? (pros, add-row, max 5)
4. Quali limiti hai trovato? (limits, add-row, max 5)
5. Da quanto lo usi? (duration radios)
6. Da cosa sei passato? (optional catalog combobox + “altro” text)
7. Nome da mostrare (`displayName`, prefilled)

Guidance: “Non incollare email, chiavi API o dati di clienti. Questo testo diventa pubblico se pubblicato.”

Submit: “Invia per la revisione”. Success: owner status **In revisione**. No silent loss.

---

## 5. Guest write gate

`canUse("community.write")` false → AuthSheet.

Copy locked in `05`. Intent `{ toolSlug }` only, no draft. Replay opens **blank** form.

---

## 6. Draft policy

**V1: component state only** + native `beforeunload` if dirty.

Form is bounded (≤2000 + bullets). Do **not** store drafts in WorkspaceStateV1. Do **not** put draft in PendingAuthIntent. Authenticated `localStorage` draft **deferred** (shared-computer leak).

---

## 7. Owner actions

On own card (any status, on that tool page):

- Edit → same form; published edit warns “Tornerà in revisione”
- Delete → confirm “Elimina definitivamente la tua esperienza”

No account settings destination required.

---

## 8. Report UX

Auth: overflow **Segnala** → small dialog (reason + optional details).  
Guest: omit control (auth-only reports).

Do not dominate the card.

---

## 9. Responsive

| px | Expectation |
|---|---|
| 390 | Cards stack; body wraps; pros/limits as simple lists; form fields 44px; no horizontal trap; section below signal |
| 768 | Wider measure; still one column |
| 1024 | Nav can include Esperienze; form two-column optional (useCase/duration) |
| 1280 | Same; do not costume-change chrome |

---

## 10. Accessibility

- Section `aria-labelledby`
- Cards: heading = displayName + tool-independent “Esperienza”
- Form: every input has visible label; `aria-invalid` + error ids; error summary on 422
- Status as `role="status"`
- Delete confirm focus trap
- Report dialog labelled
- Admin actions keyboard + confirm
- Do not use color-only for status

---

## 11. SEO / structured data

- Published body **may** be in SSR HTML (indexable UGC).
- Pending/rejected/hidden **never** in HTML.
- **No** `Review` / `aggregateRating` JSON-LD (no ratings).
- OG remains editorial tool metadata (no user quotes in OG V1 — quotes in body are enough and avoid stale OG).

---

## 12. Performance

- SSR first 8 published in a server component (same request as tool page) **or** client fetch if flag off returns nothing.
- When `communityRead` false: omit section entirely (page identical to today).
- Load-more: one GET, no N+1 authors (display_name is on the row).
- Do not block LCP: section is below editorial/signal.

---

## 13. Failure UX

Submit/rate-limit/offline: visible error, keep form values.  
Moderation unavailable: admin queue error banner.  
Flag off: no CTA.
