# Builder-First Assessment Methodology v1 (staging)

- Versione metodologia: `builder-first-v1`
- Stato: **staging — nessun assessment è pubblico**. Il registry canonico del runtime (`lib/data/editorial-assessments/`) resta vuoto finché l'owner non approva (ADR 0005).
- Data: 2026-08-04

## Scopo

Produrre, per ciascuno dei 30 tool canonici del directory, un assessment decisionale builder-first pronto per l'approvazione dell'owner. Gli assessment misurano **quanto un tool aiuta chi costruisce prodotti e business digitali a fare il suo lavoro**, non quanto è "bello" o "noto".

## Le sei dimensioni e i pesi

| Dimensione | Chiave | Peso | Cosa misura |
|---|---|---|---|
| Fit nel workflow | `workflowFit` | 25% | Quanto il tool entra in un flusso di lavoro reale di chi costruisce (produzione, validazione, operazioni) senza forzare processi alieni. |
| Velocità di adozione | `easeOfUse` | 20% | Quanto è rapido arrivare al primo risultato utile: onboarding, curva di apprendimento, attrito iniziale. |
| Ampiezza d'uso | `versatility` | 15% | Quanti casi d'uso distinti copre bene dentro il suo ruolo. |
| Qualità esperienza/output | `experienceQuality` | 15% | Qualità percepita dell'interfaccia e credibilità professionale dell'output. |
| Controllo e maturità operativa | `operationalMaturity` | 15% | Controllo su dati, esportazione, integrazioni, permessi, pricing prevedibile, tenuta nel tempo. |
| Velocità di validazione | `experimentationSpeed` | 10% | Quanto accelera un esperimento o una validazione (tempo idea → test reale). |

## Scala (interi 1–5)

1. **insufficiente** — non regge il caso d'uso dichiarato
2. **limitato** — funziona ma con vincoli pesanti
3. **adeguato** — fa il suo lavoro senza eccellere
4. **solido** — affidabile nel ruolo dichiarato
5. **eccellente** — tra i riferimenti del suo ruolo

## Formula

```
weighted = workflowFit * 0.25
         + easeOfUse * 0.20
         + versatility * 0.15
         + experienceQuality * 0.15
         + operationalMaturity * 0.15
         + experimentationSpeed * 0.10

score10 = round(weighted * 2, 1)   // arrotondato a 1 decimale
```

`editorial_conviction` **non** entra nel voto. Nessun valore può essere generato da: `level`, `featured`, categoria, tag, posizione nel catalogo, keyword matching, lunghezza del copy, fixture, mock, score storici sintetici.

## Regole di evidenza (per OGNI dimensione)

1. **motivation** — perché quel valore, in una frase decisionale.
2. **evidence** — su cosa si basa il giudizio (campo del record directory e/o capability documentata dal vendor).
3. **source** — file o fonte: `lib/data/tooolvibes-directory.ts` (record `<slug>`) e/o URL vendor.
4. **limit** — il limite onesto di quel giudizio (es. "nessun test hands-on", "pricing non riverificato").
5. **confidence** — `alta` | `media` | `bassa`.

Base probante ammessa: record del directory canonico (summary, description, bestFor, useCases, evidence), documentazione pubblica del vendor, conoscenza di categoria. **Nessun test hands-on è stato eseguito in questa fase**: la confidenza deve rifletterlo.

## Flusso di approvazione

1. Assessment redatto in `docs/editorial-assessments-v1/assessments/<slug>.md` + entry in `staging-registry.json` con `approvalStatus: "ready_for_owner_approval"`.
2. Revisione owner (supportata da `REVIEW_INDEX.md`, `CATEGORY_COMPARISON.md`, `HIGH_RISK_CLAIMS.md`).
3. Solo dopo approvazione esplicita: conversione nel formato canonico `ApprovedEditorialAssessment` e registrazione in `lib/data/editorial-assessments/` (fuori da questo pass).
4. Lo staging non è importato dal runtime: nessun punteggio staging può apparire nella UI.
