### Cosa fa Windsor AI, in una frase

Windsor AI è una piattaforma di marketing data e attribuzione che connette le tue fonti pubblicitarie (Meta, Google, LinkedIn, TikTok, ecc.), il CRM (HubSpot, Salesforce) e gli analytics in un unico layer, e ti permette di esportare il dato pulito verso BigQuery, Snowflake, Redshift o Looker.

### A chi serve davvero

Windsor non è per il singolo marketer che fa una campagna su Meta. È per il team marketing che ha bisogno di:

- **Attribuzione multi-touch reale**, non solo "ultimo click" di Google Analytics.
- **Reportistica cross-canale** unificata, senza dover entrare in 6 dashboard diverse.
- **Ownership del dato**, con export verso il proprio data warehouse.
- **Performance monitoring di campagne e canali** in tempo reale.

I profili tipici:

- **Marketing team in scaleup e mid-market** (5-50 persone marketing) che stanno crescendo e hanno bisogno di un'infrastruttura dati seria.
- **Agenzie media** che gestiscono portfolio di clienti e vogliono reportistica standardizzata.
- **Data analyst marketing** che costruiscono dashboard e modelli di attribuzione custom.
- **CFO e finance** che vogliono capire il ROI reale del marketing, canale per canale.

Non è il tool adatto a chi cerca un "dashboard facile senza setup": Windsor richiede un minimo di data literacy e di integrazione iniziale.

### Come funziona, passo per passo

Il flusso operativo ha cinque fasi.

**1. Connessione delle fonti dati.** Windsor offre connettori nativi per le principali piattaforme pubblicitarie (Meta Ads, Google Ads, LinkedIn Ads, TikTok, Pinterest, Reddit, X), per i CRM (HubSpot, Salesforce, Pipedrive), per i tool di email (Klaviyo, Mailchimp), e per le piattaforme di ecommerce (Shopify, WooCommerce). L'utente autorizza le connessioni via OAuth.

**2. Mappatura dei campi.** Windsor normalizza i dati: spese, impression, click, conversioni, revenue, lead, customer id. La mappatura consente di unificare le metriche tra canali (es. "spend" diventa "cost" ovunque).

**3. Modelli di attribuzione.** Windsor supporta diversi modelli: last click, first click, linear, time decay, position-based, data-driven (con limiti sui volumi). L'utente sceglie il modello o ne confronta più di uno.

**4. Dashboard e report.** Windsor offre dashboard pronte (ROAS, CPA, LTV per campagna) e template per report periodici. Gli utenti tecnici possono costruire dashboard custom.

**5. Export verso warehouse.** Il valore aggiunto principale di Windsor è l'export del dato normalizzato verso il proprio data warehouse (BigQuery, Snowflake, Redshift, Postgres). Una volta lì, il dato è disponibile per analisi avanzate, modelli di marketing mix, e dashboard BI custom.

:::tip Cosa distingue Windsor da un tool "solo dashboard"

La differenza è l'**ownership del dato**:

- Un tool come Supermetrics o Funnel ti dà dashboard, ma ti "intrappola" nel loro prodotto.
- Windsor ti dà il dato normalizzato, e tu lo porti dove vuoi.
- Questo significa che puoi costruire il tuo modello di attribuzione, fare analisi personalizzate, e non perdere il dato se cambi tool.

Per un team marketing che cresce, questa differenza è significativa.

:::

### Le metriche chiave che Windsor espone

Windsor espone le metriche standard di marketing con normalizzazione cross-canale:

- **Spese** (cost, spend, budget).
- **Impression, click, CTR, CPM, CPC.**
- **Conversioni, CPA, ROAS.**
- **Revenue, LTV per canale e campagna.**
- **Attribution-adjusted metrics** (es. "credito" di ogni canale in una conversione multi-touch).
- **Cross-channel overlap** (es. quante conversioni sono toccate da Meta + Google + email).

L'utente può combinare queste metriche in dashboard e report, o esportarle per analisi esterne.

### Casi d'uso concreti

:::pro Quando Windsor fa la differenza

- **Marketing team di scaleup** che investe 50k+ €/mese su più canali e ha bisogno di capire il ROI.
- **Agenzie media** che gestiscono 5-20 clienti e vogliono reportistica standardizzata.
- **Brand ecommerce** che vuole analizzare il customer journey cross-canale.
- **B2B con sales cycle lungo** che vuole capire l'attribution tra LinkedIn, Google, e attività sales.
- **Team finance** che ha bisogno di dati di spesa marketing normalizzati per i report CFO.

:::

:::warning Quando Windsor non è la scelta giusta

- **Singolo marketer con una campagna su un canale.** Il setup non si giustifica.
- **Team senza data analyst.** Windsor è un tool per data-informed team, non per chi vuole "solo un report".
- **Volumi molto bassi (<10k di spesa mensile).** Il costo del tool potrebbe superare il beneficio.
- **Budget analytics zero.** Windsor ha un costo di setup (tempo, integrazioni) che va preventivato.

:::

### Windsor vs i concorrenti diretti

**Windsor vs Supermetrics.** Supermetrics è focalizzato sull'export verso Google Sheets, Looker, BigQuery. Windsor ha più connettori nativi e un modello di attribuzione più ricco. Per un uso "leggero" (es. report in Google Sheets), Supermetrics è più semplice. Per un uso enterprise, Windsor è più strutturato.

