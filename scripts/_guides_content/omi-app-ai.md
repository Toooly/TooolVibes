### La prima cosa da capire su Omi

Indossi un dispositivo che ascolta tutto quello che sente nel raggio di 1-2 metri. Non ha un pulsante "record" da premere: è always-on. Trascrive, riassume, indicizza, e ti permette di cercare nella tua memoria conversazionale settimane dopo. È un "secondo cervello" ambient che vive appeso al collo.

Tutto il resto — funzioni, limiti, casi d'uso, rischi — discende da questa singola decisione di design. Se ti mette a disagio l'idea, Omi non è per te e nessuna feature ti convincerà del contrario. Se ti incuriosisce, vale la pena leggerlo con onestà.

### A chi serve davvero, e a chi no

Omi è per:

**Knowledge worker con molte conversazioni.** Manager, consultant, recruiter, giornalisti, avvocati, medici, accademici. Chi passa la giornata in conversazioni che contengono informazioni utili da ricordare.

**Persone con difficoltà di memoria o attenzione.** Chi dimentica commitments presi a voce, chi perde dettagli di conversazioni, chi ha ADHD o altri disturbi dell'attenzione.

**Developer e tinkerer.** Omi ha un Dev Kit 2 con API, MCP support, custom speech-to-text, e local mode. Per chi vuole costruire integrazioni custom, è una piattaforma, non solo un prodotto.

**Studenti e ricercatori.** Per prendere appunti durante lezioni, seminari, e discussioni. Le note sono strutturate automaticamente e ricercabili.

**Pazienti con patologie che compromettono la memoria.** L'uso medico di Omi è documentato per pazienti con trauma cranico, dementia early-stage, e altre condizioni dove la registrazione passiva è utile.

Non è per:

**Chiunque abbia conversazioni private con partner, amici, o familiari.** Omi registra anche quelle. La questione del consenso è reale, non teorica.

**Professioni regolate con segreto professionale.** Medici, avvocati, psicologi: le conversazioni con pazienti/clienti sono confidenziali per legge. Registrarle senza consenso esplicito può violare leggi e codici deontologici.

**Chi lavora in ambienti ad alta sicurezza.** Molti uffici governativi, militari, e di ricerca proibiscono dispositivi di registrazione. Omi è esattamente quello.

**Chi ha già un sistema che funziona.** Se sei soddisfatto del tuo Note taker (Notion AI, Reflect, Obsidian con voice), Omi non ti darà un salto di qualità sufficiente per giustificare il costo e le complicazioni.

### Cosa registra, e cosa no

Omi è un microfono ambient, sempre attivo. Registra tutto ciò che sente nel raggio di azione del microfono MEMS, che è progettato per captare voci a distanza di conversazione normale (1-2 metri).

**Registra:** conversazioni con altre persone, riunioni, lezioni, telefonate in vivavoce, conversazioni al ristorante con amici, monologhi in solitudine. Tutto ciò che il microfono capta.

