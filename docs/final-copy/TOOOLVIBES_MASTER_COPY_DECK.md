# TOOOLVIBES MASTER COPY DECK

> Stato: **FINAL COPY V2** per Home, Catalog, Radar (2026-08-03).
> Sorgente canonica: file `final-copy/routes/*` (Home, Catalog, Radar).
> Questo deck è la vista consolidata per audit e allineamento con i team.

## 1. Convenzioni

- **Tono**: editoriale sobrio, no hype, no claim non dimostrati.
- **Lingua**: italiano, copy pubblica.
- **Brand**: TooolVibes (3 "o" minuscole).
- **Title template globale**: `<page-title> | TooolVibes`. Mai doppio
  brand: la source title NON include "TooolVibes" (è il template che lo
  aggiunge).

## 2. Stato V2 delle pagine pubbliche

| Pagina | Route | Stato | File canonico |
|---|---|---|---|
| Home | `/` | HOME FINAL COPY V2 ✓ | `final-copy/routes/` (TODO) |
| Catalog | `/archivio` | CATALOG FINAL COPY V2 ✓ | `final-copy/routes/` (TODO) |
| Radar | `/radar` | RADAR FINAL COPY V2 ✓ | `final-copy/routes/RADAR_FINAL_COPY.md` |

## 3. Contratti copy trasversali

### H1

- Un solo H1 visibile nel DOM hydrated.
- Loading route non ha H1 (evita duplicazione).
- Display font (Anton) + max-width ~18ch.

### Stato / errore / loading

- 5 stati display per ogni feature live (loading, live, empty, stale, error).
- Empty / stale / error hanno CTA primaria + secondaria coerenti.
- Loading è un solo blocco, no duplicazioni.

### "LIVE" bandito

- La parola "LIVE" non è più usata come badge / status label.
- Sostituita da "Dati aggiornati" (Home) e "Dati aggiornati" / "Connessione a Product Hunt" (Radar).
- Scelta editoriale: "LIVE" è un claim di freschezza che non va dimostrato.

### Disclosure affiliate

- Testo disclosure canonico: "Link affiliato: potremmo ricevere una
  commissione, senza costi aggiuntivi per te."
- Appare su: card con `affiliateUrl`, sponsored placement, badge "Contenuto sponsorizzato".

### Footer

- V2 footer in `components/layout/site-footer-v2.tsx`.
- Summary + Contact + colonne navigazione.
- Disclosure affiliate in fondo (footer-only).
- Rimosse: "Lv11", "00 XP", "Vibe Rush", vecchia newsletter, vecchie voci
  Community / Blog.

## 4. Shell canonica (Home, Catalog, Radar)

- Stesso header (command bar).
- Stessa navigazione.
- Stesso account menu.
- Stesso footer V2.
- Stessa disclosure affiliate.
- Stesso mobile bottom nav.

NON renderizzare nella shell canonica:

- Lv11
- 00 XP
- Vibe Rush
- Vecchio footer
- Vecchia newsletter
- Vecchie voci Community / Blog
- Loading "Preparo la rotta" / "Caricamento archivio tool" / "Caricamento del catalogo…"

## 5. Stato dei moduli monetizzati

- Slot `home-featured-tool` → `home-featured-tool` (r/o da Home V2).
- Slot `catalog-native-sponsor` → `catalog-native-sponsor` (V2 contract
  "Partner nel catalogo").
- Slot `tool-sponsored-alternative` → su tool detail.

Filtri V2: non renderizzare slot se `placement.partner?.isDemo` (demo /
fixture / development / placeholder). `isPublicMonetizationPlacement`
filtra già a livello API.

## 6. QA / test contract

- `npm run lint:ci` — 0 errors, 0 warnings.
- `npm run typecheck` — clean.
- `npm run test` — 1233 passed, 32 skipped (target corrente, 2026-08-03).
- Visual smoke 2 viewport (1280, 375) per pagina.
- Playwright parity check per Radar (4 viewport: 1280, 375, 1440, 390).
- Test typography contract: font-size ≥ 12px.

## 7. File canonici

- `docs/final-copy/routes/RADAR_FINAL_COPY.md` — Radar V2 (2026-08-03) ✓
- `docs/final-copy/TOOOLVIBES_MASTER_COPY_DECK.md` — questo file ✓
- `docs/final-copy/TOOOLVIBES_GROK_IMPLEMENTATION_MAP.md` — mappa
  implementazione V2
- `docs/final-copy/TOOOLVIBES_GROK_READY_MANIFEST.md` — manifest
  deploy / handoff

## 8. TODO Home + Catalog V2 (file canonici non ancora creati)

- `docs/final-copy/routes/HOME_FINAL_COPY.md` (riferimento: HOME V2 committato
  `03e0f79`)
- `docs/final-copy/routes/CATALOG_FINAL_COPY.md` (riferimento: CATALOG V2
  committato `fc27200` + fix title `aa23304`)
