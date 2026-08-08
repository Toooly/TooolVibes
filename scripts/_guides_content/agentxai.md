### Cosa fa AgentX, in una frase

AgentX è una piattaforma no-code per costruire agenti AI specializzati: definisci l'obiettivo dell'agente, i tool che può usare, e la knowledge base da cui attingere, e l'agente lavora su task reali (qualificazione lead, supporto, automazioni interne) senza che tu scriva una riga di codice.

### A chi serve davvero

AgentX non è per chi vuole un chatbot "FAQ". È per chi vuole agenti che lavorano su processi reali:

- **Sales e marketing team** che vogliono automatizzare la qualificazione dei lead.
- **Customer success** che vogliono un primo livello di supporto automatizzato.
- **Operazioni** che vogliono agenti che gestiscono task interni (es. smistamento email, drafting documenti).
- **Founder e PM** che vogliono prototipare workflow AI senza overhead engineering.
- **Team AI di aziende** che vogliono deployare agenti rapidamente senza (o con poca) engineering.

Non è il tool giusto per chi cerca un chatbot conversazionale semplice (per quello, Tidio, Crisp, o Intercom sono più adatti), né per chi ha bisogno di un modello LLM custom con training su dati proprietari (per quello, servono approcci custom).

### Come funziona, passo per passo

Il flusso operativo ha sei fasi.

**1. Definizione dello scope dell'agente.** L'utente definisce:
- Cosa deve fare l'agente (es. "qualificare lead inbound").
- Con quali dati può lavorare (CRM, knowledge base, web).
- Quali azioni può compiere (es. "aggiornare il CRM", "inviare email").
- Quali limiti ha (es. "non può mandare email a clienti esistenti senza conferma umana").

**2. Configurazione dei tool.** L'utente configura i tool che l'agente può usare:
- Ricerca web (Google Search, Bing, Brave Search).
- CRM (HubSpot, Salesforce, Pipedrive).
- Email (Gmail, Outlook).
- Calendar (Google Calendar, Outlook).
- HTTP requests generici per API custom.
- Tool di calcolo e trasformazione dati.

**3. Knowledge base.** L'utente carica documenti (PDF, pagine web, knowledge base interne) che l'agente può consultare per rispondere a domande specifiche. La knowledge base è indicizzata in un vector store e il retriever pesca i chunk rilevanti.

**4. Prompt e personalità.** L'utente definisce il system prompt, il tono, le regole di escalation a umani, e gli esempi di comportamento atteso.

**5. Test e iterazione.** L'utente testa l'agente in un playground, lo sottopone a scenari tipici, e itera sul prompt e sui tool fino a ottenere il comportamento desiderato.

**6. Deploy.** L'agente è deployato in produzione, con monitoraggio delle conversazioni, KPI, e capacity di intervento umano.

:::tip Cosa distingue AgentX da un "chatbot builder"

- **Gli agenti ragionano e agiscono**, non solo rispondono. Possono fare ricerche, chiamare API, aggiornare dati.
- **L'orchestrazione multi-tool è nativa.** Un agente può usare 5-10 tool in sequenza per completare un task.
- **L'escalation a umani è integrata.** L'agente sa quando fermarsi e chiedere conferma.

Queste differenze sono ciò che rende AgentX utile per task reali, non solo per FAQ.

:::

### Le metriche chiave di un agente

Una volta in produzione, AgentX traccia:

- **Tasso di completamento** (task risolti senza escalation).
- **Tempo medio di risoluzione**.
- **Tasso di escalation a umani**.
- **Qualità delle risposte** (via feedback utente o via eval automatiche).
- **Costo per conversazione** (basato su token LLM consumati).
- **KPI specifici del task** (es. per lead qualification: "lead qualificati", "conversion rate").

L'utente può esportare i dati per analisi o creare dashboard custom.

### Casi d'uso concreti

:::pro Quando AgentX fa la differenza

- **Qualificazione lead inbound.** L'agente legge le richieste, le analizza contro il CRM, e assegna uno score di qualificazione. I lead qualificati vanno al sales rep, gli altri vanno a nurture.
- **Customer support di primo livello.** L'agente risponde alle FAQ, risolve i casi semplici, e scala a umani per i casi complessi.
- **Onboarding clienti.** L'agente invia email di benvenuto, raccoglie informazioni, schedula kickoff call.
- **Ricerca e sintesi.** L'agente fa ricerche su temi specifici e produce report.
- **Drafting documenti.** L'agente prepara bozze di email, proposte, report, a partire da template e dati.
- **Operazioni interne.** Smistamento email, estrazione dati da PDF, aggiornamento CRM, generazione report.

:::

:::warning Quando AgentX non è la scelta giusta

- **Vuoi un chatbot FAQ semplice.** Per quello, Tidio, Crisp, o Intercom bastano.
- **Hai bisogno di un LLM custom con training su dati proprietari.** Servono approcci custom (fine-tuning, RAG avanzato).
- **Hai requisiti di compliance stringenti** (HIPAA, GDPR ristretto, ecc.). Verifica le policy di AgentX prima di usarlo per dati sensibili.
- **Il task è troppo semplice.** Se è una singola domanda-risposta, l'agent framework è overkill.

:::

### AgentX vs i concorrenti diretti

