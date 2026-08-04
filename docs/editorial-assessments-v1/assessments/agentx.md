# Assessment — AgentX (`agentx`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni

### Fit nel workflow (workflowFit) — 3
- **motivation**: Entra in workflow business che vogliono portare agenti AI dentro processi senza setup troppo pesante: il fit è promesso ma va verificato su processi reali, non su demo.
- **evidence**: `longDescription` "rilevante per chi vuole portare agenti AI dentro processi business senza un setup troppo pesante"; `useCases` "Automatizzare processi business" e "Prototipare flussi multi-agent"; tag `agenti ai`, `flussi business`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `agentx`: longDescription, useCases, tags); https://www.agentx.so/
- **limit**: Nessun test hands-on in questa fase; profondità del "no-code" su processi business complessi non verificata.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 3
- **motivation**: No-code nella promessa, ma modellare agenti specializzati e flussi multi-agent richiede comunque pensiero strutturato: la curva è gestibile, non immediata.
- **evidence**: `shortDescription` "Piattaforma no-code e multi-agent per creare agenti AI specializzati e flussi business"; `useCases` "Creare agenti AI specializzati".
- **source**: `lib/data/tooolvibes-directory.ts` (record `agentx`: shortDescription, useCases); https://www.agentx.so/
- **limit**: Tempo al primo agente funzionante non cronometrato; dipende dalla chiarezza del processo da automatizzare.
- **confidence**: media

### Ampiezza d'uso (versatility) — 3
- **motivation**: Copre un perimetro definito (agenti AI + flussi business multi-agent): buona ampiezza nel suo segmento, ma non generalista oltre gli agenti.
- **evidence**: `useCases` "Creare agenti AI specializzati", "Automatizzare processi business", "Prototipare flussi multi-agent"; tag `agenti ai`, `multi-agent`, `flussi business`.
- **source**: `lib/data/tooolvibes-directory.ts` (record `agentx`: useCases, tags)
- **limit**: Non verificata la copertura di voice agent, integrazioni enterprise profonde o workflow non-business.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 3
- **motivation**: Tool meno noto di Flowise o v0: l'output (agenti + flussi) è presentato come professionale, ma la qualità effettiva non è verificabile senza test.
- **evidence**: `longDescription` "agenti AI specializzati e flussi multi-agent senza partire da una struttura tecnica complessa"; `highlights` "Agenti", "No-code", "Flussi".
- **source**: `lib/data/tooolvibes-directory.ts` (record `agentx`: longDescription, highlights)
- **limit**: Qualità reale degli agenti generati e stabilità dei flussi multi-agent su casi reali non testate.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 2
- **motivation**: Lock-in probabile: export di agenti e flussi, governance e audit non sono documentati, e il pricing non è riverificato.
- **evidence**: Assenza di claim su export/self-hosting/on-prem nei campi del record; nessun campo su SSO, audit log o permessi granulari; `level: expert` indica piattaforma chiusa, non self-hosted.
- **source**: `lib/data/tooolvibes-directory.ts` (record `agentx`: level, assenza di campi su export, self-hosting, SSO)
- **limit**: Pricing per agent/session, policy di export e opzioni enterprise (SSO, audit) da riverificare con accesso al prodotto.
- **confidence**: bassa

### Velocità di validazione (experimentationSpeed) — 3
- **motivation**: Prototipazione multi-agent possibile, ma il "no-code" non è sinonimo di "minuti al primo agente": la velocità di validazione c'è ma non è la dimensione in cui eccelle.
- **evidence**: `useCases` "Prototipare flussi multi-agent"; `shortDescription` "no-code e multi-agent"; `longDescription` "senza un setup troppo pesante" (non "senza setup").
- **source**: `lib/data/tooolvibes-directory.ts` (record `agentx`: useCases, shortDescription, longDescription)
- **limit**: Velocità reale di prototipazione e tempo al primo flusso business operativo non cronometrati.
- **confidence**: media

## Risultato

- weighted = 3×0.25 + 3×0.20 + 3×0.15 + 3×0.15 + 2×0.15 + 3×0.10 = 0.75 + 0.60 + 0.45 + 0.45 + 0.30 + 0.30 = **2.85**
- score10 = round(2.85 × 2, 1) = **5.7**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiali vendor: nessun test hands-on.
- Profondità reale del "no-code" su agenti complessi, export, governance enterprise e pricing da riverificare prima della pubblicazione.
