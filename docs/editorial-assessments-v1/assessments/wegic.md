# Assessment — Wegic (`wegic`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni

### Fit nel workflow (workflowFit) — 3
- **motivation**: Pensato per siti web e presenza online via flusso conversazionale: entra bene in un workflow di "pubblicare una pagina/sito in fretta", non in un workflow di prodotto complesso.
- **evidence**: `longDescription` "adatto a chi vuole un sito credibile rapidamente senza perdersi nei dettagli del builder"; `useCases` "Creare siti tramite chat", "Iterare copy e layout velocemente", "Pubblicare una presenza online in poco tempo".
- **source**: `lib/data/tooolvibes-directory.ts` (record `wegic`: longDescription, useCases); https://wegic.ai/
- **limit**: Nessun test hands-on in questa fase; il fit su web app o prodotti con logica di business non è documentato.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Il flusso conversazionale ("descrivi cosa vuoi, iteri, pubblichi") è tra i più accessibili del segmento: chiunque può partire senza competenze di design o codice.
- **evidence**: `shortDescription` "AI website builder che crea, modifica e pubblica siti tramite conversazione"; `useCases` "Creare siti tramite chat".
- **source**: `lib/data/tooolvibes-directory.ts` (record `wegic`: shortDescription, useCases); https://wegic.ai/
- **limit**: La qualità del primo output dipende dalla chiarezza del brief; curva su siti complessi non cronometrata.
- **confidence**: media

### Ampiezza d'uso (versatility) — 2
- **motivation**: Limitato al sito web: non copre web app, prodotti SaaS, backend, agenti o integrazioni di sistema.
- **evidence**: `segments` `website-builder`, `ai-app-builder`, `no-code` (tre etichette, ma l'uso concreto è sito); tag `website builder`, `ai site`; `useCases` tutti interni a "sito/presenza online".
- **source**: `lib/data/tooolvibes-directory.ts` (record `wegic`: segments, tags, useCases)
- **limit**: Non verificata la copertura di web app, prodotti o workflow multi-pagina complessi.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 3
- **motivation**: L'output è presentato come "sito credibile rapidamente", ma la qualità del design e della resa su brand esigenti non è verificabile senza test.
- **evidence**: `longDescription` "sito credibile rapidamente senza perdersi nei dettagli del builder"; `highlights` "Sito", "Chat", "Pubblicazione".
- **source**: `lib/data/tooolvibes-directory.ts` (record `wegic`: longDescription, highlights)
- **limit**: Qualità di design su siti con identità visive specifiche e qualità responsive non testate hands-on.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 2
- **motivation**: Lock-in probabile: il sito generato è chiuso nel builder, export del codice e self-hosting non sono documentati, e il pricing non è riverificato.
- **evidence**: Assenza di claim su export/self-hosting/API nei campi del record; `useCases` "Pubblicare una presenza online" indica hosting proprietario; nessun campo su permessi granulari.
- **source**: `lib/data/tooolvibes-directory.ts` (record `wegic`: useCases, assenza di campi su export e self-hosting)
- **limit**: Pricing, policy di export e limiti dei piani da riverificare con accesso al prodotto.
- **confidence**: bassa

### Velocità di validazione (experimentationSpeed) — 4
- **motivation**: "Pubblicare una presenza online in poco tempo" è esattamente la promessa: per validare ipotesi di sito (landing, presenza, MVP di marketing) la velocità è il punto di forza.
- **evidence**: `useCases` "Iterare copy e layout velocemente" e "Pubblicare una presenza online in poco tempo"; `highlights` include "Pubblicazione".
- **source**: `lib/data/tooolvibes-directory.ts` (record `wegic`: useCases, highlights); https://wegic.ai/
- **limit**: Velocità dichiarata, non cronometrata su un sito reale; il delta dipende dalla completezza del brief.
- **confidence**: media

## Risultato

- weighted = 3×0.25 + 4×0.20 + 2×0.15 + 3×0.15 + 2×0.15 + 4×0.10 = 0.75 + 0.80 + 0.30 + 0.45 + 0.30 + 0.40 = **3.00**
- score10 = round(3.00 × 2, 1) = **6.0**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiali vendor: nessun test hands-on.
- Export del sito, lock-in reale e pricing dei piani da riverificare prima della pubblicazione.
