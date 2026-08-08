### Il problema che Reclaim risolve

Apri Google Calendar e trovi 14 meeting, 3 abitudini che avresti dovuto mantenere questa settimana, e 8 task scadute ieri. Sai che il tuo deep work sta evaporando. Sai che la palestra salta. Sai che quel report che dovevi consegnare venerdì è ancora aperto. Ma "ottimizzare il calendario" è una di quelle cose che rimandi per mesi.

Reclaim AI è un layer sopra Google Calendar e Outlook che decide, in tempo reale, chi può occupare il tuo tempo e quando. Difende il focus time, distribuisce le abitudini nei buchi, trasforma le task in blocchi di calendario, e gestisce i meeting senza farti diventare un segretario di te stesso. Tu imposti le regole; Reclaim le applica.

### A chi serve davvero, e a chi no

Reclaim ha un profilo di fit molto specifico. Funziona bene per:

**Knowledge worker con calendario frammentato.** Se la tua settimana ha 20-30 ore di meeting, 5-10 task importanti, e 3-4 abitudini che vuoi mantenere (workout, lettura, deep work), Reclaim è la risposta. Senza, devi micro-gestire manualmente, e prima o dopo qualcosa salta.

**Manager e director che hanno troppe cose in parallelo.** Quando sei in 5 progetti diversi, con 3 one-to-one settimanali, e ogni progetto ha le sue task, il calendario diventa un campo di battaglia. Reclaim lo gestisce come un arbitro.

**Team che lavorano async-first.** Se la tua organizzazione ha culture async, con block di deep work difesi, e meeting solo quando necessari, Reclaim codifica quella cultura nel calendario.

**Freelance con clienti multipli e time tracking.** Le abitudini di Reclaim possono essere configurate con task specifiche (time tracking, fatturazione, follow-up), e si integrano con Todoist, Asana, Linear, ClickUp, Jira.

**Studenti universitari e dottorandi.** Block di studio difeso automaticamente, in modo che i seminari non erodano il tempo di tesi.

Non è la scelta giusta per:

**Chi ha un calendario con pochi eventi.** Se hai 5-6 meeting a settimana e poco altro, Reclaim è overkill. Il value è nel gestire la complessità; poca complessità = poco value.

**Chi vuole controllo totale e micro-gestione.** Reclaim decide per te dove mettere le cose. Se preferisci controllare tu ogni slot, l'automazione ti darà fastidio.

**Team che usano calendari condivisi come primary tool.** Reclaim lavora su calendari individuali, non su calendari di team. Per team scheduling, ci sono tool specifici (Clockwise, Motion for Teams, calendar polls).

**Chi ha bisogno di pianificazione avanzata di progetti.** Reclaim gestisce task individuali, non progetti complessi con dipendenze. Per quello, Linear, Asana, e tool di project management sono più adatti.

### Architettura: come funziona davvero

Capire come Reclaim "pensa" è fondamentale per usarlo bene. L'architettura si basa su quattro astrazioni: Habits, Tasks, Smart Meetings, e Calendar Sync.

**Habits** sono routine ricorrenti con priorità, durata, e range orario. Esempi: "Workout 3 volte a settimana, 1 ora, tra le 17 e le 20, priorità alta", oppure "Deep work 4 ore, 3 volte a settimana, tra le 9 e le 13, priorità massima". Reclaim cerca gli slot disponibili nel calendario e li blocca, spostandoli dinamicamente se arriva un meeting prioritario. La differenza rispetto a un evento ricorrente classico è che la Habit è difensiva: protegge il tempo, non lo riempie.

**Tasks** sono cose da fare con durata stimata, deadline, e priorità. Le integrazioni con Todoist, Asana, Linear, ClickUp, e Jira sincronizzano le task esterne. Reclaim le trasforma in blocchi di calendario, scegliendo quando farle in base a deadline, durata stimata, e slot disponibili. La differenza rispetto a un task manager classico è che Reclaim tratta il tempo come risorsa scarsa da allocare, non come una lista da spuntare.

