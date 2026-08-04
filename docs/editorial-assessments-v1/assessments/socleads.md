# Assessment — Socleads (`socleads`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `ready_for_owner_approval`

## Dimensioni
### Fit nel workflow (workflowFit) — 3
- **motivation**: Utile per costruire le prime liste di outbound in un workflow sales di founder o team piccoli, ma resta un tool di prospecting, non un pilastro del prodotto.
- **evidence**: Record directory: bestFor 'Costruire liste lead per outbound', useCases centrati su liste, contatti da fonti pubbliche e prospecting commerciale; category 'Lead Generation'.
- **source**: lib/data/tooolvibes-directory.ts (record `socleads`: useCases, bestFor, category, tags)
- **limit**: Nessun test hands-on; l'efficacia reale dipende da fonti pubbliche la cui disponibilità e i cui termini di servizio cambiano.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Flusso di estrazione guidato, level 'beginner' nel record, pensato per essere usato senza setup tecnico pesante da un team sales.
- **evidence**: Record directory: level 'beginner', segmenti sales/marketing, whyItMatters 'riduce il lavoro manuale sulle prime liste di contatti'.
- **source**: lib/data/tooolvibes-directory.ts (record `socleads`: level, segments, whyItMatters); https://socleads.com/
- **limit**: Curva reale di qualità del dato e falsi positivi non misurata in questa fase.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Copre più fonti pubbliche (Google Maps, Instagram, LinkedIn), ma resta un estrattore: non esce dal perimetro lead generation.
- **evidence**: Record directory: tags 'google maps', 'linkedin', 'outreach'; useCases tutti dentro lead/prospecting; nessun caso d'uso al di fuori del sales funnel.
- **source**: lib/data/tooolvibes-directory.ts (record `socleads`: tags, useCases)
- **limit**: Non verificato l'uso del tool in contesti diversi dal prospecting (es. market research, enrichment CRM).
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 3
- **motivation**: UI da prodotto sales/marketing standard, nessun elemento distintivo di qualità percepita nel record; la resa dipende dalla qualità del dato estratto.
- **evidence**: Record directory: segmenti sales/marketing, shortDescription orientata a flusso di estrazione; nessun claim di design o qualità output nel record.
- **source**: lib/data/tooolvibes-directory.ts (record `socleads`: shortDescription, segments)
- **limit**: Qualità UI reale e qualità del dato non verificate; nessuna demo analizzata.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 2
- **motivation**: Estrazione da fonti pubbliche (LinkedIn, Google Maps) espone a fragilità tecnica, dipendenza dalle policy delle piattaforme e rischio compliance; lock-in sul dato e pricing non documentati nel record.
- **evidence**: Record directory: tags 'google maps', 'linkedin' (fonti note per restrizioni ToS); assenza nel record di claim su export, integrazioni native, SLA, prevedibilità pricing.
- **source**: lib/data/tooolvibes-directory.ts (record `socleads`: tags, assenza di campi su export/SLA); https://socleads.com/
- **limit**: Pricing, portabilità del dato e stato reale del lock-in da riverificare; contesto legale dell'uso non analizzato.
- **confidence**: bassa

### Velocità di validazione (experimentationSpeed) — 4
- **motivation**: Per una prima lista utile, l'attivazione è rapida: il valore arriva nelle prime sessioni, in linea con un workflow di prospecting agile.
- **evidence**: Record directory: level 'beginner', whyItMatters 'riduce il lavoro manuale sulle prime liste di contatti'; useCases orientati a output rapidi.
- **source**: lib/data/tooolvibes-directory.ts (record `socleads`: level, whyItMatters, useCases)
- **limit**: Velocità su lead di qualità (non solo volume) non cronometrata.
- **confidence**: media

## Risultato

- weighted = 3×0.25 + 4×0.20 + 3×0.15 + 3×0.15 + 2×0.15 + 4×0.10 = 0.75 + 0.80 + 0.45 + 0.45 + 0.30 + 0.40 = **3.15**
- score10 = round(3.15 × 2, 1) = **6.3**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiale vendor: nessun test hands-on.
- Rischi di compliance su scraping, pricing e portabilità del dato da riverificare prima della pubblicazione.
