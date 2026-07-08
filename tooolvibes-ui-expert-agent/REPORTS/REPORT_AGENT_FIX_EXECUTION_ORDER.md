# REPORT_AGENT_FIX_EXECUTION_ORDER

Ordine consigliato per ridurre regressioni. Non mischiare task di fasi diverse nello stesso commit salvo richiesta esplicita.

## FASE 1 - Fix a basso rischio / CSS locali / spacing / contrasto

- **Task inclusi:** FIX-008, FIX-009, FIX-013, FIX-015.
- **Perche in questo ordine:** sono interventi locali o documentali e aiutano a stabilizzare microcopy/primitive prima dei task piu invasivi.
- **Verificare prima della fase successiva:** lint/build, nessun overflow mobile, link e menu invariati.
- **Non mischiare:** non unire questi task a token globali o stato save/compare.

## FASE 2 - Fix responsive mobile

- **Task inclusi:** FIX-003, FIX-007, FIX-014.
- **Perche in questo ordine:** prima touch target, poi search sheet, poi keyboard route pass.
- **Verificare prima della fase successiva:** viewport 320/375/414/768, safe-area, keyboard mobile, focus visible.
- **Non mischiare:** non cambiare API search, auth o routing globale.

## FASE 3 - Fix desktop layout

- **Task inclusi:** parte desktop di FIX-005 e QA desktop di FIX-004/FIX-011.
- **Perche in questo ordine:** il compare va reso leggibile prima di migrare visual system ampio.
- **Verificare prima della fase successiva:** 1024/1280/1440/1920, no scroll orizzontale inatteso, hover/focus ok.
- **Non mischiare:** non cambiare limite stato se non e stato deciso anche FIX-006.

## FASE 4 - Componenti e design system

- **Task inclusi:** FIX-004, FIX-010, FIX-011.
- **Perche in questo ordine:** token canonici prima, overlay policy poi, direzione visuale solo dopo base token.
- **Verificare prima della fase successiva:** screenshot Home/Catalogo/Detail/Compare/Radar e grep dei token.
- **Non mischiare:** non fare refactor globale insieme a copy trust o stato.

## FASE 5 - UX flow e conversione

- **Task inclusi:** FIX-001, FIX-002, FIX-005, FIX-006, FIX-012.
- **Perche in questo ordine:** trust CTA prima, trust editoriale dopo, compare/state solo con contratto chiaro, QA mode separato.
- **Verificare prima della fase successiva:** funnel tool detail/post/detail/compare, reload storage, gate aperto/chiuso.
- **Non mischiare:** non toccare Supabase/auth/API/Cloudflare senza richiesta esplicita.

## FASE 6 - Figma handoff

- **Task inclusi:** FIX-015 piu aggiornamento Figma SoT dopo screenshot finali.
- **Perche in questo ordine:** Figma deve rappresentare stato verificato, non ipotesi statiche.
- **Verificare prima della fase successiva:** naming componenti, varianti, token, screenshot collegati.
- **Non mischiare:** non modificare app source in un task solo documentale.

## FASE 7 - Final QA closure

- **Task inclusi:** pass finale su tutti i task completati.
- **Perche in questo ordine:** chiude regressioni incrociate dopo modifiche separate.
- **Verificare:** lint, build, console browser, responsive matrix, focus/touch targets, routing, auth non toccata.
- **Non mischiare:** non introdurre nuove feature durante closure.
