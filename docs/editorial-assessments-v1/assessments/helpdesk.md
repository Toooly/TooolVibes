# Assessment — HelpDesk (`helpdesk`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni
### Fit nel workflow (workflowFit) — 4
- **motivation**: Entra nel workflow quando email e chat non bastano più: dà struttura a ticket, priorità e SLA, allineato a un supporto che inizia a essere misurabile.
- **evidence**: Record directory: bestFor 'Gestire ticket clienti'; useCases 'Automatizzare priorità e assegnazioni', 'Tenere traccia di SLA e conversazioni'; whyItMatters 'Aiuta a non perdere conversazioni importanti e rende il supporto più misurabile'.
- **source**: lib/data/tooolvibes-directory.ts (record `helpdesk`: useCases, bestFor, whyItMatters); https://www.helpdesk.com/
- **limit**: Non copre chat realtime né bot: complementare a LiveChat/ChatBot nello stack.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Concetti noti (ticket, code, priorità) e UI consolidate rendono l'adozione rapida per team che arrivano da email o fogli condivisi.
- **evidence**: Record directory: level 'intermediate', shortDescription 'Ticketing system per gestire comunicazioni clienti, automazioni e supporto team'; useCases 'Gestire ticket clienti'.
- **source**: lib/data/tooolvibes-directory.ts (record `helpdesk`: level, shortDescription, useCases); https://www.helpdesk.com/
- **limit**: Complessità reale di setup di caselle, regole e SLA non misurata.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Buona varietà interna (ticket, automazioni, SLA) ma il perimetro resta il supporto strutturato; non sostituisce live chat o chatbot.
- **evidence**: Record directory: tags 'helpdesk', 'ticketing', 'support', 'automation', 'team'; useCases tutti dentro gestione ticket/automazioni.
- **source**: lib/data/tooolvibes-directory.ts (record `helpdesk`: tags, useCases)
- **limit**: Estensioni a voice, social o workflow fortemente custom non verificate sul record.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 4
- **motivation**: Stessa famiglia di prodotto di LiveChat/ChatBot, con qualità UI e focus su operator experience coerenti con la suite.
- **evidence**: Record directory: segmenti customer-support/automation, focus su agenti e team; prodotto del gruppo noto per qualità di agent console e report.
- **source**: lib/data/tooolvibes-directory.ts (record `helpdesk`: segments, useCases); https://www.helpdesk.com/
- **limit**: Qualità UI aggiornata non verificata con accesso hands-on.
- **confidence**: media

### Controllo e maturità operativa (operationalMaturity) — 4
- **motivation**: Struttura pensata per team (ruoli, code, SLA) e integrazioni con canali di posta e moduli: controllo operativo ragionevole per la sua categoria.
- **evidence**: Record directory: useCases 'Tenere traccia di SLA e conversazioni', 'Automatizzare priorità e assegnazioni'; tags 'automation', 'team'.
- **source**: lib/data/tooolvibes-directory.ts (record `helpdesk`: useCases, tags); https://www.helpdesk.com/
- **limit**: Export dei dati, granularità dei permessi e pricing per agente da riverificare.
- **confidence**: media

### Velocità di validazione (experimentationSpeed) — 3
- **motivation**: Aprire la casella e instradare i primi ticket è veloce, ma arrivare a un setup completo (SLA, automazioni, report) richiede tempo.
- **evidence**: Record directory: useCases 'Gestire ticket clienti' e 'Tenere traccia di SLA e conversazioni' implicano configurazione iniziale di code e regole.
- **source**: lib/data/tooolvibes-directory.ts (record `helpdesk`: useCases)
- **limit**: Velocità al primo ticket instradato correttamente non cronometrata.
- **confidence**: media

## Risultato

- weighted = 4×0.25 + 4×0.20 + 3×0.15 + 4×0.15 + 4×0.15 + 3×0.10 = 1.00 + 0.80 + 0.45 + 0.60 + 0.60 + 0.30 = **3.75**
- score10 = round(3.75 × 2, 1) = **7.5**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + conoscenza del prodotto: nessun test hands-on.
- Pricing per agente, profondità di automazioni e qualità attuale della UI da riverificare prima della pubblicazione.