**NON registra:** telefonate private (Omi non ha sensore di conduzione per le chiamate appoggiate all'orecchio), audio ad alta fedeltà per podcast o musica (la qualità è pensata per trascrizione, non per ascolto), audio sub-vocale o pensieri silenziosi.

La trascrizione avviene in tempo reale sull'app companion via Bluetooth. Il modello AI che genera i riassunti e le "memories" gira sul cloud Omi (o in locale, in local mode). Ogni "memory" è una porzione di conversazione che Omi ha identificato come significativa.

### La questione del consenso: non aggirabile

Questo è il punto più importante dell'articolo, e la ragione per cui Omi non è per tutti.

In molte giurisdizioni, registrare una conversazione senza il consenso di tutti i partecipanti è illegale. In Italia, l'articolo 617 del Codice Penale punisce le intercettazioni non autorizzate. In California (two-party consent), serve il consenso di tutte le parti. In altri paesi, le leggi variano.

Ma la legge è solo una parte del problema. C'è anche la questione del consenso sociale.

Quando un collega, un amico, o un familiare si rende conto che stai registrando la conversazione, la dinamica cambia. Le persone filtrano, diventano più formali, o rifiutano di parlare. L'uso di Omi in contesti sociali è una decisione che ha conseguenze relazionali.

**Omi ha una funzione "consenso esplicito"** che richiede di dichiarare "Omi sta registrando" prima di iniziare una conversazione registrata. È un'ottima feature. Ma in pratica, la maggior parte degli utenti lo lascia in modalità always-on, e si affida al fatto che il dispositivo è piccolo e spesso non notato.

**Il mio parere editoriale:** se usi Omi in contesti dove la registrazione è appropriata (riunioni di lavoro con colleghi che sanno che registri, lezioni con professore che acconsente, interviste con consensi firmati), è uno strumento potente. Se lo usi per registrare conversazioni private senza il consenso esplicito di tutti i partecipanti, stai violando la privacy delle persone. Non è una zona grigia.

### Privacy e data ownership: cosa fa Omi, e cosa no

Omi ha una narrativa forte su privacy. Verifichiamola onestamente.

**Cosa Omi fa bene:**

- **Encryption AES-256 at rest, TLS in transit.** Standard industriale.
- **SOC 2 e HIPAA compliance.** Significativo per uso enterprise e medical.
- **Local/cloud-free mode.** Su Omi Basic, i dati restano locali sul telefono. È la modalità più privacy-friendly.
- **Delete/export controls.** L'utente può cancellare o esportare tutti i dati in qualsiasi momento.
- **No training on user data.** Omi dichiara esplicitamente di non usare i dati utente per addestrare modelli.
- **Open source firmware.** Il firmware è open source, verificabile.

**Cosa Omi NON fa:**

- **Non è veramente "no subscription".** Omi Basic è gratis con 1.200 minuti di cloud listening/mese. Se superi, o vuoi transcription illimitata, ti serve Unlimited ($19/mese o $199/anno). Le transcrizioni in local mode sono illimitate ma locali — non puoi usarle per query semantiche che richiedono cloud.
- **Non protegge da registrazioni accidentali.** Se dimentichi di disattivare in una conversazione privata, registra.
- **Non anonimizza automaticamente le voci.** Le registrazioni contengono la voce di chi parla, identificabile.
- **Non è immune da data breach.** Omi è SOC 2, non è immune da attacchi. I dati sono cifrati at rest, ma se le chiavi sono compromesse, la protezione salta.

**Per la maggior parte degli utenti, il setup giusto è:** Omi Basic per uso personale, con consensi espliciti per ogni conversazione registrata, e review periodica delle "memories" per cancellare quelle sensibili.

### Pricing, spiegato onestamente

Omi ha un modello ibrido: hardware + subscription.

**Hardware.** Omi Dev Kit 2 a **$69.99 USD** (prezzo in promozione al momento della verifica, agosto 2026; prezzo regolare $79.99). Il prodotto è venduto direttamente dal negozio ufficiale su omi.me (store Shopify di Based Hardware Inc., San Francisco). Include il dispositivo, custodia in silicone, lanyard, caricatore USB-C magnetico. È un prezzo entry-level per un wearable AI — competitivo vs Plaud Note ($179), Limitless Pendant ($99), Friend ($129).

> **Nota di verifica:** i prezzi sul negozio omi.me cambiano spesso (Basic era $49, Dev Kit 2 era $79.99 prima della promozione). Verifica sul sito prima di ordinare.

**Omi Basic (gratis incluso con l'hardware).** 1.200 minuti di cloud listening/mese, transcription illimitata, AI summaries, memories. Le registrazioni locali non contano nei minuti cloud. Quando esaurisci i minuti cloud, le registrazioni continuano locali ma non vengono processate per AI.

**Omi Unlimited, $19/mese o $199/anno.** Unlimited cloud transcription, advanced AI summaries, custom note templates, priority support. Year-one total: $378 con annual billing, $407 con monthly billing. Annual risparmia $29.

**Il modello "BYO API key" è la killer feature per i developer.** In local mode, usi la tua API key (OpenAI, Anthropic) per le transcription e AI summaries. I costi sono i tuoi (pay-per-token al provider), ma il controllo è totale. Per chi ha già un account OpenAI e vuole sperimentare, è la strada più economica in assoluto.

### Hardware, in dettaglio

Omi Dev Kit 2 è un piccolo disco (~2.5cm), 10-14 ore di batteria continua, microfono MEMS ad alta sensibilità, connettività Bluetooth Low Energy 5.2, certificato splash-resistant (non waterproof).

**Form factor:** portato come ciondolo al collo, o clip su maglietta/borsa. La versione "necklace" è la più comune.

**Audio capture:** buono per conversazioni normali a 1-2 metri. Sotto una maglietta, la qualità degrada ma resta utilizzabile. In ambienti rumorosi (ristorante affollato, conference hall), la qualità peggiora significativamente.

**Battery:** 10-14 ore di ascolto continuo. Una giornata lavorativa standard (8 ore) lo gestisce. Ricarica USB-C magnetica, full charge in ~2 ore.

**Durabilità:** pensato per uso quotidiano, ma non per sport intensi o pioggia forte. Il sudore può danneggiare le porte del microfono.

### Use cases che funzionano, e che non funzionano

**Funziona bene:**

- **Riunioni 1:1 con colleghi che acconsentono.** Ogni conversazione di lavoro diventa ricercabile. Dopo 3 mesi, hai una knowledge base implicita di tutte le tue conversazioni.
- **Lecture e seminari universitari.** Note strutturate automatiche, ricercabili per argomento.
- **Interviste con consensi firmati.** Per giornalisti e ricercatori, Omi elimina le note manuali.
- **Brainstorming con il team.** Cattura idee che altrimenti andrebbero perse.
- **Sessioni di therapy (con consenso del terapeuta).** Per pazienti che vogliono rivedere le sessioni, o terapeuti che vogliono note migliori. Dipende dalle regole deontologiche locali.

**Funziona meno bene:**

- **Conference e convention.** Il rumore di fondo degrada la trascrizione. Le conversazioni sono brevi e frammentate. Le registrazioni diventano inutili o fuorvianti.
- **Conversazioni in lingua mista.** Il modello gestisce 25+ lingue, ma transizioni frequenti tra lingue diverse degradano la qualità.
- **Conversazioni telefoniche.** Omi non ha conduction sensor per le chiamate appoggiate. Può registrare in vivavoce, ma è scomodo.
- **Contesti dove serve silenzio.** Biblioteche, musei, cene eleganti. Anche con Omi disattivato, la consapevolezza di averlo intorno al collo cambia il comfort.

### Limitazioni strutturali, da conoscere prima di comprare

**La qualità della trascrizione non è perfetta.** Anche con microfono MEMS di qualità, errori di trascrizione sono comuni in ambienti rumorosi, con accenti marcati, o con terminologia tecnica. Omi corregge in parte con il modello AI, ma aspettati un 5-10% di errori sistematici.

**Le "memories" sono soggettive.** Omi identifica porzioni significative usando euristiche, non è perfetto. Alcune "memories" sono inutili, altre mancano conversazioni importanti. Serve review periodica per pulire e aggiungere tag.

**Il search semantico richiede cloud.** In local mode, puoi trascrivere e riassumere localmente, ma la ricerca semantica ("dove abbiamo parlato di onboarding l'ultima volta?") richiede che i vettori siano in un database, e quello è cloud. La modalità "tutto locale" è meno potente.

**Non sostituisce un sistema di note strutturato.** Se il tuo lavoro richiede note precise, tag, link interni, e relazioni tra concetti, Omi è un complemento, non un sostituto. Notion, Obsidian, e simili restano superiori per note strutturate.

**La batteria non dura una giornata di lavoro intenso.** 10-14 ore di ascolto continuo è il massimo. Se hai un giorno con 12 ore di meeting back-to-back, ricarica a pranzo.

### Omi vs Plaud vs Limitless vs Friend vs Bee

**Omi vs Plaud Note.** Plaud è un dispositivo "per riunioni" (on-demand recording, non always-on). Più privacy-friendly di default (registra solo quando attivi), ma perde il vantaggio di catturare conversazioni informali. Plaud è $179 con subscription $19.99/mese per transcription. Omi è $89 con subscription $19/mese. Omi vince su prezzo entry, Plaud vince su privacy-by-default.

**Omi vs Limitless Pendant.** Limitless è $99 con subscription $19/mese obbligatoria per le funzioni AI. Più maturo come prodotto, con community più ampia, ma forza la subscription (Omi Basic è gratis). Limitless vince su "polished UX", Omi vince su flessibilità (local mode, API, dev kit).

**Omi vs Friend.** Friend è un dispositivo più "social" (un'amica AI che commenta le tue attività) e un chat online gratis. Il pendant è $129. Posizionamento diverso: Friend è più lifestyle, Omi è più productivity. Se cerchi memoria conversazionale, Omi è superiore.

**Omi vs Bee Pioneer.** Bee è $49.99, no subscription, no premium tier (al momento). Più economico, più semplice, meno features. Bee lavora solo su iPhone, Omi funziona con iOS e Android. Bee è una buona entry-level, Omi è più serio.

### Setup pratico: da zero a un uso produttivo in una settimana

**1. Ordina l'hardware.** Da omiwearable.com, $89 + shipping. 5-10 giorni per la consegna.

**2. Pairing con l'app.** Scarica l'app Omi (iOS o Android), accoppia via Bluetooth, concedi i permessi di microfono e notifica. 5 minuti.

**3. Configura la prima sessione.** Indossa Omi, apri l'app, fai una sessione di test di 10 minuti. Verifica che trascriva correttamente. 15 minuti.

**4. Decidi il tuo protocollo di consenso.** Questo è il passo più importante. Decidi in quali contesti userai Omi, e come gestirai il consenso. Per uso professionale, mandare una mail al team "registro le riunioni con Omi per avere appunti migliori, dimmi se preferisci che disattivi" è appropriato. 30 minuti di decisione.

**5. Prima settimana di uso.** Indossa Omi durante le tue tipiche attività. Ogni sera, rivedi le "memories" generate. Identifica pattern: quali sono utili, quali sono rumore. Aggiusta le euristiche se possibile. Tempo: 10-15 minuti al giorno per la review.

**6. Setup integrazioni (opzionale).** Slack, Notion, Calendar, MCP, API custom. Tempo: 30-60 minuti.

**7. Pulizia periodica.** Ogni settimana, dedichi 30 minuti a pulire le "memories" inutili, aggiungere tag, e organizzare. Senza questa review, Omi diventa un dump inutilizzabile.

In una settimana hai un workflow funzionante. In un mese, hai una base di memoria ricercabile che diventa un asset.

### Errori comuni

**Non stabilire un protocollo di consenso.** Senza regole chiare, finisci per registrare conversazioni inappropriate. Decidi prima.

**Non fare review periodica.** Le "memories" si accumulano velocemente. Senza review, il sistema diventa inutilizzabile in poche settimane.

**Affidarsi solo a Omi per le note.** Per conversazioni critiche (decisioni, accordi, contratti), Omi è un complemento, non un sostituto. Conferma sempre per iscritto.

**Non testare in ambienti diversi.** Omi funziona benissimo nel tuo ufficio silenzioso, malissimo in un coffee shop rumoroso. Testa in tutti i tuoi ambienti tipici.

**Ignorare la durata della batteria.** Se ti dimentichi di ricaricare, Omi si spegne a metà giornata. Metti la ricarica in routine serale.

### Le domande che ci fanno più spesso

**Omi è meglio di Notion AI per prendere appunti?**
Sono diversi. Notion AI richiede che tu scriva le note. Omi cattura le conversazioni automaticamente. Se le conversazioni sono la tua fonte di informazione, Omi è superiore. Se il tuo lavoro è più lettura/scrittura, Notion AI è sufficiente.

**Posso usarlo in terapia?**
Dipende dalla regolamentazione locale e dal consenso del terapeuta. In molte giurisdizioni, registrare le sessioni di terapia richiede consenso esplicito e sicurezza HIPAA. Omi è HIPAA-compliant, ma il consenso è un passo separato.

**Funziona in italiano?**
Sì, supporta 25+ lingue tra cui l'italiano. La qualità è migliore in inglese (training set più ampio), ma l'italiano funziona ragionevolmente bene.

**Quanto costa davvero in un anno?**
$69.99 hardware (prezzo promo verificato agosto 2026; regolare $79.99) + $199 (annual Unlimited) = ~$269 anno uno. Se ti basta Basic, $69.99 anno uno. Se usi BYO API key, $69.99 hardware + costo API (variabile, $10-50/mese per uso moderato).

> **Caveat importante:** i dettagli di Omi Basic (soglia 1.200 min/mese di cloud) e Unlimited ($19/mese, $199/anno) non sono pubblicati direttamente sul negozio omi.me — emergono nell'app companion o in comunicazioni del vendor. I numeri sopra sono basati sul pricing storico documentato. Verifica direttamente nell'app prima di firmare un budget.

**È meglio di un Note taker come Plaud?**
Per uso always-on con cattura continua, sì. Per uso on-demand (solo quando premi record), Plaud è superiore. La scelta dipende dal tuo workflow.

**Posso esportare i dati?**
Sì, Omi supporta export in formati standard (testo, JSON). In local mode, hai accesso completo al file system.

### Alternative da considerare

- **Plaud Note / NotePin.** On-demand recording, no always-on. Più privacy-friendly.
- **Limitless Pendant.** Più maturo, subscription obbligatoria, UX più rifinita.
- **Friend.** Più lifestyle/social, meno productivity.
- **Bee Pioneer.** Budget, iOS only, no subscription.
- **Reflect / Notion AI / Obsidian + voice.** App di note con AI, no hardware, registri tu quando serve.
- **Meeting recording tools (Otter, Fireflies, Read AI).** Per sole riunioni, non always-on. Ottima qualità transcription, integrazione con calendar.

### Cosa ci aspettiamo da Omi nei prossimi mesi

**Più integrazioni native.** Slack, Notion, Calendar già supportati. La roadmap è verso più tool (CRM, task manager, project management).

**Modelli AI migliori per transcription in italiano.** La qualità in lingue non-inglese è ancora inferiore. Miglioramenti attesi.

**Miglioramenti del search semantico.** Attualmente è buono, non eccellente. Con l'evoluzione dei modelli di embedding, può migliorare.

**Compliance enterprise.** Già HIPAA e SOC 2. GDPR explicitness e data residency EU sarebbero i prossimi passi per il mercato europeo.

**Integrazione voice agents.** Omi come interfaccia per agenti AI (parli a Omi, parla con un agente, l'agente esegue task). È il futuro prossimo.

### In sintesi

Omi è uno strumento potente per un target specifico: knowledge worker con molte conversazioni che vogliono memoria continua, e che sono disposti a gestire la complessità del consenso sociale. Non è per tutti, e non è per chiunque abbia conversazioni private. Il prezzo è entry-level per la categoria, la qualità è buona ma non perfetta, e il valore dipende tutto da quanto sei disciplinato nel review periodica.

Per il target giusto, è un moltiplicatore di produttività. Per il target sbagliato, è un incubo di privacy. Decidi consapevolmente.

### Prossimi passi

- **Apri la scheda tool di Omi** per confrontare con Plaud, Limitless, e altri wearable AI.
- **Esplora la raccolta su produttività e AI hardware** per casi d'uso affini.
- **Salva Omi nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
