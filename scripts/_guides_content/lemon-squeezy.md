### Cosa fa Lemon Squeezy, in una frase

Lemon Squeezy è un merchant of record (MoR) per SaaS e prodotti digitali: ti permette di vendere a clienti internazionali gestendo al posto tuo pagamenti, tasse (VAT, GST, sales tax), fatturazione, e dunning — così tu puoi concentrarti sul prodotto.

### A chi serve davvero

Lemon Squeezy non è per chi vende prodotti fisici o per chi ha bisogno di un gateway di pagamento "neutro". È per chi:

- **Vende SaaS, software, o prodotti digitali** (licenze, ebook, corsi, template, membership).
- **Vuole vendere a clienti internazionali** senza dover gestire VAT, GST, sales tax in 50+ paesi.
- **Vuole un checkout ospitato, bello, e funzionante** senza doverlo costruire.
- **Gestisce subscription, license key, o usage-based billing** senza ricostruire da zero ogni volta.
- **È una startup o un solopreneur** che non ha (e non vuole avere) un team finance dedicato.

Non è il tool giusto per chi vende merci fisiche (manca la logistica), per chi ha bisogno di un marketplace-style platform, o per chi ha requisiti di customizzazione estrema del checkout (in quel caso, Stripe è più flessibile).

### Come funziona, passo per passo

Il flusso operativo ha sei fasi.

**1. Creazione del prodotto.** L'utente crea un prodotto in Lemon Squeezy, specifica:
- Nome, descrizione, immagini.
- Prezzo (one-time, subscription, usage-based, o "pay what you want").
- Valute accettate.
- Eventuali varianti (es. "Basic", "Pro", "Enterprise").

**2. Generazione del checkout.** Lemon Squeezy genera un checkout ospitato, bello, mobile-friendly, e accessibile. L'utente può personalizzarlo (colori, logo, campi custom) entro certi limiti.

**3. Vendita.** Il cliente completa il checkout. Lemon Squeezy gestisce il pagamento, l'eventuale subscription ricorrente, l'anti-frode, e la conformità PCI (la carta del cliente non passa mai per i server del venditore).

**4. Calcolo e versamento delle tasse.** Lemon Squeezy, in qualità di merchant of record, calcola e versa le tasse per conto del venditore:
- EU VAT.
- UK VAT.
- US sales tax (in tutti gli stati che lo richiedono).
- GST (Australia, Nuova Zelanda, Canada, India, Singapore, e altri).
- Sales tax in altre giurisdizioni (UK digitale, Giappone, Corea, Sud Africa, e oltre 50 paesi).

**5. Fatturazione e dunning.** Lemon Squeezy invia le fatture, gestisce i rinnovi, e gestisce il dunning (solleciti, retry dei pagamenti falliti, recupero dei failed payment). Le fatture sono conformi alle regole locali.

**6. Payout.** Il venditore riceve i payout secondo il calendario configurato (settimanale, mensile, o custom), con dettaglio di fees, tasse trattenute, e net.

:::tip Cosa significa "merchant of record" in pratica

Quando vendi con Lemon Squeezy, **il cliente è tecnicamente cliente di Lemon Squeezy, non tuo**. Lemon Squeezy è il merchant of record, cioè il "soggetto fiscale" che vende. Questo significa:

- Lemon Squeezy è responsabile della raccolta delle tasse (non tu).
- Lemon Squeezy è responsabile della fatturazione conforme.
- Lemon Squeezy gestisce eventuali chargeback e dispute.
- Tu sei il "seller" o "creator", e ricevi un payout netto.

Questo è un vantaggio enorme per chi non vuole gestire la fiscalità internazionale, ma ha implicazioni contrattuali che vanno comprese (es. i termini di servizio del cliente finale sono con Lemon Squeezy, non con te).

:::

### Le caratteristiche chiave di Lemon Squeezy

**Checkout ospitato.** Il cliente paga su una pagina Lemon Squeezy, non sul tuo sito. Vantaggi: PCI compliance gratuita, anti-frode integrato, mobile-friendly. Svantaggi: meno controllo sull'esperienza rispetto a Stripe Checkout personalizzato.

