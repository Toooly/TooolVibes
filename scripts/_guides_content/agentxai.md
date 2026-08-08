### Cosa fa AgentX, in una frase

AgentX è una piattaforma no-code per costruire agenti AI specializzati e flussi multi-agent — dove l'utente disegna la logica dell'agente in un canvas visuale, configura i tool che l'agente può chiamare, e mette in produzione senza scrivere codice di orchestrazione.

Non è un chatbot builder. È un sistema operativo per agenti che vivono dentro processi di business reali: lead qualification, customer support automation, document processing, internal operations.

### A chi serve davvero, e a chi no

AgentX è per:

**Team marketing e sales ops che vogliono automatizzare lead qualification.** Un agente che legge le submission form, fa enrichment, qualifica, score, e instrada ai sales rep con il contesto completo.

**Team customer support che vogliono automare le richieste di primo livello.** Un agente che risponde a FAQ, gestisce richieste standard, e instrada le questioni complesse a umani con tutto il contesto.

**Team operations che vogliono automatizzare processi ripetitivi.** Un agente che legge email, classifica, estrae dati, e li mette in un sistema downstream.

**Agenzie che costruiscono agenti per clienti.** Il tier Professional include white-label e client workspaces.

**Team che hanno già provato LangChain/LlamaIndex e vogliono qualcosa di più visuale.** AgentX è "LangChain con una UI e senza il debito tecnico del custom code".

Non è per:

**Sviluppatori che vogliono massimo controllo.** Se preferisci scrivere codice Python, LangGraph e CrewAI ti danno più flessibilità. AgentX è per chi vuole velocità, non per chi vuole controllo.

**Chatbot semplici.** Se ti serve un FAQ bot, non hai bisogno di un agent platform. Typebot, Botpress, o anche un semplice widget AI sono sufficienti.

**Mission-critical senza engineering di guardia.** Come tutti i tool no-code, debugging in produzione è più limitato. Per applicazioni critiche (financial, medical), serve almeno un dev disponibile per intervenire.

**Voice agents.** AgentX è focalizzato su text agents. Per voice, servono tool diversi (Vapi, Retell, Bland).

### Architettura: come è fatto un agente in AgentX

L'architettura di AgentX ha quattro elementi fondamentali.

**Agenti.** Un agente è un'unità autonoma con un ruolo definito, un prompt che ne stabilisce personalità e obiettivi, un set di tool che può chiamare, e una memoria opzionale. Esempi:
- "Sales Qualifier" — agisce come un sales rep, qualifica lead, pone domande, score
- "Document Processor" — riceve documenti, li estrae, li classifica, li struttura
- "Customer Support" — risponde a domande, consulta knowledge base, instrada quando serve

**Tools.** I tool sono le "azioni" che l'agente può compiere. Includono:
- HTTP request (chiamare qualsiasi API)
- Database query (PostgreSQL, MySQL, MongoDB)
- CRM integration (HubSpot, Salesforce, Pipedrive)
- Document processing (PDF, Word, Excel)
- Email/Slack notification
- Custom tool (definisci tu cosa l'agente può fare)

**Memoria.** L'agente può ricordare conversazioni passate (short-term memory, entro una sessione) e informazioni strutturate (long-term memory, su un database). La memoria long-term è utile per agenti che gestiscono lead nel tempo.

**Flussi multi-agent.** Più agenti che collaborano. Un "supervisor" instrada richieste a sotto-agenti specializzati. È il pattern adatto per workflow complessi dove un singolo agente non basta.

Il pattern operativo è: l'utente disegna l'agente in canvas, configura tool e memoria, testa con eval, deploya. L'agente gira come servizio, riceve input via API o widget, e restituisce output strutturato.

### Il sistema di crediti, spiegato onestamente

AgentX usa un sistema di crediti per l'AI usage. Ogni interazione consuma crediti, e il numero dipende dal modello usato.

**Modelli e costi (verificati luglio 2026):**
- GPT-4o: 10 crediti per interazione
- Claude Sonnet: 12 crediti per interazione
- Gemini Pro: 8 crediti per interazione
- Claude Haiku: 3 crediti per interazione

**Tier (verificati luglio 2026):**

- **Free, $0/mese.** Per chi vuole esplorare. Include valutazione base, support community.
- **Starter, non pubblicato direttamente sul pricing page ufficiale, parte da $99/mese.** Include deploy in produzione, flussi multi-agent, API access.
- **Professional, $199/mese annuale ($1.490/anno).** Include fino a 25 agenti, 10.000 crediti/mese, white-label deployment, client workspaces, 2 seat inclusi. Adatto a team che costruiscono per clienti.
- **Business, $299/mese annuale ($2.990/anno).** Unlimited workspaces, unlimited agenti, 20.000 crediti/mese, priority support, priority SLA. Adatto a agency.
- **Enterprise, custom.** Unlimited tutto, custom credit volume, on-premise option, dedicated infrastructure.

**Overages:** $10 per 1.000 crediti extra su Professional e Business. Per agenti in produzione con volumi alti, il costo dei crediti può superare il tier.

**Costo totale realistico:** un agente in produzione che gestisce 1.000 lead/mese con GPT-4o consuma 10.000 crediti/mese. Su Professional, il tier include quei crediti, ma se l'agente fa tool calls (ognuna potenzialmente un'interazione extra), il consumo sale.

