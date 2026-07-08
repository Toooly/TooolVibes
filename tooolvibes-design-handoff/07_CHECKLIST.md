# TooolVibes — Implementation Checklist

## FASE 1: Tokens ✅ / ⬜
- [ ] Variabili Figma Color create e nominate correttamente
- [ ] Variabili Figma Spacing create e nominate correttamente
- [ ] Variabili Figma Radius create e nominate correttamente
- [ ] Stili Figma Typography (Inter) creati
- [ ] Stili Figma Typography display (Fraunces) creati
- [ ] Stili Figma Elevation creati
- [ ] Nessun valore libero nei frame successivi (spot-check su 3 primitive)
- [ ] Documento mapping Figma → CSS → Tailwind

## FASE 2: Primitives ✅ / ⬜
- [ ] Button: tutte le varianti (5) e stati (6) e size (3)
- [ ] Badge: tutte le varianti (6) e stati (2)
- [ ] Input: tutte le varianti (7) e stati (7)
- [ ] Modal: tutte le varianti (4) e stati (3 annotati)
- [ ] Tooltip: tutte le posizioni (4)
- [ ] BottomSheet: tutte le varianti (3) e stati (2)
- [ ] Toast: tutte le varianti (4) e stati (3 annotati)
- [ ] Avatar: tutte le varianti (2) e size (3)
- [ ] Tabs: tutte le varianti (3) e stati (4)
- [ ] Accordion: tutte le varianti (3) e stati (4)
- [ ] Ogni variante usa SOLO token da 02_Tokens

## FASE 3: Compositi ✅ / ⬜
- [ ] Tool Card: varianti (4) e stati (5)
- [ ] Editorial Card: varianti (3) e stati (3)
- [ ] Compare Row: varianti (3) e stati (2)
- [ ] Header/Nav: varianti (4) e stati (5)
- [ ] Footer: varianti (2) e stati (2)
- [ ] Tool Card approvata da second reviewer

## FASE 4: Mobile Pages ✅ / ⬜
- [ ] Tool Detail mobile completa con tutti gli stati
- [ ] Discovery mobile completa con tutti gli stati
- [ ] Home mobile completa con tutti gli stati
- [ ] Compare mobile completa con tutti gli stati
- [ ] Shortlist mobile completa con tutti gli stati
- [ ] Editorial mobile completa con tutti gli stati
- [ ] Service mobile completa
- [ ] Nessun overflow orizzontale
- [ ] Tap target 44px rispettato
- [ ] Spot-check su 320px: nessun elemento tagliato

## FASE 5: Desktop Pages ✅ / ⬜
- [ ] Tool Detail desktop: sidebar e 2-col layout
- [ ] Discovery desktop: sidebar filtri + griglia
- [ ] Home desktop: hero 2-col + griglia
- [ ] Compare desktop: tabella multi-colonna
- [ ] Shortlist desktop: griglia card
- [ ] Editorial desktop: colonna centrale 720px
- [ ] Service desktop: blocchi feature alternati
- [ ] Line-length testo ≤75 caratteri
- [ ] Container max-width definito
- [ ] Griglie card coerenti

## FASE 6: Stati ✅ / ⬜
- [ ] Ogni primitiva ha rest/hover/focus/disabled
- [ ] Button ha loading
- [ ] Input ha error/valid
- [ ] Focus ring visibile su tutti gli elementi interattivi
- [ ] Checklist stati passata per tutte le primitive P0

## FASE 7: Prototype ✅ / ⬜
- [ ] Flow Save→Shortlist navigabile end-to-end
- [ ] Compare Flow navigabile
- [ ] Auth Flow navigabile
- [ ] Annotazioni su stati condizionali presenti

## FASE 8: QA ✅ / ⬜
- [ ] Checklist §10 framework tickata
- [ ] Second reviewer firma su ogni primitiva P0
- [ ] Handoff artifact consegnato al frontend team
- [ ] Three-way reconciliation: Figma Variables vs CSS vs Tailwind
- [ ] Report reconciliation con mismatch documentati