**Subscription management.** Lemon Squeezy gestisce abbonamenti, piani, upgrade/downgrade, pause, cancellazioni. Webhook completi per integrazioni custom.

**License key e download.** Per chi vende software, Lemon Squeezy genera e gestisce license key, e permette download sicuri dei file digitali.

**Usage-based billing.** Lemon Squeezy supporta billing basato sull'uso (es. "X euro per 1000 chiamate API"), con calcolo automatico e fatturazione mensile.

**Tax handling globale.** Il vantaggio competitivo principale. Lemon Squeezy calcola e versa le tasse in oltre 50 paesi, risparmiando al venditore ore di lavoro e migliaia di euro in consulenza fiscale.

**Affiliate program integrato.** Lemon Squeezy offre un programma di affiliazione nativo, utile se vuoi lanciare un affiliate program senza dipendere da tool esterni.

### Casi d'uso concreti

:::pro Quando Lemon Squeezy fa la differenza

- **SaaS B2B che vende a clienti in EU e US**, e non vuole gestire VAT e sales tax internazionali.
- **Indie developer che vende plugin o temi** e ha bisogno di license key automatiche.
- **Creator che vende corsi, ebook, o template** e vuole un checkout bello senza costruirlo.
- **Membership site** con accesso ricorrente a contenuti o community.
- **Prodotti digitali one-shot** con refund e chargeback gestiti.

:::

:::warning Quando Lemon Squeezy non è la scelta giusta

- **Vendi prodotti fisici.** Manca la logistica. Per quello, Shopify o Amazon.
- **Hai bisogno di customizzazione estrema del checkout.** Stripe Checkout o un checkout custom su Stripe è più flessibile.
- **Hai volumi molto alti (>1M €/anno).** Il modello MoR ha un costo percentuale (5% + 50¢ per transazione) che, su volumi alti, può superare il costo di Stripe + TaxJar.
- **Hai requisiti di compliance specifici che richiedono di essere il merchant of record.** In quel caso, Stripe + consulenza fiscale è la strada.

:::

### Lemon Squeezy vs i concorrenti diretti

**Lemon Squeezy vs Paddle.** Paddle è il competitor più diretto. La differenza principale: Paddle ha un pricing più complesso (fee variabile per paese) ma più strumenti per enterprise (B2B billing, sales tax compliance). Lemon Squeezy ha un pricing più semplice (5% + 50¢) ed è più adatto a indie e small SaaS. Per enterprise con bisogni complessi, Paddle; per indie con bisogni semplici, Lemon Squeezy.

