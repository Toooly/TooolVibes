# Assessment — LiveChat (`livechat`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni
### Fit nel workflow (workflowFit) — 4
- **motivation**: Si inserisce nel momento in cui il traffico cresce: conversazioni realtime su sito e prodotto, con ruolo doppio supporto/vendita, in linea con un workflow di crescita di un prodotto digitale.
- **evidence**: Record directory: bestFor 'Gestire chat realtime su sito'; useCases 'Supportare utenti e clienti', 'Convertire lead durante la navigazione'; whyItMatters 'quando il traffico cresce, una live chat solida può aumentare conversione e qualità del supporto'.
- **source**: lib/data/tooolvibes-directory.ts (record `livechat`: useCases, bestFor, whyItMatters); https://www.livechat.com/
- **limit**: Non copre ticketing strutturato né automazioni AI profonde: complementare, non sostitutivo, di helpdesk/chatbot.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Widget embed, agent console e onboarding sono noti per essere immediati: primo risultato utile rapido anche per team non tecnici.
- **evidence**: Record directory: level 'intermediate', segmenti customer-support/sales, useCases 'Gestire chat realtime su sito'; track record pubblico del prodotto come live chat maturo.
- **source**: lib/data/tooolvibes-directory.ts (record `livechat`: level, segments, useCases); https://www.livechat.com/
- **limit**: Curva su regole di routing, code e permessi non misurata in questa fase.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Copre live chat su web (e in parte mobile) con tagli supporto e vendita, ma non si estende a ticketing, automazioni AI o flussi complessi.
- **evidence**: Record directory: tags 'live chat', 'support', 'sales', 'realtime'; useCases tutti dentro chat realtime; segmenti customer-support/sales.
- **source**: lib/data/tooolvibes-directory.ts (record `livechat`: tags, useCases, segments)
- **limit**: Estensioni oltre la chat web (es. social messaging nativo, voice) non verificate.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 5
- **motivation**: Prodotto maturo e noto per qualità di agent console, widget e reportistica: è tra i riferimenti della sua categoria.
- **evidence**: Record directory: prodotto descritto come live chat solida per supporto/vendita; posizionamento del vendor (LiveChat) come punto di riferimento di categoria nel settore.
- **source**: lib/data/tooolvibes-directory.ts (record `livechat`: shortDescription, whyItMatters); https://www.livechat.com/
- **limit**: Nessuna demo analizzata in questa fase; qualità aggiornata dell'UI da riverificare.
- **confidence**: media

### Controllo e maturità operativa (operationalMaturity) — 5
- **motivation**: Vendor storico, integrazioni ampie, agenti, permessi e SLA noti; export delle chat e API documentate; resta la criticità del pricing per agente.
- **evidence**: Record directory: prodotto live chat di livello intermedio; track record pubblico del vendor (Text/LiveChat) come suite matura con app, integrazioni e API.
- **source**: lib/data/tooolvibes-directory.ts (record `livechat`: level, tags); https://www.livechat.com/
- **limit**: Pricing per agente e prevedibilità del costo su team in crescita da riverificare; nessun hands-on fatto.
- **confidence**: media

### Velocità di validazione (experimentationSpeed) — 3
- **motivation**: Installare il widget è veloce, ma tarare regole, code, team e integrazioni richiede tempo: l'idea → test è rapida solo sul primo scenario semplice.
- **evidence**: Record directory: useCases 'Gestire chat realtime su sito' e 'Convertire lead durante la navigazione' implicano setup iniziale di widget e team.
- **source**: lib/data/tooolvibes-directory.ts (record `livechat`: useCases, level)
- **limit**: Tempo al primo A/B tra varianti di widget/messaggi non cronometrato.
- **confidence**: media

## Risultato

- weighted = 4×0.25 + 4×0.20 + 3×0.15 + 5×0.15 + 5×0.15 + 3×0.10 = 1.00 + 0.80 + 0.45 + 0.75 + 0.75 + 0.30 = **4.05**
- score10 = round(4.05 × 2, 1) = **8.1**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + conoscenza pubblica di prodotto: nessun test hands-on.
- Pricing per agente, profondità di routing e qualità attuale della UI da riverificare prima della pubblicazione.
