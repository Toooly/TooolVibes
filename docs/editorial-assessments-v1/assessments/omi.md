# Assessment — Omi (`omi`)

- methodologyVersion: `builder-first-v1`
- assessedAt: `2026-08-04`
- assessor: TooolVibes Editorial (staging, pre-approval)
- approvalStatus: `ready_for_owner_approval`

## Dimensioni
### Fit nel workflow (workflowFit) — 2
- **motivation**: È un wearable personale per trascrizione, memoria e azioni: utile per la produttività personale del founder, non come mattone nel workflow di costruzione di un prodotto digitale.
- **evidence**: Record directory: bestFor 'Trascrivere conversazioni importanti'; useCases 'Creare memoria personale consultabile', 'Trasformare meeting e dialoghi in azioni'; categoryLabel 'Wearable AI / assistente personale'; segmenti productivity/ai-agents.
- **source**: lib/data/tooolvibes-directory.ts (record `omi`: useCases, bestFor, categoryLabel, segments); https://www.omi.me/
- **limit**: Il fit su un workflow di building/operations è marginale; entra più nella sfera 'personal AI' che 'product stack'.
- **confidence**: media

### Velocità di adozione (easeOfUse) — 2
- **motivation**: Richiede un device hardware e setup iniziale: l'attrito non è zero ed è in linea con level 'expert' e categoria wearable AI.
- **evidence**: Record directory: level 'expert', shortDescription 'Wearable AI open-source che registra, trascrive, ricorda e trasforma conversazioni in azioni'.
- **source**: lib/data/tooolvibes-directory.ts (record `omi`: level, shortDescription); https://www.omi.me/
- **limit**: Esperienza reale di onboarding hardware/AI e qualità della trascrizione non misurate.
- **confidence**: bassa

### Ampiezza d'uso (versatility) — 3
- **motivation**: Dentro la sua nicchia (memoria personale, trascrizione, azioni) copre più casi d'uso; ma resta circoscritto a un dispositivo e a un'idea di personal AI.
- **evidence**: Record directory: useCases 'Trascrivere conversazioni importanti', 'Creare memoria personale consultabile', 'Trasformare meeting e dialoghi in azioni'; tags 'transcription', 'memory', 'personal ai'.
- **source**: lib/data/tooolvibes-directory.ts (record `omi`: useCases, tags)
- **limit**: Versatilità reale in contesti non documentati (es. team, integrazioni business) non verificata.
- **confidence**: media

### Qualità esperienza/output (experienceQuality) — 3
- **motivation**: Progetto open-source con claim chiari (trascrizione + memoria + azioni), ma la qualità percepita dipende dal prodotto fisico e dal software, non verificati nel record.
- **evidence**: Record directory: tags 'open-source', 'personal ai'; whyItMatters 'interessante per chi vuole sperimentare personal AI e memoria aumentata'.
- **source**: lib/data/tooolvibes-directory.ts (record `omi`: tags, whyItMatters); https://www.omi.me/
- **limit**: Nessun test hands-on; qualità di trascrizione, latenza e UX del dispositivo non verificate.
- **confidence**: bassa

### Controllo e maturità operativa (operationalMaturity) — 2
- **motivation**: Hardware sperimentale e software in evoluzione: il pricing, la disponibilità, il supporto e la stabilità del prodotto nel tempo non sono documentati nel record; la natura open-source mitiga parte del lock-in ma non garantisce continuità del device.
- **evidence**: Record directory: tags 'open-source', 'wearable' (combinazione hardware + software); assenza nel record di pricing, SLA, ciclo di rilascio o roadmap formale.
- **source**: lib/data/tooolvibes-directory.ts (record `omi`: tags, assenza di campi su pricing/SLA); https://www.omi.me/
- **limit**: Maturità del prodotto fisico, policy di retention dei dati audio e continuità del progetto da riverificare con documentazione vendor aggiornata.
- **confidence**: bassa

### Velocità di validazione (experimentationSpeed) — 3
- **motivation**: Per chi ha già il device, il loop 'parlo → trascrizione → azione' è immediato; ma l'idea → test reale richiede l'acquisto/setup del wearable, che è un collo di bottiglia.
- **evidence**: Record directory: useCases orientati a flussi rapidi (trascrivere, generare azioni); categoria wearable AI che implica barriera d'ingresso hardware.
- **source**: lib/data/tooolvibes-directory.ts (record `omi`: useCases, categoryLabel)
- **limit**: Tempo al primo use case utile dipende dalla disponibilità del device, non misurato in questa fase.
- **confidence**: media

## Risultato

- weighted = 2×0.25 + 2×0.20 + 3×0.15 + 3×0.15 + 2×0.15 + 3×0.10 = 0.50 + 0.40 + 0.45 + 0.45 + 0.30 + 0.30 = **2.40**
- score10 = round(2.40 × 2, 1) = **4.8**
- overallConfidence: **bassa**

## Limiti complessivi

- Assessment basato su record directory + materiale vendor: nessun test hands-on.
- Maturità hardware, pricing, retention dei dati audio e stabilità del progetto open-source nel tempo da riverificare prima della pubblicazione.