**Smart Meetings** sono meeting che si organizzano da soli, rispettando vincoli di tutti i partecipanti (calendari, abitudini, task). Reclaim trova lo slot ottimale e manda l'invito. Per meeting ricorrenti con molte persone, è una delle feature più apprezzate: evita la negoziazione via email.

**Calendar Sync** tiene sincronizzati più calendari Google o Outlook. Se hai un calendario personale e uno di lavoro, e un terzo per side project, Reclaim li tiene in sync senza i loop infiniti dei cambi di colore o delle risposte "declinato" su calendari condivisi.

Il modello di scheduling è di tipo "constraint satisfaction": data una serie di Habits e Tasks con vincoli, Reclaim trova una disposizione che massimizza la priorità alta e minimizza la frammentazione. Quando un meeting arriva, Reclaim ri-negozia gli slot per assorbire l'evento nuovo. È un algoritmo continuo, non un one-shot.

### Pricing, onestamente

Reclaim pubblica quattro tier sulla pagina ufficiale, con un toggle mensile/annuale che fa risparmiare circa il 17-29% su annuale. Verifica direttamente su reclaim.ai/pricing — i numeri qui sotto sono stati confermati ad agosto 2026, ma la società è in fase di integrazione con Dropbox e i prezzi cambiano.

**Lite — Free, per sempre.** 1 utente, 1 calendar sync, 1 scheduling link, 5 AI Agents, 1 settimana di scheduling range, integrazioni limitate (Google Tasks, Slack, Zoom, Google Meet). È un piano reale, non un trial. Tutti i nuovi account ricevono inoltre un trial gratuito di 14 giorni del tier Business.

**Starter.** Annuale: **$10/seat/mese**. Mensile: **$12/seat/mese**. Fino a 10 seat. Aggiunge 8 settimane di scheduling range, 3 calendar sync, 3 scheduling link, integrazioni complete con Todoist, Asana, ClickUp, Linear, Jira, Slack status sync, Focus Time, Habits illimitate, Smart Meetings 3 come organizer. Adatto a singoli o team piccoli.

**Business.** Annuale: **$15/seat/mese**. Mensile: **$18/seat/mese**. Fino a 100 seat. 12 settimane di scheduling range, 100 AI Agents per seat, calendar sync illimitati, scheduling link illimitati, Smart Meetings illimitati, webhooks, Team OOO calendar, delegated access, branding removal. È il tier "Most Popular".

**Enterprise — $22/seat/mese, annual only, contact sales.** Minimo 100 seat. Unlimited AI Agents, SSO + SCIM provisioning, org-chart-aware scheduling, Focus Time company OKRs, dedicated support, audit log, SLA, supporto alla configurazione enterprise. Non è self-serve: contatti il sales team.

**Costi realistici per team.** Un team di 10 su Business annuale: $150/mese, $1.800/anno. Su Starter annuale: $100/mese, $1.200/anno. Pagare mensile costa circa il 20% in più: $12 invece di $10 su Starter, $18 invece di $15 su Business. Per team grossi, il delta è significativo.

Reclaim è parte del gruppo Dropbox (footer ufficiale: "Reclaim.ai from Dropbox company logo") e continua a operare come prodotto indipendente. Il prezzo resta competitivo con Motion ($29/mese entry-level), e significativamente più economico di Clockwise o Asana con calendar integration.

Una nota: i prezzi di Reclaim sono cambiati più volte negli ultimi due anni. Quando firmi un budget annuale, considera un 10-20% di tolleranza per eventuali price increase.

### Le feature che fanno la differenza

**Focus Time difensivo.** È la feature più usata. Dichiari che vuoi N ore di focus time a settimana, e Reclaim le difende. Quando un meeting prova a eroderle, Reclaim le riposiziona o ti avvisa. È il contrario di un evento "deep work" creato manualmente, che verrebbe rimosso o spostato alla prima occasione.

