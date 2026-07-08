# REPORT FIGMA — Open Questions

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## Domanda 1: Quale è il colore accent esatto?
**Area:** Token — Color  
**Perché serve risposta:** Il framework menziona `color/accent/primary` ma non specifica hue/valore esatto. Senza questo, il token non può essere creato con un valore concreto.  
**Impatto se non viene chiarita:** Il designer dovrà scegliere arbitrariamente; rischio di mismatch con il codice esistente se l'accento è già definito in Tailwind.  
**Possibile decisione provvisoria:** Usare il colore accent attualmente in codice (se individuabile) oppure un violet-600 di default, con nota di verifica.

---

## Domanda 2: Dark mode è richiesto? Se sì, quale è il default?
**Area:** Token — Color / Theme  
**Perché serve risposta:** Il framework menziona dark+light theme coverage ma non conferma se dark mode è attivo o pianificato. La struttura dei token cambia se servono Figma Modes.  
**Impatto se non viene chiarita:** Se si costruiscono token senza mode e poi il dark mode viene richiesto, serve rework totale delle variabili Figma.  
**Possibile decisione provvisoria:** Preparare la struttura per Figma Modes ma popolare solo light mode; documentare che dark è future-proofed.

---

## Domanda 3: Quale font display? GT Sectra o Fraunces?
**Area:** Token — Typography  
**Perché serve risposta:** Il framework elenca entrambi come default possibili (`GT Sectra / Fraunces`). Il file Figma deve usare un font specifico.  
**Impatto se non viene chiarita:** Font diverso tra Figma e codice = drift tipografico immediato.  
**Possibile decisione provvisoria:** Scegliere Inter per tutto l'UI e posticipare la scelta display; oppure usare Fraunces (open source, più facile da usare in Figma). Segnalare `HANDOFF → visual_design_director`.

---

## Domanda 4: Esiste già un Tailwind theme con nomi non semantici?
**Area:** Token — Naming / Code linkage  
**Perché serve risposta:** §5-bis richiede nomi semantici, ma se il codice usa `violet-500`, `gray-200`, `spacing-4`, serve uno shim di traduzione.  
**Impatto se non viene chiarita:** Se si forzano nomi semantici in Figma ma il codice usa nomi visuali, il handoff fallisce e il frontend dev deve tradurre manualmente.  
**Possibile decisione provvisoria:** Creare la mappa Figma semantic → Tailwind visual esistente; backlog P1 per migration unificata.

---

## Domanda 5: Il codice usa già un componente BottomSheet o Modal riutilizzabile?
**Area:** Primitive — Modal / BottomSheet  
**Perché serve risposta:** Se il codice usa librerie come Radix Dialog, Vaul, Headless UI, le primitive Figma devono mappare a quei componenti.  
**Impatto se non viene chiarita:** Figma-SoT che non mappa a un componente codice = orfano; il dev implementerà qualcosa di diverso.  
**Possibile decisione provvisoria:** Specificare nel handoff artifact il componente codice target; se non esiste, segnalare che va creato.

---

## Domanda 6: Quali sono le 5–7 pagine "hero" effettivamente più visitate?
**Area:** Hero pages scope  
**Perché serve risposta:** Il framework propone 7 pagine, ma i dati analytics reali potrebbero mostrare che Service o Editorial hanno traffico trascurabile.  
**Impatto se non viene chiarita:** Si potrebbe over-investire in Figma-SoT per pagine poco visitate, o sottovalutare pagine importanti non elencate.  
**Possibile decisione provvisoria:** Mantenere le 7 pagine del framework (sono ragionevoli), ma ordinare per traffico reale se disponibile.

---

## Domanda 7: Esistono già componenti Card multiple in codice?
**Area:** Compositi — Tool Card  
**Perché serve risposta:** Se esistono 3 implementazioni di card diverse nel codice, la Figma-SoT deve unificarle o documentare le differenze.  
**Impatto se non viene chiarita:** Figma-SoT che rappresenta solo una delle implementazioni = drift con le altre.  
**Possibile decisione provvisoria:** Audit rapido del codice per contare le implementazioni card; scegliere la più usata come base Figma.

---

## Domanda 8: Il Radar è una visualizzazione custom o usa una libreria?
**Area:** Both Figma + Code — Radar  
**Perché serve risposta:** Se il Radar usa D3.js, Chart.js, o è custom canvas, la rappresentazione Figma deve essere puramente illustrativa.  
**Impatto se non viene chiarita:** Se il designer crea un componente Radar interattivo in Figma, spreca tempo; se lo tralascia, manca la struttura visiva.  
**Possibile decisione provvisoria:** Trattare Radar come Figma-Reference illustrativo; struttura visiva in Figma, logica/timing in Code-Only.

---

## Domanda 9: Chi è il second human reviewer?
**Area:** Acceptance criteria  
**Perché serve risposta:** §10 richiede un secondo reviewer che firmi ogni Figma-SoT. Senza una persona designata, il criterio di accettazione è bloccato.  
**Impatto se non viene chiarita:** Handoff ritardato; nessuno può approvare le primitive per il passaggio a frontend.  
**Possibile decisione provvisoria:** Designare un frontend lead o un altro designer come reviewer; se non disponibile, usare peer-review asincrona.

---

## Domanda 10: Qual è la frequenza di release attuale?
**Area:** Drift detection / Reconciliation  
**Perché serve risposta:** Il framework raccomanda reconciliation settimanale, ma se il team rilascia ogni 2 settimane o ogni mese, la cadenza va allineata.  
**Impatto se non viene chiarita:** Reconciliation troppo frequente = overhead; troppo rara = drift silenzioso.  
**Possibile decisione provvisoria:** Iniziare con cadenza milestone (per-release); valutare settimanale se il team passa a continuous deployment.

---

## Riepilogo open questions

| # | Domanda | Area | Impatto | Decisione provvisoria |
|---|---------|------|---------|----------------------|
| 1 | Colore accent esatto | Color | Alto | Usare colore codice esistente o default |
| 2 | Dark mode default? | Theme | Alto | Preparare structure, popolare light only |
| 3 | Font display? | Typography | Medio | Fraunces o posticipare scelta |
| 4 | Tailwind theme esistente? | Naming | Alto | Creare shim di traduzione |
| 5 | Libreria Modal/BottomSheet? | Primitive | Medio | Specificare target in handoff |
| 6 | Hero pages per traffico? | Scope | Medio | Mantenere 7, ordinare per dati |
| 7 | Card multiple in codice? | Compositi | Medio | Audit e unificare |
| 8 | Radar custom o libreria? | Visualizzazione | Basso | Trattare come Reference |
| 9 | Second reviewer? | Processo | Alto | Designare persona |
| 10 | Frequenza release? | Processo | Medio | Per-release, valutare weekly |

---

**RICHIESTA NON APPLICATA — documentata solo per handoff Figma. Nessuna modifica codice eseguita.**

---

*Fine del report open questions.*
