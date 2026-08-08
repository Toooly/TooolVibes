### Cosa fa Tolt, in una frase

Tolt è una piattaforma di affiliate management pensata per SaaS che vogliono lanciare un programma di affiliazione o referral senza fee iniziali — collega Stripe, Paddle, Chargebee, o Shopify, e in 15 minuti hai un programma funzionante con dashboard per gli affiliati, tracking ricorrente, e payout globali.

Non è un "generico" affiliate tracker. È costruito specificamente per SaaS in abbonamento, dove la sfida non è tracciare una vendita singola ma tracciare un customer lifetime value e pagare commissioni che sopravvivono a upgrade, downgrade, refund, e cancellazioni.

### A chi serve davvero, e a chi no

Tolt funziona bene per:

**SaaS early-stage con Stripe, Paddle, o Chargebee.** Se sei un founder che ha appena lanciato e vuoi un programma di affiliazione subito, Tolt è probabilmente la scelta giusta. Setup in 15 minuti, integrazione nativa, pricing flat.

**SaaS mid-stage che vogliono uscire da Rewardful o FirstPromoter.** Se sei cresciuto oltre i limiti di quei tool, Tolt offre un upgrade path naturale con più features e pricing flat (vs commission cut).

**Indie maker con prodotti su Shopify.** Tolt si integra con Shopify per gestire commissioni su prodotti fisici o ibridi.

**SaaS B2B dove il customer LTV è alto.** In contesti B2B con LTV $5k-$50k, la capacità di Tolt di tracciare commissioni ricorrenti e gestire upgrade/downgrade diventa cruciale.

**Team che vogliono branded affiliate portal.** Tolt ti permette di ospitare il portale affiliati sul tuo dominio (es. affiliates.tuosito.com), che è una leva di trust importante.

Non è per:

**E-commerce puramente fisico ad alto volume.** Tolt è ottimizzato per SaaS e Shopify. Per e-commerce puro ad alto volume, tool come Refersion o UpPromote sono più adatti.

**Marketplace multi-vendor.** Tolt non è progettato per gestire pagamenti a vendor terzi in marketplace. Per quello, Stripe Connect, Adyen for Platforms.

**Enterprise con requisiti di compliance specifici.** Se hai bisogno di audit log, SSO, e compliance avanzata, Tolt non offre Enterprise plan in quel senso. Valuta FirstPromoter Enterprise o soluzioni custom.

**SaaS con +$50k MRR generato da affiliati.** A quel punto, il pricing flat di Tolt diventa meno interessante rispetto a soluzioni con commission percentage, e probabilmente hai bisogno di funzionalità enterprise.

### L'economia degli affiliati, spiegata davvero

Prima di scegliere Tolt (o qualsiasi piattaforma), devi capire l'economia del tuo programma. Tre numeri chiave:

**Costo per acquisizione (CAC) target.** Quanto sei disposto a pagare per un cliente acquisito via affiliato? Tipicamente, è 10-30% del primo MRR o del primo anno di revenue. Se il tuo ARPU è $50/mese, un CAC di $50-150 è ragionevole.

**Lifetime value (LTV).** Quanto vale un cliente nel tempo. Se il tuo churn è 5%/mese e ARPU è $50, l'LTV è circa $1.000. La regola: pagare fino al 20% dell'LTV come commissione è sostenibile.

**Commissions ricorrenti vs one-time.** La scelta più strategica. Tolt supporta entrambi:
- **One-time commission:** una tantum al signup, tipicamente 20-50% del primo pagamento. Cash flow negativo iniziale, ma limitato.
- **Recurring commission:** percentuale del MRR per la vita del cliente. Tipicamente 10-30% del MRR mensile o annuale. Allinea gli affiliati ai tuoi obiettivi di retention.
- **Hybrid:** una tantum + recurring ridotto. Esempio: 30% del primo pagamento + 10% recurring per 12 mesi. Bilanciato.

La scelta influenza il tipo di affiliati che attrai. One-time attira affiliati "spray and pray" che cercano il guadagno veloce. Recurring attira affiliati che credono nel prodotto e vogliono costruire un reddito passivo.

### Architettura tecnica: come funziona il tracking

Il tracking degli affiliati è più complesso di quanto sembri. Tolt risolve il problema con una serie di meccanismi.

**Tracking link.** Ogni affiliato riceve un link unico (es. toolt.com/?aff=ABC123 o tuosito.com/?via=ABC123). Tolt mette un cookie first-party sul browser del visitatore.

