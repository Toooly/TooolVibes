# Assessment — Windsor AI (`windsor-ai`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `approved`

## Dimensioni
### Fit nel workflow (workflowFit) — 4
- **motivation**: Entra nel workflow marketing quando report e dashboard diventano critici: è un layer di attribuzione e unified data tra ads, analytics e BI.
- **evidence**: Record directory: bestFor 'Unificare dati advertising e analytics'; category 'Dati marketing'; whyItMatters 'È utile quando report e dashboard iniziano a diventare più importanti delle singole campagne'.
- **source**: lib/data/tooolvibes-directory.ts (record `windsor-ai`: useCases, category, whyItMatters); https://www.windsor.ai/
- **limit**: Il fit su team molto piccoli senza necessità di attribution formale può essere sovradimensionato.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 3
- **motivation**: Richiede scelta connettori, mapping e setup account su BI/warehouse: non è uno strumento zero-config, in linea con level 'intermediate'.
- **evidence**: Record directory: level 'intermediate', tags 'connectors', 'bi', 'warehouse'; useCases 'Inviare dati verso BI e warehouse'.
- **source**: lib/data/tooolvibes-directory.ts (record `windsor-ai`: level, tags, useCases); https://www.windsor.ai/
- **limit**: Tempo medio al primo report affidabile non misurato in questa fase.
- **confidence**: media

### Ampiezza d'uso (versatility) — 4
- **motivation**: Ampia copertura di canali marketing lato sorgente e destinazioni lato BI/warehouse, più casi d'uso distinti dentro il suo ruolo.
- **evidence**: Record directory: useCases (unificare dati, invio a BI, reportistica), tags 'attribution', 'bi', 'warehouse', 'connectors'; segmenti marketing/automation.
- **source**: lib/data/tooolvibes-directory.ts (record `windsor-ai`: useCases, tags, segments)
- **limit**: Non verificata l'ampiezza effettiva dei connettori supportati rispetto alla documentazione live del vendor.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 3
- **motivation**: Prodotto di categoria tecnica; il record non evidenzia elementi distintivi di UX, la qualità si misura sull'affidabilità dei connettori e dei report.
- **evidence**: Record directory: segmenti marketing/automation, focus su dati e connettori; nessun claim specifico di design/UX nel record.
- **source**: lib/data/tooolvibes-directory.ts (record `windsor-ai`: segments, whyItMatters)
- **limit**: Qualità UI reale e completezza dei template di report non verificate.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 4
- **motivation**: Invia dati a warehouse e BI, quindi mantiene il dato in casa: meccanismo di controllo ragionevole e allineato a un workflow di team maturi.
- **evidence**: Record directory: useCases 'Inviare dati verso BI e warehouse', tags 'warehouse', 'bi', 'connectors'.
- **source**: lib/data/tooolvibes-directory.ts (record `windsor-ai`: useCases, tags); https://www.windsor.ai/
- **limit**: Pricing, retention dei dati sul vendor, granularità dei permessi e lock-in da riverificare.
- **confidence**: media

### Velocità di validazione (experimentationSpeed) — 3
- **motivation**: Una volta connessi i canali il flusso è rapido, ma il setup iniziale (connettori, mapping, scelta destination) rallenta l'idea → test.
- **evidence**: Record directory: level 'intermediate', useCases che implicano setup di connettori verso BI/warehouse; segmento automation.
- **source**: lib/data/tooolvibes-directory.ts (record `windsor-ai`: level, useCases, segments)
- **limit**: Tempo a 'primo report' non cronometrato; dipende dal numero di sorgenti collegate.
- **confidence**: media

## Risultato

- weighted = 4×0.25 + 3×0.20 + 4×0.15 + 3×0.15 + 4×0.15 + 3×0.10 = 1.00 + 0.60 + 0.60 + 0.45 + 0.60 + 0.30 = **3.55**
- score10 = round(3.55 × 2, 1) = **7.1**
- overallConfidence: **media**

## Limiti complessivi

- Assessment basato su record directory + materiale vendor: nessun test hands-on.
- Pricing, profondità dei connettori e granularità di permessi da riverificare prima della pubblicazione.