**Regola pratica:** budget realistico per un deployment in produzione è 2-3x il tier base, per coprire overage e modelli più potenti.

### Le feature chiave in profondità

**Canvas visuale.** L'interfaccia per disegnare agenti. Nodi per LLM, tool, memoria, condizioni. Connessioni type-checked. È la feature centrale che differenzia AgentX da soluzioni solo-code.

**Model-agnostic.** Supporta OpenAI, Anthropic, Google, e modelli custom via OpenAI-compatible API. Non sei lockato a un vendor.

**Memory strutturata e conversazionale.** Short-term per la sessione corrente, long-term per la conoscenza persistente. La long-term memory è il vantaggio competitivo per agenti che gestiscono relazioni nel tempo (lead, customer success, support tickets).

**API e widget.** Ogni agente è esposto via API REST. Widget embeddable per siti web. SDK per integrazioni custom.

**Multi-agent workflows.** Più agenti che collaborano, con un agente principale che orchestra. Pattern utile per workflow complessi.

**Evaluation framework.** Su Business e superiori, valutazione strutturata: agent risk mapping, custom datasets, multi-run testing, performance benchmarks. È la feature che distingue deployment POC da produzione.

**White-label deployment.** Su Professional. Puoi deployare l'agente con il tuo brand, non "Powered by AgentX".

**Client workspaces.** Su Professional. Multi-tenant: ogni cliente vede solo i suoi agenti e dati.

### Quando AgentX ha senso, e quando no

**Ha senso:** team non-engineering che vogliono automatizzare processi ripetitivi con AI, agenzie che costruiscono agenti per clienti, team che hanno già provato soluzioni custom e vogliono accelerare.

**Non ha senso:** se sei un dev Python e vuoi massimo controllo (LangGraph), se ti serve solo un FAQ bot (Typebot, Botpress), se hai requisiti di voice o vision specializzati, se il tuo budget è <$200/mese.

**Caso borderline:** se il tuo team ha competenza tecnica ma vuole accelerare il time-to-market, AgentX è un buon compromesso. Paghi un premium rispetto al self-hosting open source, ma risparmi settimane di sviluppo.

### AgentX vs LangGraph vs CrewAI vs Botpress vs Vapi

**AgentX vs LangGraph.** LangGraph è un framework Python per agenti. Massimo controllo, massima flessibilità, ma richiede Python expertise e tempo di sviluppo. AgentX è no-code con canvas. Per team con Python, LangGraph è superiore. Per team senza Python, AgentX è l'unica opzione realistica.

**AgentX vs CrewAI.** CrewAI è un framework Python specializzato in multi-agent. Più focalizzato di LangGraph su flussi con ruoli. Buono per il pattern "team di agenti con personalità diverse". AgentX offre lo stesso pattern con canvas visuale.

**AgentX vs Botpress.** Botpress è un chatbot builder con focus su customer support. Meno flessibile per logiche complesse, più semplice per FAQ bot. Se il tuo caso d'uso è solo customer support FAQ, Botpress è più economico. Se devi fare workflow complessi, AgentX è superiore.

**AgentX vs n8n AI.** n8n è un automation tool general-purpose con nodi AI. Più ampio (puoi fare qualsiasi automation), meno specializzato per agenti. Per team che fanno automazioni miste (AI + API + DB), n8n è più versatile. Per agenti puri, AgentX è più focalizzato.

**AgentX vs Flowise.** Flowise è open source, self-hostable, simile per visual agent building. Per team con competenza DevOps, Flowise è significativamente più economico. Per team che vogliono managed hosting, AgentX è più accessibile.

**AgentX vs Vapi / Retell / Bland.** Questi sono voice agent platforms. AgentX non fa voice. Sono mercati diversi.

### Casi d'uso reali

**Lead qualification per SaaS B2B.** Agente che riceve form submissions, fa enrichment via Clearbit o Apollo, qualifica con framework BANT o MEDDIC, score, e instrada a sales rep con il contesto completo. Risparmio: 5-10 ore/settimana per sales rep.