**Durata del cookie.** Configurabile (default 30-60 giorni). Se il visitatore converti entro quel periodo, la commissione va all'affiliato.

**Subdomain-safe tracking.** Tolt traccia attraverso root domain e subdomini (es. tuosito.com e app.tuosito.com). Importante se il marketing site e il product vivono su domini diversi.

**Sub-ID tracking.** Ogni link può avere sub-IDs (es. aff=ABC123&sub=email-campaign) per granular attribution. L'affiliato può segmentare le proprie campagne.

**Two-way billing sync.** Tolt si sincronizza con Stripe/Paddle/Chargebee in tempo reale: quando un customer subscribe, Tolt registra la commissione; quando upgrade, la commissione si aggiorna; quando cancel, la commissione si ferma; quando refund, la commissione viene dedotta. È la parte più critica e dove Tolt eccelle.

**Anti-fraud e self-referral prevention.** Tolt blocca self-referral (l'affiliato si registra come customer), detecta pattern sospetti, e permette approval manuale. Non perfetto, ma ragionevole.

### Pricing, onestamente

Tolt usa un modello tier basato sul revenue generato dagli affiliati (verificato luglio 2026):

- **Basic, $69/mese.** Fino a $10k/mese di revenue da affiliati. Unlimited affiliati e referrals, custom domain, branded portal, 2 programmi, 3 partner groups, 3 team members, 3 commission flows. Payouts manuali. Adatto a programmi early-stage.
- **Growth, $99/mese.** Fino a $20k/mese. Aggiunge auto payouts (2% processing fee), tax form collection (W-9/W-8, 1099), invoice generation, customizable email notifications. Adatto a programmi in crescita.
- **Pro, $199/mese.** Fino a $50k/mese. Unlimited programmi, custom payout methods, dedicated Slack channel, no "powered by Tolt" branding. Adatto a programmi maturi.
- **Enterprise, custom.** Programmi con +$50k/mese.

**Cosa NON è incluso al livello base che potresti aspettarti:**
- Auto payouts richiedono Growth.
- Customizable email notifications richiedono Growth.
- "No powered by Tolt" richiede Pro.
- White-label completo richiede Pro.

**Tolt ha alzato i prezzi 4 volte dal 2023.** Basic era $49, ora è $69 (+40%). Se firmi un budget annuale, tieni un 10-20% di tolleranza per futuri price increase.

**Tolt non prende commission percentage.** È una differenza sostanziale vs FirstPromoter (che prende fino al 5% del revenue generato da affiliati) o Impact (che prende 10-30%). Su programmi grossi, questo risparmio è significativo.

### Le feature chiave in profondità

**Branded affiliate portal.** Gli affiliati accedono a un portale ospitato sul tuo dominio (es. affiliates.tuosito.com), con i tuoi colori, il tuo logo, e la tua copy. Vede il loro link personale, click stats, conversion data, payout history, e materiali marketing. Su Basic c'è il "powered by Tolt" che sparisce solo su Pro.

**Recurring commission tracking.** La killer feature per SaaS. Tolt traccia upgrade, downgrade, refund, e cancellation in tempo reale, e aggiusta le commissioni di conseguenza. Se un customer upgrade da $50 a $100/mese, l'affiliato riceve commissione proporzionale. Se refund, la commissione viene dedotta.

**Custom commission per partner.** Puoi impostare commissioni diverse per singoli affiliati: 30% per i top performer, 20% per gli altri, 50% per i launch partner. La flessibilità è uno dei motivi per cui Tolt è apprezzato.

**Double-sided rewards (coupons).** L'affiliato può avere un coupon che dà uno sconto al customer E contemporaneamente genera commissione. È il pattern standard per SaaS con sconti di lancio.

**Global auto payouts.** Su Growth, pagamenti via PayPal, Wise, local bank, crypto, e wire. Con tax form collection (W-9/W-8 per US contractors) e 1099 filing. Per programmi con affiliati internazionali, è una manna.

**Custom referral link slugs.** L'affiliato può scegliere il suo slug (es. tuosito.com/?via=mario-rossi invece di tuosito.com/?via=ABC123). Migliore brand recognition.

**Email notifications.** Su Growth, puoi personalizzare le email che Tolt manda (signup, payout, referral, etc.). Su Basic, sono template fissi.

**Fraud detection.** Self-referral blocking, IP analysis, pattern detection. Non perfetto, ma ragionevole. Per frodi sofisticate, devi combinarlo con il tuo monitoring.

### Casi d'uso reali

**SaaS early-stage con primo programma di affiliazione.** Tolt Basic, custom domain, 1-2 programmi, commissioni 30% recurring. Setup: 1 ora. Primi affiliati via outreach personale. Risultato atteso: 5-15% del MRR da affiliati in 6 mesi.

**Indie maker su AppSumo o Product Hunt launch.** Tolt Basic, commissioni generose (40% recurring per 12 mesi) per creare buzz al lancio. Tracking del conversion post-launch.

**SaaS B2B con partner program.** Tolt Pro, multi-tier (referral partner, integration partner, agency partner), commissioni custom per tier, payout in valuta locale. Per programmi strutturati con relazioni a lungo termine.

**E-commerce ibrido su Shopify.** Tolt + Shopify, commissioni su prodotti fisici E digitali. Per brand che hanno sia SaaS sia shop.

**Agency che gestisce programmi per clienti.** Tolt Pro con white-label, branded portal per ogni cliente, gestione multi-tenant.

### Quando Tolt non è la scelta giusta

**Programmi con +$50k/mese di revenue affiliato.** A quel punto, valuta FirstPromoter Enterprise, Impact, o PartnerStack. Hanno funzionalità enterprise che Tolt non ha.

**E-commerce fisico puro.** Per marketplace fisici, Refersion, UpPromote, o soluzioni custom.

**Settori regolamentati con compliance specifica.** Se hai bisogno di audit log, SOC 2, HIPAA, non c'è un tier Enterprise di Tolt che copra questo.

**Integrazioni custom profonde.** Tolt ha webhooks e API, ma se devi fare integrazioni custom complesse, meglio soluzioni con API più mature (Impact, PartnerStack).

### Tolt vs FirstPromoter vs PartnerStack vs Rewardful vs Impact

**Tolt vs FirstPromoter.** FirstPromoter è il concorrente più diretto. Storicamente FirstPromoter prende 5% del revenue affiliato in tier più alti. Tolt ha 0% commission. Su programmi grossi, Tolt risparmia migliaia di dollari/anno. FirstPromoter ha più funzionalità enterprise (audit log, white-label, dedicated support). Per SaaS indie/mid-market, Tolt vince su prezzo. Per enterprise, FirstPromoter vince su features.

**Tolt vs PartnerStack.** PartnerStack è più enterprise-oriented, con focus su partner ecosystem (non solo affiliati ma anche resellers, integrators). Più costoso, più complesso, adatto a aziende con programmi partner strutturati. Tolt è più snello e focalizzato.

**Tolt vs Rewardful.** Rewardful è il tool entry-level per SaaS indie. Più economico (entry-level a $29/mese), meno funzionalità. Per chi parte da zero con budget limitato, Rewardful è OK. Tolt è il passo successivo naturale.

**Tolt vs Impact.** Impact è il leader enterprise. Ha la sua rete di affiliati, software maturo, e pricing enterprise. Per programmi che vogliono attingere alla rete Impact, è l'unica opzione. Tolt non ha una rete di affiliati propria.

**Tolt vs Refersion.** Refersion è più orientato a e-commerce, meno a SaaS. Tolt vince per SaaS.

### Setup pratico: da zero al primo affiliato attivo in un giorno

**1. Crea l'account.** Su tolt.com, signup, 14-day free trial, no credit card. 5 minuti.

**2. Connetti Stripe/Paddle/Chargebee.** Settings → Integrations. OAuth con il tuo account Stripe, autorizza Tolt a leggere customers, subscriptions, invoices. 5 minuti.

**3. Configura il primo programma.** Programs → New. Definisci nome, commissioni (percentage, recurring, duration), cookie duration. 15 minuti.

**4. Configura il branded portal.** Settings → Branding. Dominio personalizzato (es. affiliates.tuosito.com), colori, logo. 15 minuti.

**5. Definisci i materiali marketing.** Resources page con link, banner, email copy. Crea 2-3 asset base. 30 minuti.

**6. Testa con te stesso.** Crea un account affiliato di test, fai una simulazione di referral, verifica che la commissione venga tracciata. 15 minuti.

**7. Recluta i primi affiliati.** Outreach personale ai tuoi primi 10-20 candidati: blogger di nicchia, creator YouTube, podcast host, integration partners. 1-2 ore.

In un giorno hai un programma live. In una settimana, hai i primi affiliati attivi. In un mese, hai conversioni.

### Errori comuni

**Offrire commissioni troppo basse per attrarre affiliati.** Sotto 20% recurring, il programma fatica a competere con alternative. Allinea con i tuoi concorrenti.

**Non curare il branded portal.** Il portale affiliati è la prima impressione per i tuoi partner. Se è generico, la fiducia cala. Investi tempo in branding e copy.

**Ignorare l'onboarding degli affiliati.** Non basta pubblicare il link. Chiama i top affiliati, spiega il prodotto, dai loro accesso a materiali. Senza onboarding, il programma langue.

**Dimenticare di ottimizzare le commissioni.** A 6 mesi, analizza quali affiliati performano e quali no. Aumenta le commissioni per i top, riduci per gli inattivi.

**Sottovalutare l'attrito del payout.** Se i tuoi affiliati sono internazionali e tu non hai auto payouts (Growth), il payout manuale è un incubo. Cresci al tier superiore quando ne hai bisogno.

### Le domande che ci fanno più spesso

**Tolt è meglio di FirstPromoter?**
Dipende dal tuo programma. Tolt ha pricing flat (0% commission), FirstPromoter prende 5% su tier alti. Tolt ha meno funzionalità enterprise. Per SaaS indie/mid-market, Tolt vince.

**Quanto costa davvero un programma di affiliazione?**
Tolt Basic a $69/mese + i costi delle commissioni che paghi agli affiliati. Su un programma con $5k/mese di revenue da affiliati e 30% commission, paghi $1.500/mese agli affiliati + $69 a Tolt = $1.569/mese.

**Posso passare da Rewardful a Tolt?**
Sì, ma con effort. Esporti la lista affiliati, reimporti in Tolt, re-emetti i link, e gestisci il periodo di transizione. Pianifica 1-2 settimane.

**Funziona con Stripe Atlas?**
Sì, Tolt funziona con qualsiasi Stripe account. Stripe Atlas è un setup specifico ma l'integrazione è la stessa.

**Quanto devo pagare i miei affiliati?**
Dipende dal tuo LTV. Regola pratica: 20-30% recurring per SaaS con LTV $1k+. Per prodotti one-time, 20-50% del primo pagamento. Confronta con i concorrenti.

**Tolt fa marketing per trovare affiliati?**
No. Tolt è il software, non la rete. Trovare affiliati è il tuo lavoro (outreach, content marketing, conference, ecc.).

### Alternative da considerare

- **FirstPromoter.** Meno economico a programmi grossi, più features enterprise.
- **PartnerStack.** Enterprise, ecosystem partner, più costoso.
- **Rewardful.** Entry-level, meno features, più economico.
- **Impact.** Enterprise leader, con rete di affiliati propria.
- **Refersion.** E-commerce, meno adatto a SaaS.
- **Build custom con Stripe + dashboard.** Per team engineering con esigenze molto specifiche.

### Cosa ci aspettiamo da Tolt nei prossimi mesi

**Integrazione con più payment processor.** Shopify già supportato. Possibili espansioni a Lemon Squeezy, Recurly, o Chargebee 2.0.

**Più funzionalità di analytics.** Attribution migliore, segmentazione per fonte, lifetime value per affiliato. Sono richieste frequenti della community.

**API più matura.** Webhook e API esistenti, ma con limitazioni. Una API più completa aprirebbe use case enterprise.

**Compliance e audit.** W-9/W-8 e 1099 già su Growth. Possibili espansioni a GDPR compliance, audit log, e data residency EU per il mercato europeo.

### In sintesi

Tolt è una scelta eccellente per SaaS early e mid-stage che vogliono un programma di affiliazione self-serve, con pricing flat e zero commission cut. Il setup è veloce, l'integrazione con Stripe/Paddle/Chargebee è nativa, e le feature ricorrenti (commission tracking, branded portal) sono ben fatte.

Le limitazioni sono: tier alti che diventano costosi, funzionalità enterprise limitate, e prezzi che sono cambiati 4 volte in 3 anni (segnale da monitorare). Per il target giusto — SaaS indie/mid-market con programmi sotto $50k/mese di revenue affiliato — è una delle scelte migliori.

### Prossimi passi

- **Apri la scheda tool di Tolt** per confrontare con FirstPromoter, PartnerStack, e altri affiliate tool.
- **Esplora la raccolta su SaaS business** per casi d'uso affini.
- **Salva Tolt nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