**Habits ricorrenti.** Workout, lettura, journaling, language practice. Configuri la frequenza, la durata, il range orario, e Reclaim le mette in calendario. Quando salti una sessione, Reclaim sposta la prossima per tenere la frequenza. È come avere un personal scheduler per le abitudini.

**Task-to-calendar con integrazioni.** Colleghi Todoist, Asana, Linear, ClickUp, o Jira, e le task con deadline diventano blocchi di calendario. Reclaim stima la durata in base a una euristica (1 ora di default, configurabile per project), e la mette dove c'è spazio. Quando completi la task nel task manager, Reclaim rimuove il blocco.

**Smart Meetings 1:1.** Per i one-to-one ricorrenti, Reclaim trova lo slot che rispetta le abitudini di entrambi. Niente più "quando ti va bene?" via email.

**Scheduling links personalizzati.** Crei un link pubblico del tipo "30 minuti con me" o "Coffee chat", e le persone prenotano rispettando le tue abitudini e il tuo focus time. Simile a Calendly, ma con l'integrazione nativa nelle tue difese.

**Slack status sync.** Reclaim legge il tuo calendario e aggiorna il tuo status Slack ("In a meeting", "Focus time", "Heads down") automaticamente. Riduce le interruzioni.

**Buffer time e travel time.** Tra un meeting e l'altro, Reclaim inserisce un buffer configurabile (default 10 minuti) per darti tempo di respirare. Per chi ha meeting back-to-back, è una salvezza.

**Productivity stats.** Dashboard settimanale con quanto focus time hai difeso, quante Habits completate, quanti meeting accettati/rifiutati. Utile per capire dove va il tuo tempo.

### Le feature che mancano, e come workaround-are

**Nessuna vera project management.** Reclaim è task-aware ma non project-aware. Non vede le dipendenze tra task, le milestone, i deliverable. Se il tuo lavoro è strutturato a progetti complessi, gestiscili in Linear o Asana, e usa Reclaim solo per il time-blocking.

**Scheduling link collettivi con logica team.** Reclaim ha round-robin scheduling link, ma è basilare. Per team scheduling complesso (distribuzione automatica in base a workload, preferenze, SLA), tool come Motion for Teams o calendar polls sono superiori.

**Integrazione diretta con i team calendar.** Reclaim lavora sui calendari individuali. Per team calendar condivisi, devi configurare i sync, e la complessità cresce con le persone.

**Personalizzazione profonda del conflict resolution.** Quando due Habit sono in conflitto, Reclaim sceglie in base alla priorità. Ma non puoi configurare regole complesse come "se l'utente ha saltato 2 workout questa settimana, sposta il meeting invece dell'habit". La logica è semplice, non programmabile.

**Mobile app limitata.** L'app mobile esiste, ma è più un viewer che un editor completo. La gestione delle Habits, Task configuration, e calendar sync è più comoda su desktop.

### Reclaim vs Motion vs Clockwise vs Akiflow

**Reclaim vs Motion.** Motion è il concorrente più visibile: AI calendar, project management integrato, prezzi più alti ($29/mese entry-level, vs $12 di Reclaim). Motion è più completo nella project management (task con dipendenze, AI che ri-pianifica progetti), ma più caro. Reclaim è più focalizzato su habits e calendar defense, meno su project management. Per un founder con task semplici, Reclaim è più che sufficiente e costa meno. Per un team di product management con progetti complessi, Motion è superiore.

**Reclaim vs Clockwise.** Clockwise è focalizzato su team calendar optimization: trova slot per i meeting di team, riduce le interruzioni, crea "Focus Time" aziendale. È più adatto a team che vogliono ottimizzare i calendari condivisi, meno a individui che vogliono difendere il proprio tempo. Pricing simile a Reclaim, ma con meno integrazioni con task manager.

**Reclaim vs Akiflow.** Akiflow è un "inbox per il calendario" con integrazioni multiple e shortcuts da tastiera potenti. È più adatto a chi vuole un workflow keyboard-driven per gestire task e calendario. Reclaim è più automazione, Akiflow è più controllo manuale. Akiflow è meno caro (~$15/mese) ma richiede più configurazione.

