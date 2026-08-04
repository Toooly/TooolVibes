# High-Risk Claims — verifica umana richiesta prima dell'approvazione

Stato: staging builder-first-v1, 2026-08-04. Questo documento elenca tutto ciò che **deve** essere verificato da una persona prima che qualsiasi assessment entri nel registry canonico.

## 1. Rischio strutturale di questa fase

- **Nessun test hands-on**: tutti i 30 assessment sono basati su record del directory canonico + documentazione pubblica vendor. Nessuna sessione d'uso reale è stata eseguita.
- **Claim dal produttore**: gran parte delle evidenze su `experienceQuality` e `operationalMaturity` deriva da materiali vendor (siti, demo, documentazione). Sono claim di parte fino a verifica.
- **Pricing non riverificato**: nessun piano, prezzo o limite di piano è stato controllato il 2026-08-04. Il pricing di questi prodotti cambia spesso: va verificato prima della pubblicazione.
- **Feature non verificate**: export del codice, lock-in, integrazioni, permessi team, SLA e conformità non sono stati testati; dove valutati, il giudizio è prudenziale.

## 2. Dimensioni a confidenza bassa (per tool)

Giudizi con `confidence: bassa` — richiedono verifica diretta:

| Tool | Dimensioni a confidenza bassa |
|---|---|
| blink | experienceQuality, operationalMaturity |
| vibecode | experienceQuality, operationalMaturity |
| mocha | experienceQuality, operationalMaturity |
| meku | experienceQuality |
| jenni-ai | experienceQuality, operationalMaturity |
| betterpic | experienceQuality, operationalMaturity |
| imagine-art | experienceQuality, operationalMaturity |
| muse-ai | experienceQuality, operationalMaturity |
| socleads | experienceQuality, operationalMaturity |
| windsor-ai | experienceQuality |
| frase-ai | experienceQuality, operationalMaturity |
| notionapps | experienceQuality, operationalMaturity |
| blogify | experienceQuality, operationalMaturity |
| wegic | experienceQuality, operationalMaturity |
| vidau | experienceQuality, operationalMaturity |
| vibrantsnap | experienceQuality, operationalMaturity |
| reachifyme | experienceQuality, operationalMaturity |
| omi | easeOfUse, experienceQuality, operationalMaturity |
| flowise | experienceQuality |
| tolt | experienceQuality, operationalMaturity |
| agentx | experienceQuality, operationalMaturity |

## 3. Assessment a confidenza complessiva bassa

- **reachifyme** (6.0) — ampiezza 2, maturità operativa 2: prodotto giovane, poche fonti terze. Serve prova d'uso o almeno recensioni indipendenti prima di pubblicare.
- **omi** (4.8) — hardware wearable sperimentale: adozione 2, maturità 2. Il giudizio può cambiare molto con un test reale del dispositivo.

## 4. Claim specifici da verificare (campioni ad alto impatto)

- **blink / vibecode / mocha / wegic / meku**: reale qualità del codice generato e possibilità di esportarlo fuori dalla piattaforma (lock-in).
- **weweb**: tenuta "production-grade" su progetti con traffico reale; limiti dei piani su utenti/record.
- **v0**: qualità del codice esportato fuori dall'ecosistema Vercel.
- **cosmicjs**: limiti effettivi di API/record nei piani entry.
- **flowise**: copertura enterprise (auth, ruoli, audit) nelle versioni self-hosted vs cloud.
- **synthesia-ai**: conformità/licenze avatar e voci per uso commerciale; prezzi reali dei piani team.
- **lemon-squeezy**: stato del servizio post-acquisizione (Stripe) e roadmap Merchant of Record.
- **livechat / chatbot / helpdesk**: prezzi per agente e limiti di automazione nei piani pubblici.
- **windsor-ai**: accuratezza dell'attribution su casi reali multi-canale.
- **socleads**: conformità GDPR/termini delle fonti (Google Maps, LinkedIn scraping) — rischio legale da validare.
- **tolt**: integrazioni billing attualmente supportate (Stripe/Paddle/Chargebee) e limiti del piano.
- **jenni-ai / frase-ai / blogify**: qualità reale dell'output testuale e accuratezza delle citazioni/ottimizzazioni SEO.
- **omi**: stato reale dell'hardware, privacy delle registrazioni, maturità del software companion.

## 5. Fonti mancanti (da raccogliere prima dell'approvazione)

1. Sessioni hands-on o demo registrate per i tool con `experienceQuality` bassa-confidenza (21 tool).
2. Pagine pricing archiviate (data odierna) per tutti i 30 tool.
3. Almeno una fonte terza indipendente (recensione, community, caso d'uso pubblico) per reachifyme, omi, agentx, wegic, notionapps, socleads, tolt, vibecode.
4. Verifica legale/compliance per socleads (fonti dati) e synthesia-ai (diritti avatar/voci).

## 6. Regola di promozione

Nessuna entry con `overallConfidence: bassa` o con dimensioni operative a confidenza bassa dovrebbe entrare nel registry canonico senza che i punti sopra siano stati chiusi e registrati nell'assessment aggiornato.
