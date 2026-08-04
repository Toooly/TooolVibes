# TooolVibes — Builder-First Copy System (canonico)

- Stato: canonico, unico riferimento per il copy pubblico
- Data: 2026-08-04
- Ambito: testi user-facing delle route pubbliche, chrome (header/footer/command bar), stati (loading/empty/error/404), metadata. NON ambito: superfici admin (interne), documenti tecnici, ADR.

## 1. Target

TooolVibes parla a **chi costruisce prodotti e business digitali**:

- founder e indie developer che scelgono uno stack per validare e lanciare;
- team SaaS che devono ridurre alternative e trade-off prima di impegnare risorse;
- professionisti digitali (product, marketing, operations) che mantengono stack e workflow.

Non parla a "lettori" di un magazine né a un pubblico da intrattenere: parla a persone che devono **prendere una decisione sui tool** e ricordarsi perché l'hanno presa.

## 2. Posizionamento

TooolVibes è un **sistema decisionale per chi costruisce**:

- non un catalogo editoriale, ma un workspace per scegliere il proprio stack;
- non una redazione di recensioni, ma uno strumento per confrontare alternative e trade-off;
- non curatela da leggere, ma memoria delle decisioni da riusare;
- un radar sui nuovi lanci, per decidere cosa approfondire e cosa ignorare.

## 3. Promessa

**Da troppi tool a uno stack scelto con criterio.**

Riduci il rumore, confronta ciò che conta, conserva il motivo di ogni scelta. Nessuna classifica assoluta, nessun "migliore tool": il fit giusto per il tuo obiettivo, con evidenze e limiti dichiarati.

## 4. Messaging pillars

1. **Riduzione del rumore** — pochi candidati pertinenti battono molte schede uguali (Catalogo).
2. **Trade-off espliciti** — il confronto mostra differenze, limiti e contesto d'uso, non vincitori assoluti (Confronto, Arena).
3. **Memoria delle decisioni** — salvati, note e motivi restano nel workspace e si riaprono quando serve (Salvati, Account).
4. **Segnali dal mercato** — lanci reali organizzati per periodo, da approfondire con criterio (Radar).
5. **Stack organizzati** — percorsi per scenario, workflow e progetto, non liste da costruire (Collections).
6. **Governance visibile** — metodo, verifica, indipendenza dalle partnership e disclosure restano espliciti (Metodo, footer, label di valutazione).

## 5. Vocabolario canonico

| Concetto | Termine canonico | Note |
|---|---|---|
| Insieme di tool scelti dall'utente | **stack** | "il tuo stack", "scegli lo stack" |
| Tool in valutazione | **candidato** | si aggiunge al confronto, si salva |
| Risultato del confronto | **esito** / **fit** | mai "vincitore"; "emerge dal confronto" solo con hedge contestuale |
| Punteggio verificato | **valutazione editoriale** | termine di governance: metodologia, responsabilità, indipendenza |
| Area personale | **workspace** / **spazio decisionale** | account = workspace delle decisioni |
| Salvati | **shortlist operativa** | non "biblioteca" |
| Collections | **percorso** / **raccolta** | organizzano stack, workflow, scenari |
| Nuovi lanci | **segnali** | Radar = segnali da approfondire |
| Tempo richiesto da una scheda tool | **tempo di analisi** | schede tool = analisi |
| Tempo richiesto da un articolo | **tempo di lettura** | guide/articoli = lettura (letterale, ammesso) |
| Evidenza a supporto | **evidenza** | sempre con fonte dichiarata |
| Compromesso | **trade-off** / **limite** | preferire "trade-off" nelle sintesi |

**Deduplicazione delle label pubbliche.** Se più segnali (es. `level` "In evidenza", `toolOfWeek`, `featured`) producono la stessa label normalizzata, la superficie pubblica renderizza **una sola occorrenza**, preservando l'ordine della prima. Le label differenti non vengono mai unite. La deduplicazione avviene al livello di derivazione/presentazione, mai sui dati canonici.

## 6. Termini da evitare (user-facing)

| Termine | Sostituto | Eccezione |
|---|---|---|
| curatela / curato / curatore | percorso, guidato, verificato | — |
| scrivania | workspace | — |
| territorio | area, categoria | — |
| redazione (come soggetto che sceglie) | "TooolVibes", forma impersonale | contributi/correzioni: responsabilità editoriale |
| selezione della redazione | in evidenza | — |
| catalogo editoriale | catalogo | — |
| verdetto | esito, sintesi della valutazione | — |
| vincitore / migliore tool (assoluti) | fit per l'obiettivo | vietati senza supporto |
| lettura (metaforica, su tool) | analisi | articoli/guide: letterale, ammessa |
| magazine | — | vietato come framing |
| editoriale (come valore di marketing) | — | ammesso solo per governance (§7) |