**Reclaim vs calendari nativi (Google Calendar, Outlook).** I calendari nativi non hanno automazione di habits, non difendono il focus time, e non sincronizzano task con calendario automaticamente. Reclaim è un layer sopra, non un sostituto.

### Casi d'uso reali

**Founder con 3-4 progetti paralleli.** Reclaim è il sistema nervoso centrale: Habit "Review weekly metrics" ogni venerdì mattina, Task dai project management tool, Focus time difeso per le decisioni strategiche, Smart Meetings per gli investor update.

**Consulente con 8-10 clienti.** Habit settimanali per fatturazione e follow-up, Task per ogni deliverable con deadline, Focus time per la preparazione, Scheduling link per i clienti.

**Engineering manager.** Habit "1:1 con i diretti report" ogni settimana, Task per le review del codice, Focus time per la scrittura tecnica, Team calendar integration via Google Calendar.

**Dottorando.** Habit "Scrittura tesi" 4 ore al giorno, Habit "Lettura paper" 2 ore, Focus time difeso, Integrazione con Zotero o Notion per i paper.

**Team di vendita.** Smart Meetings per le demo, Buffer time tra le demo per il follow-up, Status sync su Slack per ridurre le interruzioni, calendar sync tra personal calendar e team calendar.

### Quando Reclaim non è la scelta giusta

**Team con calendari pesantemente condivisi.** Se il tuo calendario è 80% meeting con altre persone, Reclaim ha meno da difendere. Per team calendar optimization, Clockwise è più adatto.

**Lavori strutturati a turni.** Reclaim è pensato per knowledge work, non per lavoro a turni o operation.

**Contesti dove il calendario non è il primary tool.** Se sei un grafico o un designer che lavora principalmente su Figma, e i meeting sono rari, Reclaim è overkill.

**Privacy estreme.** Reclaim accede al tuo calendario, e per definizione vede tutti i tuoi eventi. Se hai requisiti di privacy tali che nessun tool di terze parti può toccare il tuo calendario, Reclaim non è per te.

### Setup pratico: da zero a un calendario difeso in 30 minuti

**1. Crea l'account e collega il calendario.** Su reclaim.ai, signup con Google o Outlook. Autorizza l'accesso al calendario. Tempo: 3 minuti.

**2. Configura le prime Habit.** Vai su "Habits", "New Habit". Parti da 2-3: workout, deep work, lettura. Configura frequenza, durata, range orario, priorità. Tempo: 10 minuti.

**3. Collega un task manager.** Settings → Integrations. Collega Todoist, Asana, o Linear. Le task con deadline diventano blocchi di calendario. Tempo: 5 minuti.

**4. Crea il primo Smart Meeting.** Vai su "Smart Meetings", "New". Tipo (1:1, group, 30min, 60min), chi invitare, vincoli (no meeting prima delle 10, etc.). Tempo: 5 minuti.

**5. Configura Focus Time.** Settings → Time Blocking. Dichiara quante ore di focus time a settimana, in quali range orari, con quale priorità. Tempo: 3 minuti.

**6. Testa e itera.** Lascia girare una settimana. Guarda come Reclaim dispone le cose. Aggiusta priorità e range. Tempo: settimana di osservazione.

In 30 minuti hai un setup funzionante. In una settimana capisci se ti piace. In un mese lo hai ottimizzato per il tuo workflow.

### Errori comuni

**Configurare troppe Habit il primo giorno.** Parti da 2-3, non da 8. Aggiungi gradualmente, altrimenti il calendario diventa una gabbia di slot obbligati che ti stressa.

**Sottovalutare la priorità delle Habit.** Reclaim sceglie in base alla priorità. Se non la configuri, le Habit di bassa priorità vengono sacrificate per i meeting. Decidi cosa è sacro e cosa è negoziabile.

