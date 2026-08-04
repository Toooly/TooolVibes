# Assessment — WeWeb (`weweb`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni

### Fit nel workflow (workflowFit) — 5
- **motivation**: WeWeb è posizionata come piattaforma no-code/AI per web app production-grade, pensata per chi vuole portare un progetto no-code a uno standard serio: si inserisce in un flusso reale di produzione, non solo di prototipazione.
- **evidence**: `longDescription` "scelta matura quando vuoi restare veloce senza perdere controllo sul front-end, sulle integrazioni e sulla tenuta del progetto nel tempo"; `useCases` "Collegare frontend visuale e backend esterni" e "Portare un progetto no-code a uno standard serio"; tag `produzione`, `backend`, `frontend`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `weweb`: longDescription, useCases, tags); https://dashboard.weweb.io/
- **limit**: Nessun test hands-on in questa fase; la profondità reale di "production-grade" su casi complessi non è verificata.
- **confidence**: alta

### Velocità di adozione (easeOfUse) — 3
- **motivation**: Costruire una web app production-ready via no-code richiede comunque investimento di apprendimento: la velocità di adozione è reale ma non è il punto di forza principale.
- **evidence**: `shortDescription` "Piattaforma visuale no-code/AI per creare web app production-grade"; `segments` `no-code`, `ai-app-builder`, `website-builder` (sovrapposizione di tre logiche).
- **source**: `lib/data/tooolvibes-directory.ts` (record `weweb`: shortDescription, segments)
- **limit**: Curva di apprendimento reale non cronometrata; la semplicità del prompt iniziale può mascherare la complessità di un'app completa.
- **confidence**: media

### Ampiezza d'uso (versatility) — 4
- **motivation**: Copre frontend visuale, integrazioni backend esterne e output production-grade: tre sotto-casi distinti dentro il ruolo no-code web app.
- **evidence**: `useCases` "Costruire web app senza ripartire da zero", "Collegare frontend visuale e backend esterni", "Portare un progetto no-code a uno standard serio"; tag `frontend`, `backend`, `produzione`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `weweb`: useCases, tags)
- **limit**: Non verificata la copertura di mobile nativo, agenti AI o workflow puramente backend.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 4
- **motivation**: Piattaforma no-code matura con output pensato per la produzione: la qualità percepita è uno dei motivi per cui viene citata in contesti professionali.
- **evidence**: `longDescription` "sembrarare pronto per andare in produzione"; `whyItMatters` "merita attenzione vera"; tag `no-code pro`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `weweb`: longDescription, whyItMatters, tags); https://dashboard.weweb.io/
- **limit**: Qualità effettiva del codice generato e UX del builder non testate hands-on.
- **confidence**: media

### Controllo e maturità operativa (operationalMaturity) — 4
- **motivation**: Export, self-hosting e integrazioni backend sono nel perimetro dichiarato del tool: il lock-in è ridotto rispetto a un vibe-coding puro, e la prevedibilità operativa è tra i motivi di scelta.
- **evidence**: `useCases` "Collegare frontend visuale e backend esterni" indica controllo esplicito su dove vivono dati e servizi; `whyItMatters` "restare veloce senza perdere controllo sul front-end, sulle integrazioni e sulla tenuta del progetto".
- **source**: `lib/data/tooolvibes-directory.ts` (record `weweb`: useCases, whyItMatters); https://dashboard.weweb.io/
- **limit**: Pricing dei piani, limiti di export e opzioni di self-hosting non riverificati in questa fase.
- **confidence**: media

### Velocità di validazione (experimentationSpeed) — 3
- **motivation**: Più orientata a costruire un prodotto tenuto che a prototipare in pochi minuti: la velocità di validazione c'è, ma non è la dimensione in cui WeWeb eccelle.
- **evidence**: `useCases` "Costruire web app senza ripartire da zero" suggerisce un tempo di setup superiore a un vibe-coding puro; tag `produzione` indica focus su tenuta.
- **source**: `lib/data/tooolvibes-directory.ts` (record `weweb`: useCases, tags)
- **limit**: Tempo idea → prototipo navigabile non cronometrato; la promessa è "production", non "minutes".
- **confidence**: media

## Risultato

- weighted = 5×0.25 + 3×0.20 + 4×0.15 + 4×0.15 + 4×0.15 + 3×0.10 = 1.25 + 0.60 + 0.60 + 0.60 + 0.60 + 0.30 = **3.95**
- score10 = round(3.95 × 2, 1) = **7.9**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + conoscenza pubblica del prodotto: nessun test hands-on.
- Pricing dei piani, limiti di export/self-hosting e qualità del codice generato su casi complessi da riverificare.
