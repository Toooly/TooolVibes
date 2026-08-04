# Assessment — Tolt (`tolt`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `ready_for_owner_approval`

## Dimensioni
### Fit nel workflow (workflowFit) — 4
- **motivation**: Si inserisce nel workflow di crescita di una SaaS che vuole trasformare utenti, creator o partner in un canale di acquisizione misurabile.
- **evidence**: Record directory: bestFor 'Lanciare un programma affiliate SaaS'; useCases 'Tracciare partner e commissioni', 'Collegare referral a billing e pagamenti'; whyItMatters 'utile quando vuoi trasformare utenti, creator o partner in un canale di crescita misurabile'.
- **source**: lib/data/tooolvibes-directory.ts (record `tolt`: useCases, bestFor, whyItMatters); https://tolt.com/
- **limit**: Ha senso solo dopo che il prodotto e il billing sono pronti: non è un tool di prima linea.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 3
- **motivation**: Richiede integrazione con Stripe/Paddle/Chargebee e configurazione di programmi, commissioni e pagine: level 'expert' nel record indica attrito non banale.
- **evidence**: Record directory: level 'expert', tags 'stripe', 'paddle', 'chargebee' (integrazioni con billing esterni), useCases 'Lanciare un programma affiliate SaaS'.
- **source**: lib/data/tooolvibes-directory.ts (record `tolt`: level, tags, useCases); https://tolt.com/
- **limit**: Curva di setup e qualità UX del dashboard non misurate in questa fase.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Profondo nel suo ruolo (programmi affiliate, referral, commissioni) ma limitato a quel perimetro: non copre ads, SEO o content.
- **evidence**: Record directory: tags 'affiliate', 'referral', 'saas'; useCases tutti dentro programmi affiliate e tracciamento partner.
- **source**: lib/data/tooolvibes-directory.ts (record `tolt`: tags, useCases)
- **limit**: Eventuali estensioni a referral non-SaaS o multi-tier non verificate sul record.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 3
- **motivation**: Prodotto di nicchia con target esperto: la qualità percepita dipende da dashboard, pagine affiliate e materiali per partner, non documentati nel record.
- **evidence**: Record directory: categoryLabel 'Marketing affiliate / SaaS', level 'expert'; nessun claim specifico di design/UX nel record.
- **source**: lib/data/tooolvibes-directory.ts (record `tolt`: categoryLabel, level)
- **limit**: UI reale, qualità delle pagine pubbliche affiliate e materiali per partner non verificate.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 3
- **motivation**: Si appoggia a billing esterni (Stripe, Paddle, Chargebee) per i pagamenti, il che dà controllo, ma il modello di pricing legato alle commissioni affiliate è un costo variabile e un rischio da prevedere.
- **evidence**: Record directory: tags 'stripe', 'paddle', 'chargebee' (dipendenza da billing esterni); nessun claim nel record su export completo o API pubbliche.
- **source**: lib/data/tooolvibes-directory.ts (record `tolt`: tags, assenza di campi su export); https://tolt.com/
- **limit**: Pricing delle commissioni, portabilità dei dati e lock-in da riverificare.
- **confidence**: bassa

### Velocità di validazione (experimentationSpeed) — 3
- **motivation**: Una volta collegato il billing e lanciato il programma si sperimenta bene, ma il setup iniziale non è rapido: l'idea → test reale richiede alcuni passaggi.
- **evidence**: Record directory: level 'expert', useCases 'Lanciare un programma affiliate SaaS' e 'Collegare referral a billing e pagamenti' implicano setup non immediato.
- **source**: lib/data/tooolvibes-directory.ts (record `tolt`: level, useCases)
- **limit**: Tempo al primo referral tracciato e pagato non cronometrato.
- **confidence**: media

## Risultato

- weighted = 4×0.25 + 3×0.20 + 3×0.15 + 3×0.15 + 3×0.15 + 3×0.10 = 1.00 + 0.60 + 0.45 + 0.45 + 0.45 + 0.30 = **3.25**
- score10 = round(3.25 × 2, 1) = **6.5**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiale vendor: nessun test hands-on.
- Pricing legato alle commissioni, profondità di integrazioni e portabilità del dato da riverificare prima della pubblicazione.