**Dimenticare di disattivare le Habit in vacanza.** Reclaim continua a cercare slot anche quando sei in ferie. Configura "Out of Office" o pausa le Habit per il periodo.

**Non integrare i task manager.** Reclaim senza integrazioni è solo un calendar tool. Con Todoist/Linear integration, diventa un time-blocking engine.

**Ignorare i productivity stats.** La dashboard è il feedback loop. Se non la guardi, non sai se Reclaim ti sta aiutando o ti sta incasinando.

### Cosa ci aspettiamo da Reclaim nei prossimi mesi

**Integrazione con Dropbox.** L'acquisizione del 2024 può portare integrazioni con Dropbox ecosystem (Dropbox Paper, Dropbox Dash, Dropbox Sign). Da monitorare se sei in quell'ecosistema.

**Mobile migliore.** L'app mobile è ancora limitata. Migliorarla è una richiesta frequente della community.

**Project management più ricco.** Reclaim potrebbe aggiungere funzionalità per gestire task con dipendenze, o integrarsi più profondamente con Linear e Asana per portare la project intelligence dentro il calendar.

**AI più conversazionale.** Possibilità di "Hey Reclaim, sposta la call con X a domani e proteggimi il martedì mattina per il deep work". Già presente in parte, da consolidare.

### Le domande che ci fanno più spesso

**Reclaim funziona con Microsoft Outlook?**
Sì, dal marzo 2025. Supporta Google Calendar e Microsoft Outlook completamente.

**Posso esportare il mio calendario e abbandonare Reclaim?**
Sì, in qualsiasi momento. Le Habit e le Task sono oggetti Reclaim, ma il calendario sottostante resta tuo. Esporti, e perdi l'automazione ma mantieni gli eventi.

**Reclaim rallenta il mio calendario?**
No. Reclaim lavora in background, le modifiche sono rapide, e non c'è un impatto percepibile sulla velocità di Google Calendar o Outlook.

**C'è un rischio di data breach?**
Reclaim memorizza i dati di configurazione (Habit, Task config) sui propri server. Il contenuto del calendario resta sui server di Google/Outlook. Reclaim è SOC 2 compliant e usa encryption standard.

**Funziona per team con molti membri?**
Sì, ma il valore per team è diverso. Reclaim eccelle come tool individuale. Per team, è uno strumento che ogni membro usa individualmente, e il valore si moltiplica (se tutti hanno Focus Time difeso, gli slot di meeting si concentrano).

**Meglio Reclaim o un calendar tradizionale + disciplina?**
La disciplina è fragile. Reclaim la codifica nel sistema. Se sei il tipo che "dovrei fare X ma finisce che Y prende il sopravvento", Reclaim è la risposta. Se sei già un master del calendar management, Reclaim è ridondante.

### Alternative da considerare

- **Motion.** Più caro ($29/mese), più completo in project management, meno focalizzato su habits.
- **Clockwise.** Più focalizzato su team calendar optimization, meno su individuale.
- **Akiflow.** Keyboard-driven, più controllo manuale, meno automazione.
- **Google Calendar + disciplina.** Gratis, ma richiede self-discipline.
- **Outlook + Focus Time blocks.** Funzionalità nativa parziale, ma molto meno potente di Reclaim.

### In sintesi

Reclaim AI è uno dei migliori investimenti di produttività per knowledge worker con calendario frammentato. Il prezzo ($10/seat/mese annuale) è giusto, il fit per il target è preciso, e l'impatto su focus time e abitudini è misurabile. Non è per tutti, e non è una bacchetta magica — richiede configurazione iniziale e iterazione. Ma per il profilo giusto, è probabilmente il tool di calendar AI con il miglior rapporto qualità/prezzo.

### Prossimi passi

- **Apri la scheda tool di Reclaim AI** per confrontare con Motion, Clockwise, e altri calendar tool.
- **Esplora la raccolta su produttività** per casi d'uso affini.
- **Salva Reclaim AI nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
