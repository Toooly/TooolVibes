# Assessment — Meku (`meku`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni

### Fit nel workflow (workflowFit) — 4
- **motivation**: Il punto di forza esplicito è generare basi React/Tailwind, iterare e poi esportare per continuare fuori dal builder: entra in un flusso in cui il codice resta del developer, non del tool.
- **evidence**: `useCases` "Generare basi React/Tailwind da cui partire", "Costruire siti o web app con iterazione veloce", "Esportare e continuare un progetto fuori dal builder"; tag `react`, `tailwind`, `export`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `meku`: useCases, tags); https://meku.dev/
- **limit**: Nessun test hands-on in questa fase; la qualità della base generata su stack non standard non è verificata.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 4
- **motivation**: Prompt AI su uno stack molto noto (React/Tailwind) porta al primo progetto navigabile in fretta, soprattutto per chi già padroneggia quel mondo.
- **evidence**: `shortDescription` "AI web app & site builder per generare progetti React/Tailwind, iterare, esportare e pubblicare"; `longDescription` "genera una base moderna, la iteri".
- **source**: `lib/data/tooolvibes-directory.ts` (record `meku`: shortDescription, longDescription); https://meku.dev/
- **limit**: La velocità reale per chi non conosce React/Tailwind può essere inferiore; curva non cronometrata.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Pensato per siti e web app React/Tailwind: copre quel perimetro bene, ma non è adatto ad app native mobile, backend complessi o workflow non-React.
- **evidence**: `segments` `vibe-coding`, `ai-app-builder`, `website-builder`; tag `react`, `tailwind`, `site builder`; `useCases` tutti interni a siti/web app.
- **source**: `lib/data/tooolvibes-directory.ts` (record `meku`: segments, tags, useCases)
- **limit**: Non verificata la copertura di mobile nativo, backend o integrazioni enterprise.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 3
- **motivation**: Tool meno noto di v0 o WeWeb: l'output è presentato come credibile (React/Tailwind moderni), ma la qualità effettiva non è verificabile senza test.
- **evidence**: `longDescription` "vuole restare nel mondo React/Tailwind ma partire da una spinta AI concreta: genera una base moderna"; `highlights` "React", "Tailwind", "Esportazione".
- **source**: `lib/data/tooolvibes-directory.ts` (record `meku`: longDescription, highlights)
- **limit**: Nessun progetto pubblico analizzato; qualità del codice generato su logiche complesse non testata.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 4
- **motivation**: Export del codice è un campo dichiarato del record e riduce il lock-in in modo esplicito: è il differenziale onesto rispetto a builder puramente chiusi.
- **evidence**: `useCases` "Esportare e continuare un progetto fuori dal builder"; `highlights` include "Esportazione"; `longDescription` "poi puoi riprendere controllo del progetto".
- **source**: `lib/data/tooolvibes-directory.ts` (record `meku`: useCases, highlights, longDescription)
- **limit**: Formato dell'export, licenza del codice generato e pricing dei piani non riverificati in questa fase.
- **confidence**: media

### Velocità di validazione (experimentationSpeed) — 4
- **motivation**: Iterazione veloce su base React/Tailwind e poi export per validare in proprio o in team: la dimensione è ben supportata dal perimetro del tool.
- **evidence**: `useCases` "Costruire siti o web app con iterazione veloce" e "Esportare e continuare un progetto fuori dal builder"; `longDescription` "la iteri e poi puoi riprendere controllo".
- **source**: `lib/data/tooolvibes-directory.ts` (record `meku`: useCases, longDescription); https://meku.dev/
- **limit**: Velocità dichiarata, non cronometrata su un caso reale; dipende dalla complessità del design system.
- **confidence**: media

## Risultato

- weighted = 4×0.25 + 4×0.20 + 3×0.15 + 3×0.15 + 4×0.15 + 4×0.10 = 1.00 + 0.80 + 0.45 + 0.45 + 0.60 + 0.40 = **3.70**
- score10 = round(3.70 × 2, 1) = **7.4**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiali vendor: nessun test hands-on.
- Qualità del codice generato su edge case reali, formato dell'export e pricing dei piani da riverificare.
