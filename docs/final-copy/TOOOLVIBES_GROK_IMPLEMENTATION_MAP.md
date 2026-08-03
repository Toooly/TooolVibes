# TOOOLVIBES GROK IMPLEMENTATION MAP

> Mappa file-per-file per implementare TooolVibes V2 (Home, Catalog, Radar).
> Aggiornato: 2026-08-03.

## Radar (V2 committato: `aa23304`)

| File | Tipo | Stato |
|---|---|---|
| `app/(marketing)/radar/page.tsx` | server | V2 ✓ |
| `app/(marketing)/radar/loading.tsx` | server | V2 ✓ (no H1, 1 blocco) |
| `components/radar/radar-experience.tsx` | client | V2 ✓ |
| `lib/radar/radar-ui-model.ts` | shared | V2 ✓ (5 stati display) |
| `lib/radar/product-hunt-contract.ts` | shared | invariato (B36) |
| `lib/radar/use-product-hunt-radar.ts` | shared | invariato |
| `lib/radar/radar-view-config.ts` | shared | invariato (env config) |
| `app/api/product-hunt/route.ts` | server route | invariato |
| `styles/radar.css` | css | V2 (eyebrow split, status rail, state panel, provenance, table cols) |
| `__tests__/lib/radar/radar-ui-model.test.ts` | test | V2 ✓ |
| `__tests__/components/radar/radar-experience.test.tsx` | test | V2 ✓ |

## Home (V2 committato: `03e0f79`)

| File | Tipo | Stato |
|---|---|---|
| `app/(marketing)/page.tsx` | server | V2 ✓ (H1, eyebrow split, hero, percorso, selezione, metodo) |
| `components/home/definitive-home.tsx` | client | V2 ✓ (Cockpit, IvoryEditorial, ClassificaOrAlternativa, Method, SponsorSection) |
| `lib/radar/radar-ui-model.ts` | shared | V2 ✓ (stato copy usato da HomeRadarPreview) |
| `lib/data/editorial-score.ts` | shared | usato da Stato A/B logic |
| `lib/monetization/placements.ts` | shared | isPublicMonetizationPlacement + resolvePublicMonetizationPlacement |

## Catalog (V2 committato: `fc27200` + `aa23304`)

| File | Tipo | Stato |
|---|---|---|
| `app/(marketing)/archivio/page.tsx` | server | V2 ✓ (SEO + sponsor wrapper) |
| `app/(marketing)/archivio/loading.tsx` | server | V2 ✓ (no H1, 1 blocco) |
| `components/archive/definitive-archive.tsx` | client | V2 ✓ (Hero, Categorie, Filtri, Ordinamento, Griglia, Empty, Paginazione) |
| `components/archive/archive-v4-tool-card.tsx` | client | V2 ✓ (CTA, badge editoriale/sponsored, aria-labels) |
| `components/monetization/partner-placements.tsx` | shared | V2 (formatLabelOverride prop) |
| `components/tools/shortlist-toggle.tsx` | shared | V2 (toolName aria-label) |
| `components/tools/compare-toggle.tsx` | shared | V2 (toolName aria-label) |
| `styles/archive-v4.css` | css | V2 (eyebrow split, chip, sort, empty, badges, disclosure) |

## Componenti condivisi modificati (con parità)

| File | Modificato per | Regressione |
|---|---|---|
| `components/monetization/partner-placements.tsx` | Catalog V2 (formatLabelOverride) | nessuna (prop opzionale) |
| `components/tools/shortlist-toggle.tsx` | Catalog V2 (toolName aria) | nessuna (prop opzionale, fallback) |
| `components/tools/compare-toggle.tsx` | Catalog V2 (toolName aria) | nessuna (prop opzionale, fallback) |

## Componenti non toccati (per vincolo)

- `app/(marketing)/page.tsx` (Home) → invariato dopo V2
- `app/(marketing)/toools/[slug]/*` (tool detail) → invariato
- `app/(marketing)/compare/*` → invariato
- `app/(marketing)/shortlist/*` → invariato
- `app/(marketing)/posts/*` → invariato
- `app/(marketing)/collections/*` → invariato
- `app/(marketing)/chi-siamo/*` → invariato
- `app/(marketing)/affiliati/*` → invariato
- Account / Auth → invariato
- Supabase config → invariato
- Cloudflare config (wrangler.jsonc) → invariato
- API Product Hunt → invariato

## Constraint compliance

- ✓ No commit/push/deploy dell'utente senza review esplicita
- ✓ Max 1-3 file per step
- ✓ Surgical, no broad refactor
- ✓ NO break di Home, Catalog già chiuso
- ✓ Componenti condivisi solo se necessari + no regressioni
