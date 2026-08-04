# Assessment — VibeCode (`vibecode`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni

### Fit nel workflow (workflowFit) — 3
- **motivation**: VibeCode entra in un flusso di iterazione e pubblicazione rapida mobile+web, ma il record non segnala integrazioni profonde con il resto della pipeline tecnica: la promessa è velocità, non ancora tenuta del progetto.
- **evidence**: `shortDescription` "Builder AI per creare app da prompt, iterare rapidamente e pubblicare progetti mobile/web"; `useCases` centrati su iterazione, demo pubblicabile e feedback reale; tag `iterazione`, `pubblicazione`, `app mobile`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vibecode`: shortDescription, longDescription, useCases, tags); https://www.vibecodeapp.com/
- **limit**: Nessun test hands-on in questa fase; l'integrazione con stack esistenti (auth, pagamenti, analytics) non è documentata nel record.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Il modello prompt-to-app con focus su iterazione porta al primo risultato nella prima sessione: la curva è tarata su velocità, non su profondità.
- **evidence**: `longDescription` "VibeCode spinge sulla velocità di iterazione: generi una base applicativa, la rifinisci rapidamente"; tag `vibe coding`, `iterazione`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vibecode`: longDescription, tags); https://www.vibecodeapp.com/
- **limit**: La qualità reale del primo output dipende dal prompt; non misurato l'attrito su app non banali.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Copre mobile e web via prompt, ma resta nel perimetro app/sito generati da AI; non segnala backend complessi, agenti o integrazioni di sistema.
- **evidence**: `segments` `vibe-coding`, `ai-app-builder`; tag `app mobile`, `iterazione`, `pubblicazione`; use cases tutti interni al ciclo idea → demo.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vibecode`: segments, tags, useCases)
- **limit**: Non verificata la copertura di backend complessi, agenti autonomi o integrazioni enterprise.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 3
- **motivation**: L'output è presentato come credibile per iterare e pubblicare velocemente, ma la qualità del codice e della UX oltre la prima demo non è verificabile senza test.
- **evidence**: `longDescription` "capisci se il prodotto merita il passaggio successivo"; tag `pubblicazione` che presuppone output presentabile.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vibecode`: longDescription, tags)
- **limit**: Nessun progetto pubblico analizzato; qualità UI/codice oltre il prototipo non testata.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 2
- **motivation**: Export del codice, self-hosting e integrazioni non documentati nel record; il lock-in è plausibile e il pricing non è riverificato.
- **evidence**: Assenza di claim su export/self-hosting/API nei campi del record; nessuna evidenza di permessi granulari o SSO.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vibecode`: assenza di campi su export e self-hosting)
- **limit**: Voce da riverificare con accesso al prodotto; pricing e politiche di export non consultati in questa fase.
- **confidence**: bassa

### Velocità di validazione (experimentationSpeed) — 4
- **motivation**: Il focus dichiarato è iterare e pubblicare in fretta: la dimensione di "quanto acceleri un test reale" è esplicitamente centrale.
- **evidence**: `useCases` "Accelerare il passaggio da idea a demo pubblicabile" e "Ridurre il tempo tra concept e feedback reale"; tag `iterazione`, `pubblicazione`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vibecode`: useCases, tags); https://www.vibecodeapp.com/
- **limit**: Velocità dichiarata, non cronometrata su un caso reale; dipende dalla natura dell'idea.
- **confidence**: media

## Risultato

- weighted = 3×0.25 + 4×0.20 + 3×0.15 + 3×0.15 + 2×0.15 + 4×0.10 = 0.75 + 0.80 + 0.45 + 0.45 + 0.30 + 0.40 = **3.15**
- score10 = round(3.15 × 2, 1) = **6.3**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiali vendor: nessun test hands-on.
- Export del codice, lock-in reale e pricing da riverificare prima della pubblicazione.
