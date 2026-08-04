# Assessment — Synthesia AI (`synthesia-ai`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni

### Fit nel workflow (workflowFit) — 5
- **motivation**: Trasforma script in video ripetibili per onboarding, training e comunicazione corporate, inserendosi direttamente in workflow continuativi dove una produzione tradizionale sarebbe troppo lenta.
- **evidence**: Il record directory indica avatar, voiceover e script testuali per formazione, onboarding, tutorial e contenuti corporate scalabili.
- **source**: `lib/data/tooolvibes-directory.ts` (record `synthesia-ai`: shortDescription, longDescription, useCases); https://www.synthesia.io/
- **limit**: Nessun test hands-on; non sono state verificate integrazioni specifiche con LMS, CMS o processi di approvazione del team.
- **confidence**: alta

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Il flusso script-to-video elimina set, camera e speaker, ma progettare template, voce, avatar e ritmo efficaci richiede più cura di una semplice generazione one-click.
- **evidence**: Il record descrive la produzione da script con avatar e voiceover e sottolinea l'assenza di set e speaker a ogni aggiornamento.
- **source**: `lib/data/tooolvibes-directory.ts` (record `synthesia-ai`: longDescription, whyItMatters); https://www.synthesia.io/
- **limit**: Onboarding, tempi di rendering e sforzo per arrivare a un template approvato non sono stati misurati.
- **confidence**: media

### Ampiezza d'uso (versatility) — 4
- **motivation**: Copre bene training, onboarding, tutorial e comunicazione multilingua, ma resta ottimizzato per video presentazionali basati su script più che per ogni genere audiovisivo.
- **evidence**: I casi d'uso directory includono training, corporate multilingua, onboarding e tutorial.
- **source**: `lib/data/tooolvibes-directory.ts` (record `synthesia-ai`: useCases, longDescription)
- **limit**: Non verificata l'idoneità per storytelling emozionale, demo prodotto complesse o campagne che richiedono riprese reali.
- **confidence**: alta

### Qualità esperienza/output (experienceQuality) — 5
- **motivation**: È una piattaforma di riferimento per video avatar corporate e offre un output sufficientemente coerente e professionale per formazione scalabile, pur senza sostituire sempre la presenza umana.
- **evidence**: Il record la posiziona su video professionali con avatar e voiceover; il sito vendor documenta un'offerta consolidata per comunicazione e training aziendale.
- **source**: `lib/data/tooolvibes-directory.ts` (record `synthesia-ai`: shortDescription, whyItMatters); https://www.synthesia.io/
- **limit**: Nessun video è stato valutato in questa fase; naturalezza, pronuncia, accessibilità e ricezione del pubblico restano dipendenti dal caso d'uso.
- **confidence**: media

### Controllo e maturità operativa (operationalMaturity) — 5
- **motivation**: Il posizionamento enterprise e l'uso per contenuti corporate ricorrenti indicano maturità su gestione e scala; rimangono lock-in su template/avatar e rischio di pricing elevato o variabile.
- **evidence**: Il record descrive comunicazione scalabile e contenuti corporate multilingua; il sito vendor presenta la piattaforma come soluzione strutturata per organizzazioni.
- **source**: `lib/data/tooolvibes-directory.ts` (record `synthesia-ai`: longDescription, useCases); https://www.synthesia.io/
- **limit**: Export dei progetti sorgente, permessi granulari, policy dati, SLA e pricing non sono stati verificati direttamente; l'output video esportato non elimina il lock-in di editing.
- **confidence**: media

### Velocità di validazione (experimentationSpeed) — 4
- **motivation**: Consente di validare rapidamente script, lingue e formati video senza organizzare riprese, anche se rendering e approvazioni corporate impediscono un ciclo istantaneo.
- **evidence**: Il record evidenzia la produzione da script senza set, camera e speaker e l'uso per tutorial e onboarding aggiornabili.
- **source**: `lib/data/tooolvibes-directory.ts` (record `synthesia-ai`: whyItMatters, useCases)
- **limit**: Tempi di generazione, revisione e localizzazione non sono stati cronometrati.
- **confidence**: media

## Risultato

- weighted = 5×0.25 + 4×0.20 + 4×0.15 + 5×0.15 + 5×0.15 + 4×0.10 = 1.25 + 0.80 + 0.60 + 0.75 + 0.75 + 0.40 = **4.55**
- score10 = round(4.55 × 2, 1) = **9.1**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiali vendor e conoscenza pubblica di categoria: nessun test hands-on.
- Naturalezza degli avatar, accessibilità, governance, portabilità dei progetti, SLA e pricing da riverificare prima della pubblicazione.
