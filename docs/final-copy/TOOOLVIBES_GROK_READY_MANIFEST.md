# TOOOLVIBES GROK READY MANIFEST

> Manifest di deploy / handoff TooolVibes (V2: Home, Catalog, Radar).
> Aggiornato: 2026-08-03.

## 1. Stato corrente

- Branch: `main`
- HEAD corrente: `aa23304` (MiniMax: fix catalog V2 SEO title)
- Worker: `tooolvibes` (account `staff@elevianutrition.eu`)
- URL pubblico: `https://tooolvibes.staff-ffa.workers.dev`
- Compatibilità: `nodejs_compat` (compatibility_date 2026-04-25)
- Wrangler config: `wrangler.jsonc` (flat, no env, no custom domain)
- Ultimi commit rilevanti:
  - `aa23304` MiniMax: fix catalog V2 SEO title
  - `fc27200` MiniMax: CATALOG FINAL COPY V2
  - `03e0f79` MiniMax: HOME FINAL COPY V2
  - `432292b` MiniMax: contrast + responsiveness audit fix

## 2. Pagine pubbliche con V2 final copy

| Pagina | Route | Stato | Ultimo commit |
|---|---|---|---|
| Home | `/` | LIVE (HOME V2) | `03e0f79` |
| Catalog | `/archivio` | LIVE (CATALOG V2) | `fc27200` + `aa23304` |
| Radar | `/radar` | READY (RADAR V2 — pending user review) | working tree (no commit) |

## 3. Quality gates correnti

- `npm run lint:ci` → 0 errors, 0 warnings ✓
- `npm run typecheck` → clean ✓
- `npm run test` → 1233 passed, 32 skipped ✓ (radar V2: 40 test pass)

## 4. Radar V2 — checklist di verifica

### Funzionale
- [x] Hero V2 (eyebrow split, H1, lede, provenance)
- [x] Status rail 4 dt/dd (Stato, Ultimo aggiornamento, Segnali disponibili, Periodo)
- [x] Periodo V2 (Oggi / Ultimi 7 giorni / Ultimi 30 giorni)
- [x] Vista V2 (Mappa / Elenco)
- [x] Loading state 1 solo blocco (no H1)
- [x] Live state con H2 dinamico + supporting copy V2
- [x] Empty state (title + body + Riprova + Vai al catalogo)
- [x] Stale state (badge + title + body + Aggiorna i dati)
- [x] Error state (title + body + Riprova + Vai al catalogo)
- [x] Mappa: region aria-label, node aria-label
- [x] Elenco: eyebrow, H2, columns V2, CTA
- [x] Provenance section (Informazioni sui dati + body + Visita Product Hunt)
- [x] Retry button (Aggiorna i dati / Aggiornamento in corso…)
- [x] SEO V2 (title, description, og title, og description)

### Vincoli copy
- [x] "LIVE" rimosso da tutti i label
- [x] "Aggiorna ora" → "Aggiorna i dati" / "Riprova"
- [x] "ULTIMA SYNC" / "OFFLINE" / "IN PAUSA" / "NESSUN SEGNALE" rimossi
- [x] "Migliori su Product Hunt" / "Classifica verificabile" rimossi
- [x] "Giorno / Settimana / Mese" → "Oggi / Ultimi 7 giorni / Ultimi 30 giorni"
- [x] "Radar" (vista) → "Mappa"
- [x] "Tabella" → "Elenco"

### Accessibilità
- [x] Un solo H1 (verificato via Playwright)
- [x] Un solo blocco loading
- [x] Period control: role="group" + aria-labelledby
- [x] View control: role="group" + aria-labelledby
- [x] Periodo e vista con aria-pressed
- [x] Stato con aria-live="polite" / role="alert" per error
- [x] Mappa region aria-label
- [x] Nodi con aria-label
- [x] Righe elenco con aria-label
- [x] Focus non spostato al cambio periodo / vista

### Parità desktop / mobile
- [x] Stesso H1 su 4 viewport (1280, 375, 1440, 390)
- [x] Stesso eyebrow (split via CSS @ 47.99rem)
- [x] Stesso status
- [x] Stesso signal count
- [x] Stesso dataset (items identici)
- [x] Stesso order
- [x] Stesso range / vista
- [x] Stesso aria-label mappa

### Non regressione
- [x] Home V2 invariato (committato `03e0f79`)
- [x] Catalog V2 invariato (committato `fc27200` + `aa23304`)
- [x] HomeRadarPreview invariato (consumato dalla home)
- [x] API Product Hunt invariata
- [x] Data contract B36 invariato
- [x] Wrangler config invariato

## 5. Stato del working tree

```
 M __tests__/components/radar/radar-experience.test.tsx
 M __tests__/lib/radar/radar-ui-model.test.ts
 M app/(marketing)/radar/loading.tsx
 M app/(marketing)/radar/page.tsx
 M components/radar/radar-experience.tsx
 M lib/radar/radar-ui-model.ts
 M styles/radar.css
```

7 file modificati. 1192 inserzioni, 278 cancellazioni. 0 nuovi file
in `app/`, `components/`, `lib/`, `styles/`. I 4 nuovi file sono
`docs/final-copy/*` (4 file `*.md` di documentazione).

## 6. Deploy

NON eseguito. Il working tree è pronto ma la review utente è richiesta
prima di:
- commit
- push
- deploy (build:cloudflare + opennextjs-cloudflare deploy)
- 7-step deployment certification pubblica

## 7. Review checklist per l'utente

1. Verificare i file modificati (`git diff --stat`).
2. Verificare il file di copy canonica: `docs/final-copy/routes/RADAR_FINAL_COPY.md`.
3. Verificare la mappa implementazione: `docs/final-copy/TOOOLVIBES_GROK_IMPLEMENTATION_MAP.md`.
4. Verificare la parità desktop/mobile: gli screenshot in `/tmp/radar-v2-fix/radar-FIX-*.png`.
5. Approvare commit + push + deploy.
6. Eseguire la 7-step deployment certification (curl + wrangler + Playwright su URL pubblico).