**Windsor vs Funnel.io.** Funnel è il competitor più diretto, con modello simile (connettori + normalizzazione + export). La differenza è sottile: Funnel ha un'UI più moderna, Windsor ha più modelli di attribuzione pronti. Per molti team, la scelta è indifferente — confronta pricing e connettori specifici.

**Windsor vs Triple Whale.** Triple Whale è focalizzato sull'ecommerce (Shopify, DTC brands). Windsor è più generalista. Per un brand ecommerce puro, Triple Whale è specializzato. Per un team marketing multi-canale generalista, Windsor è più adatto.

**Windsor vs Northbeam.** Northbeam è un altro competitor forte sul cross-channel. La differenza: Northbeam è più orientato a "media mix modeling", Windsor è più "attribution + dashboard". Per team che fanno MMM avanzato, Northbeam è preferibile. Per attribution operativa, Windsor è solido.

**Windsor vs Google Analytics 4.** GA4 è free e fa attribution di base, ma è limitato a quel che Google vede. Windsor aggiunge Meta, LinkedIn, TikTok, CRM, e ti dà il dato esportabile. Non sostituisce GA4, lo completa.

### Pricing di Windsor

Windsor ha un modello di pricing a tier, basato su connettori, fonti dati, e volumi:

- **Free tier**: limitato a 1-2 connettori, utile per test.
- **Pro**: 5-10 connettori, attribution di base, dashboard.
- **Business**: 20+ connettori, attribution avanzata, export warehouse.
- **Enterprise**: custom.

I prezzi pubblicati sul sito variano nel tempo. Indicativamente, il tier Pro parte da 100-200 €/mese, e il tier Business da 500+ €/mese. Il pricing è spesso negoziato per volumi alti.

### Flusso pratico: un caso reale

Marco è head of growth in una scaleup B2B che spende 60k €/mese tra Google Ads, LinkedIn, e content syndication. Il team finance chiede report di ROI cross-canale, e il CEO vuole capire se sta spendendo bene.

**Settimana 1:** setup. Marco collega Google Ads, LinkedIn, HubSpot, e Google Analytics. Mappa i campi. Imposta i modelli di attribuzione (last click + first click + time decay, in confronto).

**Settimana 2:** primi report. Marco scopre che LinkedIn, su cui spendeva 30k €/mese, porta il 5% delle conversioni con last click, ma il 25% con time decay. La storia è diversa a seconda del modello.

**Settimana 3:** export verso BigQuery. Il team data costruisce una dashboard custom che combina Windsor + dati sales + dati prodotto.

**Mese 2:** decisione. Marco sposta 10k €/mese da LinkedIn a Google Ads (che ha un ROI migliore su first click e contribuisce di più al bottom funnel). Risultato atteso: +15% di MQL senza aumento di spesa.

ROI di Windsor per Marco: un singolo spostamento di budget di 10k/mese ripaga 1000+ volte il costo del tool.

### Le domande che ci fanno più spesso

**Windsor è difficile da configurare?**
Richiede un setup di 2-5 giorni per un data analyst. Non è un "click and go", ma non è nemmeno un progetto di mesi. La documentazione è buona.

**Posso esportare in Google Sheets?**
Sì, ma il valore principale di Windsor è l'export verso data warehouse (BigQuery, Snowflake, ecc.). Google Sheets è supportato ma è un uso "leggero".

**Windsor supporta l'italiano?**
Sì, l'interfaccia è multilingua. I dati elaborati sono naturalmente nella lingua delle fonti.

**Quanto costa?**
Il pricing è a tier, a partire da circa 100-200 €/mese per il piano Pro. Il piano Business (consigliato per team marketing strutturati) parte da 500+ €/mese. Il pricing è spesso personalizzato.

**Windsor è un "media mix modeling" tool?**
No, è un attribution + dashboard tool. Il media mix modeling è un approccio diverso (statistico, richiede più dati storici) ed è offerto da tool come Northbeam o da data scientist custom.

**Windsor può sostituire Google Analytics?**
No, si integra. GA4 continua a essere utile per l'analisi del comportamento on-site. Windsor aggiunge il pezzo cross-channel.

**Il dato è in tempo reale?**
Sì, con un lag di 1-3 ore rispetto alle piattaforme pubblicitarie (dipende dai connettori).

### Cosa ci aspettiamo da Windsor nei prossimi mesi

Le aree da osservare:

- **AI-assisted insights.** Se Windsor introduce alert e insight automatici ("questa campagna ha un CPA anomalo"), il valore sale.
- **Modelli di attribution più granulari.** Soprattutto per il B2B, dove i sales cycle sono lunghi e multi-stakeholder.
- **Integrazione con strumenti di marketing mix modeling.** Per chi vuole combinare attribution operativa con MMM strategico.
- **Predictive analytics.** Previsioni di spesa, di performance, di mix ottimale.

### In sintesi

Windsor AI è uno strumento solido per team marketing che hanno bisogno di attribution cross-channel, reportistica unificata, e ownership del dato. Non è un tool "per tutti": richiede data literacy e un minimo di investimento iniziale.

Per un team marketing in crescita che spende 50k+ €/mese su più canali, è uno degli investimenti con ROI più diretto: un singolo spostamento di budget ben informato ripaga anni di abbonamento.

### Prossimi passi

- **Apri la scheda tool di Windsor AI** per vedere pricing, integrazioni, e giudizio editoriale completo.
- **Confronta con altri tool di marketing data** nella raccolta dedicata.
- **Salva Windsor nei preferiti** se vuoi tornarci dopo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
