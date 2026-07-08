# TooolVibes — Figma File Structure

```
Tooolvibes Design System
├── 00_Cover
│   └── Titolo progetto, versione, data, owner, link docs
├── 01_Foundations
│   ├── Design Principles
│   ├── Accessibility Guidelines (contrasto minimo, touch target)
│   └── Grid & Breakpoints (375 / 768 / 1280 / 1920)
├── 02_Tokens
│   ├── Color (Figma Variables)
│   ├── Typography (Figma Styles)
│   ├── Spacing (Figma Variables)
│   ├── Radius (Figma Variables)
│   ├── Elevation (Figma Styles/Effects)
│   └── Motion (Annotations only)
├── 03_Primitives
│   ├── Buttons (anatomy, variants, states, sizes, tokens, do/don't)
│   ├── Badges
│   ├── Cards (base)
│   ├── Inputs
│   ├── Modal / Sheet
│   ├── Tooltip / Toast
│   ├── Avatar
│   ├── Tabs
│   └── Accordion
├── 04_Components
│   ├── Tool Card (variants: default, compact, featured, horizontal)
│   ├── Editorial Card
│   ├── Compare Row
│   ├── Header / Nav
│   └── Footer
├── 05_Sections
│   ├── Hero
│   ├── Filters
│   ├── Grid
│   ├── CTA Banner
│   └── Editorial Body
├── 06_Pages_Mobile
│   ├── Tool Detail — 375px
│   ├── Discovery — 375px
│   ├── Home — 375px
│   ├── Compare — 375px
│   ├── Shortlist — 375px
│   ├── Editorial — 375px
│   └── Service — 375px
├── 07_Pages_Desktop
│   ├── Tool Detail — 1280px
│   ├── Discovery — 1280px
│   ├── Home — 1280px
│   ├── Compare — 1280px
│   ├── Shortlist — 1280px
│   ├── Editorial — 1280px
│   └── Service — 1280px
├── 08_Prototype_Flows
│   ├── Save → Shortlist
│   ├── Compare Flow
│   └── Auth Flow
└── 09_Archive
    ├── 99 — Snapshots (Shop, 404, Account, Login)
    └── Deprecated Components
```

## Ordine di creazione

| Ordine | Pagina | Dipendenze |
|--------|--------|------------|
| 1 | 00_Cover | Nessuna |
| 2 | 01_Foundations | Nessuna |
| 3 | 02_Tokens | Nessuna (gating item) |
| 4 | 03_Primitives | 02_Tokens |
| 5 | 04_Components | 03_Primitives |
| 6 | 05_Sections | 04_Components |
| 7 | 06_Pages_Mobile | 05_Sections |
| 8 | 07_Pages_Desktop | 06_Pages_Mobile |
| 9 | 08_Prototype_Flows | 06 + 07 |
| 10 | 09_Archive | Release completata |

## Timeline stimata

| Fase | Durata | Cumulativo |
|------|--------|------------|
| Token | 2-3 giorni | 2-3 gg |
| Primitive | 4-5 giorni | 6-8 gg |
| Compositi | 3-4 giorni | 9-12 gg |
| Mobile | 4-5 giorni | 13-17 gg |
| Desktop | 3-4 giorni | 16-21 gg |
| Stati | 2-3 giorni | 18-24 gg |
| Prototype | 2 giorni | 20-26 gg |
| QA Handoff | 2-3 giorni | 22-29 gg |

**Totale: 3-4 settimane per un designer dedicato**