**AgentX vs LangChain / Flowise.** LangChain e Flowise sono framework "general purpose" per costruire applicazioni AI. Richiedono competenze tecniche (Python/JS per LangChain, base tecnica per Flowise). AgentX è più "business user friendly", con UI che astrae la complessità dell'orchestrazione. Per developer che vogliono massimo controllo, LangChain. Per business user che vogliono velocità, AgentX.

**AgentX vs Voiceflow.** Voiceflow è focalizzato su chatbot conversazionali (con un focus su voice / IVR). AgentX è più orientato ad agenti che eseguono task. Per chatbot conversazionali, Voiceflow. Per agenti task-oriented, AgentX.

**AgentX vs Botpress.** Botpress è un competitor diretto, con canvas simile. La differenza è di posizionamento: Botpress è più "chatbot-first", AgentX è più "agent-first". Per chatbot complessi, Botpress. Per agenti task-oriented, AgentX.

**AgentX vs Lindy.ai.** Lindy è un competitor recente, con un approccio simile (agenti no-code per task reali). La differenza è di prezzo, di template, e di integrazioni. Confronta per il tuo caso d'uso specifico.

**AgentX vs Relevance AI.** Relevance AI è un altro competitor, con un focus su "AI workforce" (agenti che lavorano su task di team). Posizionamento simile, target simile. La scelta dipende spesso da test specifici sul tuo caso d'uso.

### Pricing di AgentX

AgentX ha un modello freemium con limiti sulle esecuzioni, e tier a pagamento basati su volumi e funzionalità:

- **Free tier**: limitato a poche centinaia di esecuzioni al mese, utile per test.
- **Pro**: più esecuzioni, più tool, supporto base.
- **Business**: esecuzioni illimitate (o volumi alti), collaboration, supporto prioritario, SLA.

I prezzi pubblicati variano. Indicativamente, il tier Pro parte da 30-50 €/mese, e il tier Business da 200-500 €/mese per uso moderato. Per volumi enterprise, custom pricing.

### Flusso pratico: un caso reale

Sofia è head of marketing in una scaleup B2B. Vuole automatizzare la qualificazione dei lead inbound che arrivano via form sul sito e via email.

**Settimana 1:** setup. Sofia definisce l'agente "Lead Qualifier" con scope, tool (CRM HubSpot, Google Search, email), e knowledge base (casi studio, descrizione prodotti, ICP).

**Settimana 2:** addestramento. Sofia testa l'agente su 50 lead storici, ne verifica le risposte, e itera sul prompt.

**Settimana 3:** deploy. L'agente è live: legge le nuove richieste, fa ricerche sul lead, scrive uno score, aggiorna HubSpot, e risponde al lead con un'email personalizzata. Per lead qualificati (score > 70), notifica il sales rep.

**Mese 2:** risultati. Sofia e il sales lead misurano: lead qualificati al mese passati da 30 a 80, tempo di risposta ai lead passato da 24 ore a 2 ore, e il team sales può focalizzarsi sui lead caldi.

ROI: il costo di AgentX (50-100 €/mese) è enormemente inferiore al costo di un SDR part-time.

### Le domande che ci fanno più spesso

**AgentX è difficile da configurare?**
La UI è no-code, ma il setup non è banale: serve definire bene scope, tool, e prompt. Per un task semplice, 1-2 giorni. Per un task complesso, 1-2 settimane.

**Quanto costa?**
Il pricing è a tier, a partire da 30-50 €/mese per il Pro, fino a 200-500 €/mese per il Business. Per volumi enterprise, custom pricing.

**AgentX può gestire dati sensibili?**
Verifica le policy di sicurezza e compliance. Per dati sanitari (HIPAA) o finanziari (PCI), potresti aver bisogno di un piano enterprise o di un tool self-hosted.

**Gli agenti possono fare danni?**
Sì. Un agente con accesso a un CRM può modificare record, inviare email, cancellare contatti. Servono guardrail: conferma umana per azioni sensibili, audit log, e limiti di azione per agente.

**Posso integrare AgentX con il mio stack?**
Sì, con API e webhook. Per stack complessi, la fase di integrazione è la parte più time-consuming.

**AgentX è un competitor di ChatGPT Enterprise?**
No, sono complementari. ChatGPT Enterprise è un'interfaccia AI per uso interno. AgentX è una piattaforma per costruire agenti task-oriented. Si possono usare insieme: ChatGPT per assistenza, AgentX per automazione.

### Cosa ci aspettiamo da AgentX nei prossimi mesi

Le aree da osservare:

- **Migliore debugging degli agenti.** Log più ricchi, replay delle conversazioni, identificazione di failure mode.
- **Multi-agent orchestration.** Agenti che collaborano tra loro su task complessi.
- **Migliore supporto per tool complessi.** Integrazioni più profonde con CRM, ERP, e tool di produttività.
- **Enterprise features.** SSO, audit log, role-based access, on-prem option.

### In sintesi

AgentX è una piattaforma solida per costruire agenti AI no-code, utile per team che vogliono automatizzare task reali senza overhead engineering. Non è per chatbot semplici, e non sostituisce un approccio custom per use case specialistici.

Per team che vogliono velocità e ROI rapido su task ripetitivi, è uno degli investimenti con ritorno più diretto. Per use case mission-critical, serve un approccio custom.

### Prossimi passi

- **Apri la scheda tool di AgentX** per vedere pricing, integrazioni, e giudizio editoriale completo.
- **Confronta con altre piattaforme agenti** nella raccolta dedicata.
- **Salva AgentX nei preferiti** se vuoi tornarci dopo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