**Lemon Squeezy vs Stripe + TaxJar.** Stripe è un payment processor, non un MoR. Se usi Stripe, sei tu il merchant of record, e devi gestire tu le tasse (con l'aiuto di TaxJar o di consulenza fiscale). Il vantaggio di Stripe è la flessibilità del checkout, degli abbonamenti, e delle integrazioni. Il vantaggio di Lemon Squeezy è la semplicità fiscale. La scelta dipende da quanto vale per te la semplicità vs la flessibilità.

**Lemon Squeezy vs Gumroad.** Gumroad è focalizzato su creator (ebook, corsi, musica). Lemon Squeezy è più focalizzato su SaaS e software. Per un creator puro, Gumroad è più friendly. Per un SaaS, Lemon Squeezy è più strutturato (license key, usage-based, subscription).

**Lemon Squeezy vs FastSpring.** FastSpring è un MoR con focus su software, più enterprise di Lemon Squeezy. Per software company grandi con bisogni complessi (reseller, multi-store, compliance), FastSpring è preferibile. Per indie e piccole software house, Lemon Squeezy è sufficiente.

**Lemon Squeezy vs Pabbly.** Pabbly è più "automation + checkout" che MoR puro. È un'opzione economica per chi ha bisogni semplici, ma meno robusto per uso SaaS serio.

### Pricing di Lemon Squeezy

Il pricing è semplice e trasparente:

- **5% + 50¢ per transazione.** Nessun fee mensile, nessun fee di setup.
- **Zero commissioni** per tasse (perché Lemon Squeezy le gestisce per te, e le trattiene dal payout).
- **Volume discounts** disponibili per transazioni ad alto volume (contatta il sales).

Per un SaaS che fattura 10k €/mese con 100 transazioni, il costo è circa 500-550 €/mese. Per un SaaS che fattura 100k €/mese, il costo è circa 5k-5.5k €/mese — confrontabile con Stripe + TaxJar, ma con zero lavoro di compliance.

### Flusso pratico: un caso reale

Marco è un indie developer che ha lanciato un plugin per Notion. Prezzo: 49 € one-time o 99 €/anno subscription. Clienti in EU, US, e Australia.

**Settimana 1:** setup. Marco crea il prodotto in Lemon Squeezy, configura il checkout, genera le license key template.

**Settimana 2:** integrazione. Marco embedda il checkout sul suo sito con uno snippet, e configura i webhook per la generazione automatica delle license key al pagamento.

**Mese 1-3:** 50 clienti pagano, 30 in EU, 15 in US, 5 in AU. Marco riceve i payout ogni settimana, al netto delle tasse che Lemon Squeezy ha versato per lui. Il suo commercialista riceve le fatture in PDF direttamente da Lemon Squeezy.

**Senza Lemon Squeezy:** Marco avrebbe dovuto registrarsi al MOSS (EU VAT), gestire la sales tax US (50 stati), la GST australiana, e tenere la compliance fiscale aggiornata. Per un indie, è tempo e costo proibitivi.

ROI per Marco: pagare il 5% + 50¢ per transazione è enormemente più economico che pagare un consulente fiscale + gestire la compliance internazionale.

### Le domande che ci fanno più spesso

**Lemon Squeezy è un payment processor o un MoR?**
È un merchant of record. Il cliente compra da Lemon Squeezy, non da te. Questo ha vantaggi (compliance fiscale) e implicazioni (i termini di servizio sono con Lemon Squeezy, non con te).

**Quanto si paga?**
5% + 50¢ per transazione. Per transazioni internazionali, le fee del payment processor (Stripe, PayPal) sono già incluse.

**Posso personalizzare il checkout?**
Entro certi limiti: colori, logo, campo "thank you message". Per personalizzazione estrema, Stripe Checkout resta più flessibile.

**Lemon Squeezy supporta i rimborsi?**
Sì, con un self-service portal per il cliente. Puoi configurare policy di rimborso (es. "entro 30 giorni", "no rimborsi dopo 30 giorni").

**Lemon Squeezy è adatto a vendite B2B?**
Sì, ma ci sono limiti: la fatturazione B2B con VAT reverse charge richiede configurazione. Per B2B complessi, Paddle o Stripe sono preferibili.

**Posso usare Lemon Squeezy per un marketplace?**
No, Lemon Squeezy è per single-seller. Per marketplace, servono piattaforme come Stripe Connect.

**Lemon Squeezy supporta usage-based billing?**
Sì, con metering automatico. Il cliente paga in base all'uso reale (es. "X euro per 1000 chiamate API").

### Cosa ci aspettiamo da Lemon Squeezy nei prossimi mesi

Le aree da osservare:

- **Migliore supporto B2B.** Fatturazione con VAT ID, PO number, e termini di pagamento più flessibili.
- **Espansione geografica del tax handling.** Copertura di nuovi paesi in cui le regole fiscali digitali sono in evoluzione.
- **Migliore subscription management.** Pause, dunning avanzato, retention flows.
- **Migliore API e integrazioni.** Per team che vogliono costruire esperienze custom sopra Lemon Squeezy.

### In sintesi

Lemon Squeezy è un merchant of record eccellente per SaaS e prodotti digitali che vogliono vendere internazionale senza gestire la fiscalità. Il pricing è semplice, il checkout è bello, e la copertura fiscale è il vantaggio competitivo principale.

Per indie e piccole software house, è uno degli investimenti con ROI più diretto: paghi una percentuale, risparmi ore di lavoro di compliance fiscale. Per enterprise con bisogni complessi, Paddle o Stripe restano preferibili.

### Prossimi passi

- **Apri la scheda tool di Lemon Squeezy** per vedere pricing, integrazioni, e giudizio editoriale completo.
- **Confronta con altri merchant of record** nella raccolta dedicata.
- **Salva Lemon Squeezy nei preferiti** se vuoi tornarci dopo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
