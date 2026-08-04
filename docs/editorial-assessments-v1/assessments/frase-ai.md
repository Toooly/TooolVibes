# Assessment — Frase AI (`frase-ai`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `ready_for_owner_approval`

## Dimensioni

### Fit nel workflow (workflowFit) — 5
- **motivation**: Unisce analisi SERP, brief, outline, scrittura e ottimizzazione in una sequenza coerente con il workflow SEO reale di founder e content team.
- **evidence**: Il record directory descrive ricerca SERP, brief, outline e ottimizzazione e dichiara la riduzione del salto tra keyword research, brief e pubblicazione.
- **source**: `lib/data/tooolvibes-directory.ts` (record `frase-ai`: shortDescription, longDescription, whyItMatters); https://www.frase.io/?via=tool57
- **limit**: Nessun test hands-on; non sono state verificate integrazioni con CMS, analytics o strumenti keyword già in uso.
- **confidence**: alta

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Centralizzare ricerca e brief accelera il primo output, ma interpretare intenti, concorrenti e raccomandazioni richiede competenza SEO.
- **evidence**: Il record indica brief più veloci, analisi SERP e ottimizzazione controllabile nello stesso prodotto.
- **source**: `lib/data/tooolvibes-directory.ts` (record `frase-ai`: longDescription, useCases); https://www.frase.io/?via=tool57
- **limit**: Onboarding, curva delle funzioni avanzate e tempo fino a un brief approvato non sono stati misurati.
- **confidence**: media

### Ampiezza d'uso (versatility) — 4
- **motivation**: Copre ricerca, pianificazione, produzione e aggiornamento di contenuti, più fasi distinte dentro il perimetro SEO pur senza diventare una suite marketing generalista.
- **evidence**: I casi d'uso directory includono creazione di brief, ottimizzazione di contenuti pubblicati e analisi di SERP e intenti.
- **source**: `lib/data/tooolvibes-directory.ts` (record `frase-ai`: useCases, shortDescription)
- **limit**: Non verificata la profondità su SEO tecnica, backlink, local SEO o mercati linguistici specifici.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 4
- **motivation**: Brief basati sulla SERP e controlli di ottimizzazione rendono l'output più decisionale di una chat generica, ma non garantiscono originalità né performance organica.
- **evidence**: Il record evidenzia analisi SERP, intenti, outline e ottimizzazione come base per contenuti più controllabili.
- **source**: `lib/data/tooolvibes-directory.ts` (record `frase-ai`: longDescription, useCases); https://www.frase.io/?via=tool57
- **limit**: Nessun brief o articolo è stato valutato; qualità editoriale, aggiornamento dei dati e correlazione tra score e ranking restano da verificare.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 4
- **motivation**: La copertura di un workflow SEO continuativo indica un prodotto maturo, ma il record non documenta export, collaborazione, API, gestione dati o prevedibilità del pricing; resta lock-in sulle analisi e sui punteggi proprietari.
- **evidence**: Il record descrive una piattaforma multi-fase per team e founder, senza dettagli su portabilità, permessi, integrazioni o costi.
- **source**: `lib/data/tooolvibes-directory.ts` (record `frase-ai`: longDescription, whyItMatters, assenza di dettagli operativi); https://www.frase.io/?via=tool57
- **limit**: Export, collaborazione, fonti SERP, policy dati, limiti d'uso, pricing e dipendenza dagli score proprietari devono essere riverificati.
- **confidence**: bassa

### Velocità di validazione (experimentationSpeed) — 5
- **motivation**: Comprime ricerca SERP e preparazione del brief, permettendo di testare rapidamente un cluster o aggiornare una pagina prima di investire in un ciclo editoriale completo.
- **evidence**: Il record dichiara brief SEO più veloci, ottimizzazione di contenuti esistenti e riduzione del salto tra ricerca e pubblicazione.
- **source**: `lib/data/tooolvibes-directory.ts` (record `frase-ai`: whyItMatters, useCases)
- **limit**: La preparazione accelera, ma la validazione finale del ranking richiede settimane o mesi e non è stata osservata.
- **confidence**: media

## Risultato

- weighted = 5×0.25 + 4×0.20 + 4×0.15 + 4×0.15 + 4×0.15 + 5×0.10 = 1.25 + 0.80 + 0.60 + 0.60 + 0.60 + 0.50 = **4.35**
- score10 = round(4.35 × 2, 1) = **8.7**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiali vendor e conoscenza di categoria: nessun test hands-on.
- Qualità dei dati SERP, resa editoriale, correlazione con il ranking, integrazioni, export e pricing da riverificare prima della pubblicazione.
