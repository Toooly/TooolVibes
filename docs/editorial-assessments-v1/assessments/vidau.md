# Assessment — Vidau (`vidau`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `ready_for_owner_approval`

## Dimensioni

### Fit nel workflow (workflowFit) — 4
- **motivation**: Porta URL prodotto, immagini e testi direttamente nel ciclo di produzione di creatività performance, con un fit forte per ecommerce e campagne che richiedono molte varianti.
- **evidence**: Il record directory lo descrive come generatore di video ads da URL, immagini e testi per campagne, ecommerce e creatività performance.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vidau`: shortDescription, longDescription, useCases); https://www.vidau.ai/
- **limit**: Nessun test hands-on; non sono state verificate integrazioni con cataloghi prodotto, ad platform o flussi di approvazione.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Generare da URL o asset esistenti riduce brief e montaggio iniziali, ma selezione del messaggio, revisione e adattamento al canale restano necessari.
- **evidence**: Il record presenta un flusso da URL, immagini e testi a video ads pronti.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vidau`: shortDescription, longDescription); https://www.vidau.ai/
- **limit**: Non sono stati misurati onboarding, tempi di rendering o sforzo per correggere una variante.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Accetta più tipi di input e può produrre varianti per prodotti diversi, ma resta focalizzato sul formato video advertising.
- **evidence**: I casi d'uso directory riguardano video ads da URL, test creativi ed ecommerce.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vidau`: useCases, shortDescription)
- **limit**: Non verificata la copertura di formati organici, tutorial, video lunghi o brand storytelling.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 4
- **motivation**: Il flusso specializzato può produrre asset abbastanza rifiniti per un test paid, ma la qualità percepita dipende da template, voce, scene e fedeltà al prodotto.
- **evidence**: Il record definisce gli output come video ads pronti e creatività per campagne ed ecommerce; il sito vendor mostra il posizionamento specializzato.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vidau`: shortDescription, longDescription); https://www.vidau.ai/
- **limit**: Nessun annuncio è stato valutato; accuratezza dei claim, resa del prodotto, localizzazione e performance creativa non sono verificate.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 3
- **motivation**: L'output video dovrebbe essere utilizzabile fuori piattaforma, ma il record non chiarisce export, watermark, diritti, brand control, crediti o pricing, con rischio di dipendenza per le revisioni.
- **evidence**: Il record parla di asset video per campagne ma non documenta formati, API, permessi, licenze o modello economico.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vidau`: useCases, assenza di dettagli operativi); https://www.vidau.ai/
- **limit**: Risoluzione, export, licenze commerciali, retention degli asset, crediti, pricing e lock-in di editing devono essere riverificati.
- **confidence**: bassa

### Velocità di validazione (experimentationSpeed) — 5
- **motivation**: La capacità dichiarata di trasformare rapidamente un URL prodotto in più video rende molto veloce il ciclo idea → variante testabile.
- **evidence**: WhyItMatters e useCases evidenziano la riduzione del tempo verso la prima variante e il test rapido di creatività.
- **source**: `lib/data/tooolvibes-directory.ts` (record `vidau`: whyItMatters, useCases)
- **limit**: Il tempo di produzione non è stato cronometrato e la velocità di apprendimento richiede comunque traffico e misurazione sulla piattaforma ads.
- **confidence**: media

## Risultato

- weighted = 4×0.25 + 4×0.20 + 3×0.15 + 4×0.15 + 3×0.15 + 5×0.10 = 1.00 + 0.80 + 0.45 + 0.60 + 0.45 + 0.50 = **3.80**
- score10 = round(3.80 × 2, 1) = **7.6**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiali vendor: nessun test hands-on.
- Qualità e performance degli annunci, controllo del brand, licenze, export, crediti e pricing da riverificare prima della pubblicazione.