## 7. Dove "editoriale" resta

"Editoriale" resta solo dove comunica **governance, metodologia, responsabilità, trasparenza, indipendenza dalle partnership**:

- label del punteggio verificato: "Valutazione editoriale" / "Valutazione editoriale in preparazione";
- disclosure affiliate/footer ("Le partnership commerciali non determinano le valutazioni editoriali");
- pagina Metodo e documenti di metodologia;
- superfici admin (interne, non pubbliche): terminologia libera.

Ovunque il termine funzioni da **etichetta di marketing** (eyebrow, badge, titolo di sezione) viene sostituito.

## 8. Terminologia assessment

- Sei dimensioni builder-first: **Fit nel workflow** (workflowFit, 25%), **Velocità di adozione** (easeOfUse, 20%), **Ampiezza d'uso** (versatility, 15%), **Qualità esperienza/output** (experienceQuality, 15%), **Controllo e maturità operativa** (operationalMaturity, 15%), **Velocità di validazione** (experimentationSpeed, 10%).
- Scala 1–5: 1 insufficiente, 2 limitato, 3 adeguato, 4 solido, 5 eccellente.
- `weighted = workflowFit*0.25 + easeOfUse*0.20 + versatility*0.15 + experienceQuality*0.15 + operationalMaturity*0.15 + experimentationSpeed*0.10`; `score10 = round(weighted*2, 1)`.
- Nessuna "editorial conviction" nel voto; nessun valore derivato da level/featured/categoria/tag/copy.
- Stati: staging `ready_for_owner_approval` → pubblicazione solo dopo approvazione owner nel registry canonico (ADR 0005).

## 9. Principi CTA

- Verbi d'azione decisionali: Esplora, Confronta, Salva, Apri, Analizza, Riprendi.
- La CTA dice cosa ottieni: "Apri la scheda", "Apri il confronto", "Vai ai salvati".
- Niente CTA da marketing SaaS ("Scopri di più", "Prova gratis" come label di sistema).
- Singolare/plurale coerenti col conteggio reale; stati vuoti con una sola CTA primaria.

## 10. Loading, empty ed error states

- **Loading**: dichiara cosa sta succedendo ("Stiamo preparando…"), niente promesse.
- **Empty**: spiega cosa ci guadagna l'utente e dai un primo passo concreto.
- **Error**: ammetti il problema, offri "Riprova" + via d'uscita; mai incolpare l'utente.
- **404**: dichiara la non disponibilità e riporta a home/catalogo.
- Nessun dato simulato viene mai presentato come reale (contratto Radar e score).

## 11. Applicazione route per route

| Route | Ruolo nel sistema | Framing builder-first |
|---|---|---|
| Home `/` | spiega prodotto e target | sistema decisionale per chi costruisce; CTA verso catalogo/confronto/radar |
| Catalogo `/archivio` | trovare candidati e ruoli nello stack | "Riduci le alternative. Trova i tool da valutare." |
| Radar `/radar` | individuare nuovi lanci | "Segui i lanci. Individua i segnali da approfondire." |
| Confronto `/compare` | leggere differenze e trade-off | matrice + esito comparativo, nessun vincitore assoluto |
| Arena (in `/compare`) | fit per obiettivo selezionato | "Più adatto in questo confronto", obiettivo dichiarato |
| Salvati `/shortlist` | shortlist operativa | candidati, motivi, decisioni registrate |
| Collections `/collections` | organizzare stack e scenari | percorsi già organizzati, non filtri da costruire |
| Account `/account` | workspace personale delle decisioni | continuità di salvati, confronti e note |
| Tool detail `/toools/[slug]` | framing per la decisione | quadro decisionale, scheda tecnica, alternative |
| Metodo `/metodo` | governance | percorso scopri→confronta→salva + criteri |
| Posts `/posts` | approfondimenti operativi | guide e analisi collegate ai tool |
| Header/footer/command bar | chrome | label funzionali, tagline builder-first, disclosure preservata |

## 12. Documenti precedenti: destino

| Documento | Destino |
|---|---|
| Questo file | **Canonico** — unica fonte per il copy pubblico |
| `docs/adr/0005-editorial-assessment-pipeline.md` | **Mantenuto** — governance del resolver punteggi |
| `docs/editorial-assessments-v1/METHODOLOGY.md` | **Mantenuto** — metodologia builder-first v1 (staging) |
| `docs/FINAL_PRODUCT_PRESENTATION_CLOSURE.md` e altri closure docs | **Mantenuti come storico** — non fonti di copy |
| Inventario copy pre-esistente (pass DeepSeek/MiniMax) | **Integrato** in questo sistema |
| Nessuna fonte di copy concorrente | Eventuali note copy fuori da questo file sono **superseded** da questo documento |