**Customer support tier 1.** Agente che gestisce FAQ, reset password, status ordini, e instrada questioni complesse a umani. Riduzione del 40-60% del volume al support team umano.

**Document processing per finance.** Agente che riceve fatture, le legge, estrae dati strutturati, li mette in un sistema ERP. Sostituisce data entry manuale.

**Internal HR assistant.** Agente che risponde a domande su policy aziendali, leave, benefits, basandosi su documenti HR interni.

**Sales enablement.** Agente che conosce le schede prodotto, casi studio, objection handling. Il sales rep chiede contesto e l'agente fornisce.

**Research automation.** Agente che fa market research, aggrega dati, genera report strutturati.

### Setup pratico: da zero a un agente in produzione in una settimana

**1. Crea l'account.** Su agentx.so, signup. 5 minuti.

**2. Configura il primo agente.** "Agents" → "New". Definisci ruolo, prompt, tool iniziali. 30 minuti.

**3. Testa con eval.** "Evaluations" → "Run". Usa un dataset di 10-20 esempi rappresentativi. Verifica qualità. 30 minuti.

**4. Configura integrazioni.** Collega CRM, database, API esterne che l'agente userà. 1-2 ore.

**5. Deploy.** "Deploy to Production". L'agente è ora accessibile via API o widget. 5 minuti.

**6. Monitoring.** Configura logging, alerting su error rate, dashboard per quality metrics. 1 ora.

**7. Iterazione basata su dati reali.** Dopo 1-2 settimane di produzione, analizza le conversazioni, identifica failure modes, raffina prompt e tool. Continuo.

In una settimana hai un agente POC-ready. In un mese, un agente production-grade. In tre mesi, un agente che evolve con dati reali.

### Errori comuni

**Sottovalutare la qualità del prompt.** Il prompt determina il 70% della qualità. Iterazioni multiple, A/B test, review con eval sono necessari.

**Tool troppi.** Dare all'agente 20 tool aumenta le possibilità di scelte sbagliate. Meglio 5-8 tool focalizzati.

**Nessuna valutazione strutturata.** "Funziona" non è una metrica. Senza eval dataset e metric tracking, stai lavorando al buio.

**Deploy senza monitoring.** In produzione senza logging, il primo bug ti arriva dall'utente. Sempre monitoring e alerting.

**Sottovalutare il costo modello.** Un agente con tool calls e memoria può consumare più crediti del previsto. Modella il costo prima del deploy, non dopo.

### Le domande che ci fanno più spesso

**AgentX è meglio di LangGraph?**
Per chi non è Python developer, sì. Per Python developer, LangGraph è superiore per flessibilità.

**Quanto costa in produzione?**
Tier Professional a $199/mese + ~$100-200 di overage crediti per agenti in produzione reali. Total: $300-400/mese per un deployment medio.

**Posso usarlo per voice agents?**
No, AgentX è text-only. Per voice, Vapi, Retell, Bland.

**Posso deployare on-premise?**
Solo su Enterprise. Self-hosted open source alternative: Flowise, LangFlow.

**Supporta MCP?**
Sì, AgentX supporta Model Context Protocol per collegare tool esterni.

**Funziona per chatbot customer support semplici?**
Sì, ma è sovradimensionato. Per solo FAQ, Botpress o Typebot sono più economici.

### Alternative da considerare

- **LangGraph / LangChain.** Per Python developer che vogliono massimo controllo.
- **CrewAI.** Per multi-agent con personalità, Python-first.
- **Flowise.** Open source, self-hosted, gratuito. Per team con DevOps.
- **Botpress.** Più semplice, più economico per FAQ bot.
- **n8n AI.** General automation, versatile ma meno specializzato.
- **Voiceflow.** Per team con focus su conversational UX.
- **Build custom con OpenAI Assistants API.** Massimo controllo, massimo sforzo.

### In sintesi

AgentX è una piattaforma solida per team non-engineering che vogliono costruire agenti AI in produzione. Il pricing è medio-alto ma giustificato per il valore. Il canvas visuale è uno dei migliori sul mercato. Le limitazioni principali sono: lock-in al sistema di crediti, voice non supportato, e complessità che richiede pratica per essere sfruttata appieno.

Per il target giusto — team che vogliono velocità + qualità senza scrivere codice — è una delle scelte migliori. Per il target sbagliato — Python developer che vuole controllo, o team che vuole solo FAQ bot — ci sono alternative migliori.

### Prossimi passi

- **Apri la scheda tool di AgentX** per confrontare con LangChain, Flowise, e altri agent builder.
- **Esplora la raccolta su agenti AI** per casi d'uso affini.
- **Salva AgentX nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
