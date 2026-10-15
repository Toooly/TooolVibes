# Compare V2 — implementazione e verifica

15 ottobre 2026. Solo area Compare. Nessun deploy, push o intervento infrastrutturale.

## Prima → dopo

| Prima | Compare V2 |
| --- | --- |
| Arena, classifica, verdetto e dettagli simili nelle due viste | Mobile a coppie; desktop con summary e matrice |
| Scelta da una sequenza di schermate e punteggi | Differenze editoriali, prezzi, punti di forza e trade-off subito leggibili |
| Modifica della selezione legata al catalogo | Ricerca, aggiunta, sostituzione e rimozione dentro Compare |
| Filtri concentrati sui punteggi | Filtro che elimina effettivamente i criteri equivalenti |
| Renderer importati staticamente | Import dinamico del solo renderer attivo; gestore e DecisionSheet a richiesta |

## Architettura e contratti

- `tool-battle-view.tsx`: controller unico per store canonico, obiettivo, filtro, coppia e gestione tool.
- `comparison-view-model.ts`: criteri e valori normalizzati, differenze ricalcolate sulla coppia, priorità per obiettivo. Non modifica rating o dati editoriali e non deduce funzionalità mancanti.
- `compare-v2/mobile-comparison.tsx`: due candidati, selettori di coppia, tre differenze, dettagli progressivi, scelta esplicita.
- `compare-v2/desktop-comparison.tsx`: summary affiancati, quattro differenze, gruppi navigabili, intestazione sticky e matrice.
- `compare-v2/comparison-manager.tsx`: dialog nativo, bottom sheet su mobile, ricerca e gestione anche al limite massimo; Escape, tap esterno e ripristino del focus.
- `compare-v2/comparison-parts.tsx`: celle, disclosure e scelta condivise. I dettagli chiusi non vengono montati; i riepiloghi lunghi sono abbreviati, con testo completo nelle sezioni di dettaglio.
- `compare-v2/decision-target.ts`: helper canonico estratto senza cambiarne il comportamento; permette di caricare il foglio decisionale solo all'apertura.
- `compare-v2/compare-copy.tsx`: copy IT/EN locale alla Compare; riusa le traduzioni editoriali esistenti.
- `styles/compare.css`: proprietario degli stili Compare, con classi `cv-*`, accenti cyan, focus visibile, target touch, safe area, viewport dinamico e rispetto di reduced motion.

Restano invariati: MIN 2/MAX 5, persistenza e ownership guest/account, Save, URL obiettivo, obiettivo persistito, API e routing. La lettura consigliata è 2–4 tool; una selezione legacy di cinque resta utilizzabile. La coppia e il filtro sopravvivono al cambio viewport. La sostituzione usa le operazioni canoniche dello store, senza cancellare o ricostruire il workspace. DecisionSheet conserva alternative, obiettivo, registrazione e analytics canonici.

Il dock rimane nascosto su `/compare`, come già previsto dal suo contratto. Nessun cambiamento a Catalog, Save, Radar, navigazione o prezzi.

## Test automatici

223 test superati in 21 suite pertinenti: nuovo modello e interazioni, obiettivi, decisioni, score e adapter canonici, contratto store, auth intent replay, compare hash, flag e dock. Inclusi controlli axe sui frammenti, senza verifica automatica del contrasto in jsdom.

Lint dei file modificati: superato, zero warning. Controllo ownership CSS: superato. Diff whitespace: pulito.

Typecheck globale: **non superato**, stessi 44 errori esterni rilevati prima del refactor; nessun errore nei file Compare modificati. Principalmente conflitti di tipi `Response.json()`/tipi Workers e test/account esistenti.

Build: compilazione ottimizzata riuscita, poi **interrotta nel controllo tipi** su `components/account/panel/use-account-submissions.ts:74` (`unknown` incompatibile con `AccountSubmissionsPayload`). Nessun bypass delle verifiche e nessuna modifica fuori scope per nascondere il problema. Il ramo non è dichiarato pronto al rilascio globale finché questo blocco rimane.

## Browser QA

33 combinazioni Chromium: 2, 3 e 4 tool per ciascuna larghezza 1728, 1440, 1280, 1024, 768, 430, 414, 390, 375, 360 e 320 px. Un solo renderer, nessun overflow orizzontale, sezioni chiuse non montate su mobile e filtro dei criteri verificati.

Prove aggiuntive:

- WebKit touch 390 IT / 320 EN; Chromium desktop 1440 IT.
- Smoke finale touch Chromium 390 EN / WebKit 320 IT, con controllo degli errori di idratazione.
- Cambio coppia e resize; sostituzione al limite di cinque; selezione indipendente da Save.
- Gestore: ricerca, chiusura con Escape/tap esterno, focus restituito al trigger.
- DecisionSheet canonico aperto dalla scelta esplicita, su entrambi i motori. Persistenza della decisione e delle alternative verificata nei test componenti.
- Testi/nome tool molto lunghi e pricing non booleano senza overflow.
- Sticky desktop: intestazione rilevata a 84 px con header globale a 85 px, adiacente al suo bordo inferiore.
- Dati mancanti, coppie obsolete/duplicate, selezioni vuote/incomplete e prezzi non pubblicati coperti dai test automatici.

Sono emulazioni browser, non una prova su iPhone fisico. Nessuna sessione account reale autenticata è stata usata; la verifica account resta nei test di contratto e nel riuso del flusso canonico.

## Performance e limiti della misura

Stesso ambiente Next dev, quattro tool, viewport 390/1440×900, attesa 500 ms dopo il renderer.

| Misura | Prima | Dopo |
| --- | ---: | ---: |
| Discendenti DOM Compare, mobile | 307 | 135 (−56%) |
| Discendenti DOM Compare, desktop | 338 | 392 (+16%, summary e overview già visibili) |
| Trasferimento `page.js`, dev mobile | 2.459 MB | 1.374 MB |
| Chunk mobile aggiuntivo, dev | incluso nella pagina | circa 16.5 KB |
| Backdrop blur dentro Compare | 0 | 0 |

La richiesta iniziale non carica il chunk del renderer opposto né il gestore/foglio decisionale. La sola immagine di ciascun tool ha dimensioni riservate e fallback; nessuna animazione continua o libreria nuova. Le sezioni si aprono con una breve transizione di opacità/traslazione, disattivata con reduced motion.

Sono ancora presenti long task iniziali in ambiente dev: nell'ultima misura mobile 95/142/57 ms; desktop 108 ms. Non si dichiara una loro riduzione: manca una misura iniziale equivalente. Hydration senza errori negli smoke; tempi di idratazione e bundle ottimizzato di produzione non certificati, essendo la build globale bloccata.

## Debito residuo

1. Risolvere separatamente il blocco TypeScript globale prima del rilascio.
2. I componenti Arena precedenti rimangono nel repository per compatibilità dei vecchi import/test; non sono nel percorso attivo di `/compare`. Una loro rimozione può essere un lavoro dedicato.
3. Il modello usa dati editoriali esistenti, non uno schema strutturato di feature: le righe di integrazione/API/privacy riportano affermazioni documentate e distinguono i dati mancanti. Una futura matrice strutturata richiede un lavoro editoriale separato.
4. Completare eventuale validazione fisica e account reale prima di affermare copertura di quei contesti.

Le modifiche preesistenti a prezzi, catalogo, traduzioni, pulsanti e servizi restano fuori da questo commit.
