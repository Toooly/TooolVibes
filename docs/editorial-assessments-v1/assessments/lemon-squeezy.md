# Assessment — Lemon Squeezy (`lemon-squeezy`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni
### Fit nel workflow (workflowFit) — 4
- **motivation**: Entra nel workflow 'vendi un prodotto digitale o SaaS senza costruire da subito tutta la macchina fiscale': è un Merchant of Record che comprime onboarding, pagamenti, tasse.
- **evidence**: Record directory: bestFor 'Vendere prodotti digitali'; useCases 'Gestire abbonamenti SaaS', 'Demandare tax compliance e billing'; whyItMatters 'è utile quando vuoi vendere software o prodotti digitali senza costruire subito tutta la gestione fiscale'.
- **source**: lib/data/tooolvibes-directory.ts (record `lemon-squeezy`: useCases, bestFor, whyItMatters); https://www.lemonsqueezy.com/
- **limit**: Per chi vuole controllare tutto in proprio (fatturazione, tassazione, brand sul checkout) può non essere la scelta giusta.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Dashboard di prodotti, link di checkout e setup abbonamento sono pensati per essere rapidi; il primo prodotto vendibile si crea in una sessione.
- **evidence**: Record directory: level 'intermediate', segmenti payments, useCases orientati a vendita di prodotti digitali e abbonamenti.
- **source**: lib/data/tooolvibes-directory.ts (record `lemon-squeezy`: level, segments, useCases); https://www.lemonsqueezy.com/
- **limit**: Curva su tassazione internazionale e gestione rimborsi non misurata in questa fase.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Copre pagamenti, abbonamenti e MoR per prodotti digitali e SaaS, ma è focalizzato su questo perimetro: non un commerce platform generalista.
- **evidence**: Record directory: tags 'payments', 'saas', 'merchant of record', 'subscriptions', 'tax'; useCases tutti dentro vendita digitale / SaaS / abbonamenti.
- **source**: lib/data/tooolvibes-directory.ts (record `lemon-squeezy`: tags, useCases)
- **limit**: Casi d'uso oltre il digitale (fisico, marketplace complesso) non sono nel perimetro del record.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 4
- **motivation**: Prodotto percepito come moderno, con checkout curato e dashboard pulita; brand e marketing del vendor coerenti con un target di creator/SaaS.
- **evidence**: Record directory: categoryLabel 'Pagamenti / Merchant of Record', posizionamento del vendor verso creator e SaaS; tag 'saas', 'subscriptions'.
- **source**: lib/data/tooolvibes-directory.ts (record `lemon-squeezy`: categoryLabel, tags); https://www.lemonsqueezy.com/
- **limit**: Qualità UI aggiornata e personalizzazione del checkout non verificate con un accesso hands-on.
- **confidence**: media

### Controllo e maturità operativa (operationalMaturity) — 3
- **motivation**: Il modello MoR è un'arma a doppio taglio: alleggerisce tasse e fisco, ma introduce dipendenza dal vendor (il cliente finale è del MoR) e vincola export, branding e rapporto diretto col cliente.
- **evidence**: Record directory: tags 'merchant of record', 'tax'; useCases 'Demandare tax compliance e billing' implica cessione di parte delle responsabilità operative al vendor.
- **source**: lib/data/tooolvibes-directory.ts (record `lemon-squeezy`: tags, useCases); https://www.lemonsqueezy.com/
- **limit**: Portabilità del cliente, esportazione dati e clausole di lock-in da leggere con attenzione prima della pubblicazione.
- **confidence**: media

### Velocità di validazione (experimentationSpeed) — 4
- **motivation**: Per validare monetizzazione di un prodotto digitale, il tempo idea → primo pagamento reale è breve: link di checkout e prodotto si pubblicano in fretta.
- **evidence**: Record directory: useCases 'Vendere prodotti digitali' e 'Gestire abbonamenti SaaS' orientati a setup rapido di offerta e billing.
- **source**: lib/data/tooolvibes-directory.ts (record `lemon-squeezy`: useCases)
- **limit**: Tempo al primo incasso reale e gestione dispute/rimborso non cronometrati.
- **confidence**: media

## Risultato

- weighted = 4×0.25 + 4×0.20 + 3×0.15 + 4×0.15 + 3×0.15 + 4×0.10 = 1.00 + 0.80 + 0.45 + 0.60 + 0.45 + 0.40 = **3.70**
- score10 = round(3.70 × 2, 1) = **7.4**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + conoscenza del prodotto: nessun test hands-on.
- Lock-in del MoR, portabilità del cliente e pricing su volumi alti da riverificare prima della pubblicazione.
