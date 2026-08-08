import "server-only";

import { cache } from "react";

import { getPublishedTools } from "@/lib/data/public-tools";
import {
  getPublishedArticlesFromSupabase,
  mapArticleToEditorialPost,
} from "@/lib/supabase/article-repository";
import { getPublishedArticlesFromArticleStorage } from "@/lib/supabase/article-storage-repository";
import { isSupabasePublicEnabled } from "@/lib/supabase/public-client";
import type {
  BlogArticleRecord,
  EditorialPostKind,
  EditorialPostRecord,
} from "@/lib/types/article";
import type { ToolPublic } from "@/lib/types/tool-public";

type GuideSeed = Omit<EditorialPostRecord, "kind"> & {
  kind: EditorialPostKind;
};

function uniqueText(values: Array<string | null | undefined>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

function getToolWriteupDate(tool: ToolPublic) {
  return (
    tool.publication.publishedAt ??
    tool.lifecycle.updatedAt ??
    tool.lifecycle.discoveredAt ??
    tool.lifecycle.createdAt
  );
}

function buildToolWriteup(tool: ToolPublic): EditorialPostRecord | null {
  const publishedAt = getToolWriteupDate(tool);

  if (!publishedAt) {
    return null;
  }

  const evidence = tool.editorial.evidence;
  const highlights = uniqueText([
    tool.content.bestFor,
    ...evidence
      .filter((item) =>
        ["highlight", "strength", "review", "rationale"].includes(item.kind),
      )
      .map((item) => item.text),
  ]).slice(0, 3);

  return {
    slug: tool.slug,
    title: tool.name,
    dek: tool.content.summary,
    summary: tool.content.description,
    kind: "tool-writeup",
    published_at: publishedAt,
    updated_at: tool.lifecycle.updatedAt ?? publishedAt,
    source_label: tool.provenance.sourceLabel ?? "Catalogo TooolVibes",
    source_url: tool.urls.editorial ?? tool.urls.website,
    tool_slug: tool.slug,
    featured: tool.flags.featured,
    highlights,
    details: tool.content.useCases.slice(0, 3),
    cautions: evidence
      .filter((item) => item.kind === "caution")
      .map((item) => item.text)
      .slice(0, 3),
  };
}

const guideSeeds: GuideSeed[] = [
  {
    slug: "betterpic",
    title: 'BetterPic: la guida onesta all\'headshot AI',
    dek: 'Cosa fa davvero, quando ti risparmia un fotografo, e quando invece non basta.',
    summary:
      "BetterPic genera headshot professionali a partire dai tuoi selfie, con consegna in meno di un'ora." +
      "Funziona bene per LinkedIn, CV e press kit standard, ma non sostituisce uno shooting reale. In" +
      "questa guida vediamo come usarlo al meglio, quanto costa, e come si posiziona contro alternative" +
      "come HeadshotPro e Aragon AI.",
    kind: "guide",
    tool_slug: 'betterpic',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/betterpic",
    featured: true,
    highlights: [
      "**Aggiornamento LinkedIn in giornata.** Consulente che cambia settore e vuole rinfrescare il profilo. Carica 12 selfie, sceglie preset corporate, scarica e pubblica. Tempo totale: 1-2 ore.",
      "**Press kit per founder early-stage.** Set uniforme in tempi rapidi, costo abbordabile.",
      "**Allineamento immagini del team.** Azienda con 10 persone che vogliono foto dal look coerente. Team pricing dedicato.",
      "**CV e portfolio per freelance.** Tempo minimo, immagine spendibile.",
      "**Print-ready a costi accessibili.** Tutti i tier sono 4K, quindi stampabile su banner, badge, press kit.",
    ],
    details: [
      "**Aggiornamento LinkedIn in giornata.** Consulente che cambia settore e vuole rinfrescare il profilo. Carica 12 selfie, sceglie preset corporate, scarica e pubblica. Tempo totale: 1-2 ore.",
      "**Press kit per founder early-stage.** Set uniforme in tempi rapidi, costo abbordabile.",
      "**Allineamento immagini del team.** Azienda con 10 persone che vogliono foto dal look coerente. Team pricing dedicato.",
    ],
    cautions: [
      "**Campagne stampa di alto livello.** Copertine, campagne adv nazionali, branded content premium.",
      "**Ritratti con direzione artistica.** Luce studiata, angolazione non convenzionale, look specifico.",
      "**Contesti in cui l'AI-generated è esplicitamente esclusa.** Alcune redazioni, agenzie, contesti corporate vietano le immagini AI.",
      "**Personal brand che deve trasmettere \"presenza\".** Speaker, mental coach, autori: serve uno shooting reale.",
      "**Volti con caratteristiche molto particolari.** Viso molto asimmetrico, barba insolita. L'AI può semplificare.",
    ],
      content_markdown: `### Cosa fa BetterPic, in una frase

BetterPic prende un set di selfie (8-14), li usa come riferimento biometrico, e ti restituisce un pacchetto di 20-120 ritratti generati in 4K in meno di due ore, con la possibilità di far ritoccare un'immagine da un editor umano sul tier Expert.

### A chi serve davvero, e a chi no

L'utente tipo di BetterPic è una persona che ha bisogno di "sembrare credibile" in tempi brevi, non di "sembrare un personaggio". In concreto:

- Consulenti, founder, manager che aggiornano LinkedIn dopo un cambio di ruolo o un rebranding personale.
- Freelance che devono pubblicare una foto sul sito e sui CV di proposte.
- Team aziendali che vogliono allineare lo stile delle foto interne senza organizzare uno shooting per 12 persone.
- Persone in transizione di carriera che non hanno foto recenti e non vogliono aspettare settimane.
- Press kit per founder early-stage che hanno bisogno di immagini credibili per giornalisti, podcast, pagine "About".

Non è il servizio giusto per chi cerca un ritratto riconoscibile, una direzione artistica precisa, o un'immagine destinata a una campagna adv di alto livello. In quei casi, un fotografo resta una scelta migliore.

### Come funziona, davvero

Il flusso è lineare, una volta dentro.

**1. Caricamento del set di selfie.** BetterPic chiede 8-14 foto in contesti diversi, con espressioni diverse, in condizioni di luce differenti. Selfie frontali, di tre quarti, in luce naturale, in luce interna, con e senza occhiali (se li porti solitamente). La piattaforma fornisce una mini-guida su come scattare: sfondo neutro, volto ben illuminato, niente gruppi. Meno foto del previsto da molti concorrenti (che chiedono 15-25) — è uno dei punti di accesso più semplici.

**2. Scelta dello stile.** BetterPic offre una libreria di preset organizzati per contesto: corporate, creativo, ambientato, tradizionale. La scelta del preset influenza molto il risultato finale. Un preset "corporate classico" produce sfondi neutri, giacca o maglia, luce morbida. Un preset "creativo" restituisce uno sfondo colorato, look più rilassato.

**3. Generazione.** L'algoritmo produce un pacchetto di scatti in 4K partendo dal volto di riferimento. Il tempo di attesa varia: 2 ore per il tier base, 1 ora per il tier top. L'utente riceve una notifica quando il pacchetto è pronto.

**4. Selezione e (opzionale) ritocco umano.** L'utente scarica il pacchetto e seleziona le immagini migliori. Solo il tier Expert include il ritocco umano (illimitato su 1 foto, con 1 redo gratuito). Per gli altri tier, gli AI edit sono limitati (2-8 per pacchetto) e il ritocco umano è un add-on a $8/edit.

**5. Utilizzo.** Le immagini sono fornite in 4K (long edge ~3840px), scaricabili in formati standard, con licenza commerciale. Il tier base (Basic, $35) include uso personale, Pro ($39) e Expert ($79) includono licenza commerciale. Per uso editoriale ad alta risoluzione o campagne, leggi i termini sul sito ufficiale.

:::tip Set di selfie ideale

Per risultati davvero buoni, prepara un set di almeno 10-12 selfie così composto:

- Luce naturale vicino a una finestra (almeno metà del set)
- Luce interna neutra (almeno 3-4 foto)
- Espressioni diverse: neutro, mezzo sorriso, sorriso pieno
- Angolazioni: frontale, leggero tre quarti a sinistra, a destra
- Sfondi diversi: muro chiaro, muro scuro, sfocato
- Eventuali accessori che usi abitualmente: occhiali, orecchini

Scatta in momenti diversi: la varietà è la materia prima del modello.

:::

### La qualità dell'output, onestamente

BetterPic non è magia, e non è nemmeno fuffa. Il risultato dipende da tre fattori.

**Qualità del set di input.** Se le foto sono sfocate, in controluce, tutte con la stessa espressione e la stessa angolazione, l'output sarà piatto. Se sono varie, ben esposte, con espressioni differenti, l'output sarà molto più ricco.

**Preset scelto.** I preset corporate e tradizionali sono i più conservativi, e quindi i più "sicuri" per LinkedIn, CV, contesti formali. I preset creativi e ambientati producono risultati più distintivi, ma anche più rischiosi se l'uso finale è corporate.

**Tier e uman edit.** Il pacchetto base è accettabile, ma su volti con asimmetrie marcate, occhiali dalla montatura spessa, barbe molto folte, l'AI può generare artefatti. Il ritocco umano (solo Expert) risolve la maggior parte di questi problemi. Per gli altri tier, gli AI edit aiutano ma non sostituiscono un editor umano.

### Quanto costa, con i numeri reali

BetterPic usa un modello one-time payment (verificato luglio 2026):

| Tier | Prezzo | Foto | Stili | Tempo | AI edits | Human edits | Licenza |
|------|--------|------|-------|-------|----------|-------------|---------|
| Basic | $35 | 20 | 1 | 2 ore | 2 | 0 | Personale |
| Pro | $39 | 60 | 3 | 1.5 ore | 4 | 0 | Commerciale |
| Expert | $79 | 120 | 6 | 1 ora | 8 | Unlimited su 1 foto + 1 redo | Commerciale |

**Add-ons:** $8 per human edit extra, $10 per redo completo (ri-elabora da nuove foto).

**Team pricing:** quote-based, via teams.betterpic.io. 60 foto/persona, dashboard custom, human touch-up, EU data residency per GDPR. Non c'è un prezzo per-seat pubblicato.

**Politica di refund:** 7 giorni, ma i refund sono negati se hai già scaricato le immagini. Quindi: valuta bene prima di scaricare.

Per confronto:

- Shooting fotografico professionale: 150-500 euro, 1-3 settimane di attesa.
- HeadshotPro: stesso segmento, pricing simile ($29-$59).
- Photoshop + freelancer: variabile, 50-200 euro.

Il vantaggio economico di BetterPic è chiaro per chi ha bisogno di un headshot in tempi brevi. Il divario si riduce quando serve il ritocco umano di qualità, perché a quel punto il costo di BetterPic Expert si avvicina a quello di un fotografo entry-level.

### Quando BetterPic funziona bene

:::pro Casi d'uso in cui BetterPic è la scelta giusta

- **Aggiornamento LinkedIn in giornata.** Consulente che cambia settore e vuole rinfrescare il profilo. Carica 12 selfie, sceglie preset corporate, scarica e pubblica. Tempo totale: 1-2 ore.
- **Press kit per founder early-stage.** Set uniforme in tempi rapidi, costo abbordabile.
- **Allineamento immagini del team.** Azienda con 10 persone che vogliono foto dal look coerente. Team pricing dedicato.
- **CV e portfolio per freelance.** Tempo minimo, immagine spendibile.
- **Print-ready a costi accessibili.** Tutti i tier sono 4K, quindi stampabile su banner, badge, press kit.

:::

### Quando BetterPic non è la scelta giusta

:::warning Casi in cui uno shooting resta superiore

- **Campagne stampa di alto livello.** Copertine, campagne adv nazionali, branded content premium.
- **Ritratti con direzione artistica.** Luce studiata, angolazione non convenzionale, look specifico.
- **Contesti in cui l'AI-generated è esplicitamente esclusa.** Alcune redazioni, agenzie, contesti corporate vietano le immagini AI.
- **Personal brand che deve trasmettere "presenza".** Speaker, mental coach, autori: serve uno shooting reale.
- **Volti con caratteristiche molto particolari.** Viso molto asimmetrico, barba insolita. L'AI può semplificare.

:::

### BetterPic vs i concorrenti diretti

**BetterPic vs HeadshotPro.** Stesso segmento, pricing simile. BetterPic ha 4K su tutti i tier, HeadshotPro ha 4K solo sul premium. Per uso corporate rapido, BetterPic è più lineare. Per personalizzazione fine, HeadshotPro ha più opzioni.

**BetterPic vs Aragon AI.** Stesso segmento, pricing simile. Aragon ha consegna più veloce (15 min sul premium) e più foto incluse (40-100). BetterPic ha 4K su tutti i tier, e uman edit su Expert. Per chi cerca velocità, Aragon. Per chi cerca risoluzione, BetterPic.

**BetterPic vs Secta Labs.** Secta è posizionato più in alto, con un ex-fotografo Apple. Singolo tier a $49, 200-300 foto, alta-def ma non 4K-marketed. Per "look da copertina" distinctive, Secta. Per uso corporate standard, BetterPic.

**BetterPic vs un fotografo.** Non è un confronto equi: sono prodotti diversi. Il fotografo vince su qualità e distintività. BetterPic vince su tempi, costi, e scalabilità. Se hai un mese, scegli il fotografo. Se devi farlo in una giornata, scegli BetterPic.

### Il protocollo di scatto che fa la differenza

:::tip Checklist operativa

Prima di aprire BetterPic:

- [ ] Almeno 10 foto, idealmente 12-14
- [ ] Luce naturale vicino a una finestra in almeno metà del set
- [ ] Espressioni miste: neutro, sorriso leggero, sorriso pieno
- [ ] Angolazioni miste: frontale, tre quarti a sinistra, tre qualti a destra
- [ ] Sfondi neutri (muro chiaro, muro scuro, sfocato)
- [ ] Niente gruppi, niente altre persone nel frame
- [ ] Se porti occhiali, almeno metà delle foto con gli occhiali
- [ ] Niente filtri, niente modifiche, niente HDR spinto
- [ ] Foto nitide, non sfocate
- [ ] Niente tagli che nascondano il mento o la fronte

Dopo aver scattato:

- [ ] Controlla che ogni foto sia a fuoco sul viso
- [ ] Scarta i duplicati quasi identici
- [ ] Mantieni una varietà reale, non 12 varianti della stessa inquadratura

:::

### Un caso reale: Marco

Marco è un consulente marketing, 38 anni, ha cambiato azienda dopo otto anni, e vuole rinfrescare la sua presenza LinkedIn prima di fare outreach commerciale. Tempo: il weekend. Budget: minimo.

Venerdì sera: scatta 12 selfie in casa, davanti a una finestra, contro un muro bianco, in quattro "set" diversi (cambio maglia, cambio luce naturale, cambio espressione). Seleziona le 12 migliori.

Sabato mattina: si iscrive a BetterPic, carica le foto, sceglie preset "corporate classico". Tempo di generazione: 38 minuti sul tier Pro. Scarica il pacchetto, seleziona 4 immagini.

Sabato pomeriggio: aggiorna LinkedIn con la nuova foto. Aggiorna anche la foto del sito personale.

Costo totale: $39 (Pro). Tempo totale: meno di 3 ore. Risultato: un headshot credibile, allineato al tono corporate, sufficiente per uso LinkedIn e CV.

Per il sito personale, Marco decide di investire in uno shooting reale con un fotografo locale il mese successivo. BetterPic gli ha dato il "credito visivo" in attesa di una soluzione di qualità superiore.

### Le domande che ci fanno più spesso

**BetterPic funziona davvero con pochi selfie?**
Sì, è uno dei punti di forza. 8-14 foto sono sufficienti. Sotto quella soglia la qualità cala. Sopra 20, non migliora significativamente.

**Gli headshot sono riconoscibili come AI-generated?**
A un osservatore attento ravvicinato, sì. A un recruiter che scorre LinkedIn, no. Per uso professionale standard l'output regge. Per uso editoriale ad alta risoluzione no.

**Posso scegliere lo stile?**
Sì, ci sono preset preconfigurati. La personalizzazione fine (composizione, sfondo specifico, tipo di luce) ha limiti strutturali: l'AI non è un editor.

**Il tier base (Basic) include la licenza commerciale?**
No. Basic ($35) è per uso personale. Pro ($39) e Expert ($79) includono licenza commerciale. Per uso business, salta Basic.

**Posso usare le immagini per un annuncio stampa o per un cliente?**
Con Pro o Expert sì, sotto i termini della licenza. Per usi commerciali estesi (campagna adv nazionale, branded content per brand premium), verifica i termini sul sito.

**BetterPic è meglio di uno shooting tradizionale?**
No, se hai tempo e budget. Sì, se ti serve velocità e credibilità di base. La risposta onesta è: dipende da quanto vale per te la differenza.

**E se l'output non mi piace?**
Hai AI edits (2 su Basic, 4 su Pro, 8 su Expert) inclusi. Expert include anche 1 redo gratuito e human edits illimitati su 1 foto. Se ancora non ti piace, il refund è di 7 giorni ma solo se non hai scaricato.

### Alternative da considerare

- **HeadshotPro.** Stesso segmento, pricing simile. Più stili, meno 4K.
- **Aragon AI.** Più veloce, più foto, premium solo per 4K.
- **Secta Labs.** Premium, look distintivo, ex-fotografo Apple.
- **Shooting tradizionale.** Resta il riferimento per qualità assoluta. 150-500 euro, 1-3 settimane.
- **ShootProof + fotografo locale.** Per chi vuole un fotografo a tariffe accessibili.

### Cosa ci aspettiamo da BetterPic nei prossimi mesi

- **Miglioramenti del ritocco umano.** Se BetterPic investe sull'upsell del ritocco umano, la differenza con un fotografo entry-level si riduce ulteriormente.
- **Personalizzazione del preset.** Se la piattaforma apre a preset più flessibili, la qualità per usi specifici (legale, medical, creative) migliora.
- **Politiche sui diritti.** La chiarezza delle licenze per uso commerciale è una delle aree che più spesso genera confusione. Policy più esplicite aiutano.
- **Integrazione con tool di personal brand.** LinkedIn, CRM, podcast platform, se nascono integrazioni dirette il flusso si accorcia.

### In sintesi

BetterPic è una risposta concreta a un bisogno reale: immagini profilo credibili in tempi rapidi, a costi accessibili, con risoluzione 4K su tutti i tier. Non sostituisce uno shooting professionale, e non è adatto a produzioni editoriali di alto livello. Risponde bene alla maggior parte delle esigenze di personal brand standard, e può essere un buon primo step prima di investire in una soluzione fotografica completa.

La chiave è capire il proprio use case: se serve "credibile e veloce" in 4K, BetterPic è una scelta valida. Se serve "distintivo e ad alto impatto", meglio investire in un fotografo.

### Prossimi passi

- **Apri la scheda tool di BetterPic** per vedere pricing, integrazioni, e giudizio editoriale completo.
- **Confronta con altre soluzioni immagini AI** nella raccolta dedicata.
- **Salva BetterPic nei preferiti** se vuoi tornarci dopo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "frase-ai",
    title: 'Frase: come funziona davvero la piattaforma SEO + content workflow',
    dek: 'Brief SERP, drafting e ottimizzazione nello stesso spazio: una guida onesta.',
    summary:
      "Frase è una piattaforma SEO e content workflow che unisce analisi SERP, generazione di brief e" +
      "scrittura assistita. In questa guida vediamo come usarlo per content team, agenzie e in-house," +
      "quando vale l'investimento, e come si posiziona contro Surfer SEO, Clearscope, MarketMuse e i nuovi" +
      "tool AI-first.",
    kind: "guide",
    tool_slug: 'frase-ai',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/frase-ai",
    featured: true,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Frase, in una frase

Frase è una piattaforma SEO + GEO end-to-end che fa ricerca SERP, genera brief, scrive draft ottimizzati, pubblica sul CMS, monitora il ranking su Google, e traccia la visibilità su ChatGPT, Perplexity, Google AI, Claude, e Gemini — in un workflow solo invece di cinque tool separati.

Non è un content generator. È un sistema operativo per il content marketing che ha capito che il gioco non è più solo "rank su Google", è "essere citato dagli AI answer engine".

### A chi serve davvero, e a chi no

Frase funziona bene per:

**Content team in-house che pubblicano 10+ articoli al mese.** Quando il volume è alto, il collo di bottiglia è il workflow: brief, scrittura, ottimizzazione, pubblicazione, monitoraggio. Frase automatizza i primi quattro e strumenta il quinto. Il ROI si vede già dal secondo mese.

**Agenzie SEO con più clienti.** Il tier Scale (fino a 10 domini) è progettato per agency. Brand portal, white-label report, e multi-domain tracking sono fatti per il workflow agency.

**SEO specialist che vogliono integrare GEO nel loro stack.** Il 2026 è l'anno in cui "GEO" (Generative Engine Optimization) è entrato nel mainstream. Frase traccia visibilità su 5 AI engine, e questo è uno dei motivi per cui il pricing è aumentato: vale il delta.

**Team che usano WordPress, Webflow, Sanity, o Wix come CMS primario.** Il publish one-click elimina un passaggio manuale che rallenta il flusso.

Non è la scelta giusta per:

**Chi scrive 2-3 articoli al mese.** Il pricing non giustifica, e il workflow è sovradimensionato. Per volumi bassi, Surfer SEO o Clearscope sono sufficienti.

**Chi fa blog post puramente editoriali senza intento SEO.** Frase ottimizza per rank e citazione AI. Se il tuo obiettivo è solo "scrivere bene", è un tool sbagliato.

**Team che hanno già un workflow consolidato su tool diversi.** Migrare a Frase ha un costo di apprendimento e disruption. Se il tuo team è già produttivo con Ahrefs + Surfer + Notion, Frase non migliorerà magicamente.

**Enterprise con requisiti di compliance o on-premise.** Frase è cloud-only. Se devi on-premise, non è la scelta.

### Il workflow reale, end-to-end

Ecco come un team serio usa Frase nel 2026. Non è il marketing pitch, è il pattern operativo.

**1. Research e brief.** Partenza: hai una lista di keyword o topic da coprire. Apri Frase, lanci la ricerca SERP per la keyword target. Frase analizza i top 20 risultati Google, estrae headings, lunghezze medie, statistiche citate, domande People Also Ask, e domande da Reddit e Quora. Genera un brief con outline suggerito, keyword target, suggerimenti NLP, e link a fonti.

Il valore: in 5-10 minuti hai un brief che manualmente richiederebbe 1-2 ore di ricerca. La qualità del brief dipende dalla keyword: keyword competitive danno brief più ricchi, keyword di nicchia danno brief più scarni.

**2. Drafting assistito.** Apri l'editor di Frase, incolla il brief, e scrivi. Mentre scrivi, Frase mostra in real-time:
- Topic score: quanto il tuo draft copre i topic che i top risultati coprono
- SEO score: keyword density, struttura, lunghezza
- GEO score: come il tuo draft si posiziona per essere citato dagli AI engine
- Suggerimenti NLP: keyword correlate da includere
- Domande da coprire: PAA e Reddit che non hai ancora risposto

Il valore: in tempo reale sai se stai scrivendo un articolo "rank-ready" o se ti stai allontanando. Niente più "ottimizzo dopo", l'ottimizzazione è nel flusso.

**3. AI assistita.** Se vuoi accelerare, Frase AI scrive sezioni del draft basandosi sul brief. Il livello di qualità è onesto: buono per bozze di sezioni standard, mediocre per sezioni che richiedono visione editoriale forte. Il pattern corretto è: tu scrivi la struttura e le idee chiave, Frase AI riempie le sezioni standard (definitions, backgrounds, summary), tu raffini e aggiungi il punto di vista.

**4. Ottimizzazione finale.** Quando il draft è completo, rivedi i tre score (Topic, SEO, GEO). Punta Topic score sopra 80% per keyword competitive. Il GEO score è più sfumato: Frase suggerisce formattazione (liste, tabelle, FAQ strutturate) che aumenta la probabilità di essere citato dagli AI engine.

**5. Publish one-click.** Se usi WordPress, Webflow, Sanity, o Wix, clicchi "Publish" e Frase manda l'articolo al CMS con metadata SEO, immagini ottimizzate, e structured data. Se usi un CMS diverso, copi il markdown o esporti l'HTML.

**6. Monitoraggio.** Dopo la pubblicazione, l'articolo entra nel monitoring di Frase:
- Google ranking: posizione sulla SERP per la keyword target
- Traffic da GSC: click e impression (se hai collegato Google Search Console)
- AI visibility: quante volte l'articolo è citato da ChatGPT, Perplexity, Google AI, Claude, Gemini
- Content decay: se l'articolo inizia a perdere rank, Content Guard ti avvisa

**7. Content Guard e fix.** Questa è la feature che distingue Frase nel 2026. Content Guard monitora la pagina pubblicata, e quando rileva un calo di ranking, genera automaticamente un draft di revisione basato sui fattori che sono cambiati (nuovi competitor, aggiornamento di Google, query trends). Tu approvi, modifichi, o rifiuti. È un'evoluzione del "content refresh periodico" che di solito non fai perché è noioso.

### Pricing, spiegato onestamente

I piani (verificati sulla pagina ufficiale a luglio 2026, annual billing):

**Starter, $39/mese annuale ($49/mese mensile).** 1 seat, 1 sito, 10 articoli/mese, 50 audit pages, SEO + GEO score, AI visibility su ChatGPT e Google AI, Content Guard su 3 pagine, Frase CMS free. Adatto a freelance, blogger, e piccole attività.

**Professional, $103/mese annuale ($129 mensile).** 3 seat inclusi ($29/mese per seat extra), 5 siti, 40 articoli/mese, 250 audit pages, internal linking suggestions, AI crawler monitoring, Perplexity aggiunto al monitoring, Content Guard su 15 pagine. Adatto a team in-house e agenzie piccole.

**Scale, $239/mese annuale ($299 mensile).** 5 seat, 10 domini, 100 articoli/mese, 1000 audit pages, Content Guard su 50 pagine, Claude e Gemini aggiunti al monitoring, white-label client reports, repurposing automatico. Adatto a team content strutturati e agenzie.

**Enterprise, custom.** White-label report, branded client portal, custom domain, support dedicato.

**FraseCMS** è un'opzione separata: gratis con 100k page views/mese, Basic $19/mese per 250k views, Pro $99/mese per 1M views. È l'opzione "non ho un CMS, ospitalo voi".

**Add-ons pay-as-you-go:** su Professional, $5 per articolo extra, $0.50 per audit page extra, $0.25 per AI prompt extra. Su Scale, $4, $0.40, e $0.20 rispettivamente.

**Cambiamento importante del 2026:** GEO tracking (visibilità su AI engine) è ora incluso in tutti i piani, senza add-on separato. Prima del 2026, era un $35/mese add-on. Questo rende Frase significativamente più conveniente rispetto a prima.

**Costo modello AI:** le funzionalità AI (drafting, Content Guard revisions) consumano credits. Il tier include un numero base, e l'overage è pay-as-you-go. Su un team Professional che produce 40 articoli/mese, il costo AI tipico è $20-50 in più.

### Le funzionalità chiave in profondità

**SERP Analyzer.** Il core dell'analisi competitiva. Per una data keyword, estrae i top 20 risultati Google, analizza headings (H1, H2, H3), lunghezze medie, domande People Also Ask, snippet in evidenza, e backlink overview. Genera un brief "rank-ready" che identifica cosa serve per competere. È la funzione su cui Frase ha costruito la sua reputazione.

**AI Writer con brand voice.** Genera testo basandosi sul brief. La qualità è migliore dei generatori generici perché è ancorata al brief SERP. Il "brand voice" è una funzione recente: carichi 3-5 articoli del tuo brand, Frase estrae tono, vocabolario, e stile, e l'AI scrive "come te". La qualità è variabile — su argomenti tecnici con dati, funziona; su opinion piece, è mediocre.

**GEO (Generative Engine Optimization).** Questa è la funzionalità che definisce Frase nel 2026. Il GEO score misura quanto il tuo draft è strutturato per essere citato dagli AI answer engine. Fattori considerati: presenza di definizioni chiare, struttura a domanda-risposta, tabelle comparative, FAQ strutturate, citazioni autorevoli, lunghezza adeguata. Non è magia: è un insieme di best practice SEO evolute per il contesto AI. Funziona meglio di quanto ti aspetti, e diventa un vantaggio competitivo quando i concorrenti ignorano ancora GEO.

**Content Guard.** Monitoring post-pubblicazione. Tiene d'occhio le pagine pubblicate per cambiamenti di ranking, e quando rileva un calo, genera un draft di revisione. Su Starter monitora 3 pagine, su Professional 15, su Scale 50. Per team content, è la funzione che giustifica il tier superiore.

**AI Visibility tracking.** Traccia quanto i tuoi contenuti sono citati dagli AI engine. Su Starter, ChatGPT e Google AI. Su Professional, aggiunge Perplexity. Su Scale, aggiunge Claude e Gemini. Mostra la "share of voice" rispetto ai competitor per una data query. È il nuovo "rank tracking" per il 2026.

**Internal linking suggestions.** Suggerisce link interni tra i tuoi articoli in base a topic similarity. Su Professional e superiori. Fa risparmiare ore di audit manuale.

**Programmatic SEO.** Su Scale. Genera pagine SEO programmatiche per location pages, directory, e use case combinations. Richiede setup tecnico, ma per SaaS con multi-location o multi-product è un moltiplicatore di traffico organico.

**AI agenti specializzati.** Su tutti i piani, 80+ agenti specializzati che gestiscono task specifici: research, outline, drafting, optimization, audit, publishing. È il pattern "agent for everything", e funziona meglio quando lo usi come collaboratore, non come sostituto.

### Cosa fa bene, e cosa fa male

**Fa bene:** SERP research, brief generation, draft assistito, GEO optimization, AI visibility tracking, Content Guard. Sono i suoi superpoteri, e in queste aree è tra i migliori sul mercato.

**Fa meno bene:** project management (non gestisce workflow editoriali complessi), content calendar (esiste ma è basilare), team collaboration (commenti e review sì, ma non è Notion), multilingual SEO (supporta ma con qualità variabile).

**Fa male:** articoli puramente editoriali senza intento di rank, content ultra-creativi dove il punto di vista personale è centrale, articoli che richiedono fonti primarie o interviste originali.

### Frase vs Surfer vs Clearscope vs MarketMuse

**Frase vs Surfer SEO.** Surfer è focalizzato sull'ottimizzazione on-page: SERP analysis, content editor, NLP suggestions. È più specializzato, più economico (entry-level a $89/mese vs Frase $39), ma non ha la pipeline publishing, il GEO, l'AI visibility. Per team che vogliono solo "ottimizza bene questo articolo", Surfer è più focalizzato. Per team che vogliono un workflow completo, Frase vince.

**Frase vs Clearscope.** Clearscope è il premium tool per content optimization. Report SEO di alta qualità, content grading sofisticato, ma niente drafting AI, niente publishing, niente GEO. Per team che hanno già un draft e vogliono uno score di qualità serio, Clearscope è superiore. Per team che vogliono un workflow completo, Frase vince.

**Frase vs MarketMuse.** MarketMuse è enterprise-oriented, con focus su content inventory e topic clusters. Più costoso, più complesso, più adatto a team content strutturati in aziende grandi. Per team con 5-10 persone che fanno content marketing, Frase è più accessibile. Per team con 30+ content people, MarketMuse è più adatto.

**Frase vs tool "free + DIY".** Clearscope, Surfer, e altri sono più economici del 2024 grazie a nuovi competitor. Frase ha il vantaggio dell'integrazione end-to-end, ma se il tuo workflow è già "Ahrefs per keyword + Surfer per optimize + Notion per scrivere", Frase non migliorerà di 10x.

### Casi d'uso reali

**SaaS blog con 30 articoli/mese.** Tier Professional. Research SERP per ogni articolo, brief rank-ready, drafting AI-assisted, GEO score, publish su WordPress, monitoraggio. Tempo per articolo: 2-3 ore (vs 5-6 ore senza Frase).

**Agenzia SEO con 8 clienti.** Tier Scale, 5 seat, 10 domini. Workflow per ogni cliente: research, brief, draft, review, publish, monitor. Report white-label mensili. Risparmio operativo: 30-50% del tempo del team.

**E-commerce con 100+ pagine prodotto.** Tier Professional, focus su programmatic SEO. Genera pagine per category + location, ottimizza description prodotti, monitora ranking su long-tail keywords.

**Editorial site senza intento SEO.** Frase è il tool sbagliato. Per editorial puro, strumenti di collaborative writing (Notion, Google Docs) sono sufficienti.

### Setup pratico: da zero al primo articolo pubblicato in 2 ore

**1. Crea l'account e collega il tuo CMS.** Su frase.io, signup con Google. Collega WordPress via plugin, Webflow via API, o configura un altro CMS. Tempo: 15 minuti.

**2. Configura il primo progetto.** Settings → Projects. Aggiungi il tuo sito, configura il brand voice caricando 3-5 articoli esistenti. Tempo: 20 minuti.

**3. Collega Google Search Console.** Settings → Integrations → GSC. Questo abilita il monitoraggio di click, impression, e position. Tempo: 5 minuti.

**4. Fai la prima ricerca.** "Research" → inserisci una keyword target. Frase genera il brief. Tempo: 5 minuti.

**5. Scrivi o usa l'AI.** Apri l'editor, parti dal brief, scrivi o usa AI Writer. Monitora i tre score. Tempo: 60-90 minuti.

**6. Pubblica.** Clicca "Publish" per mandare al CMS, o esporta. Tempo: 5 minuti.

**7. Configura il monitoraggio.** L'articolo pubblicato entra automaticamente in monitoraggio. Content Guard inizia a guardarlo. Tempo: 1 minuto.

In 2 ore hai un articolo rank-ready, pubblicato, e monitorato. Per il secondo articolo il tempo scende a 60-90 minuti perché conosci già il workflow.

### Errori comuni

**Affidarsi troppo all'AI Writer.** L'AI scrive bozze decenti ma generiche. Il punto di vista editoriale, le idee non-ovvie, e la voce del brand devono venire da te. Frase è un acceleratore, non un sostituto.

**Ignorare il GEO score.** Molti team SEO sono ancora ancorati al SEO score classico. Il GEO score è altrettanto importante nel 2026. Ignorarlo significa perdere visibilità su ChatGPT e Perplexity.

**Non collegare GSC.** Senza GSC, il monitoraggio post-pubblicazione è cieco sui dati di click e impression reali. Collegalo il primo giorno.

**Produurre troppo velocemente senza quality check.** Il workflow Frase è veloce, ma la qualità editoriale finale è ancora responsabilità tua. Review sempre, specialmente per articoli che vanno su testate con reputazione.

**Non aggiornare i brief con dati freschi.** Il SERP cambia. Un brief di 3 mesi fa può essere superato. Per keyword competitive, rifai la research prima di aggiornare un articolo.

### Cosa ci aspettiamo da Frase nei prossimi mesi

**GEO sempre più centrale.** Man mano che gli AI engine diventano una quota maggiore del traffico referral, GEO diventa la metrica principale. Frase ha un vantaggio first-mover qui.

**Più agenti specializzati.** La roadmap è verso agenti che gestiscono workflow sempre più complessi in autonomia, con review umana finale.

**Integrazione AI engine più profonda.** Tracciamento di citazioni specifiche, non solo presenza. Mostrarti esattamente quali frasi del tuo articolo sono state usate, in quali prompt.

**Multi-modal GEO.** GEO per video (YouTube come answer engine), audio (voice search), immagini. Espansione oltre il text.

### Le domande che ci fanno più spesso

**Frase è meglio di ChatGPT per scrivere articoli?**
Per articoli SEO con intento di rank, sì. ChatGPT non ha il SERP context, non sa cosa è già rankato, non genera il brief. Per brainstorming o scrittura libera, ChatGPT va altrettanto bene.

**Quanto costa davvero un articolo rank-ready?**
Su Professional con 40 articoli inclusi, il costo marginale è il tuo tempo + l'overage AI. Un articolo "rank-ready" in 2-3 ore è realistico. Su Surfer puro, lo stesso articolo richiede 1-2 ore in più per il workflow di ottimizzazione.

**Frase può sostituire un SEO specialist?**
No, ma può aumentare la produttività del SEO specialist di 2-3x. Il SEO specialist fa la strategia, l'analisi, le decisioni. Frase esegue.

**Funziona per mercati non-anglofoni?**
Sì, supporta multi-lingua. La qualità della SERP analysis è migliore in inglese (database più ricco), ma funziona bene anche per italiano, spagnolo, francese, tedesco.

**Frase vs Ahrefs?**
Sono complementari, non concorrenti. Ahrefs è per keyword research, backlink analysis, competitor research. Frase è per content creation, optimization, GEO. Li usi insieme.

### Alternative da considerare

- **Surfer SEO.** Più focalizzato sull'optimization, meno sul workflow completo.
- **Clearscope.** Premium content grading, niente AI drafting.
- **MarketMuse.** Enterprise content strategy, più costoso.
- **WriterZen.** Budget-friendly, funzionalità simili ma meno profonde.
- **Scalenut.** AI-first, buon rapporto qualità/prezzo.
- **DIY (Ahrefs + Surfer + Notion).** Più flessibile, più lavoro manuale.

### In sintesi

Frase nel 2026 è uno dei tool più completi per content marketing SEO + GEO. Non è il più economico, ma l'integrazione end-to-end e il focus su GEO lo rendono particolarmente rilevante per team che pubblicano regolarmente. Per il blogger occasionale è overkill; per il content team strutturato è uno dei migliori investimenti.

### Prossimi passi

- **Apri la scheda tool di Frase** per confrontare con Surfer, Clearscope, e altri SEO tool.
- **Esplora la raccolta su SEO e content** per casi d'uso affini.
- **Salva Frase nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "jenny-ai",
    title: 'Jenni AI: la guida onesta all\'assistente di scrittura accademica',
    dek: 'Quando ha senso usarlo per paper, tesi e ricerca, e quando non basta.',
    summary:
      "Jenni AI è un assistente di scrittura pensato per il mondo accademico: aiuta con bozze, citazioni," +
      "gestione fonti e revisione. In questa guida vediamo come funziona, quando è davvero utile (tesi," +
      "paper, revisioni sistematiche), e dove invece è meglio affidarsi a strumenti più tradizionali.",
    kind: "guide",
    tool_slug: 'jenni-ai',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/jenny-ai",
    featured: true,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Jenni AI, in una frase

Jenni è un workspace AI pensato per chi scrive testi accademici: autocomplete, gestione citazioni in 2.600+ stili, chat con PDF, library management, e modalità di revisione specifiche (Proofread, Claim Confidence, Peer Review, Source Quality) — disegnato per ridurre l'attrito tra le note e il draft finito.

### A chi serve davvero, e a chi no

Jenni è per:

**Studenti universitari e dottorandi** che scrivono tesi, dissertazioni, literature review, paper. L'autocomplete accademico, la generazione automatica di citazioni APA/MLA/Chicago/Harvard/Vancouver, e l'import di PDF per source-grounded writing sono fatti per loro.

**Ricercatori** che passano dalla lettura alla scrittura e vogliono citare correttamente. Source Quality (introdotto a luglio 2026) flagga citazioni ritrattate, outdated, o same-journal-heavy — un layer di verifica che altri tool non hanno.

**Autori non madrelingua inglese** che scrivono paper in inglese. Il tone-of-voice AI assistant mantiene il registro accademico.

**Team accademici e istituti di ricerca** che vogliono standardizzare la qualità di scrittura tra collaboratori. Il Team plan include collaboration e admin dashboard.

Non è per:

**Content writer e marketer.** Per article SEO, blog post, o marketing copy, tool come Jasper, Copy.ai, o Frase sono più adatti. Jenni è specifico per accademico, e il suo tone è inadatto al marketing.

**Autori di narrativa.** Per fiction, tool come Sudowrite, NovelAI, o il proprio editor sono migliori. Jenni non genera prosa creativa.

**Studenti che cercano scorciatoie anti-plagiarism.** Jenni include un plagiarism checker, ma usarlo per "pulire" un paper AI-generated è un uso improprio che può portare a problemi accademici. Il tool aiuta chi scrive, non chi vuole evitare di scrivere.

**Chi cerca un reference manager puro.** Zotero, Mendeley, EndNote sono più maturi per citation management puro. Jenni è un writing environment, non un reference manager.

### Architettura: come è fatto

Jenni è un editor documentale con AI integrata. Le funzionalità si organizzano in cinque aree.

**AI Autocomplete.** Suggerimenti di completamento che apprendono dal tuo stile mentre scrivi. Non sono completamenti generici: si adattano al tono, vocabolario, e struttura del tuo documento. La qualità è significativamente migliore di ChatGPT per scrittura accademica lunga.

**AI Edit.** Strumenti di revisione AI: parafrasi con preservazione della citazione, espansione di paragrafi, raffinamento del tono, sintesi. Parafrasi con source preservation è critico per integrità accademica — non è solo "riformulare", è "riformulare mantenendo l'attribuzione".

**Citation Management.** 2.600+ stili di citazione (APA 6/7, MLA 8/9, Chicago notes-bibliography, Harvard, Vancouver, e molti altri). Generazione automatica in-text citations da DOI, URL, o import. Bibliography export. Integrazione con Zotero e Mendeley.

**Library e PDF Chat.** Upload di PDF, chat con i documenti ("riassumi il paper X", "qual è la metodologia usata?"), collections-based chat per interrogare interi folder di fonti. Atlas, il motore di ricerca interno, indicizza tutti i tuoi documenti.

**Review Modes.** Quattro modalità specifiche:
- **Proofread:** grammar, spelling, style
- **Claim Confidence:** verifica che le affermazioni nel testo siano supportate dalle fonti citate
- **Tone of Voice:** assicura coerenza di registro
- **Peer Review:** simula il feedback di un reviewer accademico
- **Source Quality:** flagga fonti ritrattate, outdated, o ridondanti

Queste review modes sono il vantaggio competitivo di Jenni nel 2026. La Source Quality in particolare, introdotta a luglio 2026, è un layer di verifica che non esiste in altri tool.

### Pricing, onestamente

Jenni ha tre tier pubblici (verificati luglio 2026 sul sito ufficiale):

| Tier | Prezzo | Limiti | Note |
|------|--------|--------|------|
| Free | $0 | 200 AI words/giorno, 10 AI autocompletes/giorno, 10 PDF uploads, 3 AI edits/mese, 5 AI chat/mese, 2 reviews/mese | Tier reale, non trial |
| Plus | $12/mese (annuale) o $20/mese (mensile) | 5.000 autocompletes/mese, unlimited PDF uploads, 500 AI edits/mese, 500 AI chat/mese, 10 reviews/mese, latest features | Adatto a studenti attivi |
| Pro | $29/mese (annuale) o $29/mese (mensile) | Unlimited su tutto, priority support | Adatto a ricercatori intensivi |

**Annual billing** su Plus fa risparmiare circa il 40% ($144/anno vs $240/anno).

**Costo realistico per uso accademico serio:** uno studente che scrive una tesi di laurea magistrale in 6 mesi consuma probabilmente 200-500 AI edits, 100-300 chat, e qualche migliaio di autocompletes. Plus a $12/mese × 6 = $72 copre abbondantemente.

**Per un ricercatore attivo** che pubblica 3-4 paper/anno: Pro è giustificato. $29/mese × 12 = $348/anno.

**Refunds:** Jenni offre refund entro 7 giorni per il primo acquisto. Per acquisti successivi, la policy è più restrittiva.

### Le feature chiave in profondità

**AI Autocomplete adattivo.** La differenza tra Jenni e ChatGPT per la scrittura: l'autocomplete di Jenni apprende dal tuo documento. Suggerimenti basati sul tono che stai usando, sul vocabolario che stai impiegando, sulle citazioni che hai già inserito. Non è generico, è contestuale.

**Source-Grounded Autocomplete.** Per chi scrive paper con fonti specifiche, l'autocomplete può essere ancorato alle tue fonti. Carichi i PDF, l'autocomplete cita i tuoi documenti invece di generare dal nulla. È la differenza tra un paper "AI-assisted" e un paper "AI-generated".

**AI Chat con PDF.** Upload di documenti, poi chatti con loro. "Qual è la metodologia del paper X?", "Riassumi le conclusioni di Smith 2024", "Confronta paper X e paper Y". Il targeting è preciso: con \`@filename.pdf\` puoi ancorare la chat a un documento specifico. Su Plus, hai 500 chat/mese; su Pro, illimitate.

**2.600+ Citation Styles.** La libreria di stili è tra le più ampie sul mercato. Include tutti i major (APA, MLA, Chicago, Harvard, Vancouver) e molti specialistici. La generazione automatica da DOI o URL è la parte che fa risparmiare tempo. Non devi più scrivere a mano le citazioni.

**Integrazione con Zotero e Mendeley.** Sync delle library esterne. Le citazioni e i PDF che hai già in Zotero appaiono in Jenni senza duplicare.

**Multilingual Support.** Scrittura in 30+ lingue, con capacità di "rewrite in English" mantenendo il significato. Utile per ricercatori non madrelingua inglese.

**Outline e Summary Builder.** Da note sparse, genera outline strutturato. Da documenti densi, genera summary. Sono strumenti di scaffolding per chi parte da zero.

**Version History.** Track dei cambiamenti e revert a versioni precedenti. Per chi scrive draft lunghi con iterazioni multiple, evita disastri.

**Browser Extension.** Jenni in Google Docs, e in altri web editor. Non tutte le funzionalità sono nell'estensione, ma l'autocomplete base sì.

### Cosa fa bene, e cosa fa meno bene

**Fa bene:** scrittura accademica con source grounding, citation management, AI chat con PDF, review modes specifiche (Source Quality, Claim Confidence). Sono i suoi superpoteri.

**Fa meno bene:** prosa creativa, marketing copy, scrittura veloce senza source grounding. Per questi use case, tool diversi sono più adatti.

**Fa male:** generare paper interi "from scratch" con citazioni inventate. Jenni cita solo fonti reali (DOI, URL, library), ma usato impropriamente può generare paper con citazioni plausibili ma inventate. La qualità dell'output dipende dalla qualità delle tue fonti.

### Limiti strutturali, da conoscere

**Il plagiarism check è base.** Confronta con web sources, non con paper accademici indicizzati (Turnitin, iThenticate). Per submission a riviste con check serio, ti serve ancora Turnitin.

**L'output AI è rilevabile.** I detection tool (GPTZero, Originality.ai) identificano il testo AI-generated. Jenni non evade la detection. Il pattern corretto: Jenni aiuta a scrivere, tu rivedi e aggiungi il tuo punto di vista.

**La contestualizzazione è limitata.** Jenni non conosce il paper completo: lavora sul contesto locale del documento. Per review globali ("è il paper coerente con la tesi centrale?"), serve un supervisor umano.

**I modelli sottostanti sono GPT-class.** La qualità dipende dal modello, e Jenni non è trasparente su quale usa. In generale, è GPT-4-class con wrapper.

### Jenni vs Grammarly vs Sudowrite vs Zotero

**Jenni vs Grammarly.** Grammarly è il re della grammar e spelling check. Più maturo, più polished UX, brand riconoscibile. Ma non ha source-grounded writing, citation management specifico per accademico, o PDF chat. Jenni è specializzato per accademico, Grammarly è generalista.

**Jenni vs Sudowrite.** Sudowrite è per fiction. Completamente diverso. Non c'è overlap reale.

**Jenni vs ChatGPT con plugin accademici.** ChatGPT può fare cose simili con plugin come ScholarAI o Consensus, ma è più fragile (i plugin cambiano, ChatGPT non è specializzato). Jenni è un environment dedicato.

**Jenni vs Zotero + ChatGPT.** Zotero è un reference manager puro. Puoi usarlo con ChatGPT per citare, ma è workflow manuale. Jenni integra la citazione nel flow di scrittura.

**Jenni vs Paperpal / Writefull.** Sono competitor diretti nello spazio "AI for academic writing". Paperpal è editoriale-focused (journal targeting, submission prep), Writefull è più accademico-generico. Jenni ha Source Quality che è unique.

### Casi d'uso reali

**Studente magistrale con tesi di 80 pagine.** Tier Plus, scrittura su 4 mesi, source grounding attivo su 30-40 paper letti, citation management, autocomplete per il tone. Risparmio: 30-40 ore di citation formatting manuale.

**Dottorando con paper per conferenza.** Tier Pro, scrittura intensiva in 2-3 settimane, multiple revisioni con review modes, claim confidence per verificare le affermazioni. Quality check prima della submission.

**Ricercatore con revisione di letteratura.** Tier Plus, PDF chat con 50+ paper, summary builder, outline generator, citation per il draft finale. Velocità di literature review: 2-3x rispetto al manuale.

**Insegnante con preparazione materiale.** Tier Pro, outline delle lezioni, summary dei paper da assegnare, struttura delle slides. Non è lo use case primario ma funziona.

### Setup pratico: da zero a un paper draft in 2 settimane

**1. Crea l'account e importa le fonti.** Su jenni.ai, signup, scegli il tier (Pro se budget lo permette, altrimenti Plus). Importa i PDF delle fonti primarie, sincronizza con Zotero se lo usi. 1-2 ore.

**2. Crea il documento.** New document, scegli citation style. Inizia l'outline. 30 minuti.

**3. Scrivi con autocomplete.** Lascia che Jenni suggerisca. Accetta, modifica, o rifiuta. Il pattern corretto: scrivi tu le idee, lascia che Jenni formatti. 4-8 ore al giorno per 5-7 giorni.

**4. Inserisci citazioni.** Mentre scrivi, usa la citation generation. DOI o URL della fonte, Jenni formatta in-text e bibliography. 30 minuti integrato nel flow.

**5. Review con le modalità.** Proofread per grammar, Claim Confidence per verificare affermazioni, Source Quality per pulizia delle fonti, Tone of Voice per coerenza. 2-3 ore.

**6. Version history.** Salva versioni a milestone (draft 1, draft 2, final). 15 minuti.

**7. Esporta.** Word, LaTeX, o PDF, a seconda del submission target. 5 minuti.

In 2 settimane hai un draft completo con citazioni formattate, review passate, e version history. Per submission, un giro finale di human review è comunque necessario.

### Errori comuni

**Generare paper senza leggere le fonti.** Jenni source-grounded è uno strumento potente, ma se non leggi le fonti, citi senza capire. Il risultato è un paper formalmente corretto ma intellettualmente vuoto. Leggi sempre.

**Affidarsi solo all'AI per le citazioni.** Jenni automatizza la formattazione, ma la scelta delle citazioni è tua. Cita le fonti che hai letto, non quelle che "Jenni suggerisce".

**Non fare Claim Confidence check.** La review mode Claim Confidence verifica che le affermazioni siano supportate. Senza, rischi affermazioni non coperte dalle fonti. Fallo sempre prima della submission.

**Ignorare la Tone of Voice.** La coerenza di registro è importante per journal editor e reviewer. La review mode Tone of Voice è gratis, usala.

**Pagare per Pro quando Plus basta.** Pro è per uso intensivo. Se scrivi 1-2 paper/anno, Plus è sufficiente. Non over-pagare.

### Le domande che ci fanno più sposo

**Jenni è meglio di ChatGPT per scrivere paper?**
Per paper con citazioni e source grounding, sì. Per brainstorming o scrittura libera, ChatGPT va altrettanto bene.

**Quanto costa in un anno?**
Studente: Plus annuale $144/anno. Ricercatore: Pro $29/mese = $348/anno.

**Funziona con Zotero?**
Sì, integrazione nativa. Le library di Zotero si sincronizzano.

**I paper scritti con Jenni superano i plagiarism check?**
Dipende. Jenni parafrasa le fonti (non copia), ma il plagiarism check serio (Turnitin) può ancora flaggare. Per evitare problemi, usa Jenni come acceleratore di scrittura, non come generatore di paper.

**Jenni è meglio di Grammarly?**
Per accademico, sì. Per scrittura generale (email, blog, social), Grammarly è sufficiente.

**C'è un trial?**
Il tier Free è il trial permanente. 200 words/giorno sono sufficienti per testare il workflow.

### Alternative da considerare

- **Grammarly.** Grammar e spelling, generalista, non accademico-specializzato.
- **Paperpal.** Academic writing con focus journal submission.
- **Writefull.** Academic writing più generico.
- **Sudowrite.** Fiction, completamente diverso.
- **ChatGPT con plugin accademici.** Più fragile, più flessibile.
- **Zotero + Word.** Workflow tradizionale, manuale, gratuito.

### Cosa ci aspettiamo da Jenni nei prossimi mesi

**Più review modes.** Source Quality è l'inizio. Claim Confidence e Peer Review sono già lì. Possibili estensioni: Replication Check, Funding Compliance.

**Migliore integrazione con reference manager.** Zotero e Mendeley già supportati. Sincronizzazione bidirezionale, gestione di metadata, e PDF management più profondi.

**Migliori capacità multilingual.** Il tone-of-voice per non-madrelingua inglese è buono, non eccellente. Miglioramenti attesi.

**Mobile companion.** L'app mobile è basilare. Un mobile companion più funzionale sarebbe utile per scrivere in mobilità.

### In sintesi

Jenni è uno dei migliori tool di AI-assisted academic writing nel 2026. La combinazione di source-grounded autocomplete, citation management serio, e review modes specifiche (Source Quality) lo rende particolarmente utile per studenti e ricercatori. Il pricing è accessibile, il tier Free è reale, e il workflow è integrato.

Le limitazioni principali sono: plagiarism check base, AI output rilevabile, e context limitation a livello di documento. Sono limiti strutturali degli LLM attuali, non specifici di Jenni.

Per studenti e ricercatori, è uno dei migliori investimenti. Per content writer, è il tool sbagliato.

### Prossimi passi

- **Apri la scheda tool di Jenni AI** per confrontare con Paperpal, Grammarly, e altri writing tool.
- **Esplora la raccolta su scrittura e produttività** per casi d'uso affini.
- **Salva Jenni AI nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "reclaim-ai",
    title: 'Reclaim AI: come pianificare la settimana senza farla a pezzi',
    dek: 'Calendario intelligente per task, abitudini e meeting: come funziona davvero.',
    summary:
      "Reclaim AI è un planner intelligente che si collega a Google Calendar e Outlook per difendere il" +
      "tempo di concentrazione, pianificare task, abitudini e routine. In questa guida vediamo come" +
      "funziona, quando vale l'abbonamento, e come si confronta con Motion, Notion Calendar, e l'approccio" +
      "manuale con time blocking.",
    kind: "guide",
    tool_slug: 'reclaim-ai',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/reclaim-ai",
    featured: true,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Reclaim AI, in una frase

Reclaim è un layer di intelligenza sopra Google Calendar e Outlook che difende automaticamente il tuo focus time, distribuisce le tue abitudini ricorrenti nei buchi del calendario, e protegge le tue task dai meeting invadenti — senza che tu debba micro-gestire ogni slot.

Non è un calendario. Non è un task manager. È un arbitro che decide, in tempo reale, chi può occupare il tuo tempo e quando.

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

Reclaim ha quattro tier (verificati sul sito ufficiale a luglio 2026):

**Lite, gratis per sempre.** 1 utente, 1 sync calendar, 1 scheduling link, 5 AI Agents, 1 settimana di scheduling range, integrazioni limitate (Google Tasks, Slack, Zoom, Google Meet). È un piano reale, non un trial. Copre l'uso individuale leggero.

**Starter, $12/mese per seat (annuale) o $10/seat con commit annuale.** Aggiunge 8 settimane di scheduling range, 3 calendar sync, 3 scheduling link, integrazioni complete con Todoist, Asana, ClickUp, Linear, Jira, Slack status sync, Focus Time, Habits illimitate, Smart Meetings 3 come organizer. Adatto a singoli o team piccoli.

**Business, $18/mese per seat (annuale).** 12 settimane di scheduling range, calendar sync illimitati, scheduling link illimitati, Smart Meetings illimitati, webhooks, Team OOO calendar, delegated access, security review. Adatto a team 10-100 persone.

**Enterprise, $22/mese per seat (annuale), minimo 100 seat.** SSO, SCIM provisioning, domain capture, dedicated support, audit log, SLA. Adatto a organizzazioni 100+.

Reclaim è stato acquisito da Dropbox nel 2024 per $40.2M, ma continua a operare come prodotto indipendente. La cosa importante da sapere: i prezzi sono competitivi con Motion ($29/mese entry-level), e significativamente più economici di strumenti enterprise comparabili (Clockwise, Asana con calendar integration).

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

Reclaim AI è uno dei migliori investimenti di produttività per knowledge worker con calendario frammentato. Il prezzo ($12/mese) è giusto, il fit per il target è preciso, e l'impatto su focus time e abitudini è misurabile. Non è per tutti, e non è una bacchetta magica — richiede configurazione iniziale e iterazione. Ma per il profilo giusto, è probabilmente il tool di calendar AI con il miglior rapporto qualità/prezzo.

### Prossimi passi

- **Apri la scheda tool di Reclaim AI** per confrontare con Motion, Clockwise, e altri calendar tool.
- **Esplora la raccolta su produttività** per casi d'uso affini.
- **Salva Reclaim AI nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "windsor-ai",
    title: 'Windsor AI: attribuzione marketing e reporting multi-canale',
    dek: 'Come unificare i dati di marketing, attribuire le conversioni e leggere il ROI.',
    summary:
      "Windsor AI è una piattaforma di marketing data e attribuzione che connette fonti pubblicitarie, CRM" +
      "e analytics in un unico warehouse. In questa guida vediamo come funziona, quando conviene rispetto a" +
      "soluzioni enterprise come Triple Whale, e quali team marketing beneficiano davvero dell'adozione.",
    kind: "guide",
    tool_slug: 'windsor-ai',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/windsor-ai",
    featured: true,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Windsor AI, in una frase

Windsor AI è una piattaforma no-code di data integration e marketing attribution che collega 325+ fonti di marketing e vendita a destinazioni come BigQuery, Snowflake, Google Sheets, Looker, e Power BI — e che include un modello di attribuzione multi-touch basato su Markov chain per capire quale canale sta davvero portando conversioni.

Non è solo un connettore. È un data pipeline + attribution engine per team marketing che non vogliono (o non possono) avere un data engineer a tempo pieno.

### A chi serve davvero, e a chi no

Windsor AI funziona bene per:

**Team marketing che spendono $20k-$500k/mese in ads su più canali.** Quando hai Meta Ads, Google Ads, TikTok, LinkedIn, e forse Pinterest tutti attivi, e devi capire quale canale sta realmente contribuendo, l'attribuzione last-click di Google Analytics mente. Windsor ti dà la verità multi-touch.

**Aziende che vogliono centralizzare i dati marketing in un data warehouse.** Senza dover scrivere custom ETL. Colleghi le fonti, scegli la destinazione, e i dati arrivano puliti, normalizzati, e pronti per l'analisi.

**Team che usano BigQuery, Snowflake, o Redshift.** Windsor eccelle in questo caso, perché i dati arrivano in tempo reale e possono essere analizzati con SQL.

**Marketing operations specialist che vogliono un'alternativa a Supermetrics.** Windsor ha più connettori, più destinazioni incluse, e pricing flat (vs per-source come Supermetrics).

**Agenzie media-buying che gestiscono 20+ clienti.** Il pricing flat di Windsor (vs per-utente o per-source) lo rende economicamente interessante per agency.

Non è la scelta giusta per:

**Aziende che spendono meno di $5k/mese in ads.** A volumi bassi, Google Analytics nativo è sufficiente, e Windsor è overkill.

**Team che hanno già una data infrastructure robusta.** Se hai un data engineer full-time e un Fivetran o Airbyte, Windsor è ridondante.

**Casi d'uso che richiedono server-side tracking.** Windsor è un data integration tool, non un server-side tracking tool. Per server-side CAPI, Enhanced Conversions, o conversion API, ti servono tool diversi (SignalBridge, Stape, o implementazione custom).

**Realtime decision-making su bid management.** Windsor è analytico, non operativo. Per bidding automatico su Meta o Google, usare le piattaforme native.

### Architettura: come funziona davvero

Capire l'architettura è fondamentale per capire quando Windsor ha senso e quando no.

**Fonti (325+ connector).** Ogni connettore è un modulo che parla l'API di una piattaforma specifica: Meta Ads API, Google Ads API, TikTok API, LinkedIn Campaign Manager, HubSpot, Salesforce, Shopify, Klaviyo, Stripe, GA4, e così via. Tutti i connettori sono disponibili su tutti i piani — niente "premium connector" o upsell. È uno dei vantaggi competitivi rispetto a Supermetrics.

**Destinazioni.** Dove vanno i dati. Le destinazioni supportate includono:
- Data warehouse: BigQuery, Snowflake, Redshift, Databricks
- Spreadsheet: Google Sheets, Excel
- BI tool: Looker Studio, Power BI, Tableau, Google Sheets come BI
- Custom: webhook, API

Windsor include tutte le destinazioni su tutti i piani — un altro vantaggio su Supermetrics, che fa pagare extra per destinazioni aggiuntive.

**Data transformation.** Quando i dati arrivano, Windsor li normalizza: rinomina i campi in un formato consistente, applica schema matching, gestisce i cambi di schema delle API (Meta cambia la sua API ogni 6 mesi, e i connettori si aggiornano di conseguenza). Per il data warehouse, questo significa tabelle pronte per l'analisi senza ETL custom.

**Sync schedule.** Puoi schedulare il sync: real-time, hourly, daily. Per la maggior parte dei casi d'uso marketing, daily è sufficiente. Real-time serve per bidding automation, ma Windsor non è progettato per quello.

**Attribution engine.** Questo è il valore aggiunto. Windsor include modelli di attribuzione multi-touch: first-touch, last-touch, linear, time-decay, position-based (U-shaped), e — la feature distintiva — Markov chain attribution. Markov calcola il "removal effect" di ogni canale: se togliessi quel canale, quanto calerebbero le conversioni? È il modello più sofisticato e il più onesto, perché non assume pesi uguali tra i canali.

**MCP server.** Windsor offre un server Model Context Protocol che permette a ChatGPT, Claude, e Gemini di interrogare i tuoi dati marketing in linguaggio naturale. "Quanto ho speso su Meta Ads il mese scorso per la campagna X?" diventa una domanda che puoi fare a Claude invece di scrivere SQL.

### Pricing reale, calcolato onestamente

Windsor ha sei tier (verificati sul sito ufficiale a luglio 2026):

**Free, $0/mese per sempre.** 1 utente, 1 fonte, 1 account, 1 destinazione, daily sync. È un tier reale, non un trial. Sufficiente per testare il workflow o per micro-progetti.

**Basic, $19/mese annuale ($23 mensile).** Utenti illimitati, 3 fonti, 75 account, 5 destination task, daily sync, 5M monthly active rows (MAR) inclusi. Il delta di $4 tra mensile e annuale è piccolo, ma vale la pena l'annuale. Adatto a freelancer e team molto piccoli.

**Standard, $99/mese annuale ($118 mensile).** 7 fonti, 75 account, 5 destinazioni. È il tier "sweet spot" per team marketing strutturati che hanno 5-7 piattaforme attive. Include Google Sheets, BigQuery, Snowflake, e i principali BI tool come destinazioni.

**Plus, $249/mese annuale ($298 mensile).** 10 fonti, 200 account, 5 destinazioni. Per team più grandi o multi-brand.

**Professional, $499/mese annuale ($598 mensile).** 14 fonti, 500 account, 5 destinazioni, support prioritario. Per agenzie media-buying con molti clienti.

**Enterprise, custom.** 14-300+ fonti, 50.000+ account, dedicated support, SLA.

**Attribution pricing separato:** questa è la parte che fa storcere il naso. Le funzionalità di attribution avanzate (Markov, multi-touch) sono in un tier separato:
- Attribution Standard: $549/mese annuale ($658 mensile)
- Attribution Professional: $699/mese annuale ($838 mensile)

Quindi, se vuoi data integration + attribution avanzata, paghi due tier: Standard + Attribution Standard = $99 + $549 = $648/mese annuale. È caro. È il prezzo dell'attribution seria.

**Overages:** $20 per 1M additional rows su Basic, variabile su altri tier. Per la maggior parte dei team, il MAR incluso è sufficiente.

### Le feature chiave in profondità

**325+ connettori.** La libreria è una delle più ampie del settore. Include tutti i major ad platform (Meta, Google, TikTok, LinkedIn, Pinterest, Reddit, X, Snapchat), i CRM (HubSpot, Salesforce, Pipedrive), e-commerce (Shopify, WooCommerce, BigCommerce), email (Klaviyo, Mailchimp, Sendgrid), analytics (GA4, Mixpanel, Amplitude), e molto altro. Tutti disponibili su tutti i piani.

**Schema matching e incremental loading.** Quando colleghi Meta Ads e Google Ads insieme, i campi sono diversi ("spend" vs "cost", "campaign_name" vs "campaign"). Windsor normalizza in fase di sync, e fa incremental loading (solo i dati nuovi, non tutto ogni volta), che è critico per performance e costi.

**MCP server per AI interrogation.** Server Model Context Protocol che permette a LLM esterni (Claude, ChatGPT, Gemini) di fare query SQL-like sui tuoi dati. Invece di aprire Looker Studio, chiedi a Claude "qual è il ROAS di Meta Ads vs Google Ads negli ultimi 30 giorni, segmentato per campagna?".

**TV Ad Performance e AppsFlyer Master API.** Feature meno conosciute ma potenti: TV Ad Performance usa un algoritmo per collegare le TV ads a traffico web (rilevando spike quando una campagna TV va on air), e AppsFlyer Master API è per mobile attribution.

**Budget Optimizer.** Algoritmo che suggerisce riallocazione del budget tra campagne basandosi su ROAS e attribution model. È uno strumento decisionale, non automatizza i cambi di budget.

**White-label reports.** Su Enterprise. Per agenzie che vogliono presentare report con il proprio brand ai clienti.

**Custom domain per le dashboard.** Su Enterprise.

### Quando Windsor ha senso, e quando no

**Sì, se:** spendi $20k+/mese in ads, hai 5+ fonti attive, vuoi dati in un warehouse o BI tool, e/o vuoi attribution multi-touch seria. Il ROI è chiaro.

**No, se:** spendi poco, hai poche fonti, non hai bisogno di attribution (last-click va bene), o hai già un data team che costruisce pipeline custom.

**Caso borderline:** se spendi $5-20k/mese e hai 3-4 fonti, Basic o Standard sono sufficienti. L'attribution separata è un costo extra da valutare solo se il last-click davvero non basta.

### Windsor vs Supermetrics vs Fivetran vs Improvado

**Windsor vs Supermetrics.** Il confronto più diretto. Supermetrics ha più connettori storici (è nato prima), ma Windsor ha: pricing flat vs per-source, tutte le destinazioni incluse, e attribution built-in. Supermetrics è più caro a parità di volumi, specialmente quando aggiungi più fonti o destinazioni. Per team che vogliono data integration puro senza attribution, sono molto simili. Per team che vogliono anche attribution, Windsor vince.

**Windsor vs Fivetran.** Fivetran è il leader di mercato per data integration enterprise. Ha più connettori, più destination, più robustezza, ma è significativamente più caro (entry-level intorno a $500/mese) e richiede setup più tecnico. Per enterprise con data team, Fivetran è la scelta. Per team marketing che vogliono qualcosa di più accessibile, Windsor è meglio.

**Windsor vs Improvado.** Improvado è più enterprise-oriented, con focus su custom data transformation e routing. Pricing enterprise, setup più complesso. Per team marketing mid-size, Windsor è più accessibile.

**Windsor vs Airbyte (open source).** Airbyte è open source e self-hostable, gratis, ma richiede engineering per setup e manutenzione. Per team con data engineer, Airbyte è più flessibile. Per team marketing senza engineering, Windsor vince per accessibilità.

**Windsor vs build custom con Python e Airflow.** Per team data maturi, build custom è il massimo della flessibilità. Per team marketing che vogliono "connetti fonti e dammi i dati", Windsor è molto più veloce.

### Casi d'uso reali

**E-commerce DTC con $100k/mese su Meta + Google.** Tier Standard, connetti Meta Ads, Google Ads, Shopify, Klaviyo. Destinazione: BigQuery. Attribution Standard per capire il ruolo di ogni canale. Risultato: capisci che Meta è per awareness, Google è per conversion, email è per retention, e sposti budget di conseguenza.

**B2B SaaS con $50k/mese su LinkedIn + Google + HubSpot.** Tier Standard, connetti LinkedIn Ads, Google Ads, HubSpot. Destinazione: BigQuery. Analisi del full funnel: impression → click → lead → MQL → SQL → closed-won. Capisci che LinkedIn genera lead che si chiudono a $5k ACV, Google genera lead che si chiudono a $1k ACV, e aggiusti il bidding.

**Agenzia media-buying con 15 clienti.** Tier Professional, connetti 15 Meta Ads account e 15 Google Ads account. Destinazione: Looker Studio dashboard per cliente. Report mensili per ogni cliente. Risparmio: 10+ ore a settimana rispetto a dashboard manuali.

**Marketing team senza data engineer.** Tier Standard + Attribution Standard, connetti 5-7 fonti, destinazione Google Sheets. Il team marketing può fare analisi senza dipendere dall'IT.

### Setup pratico: da zero al primo sync in 30 minuti

**1. Crea l'account e scegli le fonti.** Su windsor.ai, signup. Vai su "Sources", seleziona le piattaforme da collegare. Per ogni fonte, autorizza l'accesso OAuth. Tempo: 10 minuti.

**2. Scegli la destinazione.** "Destinations". Le opzioni: Google Sheets (più semplice), BigQuery (richiede setup), Looker Studio (visualizzazione). Per il primo test, Google Sheets. Tempo: 5 minuti.

**3. Configura il primo data flow.** "Data Flows" → "New". Seleziona fonte, destinazione, e campi da sincronizzare. Configura la frequenza (daily per default). Tempo: 10 minuti.

**4. Verifica il primo sync.** Trigger manual sync, verifica che i dati arrivino nella destinazione. Tempo: 5 minuti.

**5. Costruisci la prima dashboard (opzionale).** Se destinazione è Looker Studio o Google Sheets, costruisci una dashboard base. Tempo: 30-60 minuti per una dashboard decente.

In 30 minuti hai dati che fluiscono. In un'ora hai una dashboard funzionante. In un giorno hai insight che prima non avevi.

### Errori comuni

**Sottovalutare il numero di fonti necessarie.** "Useremo Meta e Google, basta quelli" diventa presto "ci serve anche Shopify, Klaviyo, HubSpot". Aggiungere fonti a metà contratto è facile, ma il pricing scala. Meglio fare un inventario realistico prima.

**Confondere data integration con attribution.** Sono due problemi diversi. L'integration ti dà i dati. L'attribution ti dà la storia di quei dati. Se il tuo problema è capire il customer journey, ti serve attribution, e il tier sale.

**Sottovalutare la Markov attribution.** Molti team si accontentano del first/last touch. Markov è il modello più onesto, ma richiede un volume minimo di conversioni per essere statisticamente valido. Sotto 100 conversioni/mese, i risultati sono rumorosi.

**Ignorare la qualità dei dati di partenza.** Se Meta Ads è tracciato male (pixel rotto, conversion API non configurato), Windsor non ti salva. I dati di input devono essere puliti.

**Dimenticare la data governance.** Chi può accedere a quali dati? Windsor ha RBAC, ma configurarlo è noioso. Fallo il primo giorno, non dopo il primo data leak.

### Cosa ci aspettiamo da Windsor nei prossimi mesi

**Più AI agenti nativi.** L'MCP server è l'inizio. L'evoluzione è agenti che fanno analisi autonoma, identificano anomalie, e ti notificano.

**Integrazione più profonda con i data warehouse.** Snapshot, change data capture, e sync bidirezionale tra Windsor e warehouse. Per data team che vogliono Windsor come parte di un'architettura più ampia.

**Causal inference più sofisticata.** Markov è buono, ma causal inference con dati osservazionali è il prossimo livello. Se Windsor ci arriva, diventa il leader incontrastato.

**Compliance e data residency.** SOC 2, GDPR, HIPAA per casi d'uso enterprise. Già in roadmap.

### Le domande che ci fanno più spesso

**Windsor è meglio di Supermetrics?**
Per data integration puro, sono simili. Per pricing, Windsor vince (flat vs per-source). Per attribution built-in, Windsor vince. Per libreria di connettori legacy, Supermetrics ha un piccolo vantaggio.

**Quanto costa davvero?**
Tier Standard a $99/mese è il sweet spot per team marketing mid-size. Se aggiungi Attribution Standard, arrivi a $648/mese. Per team che spendono $50k+/mese in ads, il ROI è misurabile in settimane.

**Posso usarlo senza data warehouse?**
Sì, Google Sheets come destinazione funziona. Non è elegante come BigQuery, ma per team senza data engineer, è l'unica opzione realistica.

**Windsor supporta il mio CRM?**
Probabilmente sì. La libreria copre HubSpot, Salesforce, Pipedrive, Zoho, e altri. Verifica sul sito ufficiale per il tuo caso specifico.

**Funziona per server-side tracking?**
No. Windsor è per data integration, non per conversion API. Per server-side CAPI, usa Stape, SignalBridge, o implementazione custom con Meta CAPI / Google Enhanced Conversions.

**Quanto è affidabile il sync?**
Windsor ha SLA del 99.5% su Standard, 99.9% su Plus e superiori. In pratica, i sync daily sono affidabili. Per real-time critico, meglio soluzioni custom.

### Alternative da considerare

- **Supermetrics.** Più connettori legacy, pricing per-source. Buono se hai bisogno di connettori molto specifici.
- **Fivetran.** Enterprise, più caro, più robusto. Per data team strutturati.
- **Improvado.** Enterprise, custom transformation. Per agenzie media grandi.
- **Airbyte.** Open source, gratis, richiede engineering. Per team con data engineer.
- **Make / n8n.** General automation, possibilità di fare data integration custom, più cheap ma più fragile.
- **Build custom.** Per data team che vogliono massima flessibilità.

### In sintesi

Windsor AI è una scelta eccellente per team marketing che spendono significativamente in ads, hanno multiple fonti attive, e vogliono dati centralizzati senza costruire pipeline custom. Il pricing flat è un vantaggio competitivo vs Supermetrics. L'attribution Markov è unica nel settore. La limitazione principale è l'attribution separata che fa raddoppiare il costo per chi ha bisogno di multi-touch serio.

Per team piccoli, è overkill. Per team grandi con data engineer, Fivetran è superiore. Per il target giusto — team marketing mid-size senza data engineer dedicato — è probabilmente la scelta migliore.

### Prossimi passi

- **Apri la scheda tool di Windsor AI** per confrontare con Supermetrics, Fivetran, e altri data integration tool.
- **Esplora la raccolta su marketing e analytics** per casi d'uso affini.
- **Salva Windsor AI nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "reachifyme",
    title: 'ReachifyMe: come creare un content engine per LinkedIn',
    dek: 'Drafting, hook, scheduling e analytics per chi fa LinkedIn seriamente.',
    summary:
      "ReachifyMe è una piattaforma di content engine focalizzata su LinkedIn: aiuta a creare post," +
      "ottimizzare hook, schedulare pubblicazioni e analizzare le performance. In questa guida vediamo" +
      "quando conviene rispetto a Taplio, Supergrow, e al classico workflow manuale su LinkedIn nativo.",
    kind: "guide",
    tool_slug: 'reachifyme',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/reachifyme",
    featured: false,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa ReachifyMe, in una frase

ReachifyMe è un set di tool AI per costruire la tua presenza LinkedIn: generatore di post, scheduler, generatore di carousel, generator di idee, hashtag tool, formatter del testo, e un visitor assistant AI per il tuo profilo — pensato per creator, freelance, e founder che fanno di LinkedIn il canale di lead generation primario.

### A chi serve davvero, e a chi no

ReachifyMe è per:

**Creator e freelance che fanno di LinkedIn il canale principale.** Post regolari, personal brand, lead generation via DM. Se LinkedIn è dove ti trovano i clienti, ReachifyMe è il tool che ti fa risparmiare ore.

**Founder B2B che usano LinkedIn per thought leadership.** Post settimanali su temi di settore, carousel didattici, commenti strategici. ReachifyMe genera idee e draft, tu curi la voce.

**Sales rep che fanno social selling.** Post regolari, DM automation, presenza credibile su LinkedIn.

**Marketer che gestiscono LinkedIn per brand.** Multi-account, scheduling, content calendar.

**Studenti e job seeker che vogliono costruire presenza.** Profile optimization, post regolari, networking attivo.

Non è per:

**Aziende che fanno LinkedIn Ads in scala.** ReachifyMe è per organica, non per paid. Per ads, gestisci direttamente in Campaign Manager.

**Chi cerca un tool di cold outreach.** ReachifyMe non fa automation di messaggi o connection request. Per quello, LinkedHelper, Zopto, Octopus CRM.

**Chi ha bisogno di analytics avanzate.** ReachifyMe ha metriche di base (engagement, reach), ma non il livello di LinkedIn Campaign Manager o tool specialistici.

**Multi-piattaforma.** ReachifyMe è LinkedIn-only. Se gestisci Twitter, Instagram, e LinkedIn, ti serve un tool multi-piattaforma (Buffer, Hootsuite).

### Cosa fa, in pratica

ReachifyMe è un toolkit, non un workflow unico. Le feature principali sono:

**AI Post Generator.** Scrivi un argomento, scegli il tone, ReachifyMe genera un draft. La qualità è variabile: buona per bozze, mediocre per post "iconici" che richiedono personalità. Il pattern corretto: usa il generator per il 70% del draft, poi aggiungi il tuo punto di vista e casi specifici.

**AI Idea Generator.** Input una nicchia o un tema, output una lista di idee per post. Utile per superare il blocco dello scrittore o per riempire un content calendar.

**Hashtag Generator.** Genera hashtag rilevanti per il tuo post basandosi sul contenuto. Include hashtag di nicchia + generali. Aumenta la reach organica.

**Headline Generator.** Per il tuo profilo LinkedIn e per i post. Test A/B di headline diverse.

**LinkedIn Text Formatter.** Aggiunge bold, italic, underline, e altre formattazioni che LinkedIn normalmente non supporta nativamente (LinkedIn strips formatting). Il tool usa caratteri Unicode che LinkedIn mantiene.

**Carousel Generator.** Genera carousel (post multi-slide) partendo da testo o articoli. Utile per "listicle" educational posts che performano bene su LinkedIn.

**Trending News.** Mostra post trending nel tuo settore, per restare al passo.

**Scheduler.** Schedula post per pubblicazione automatica. Supporta company page e personal profile.

**Hook and CTA Generator.** Genera hook (prime righe che catturano attenzione) e CTA (call-to-action finali). Sono le parti più importanti di un post LinkedIn.

**AI Meme Generator.** Genera meme per LinkedIn. Funziona sorprendentemente bene per engagement.

**Video Downloader.** Scarica video da LinkedIn. Per uso personale e reference.

**Browser Extension.** ReachifyMe in Chrome, accessibile mentre navighi LinkedIn.

### Pricing, onestamente

ReachifyMe non pubblica un pricing dettagliato sulla homepage. La pagina pricing ufficiale conferma:

- **7-day free trial.** Accesso completo, no carta di credito richiesta.
- **Piani mensili e annuali.** Annual billing risparmia fino al 15%.
- **Pricing stimato:** starter da $9.95-$15/mese, mid-tier $19.99-$30/mese, premium fino a $29-$50/mese (fonti diverse, pricing cambia spesso).

I prezzi esatti cambiano frequentemente. Verifica su reachifyme.com/pricing prima di firmare.

**Costo modello AI:** ReachifyMe usa GPT-class per le generazioni. Ogni generazione consuma crediti interni. Su tier più alti, più crediti inclusi.

**Refunds:** la policy non è prominente. Contatta il supporto per richieste specifiche.

### Cosa fa bene, e cosa no

**Fa bene:** ridurre l'attrito della creazione quotidiana di contenuti LinkedIn, generare idee quando sei in blocco, formattare testo, generare carousel. Il tool è un acceleratore, non un sostituto.

**Fa meno bene:** catturare una voce personale forte, generare post che diventano virali per la loro originalità, gestire commenti e DM in modo strategico.

**Fa male:** fingere che il tuo punto di vista sia un altro. Se ReachifyMe genera un post e tu pubblichi senza modificarlo, il post suona generico, e il pubblico se ne accorge.

### Quando ReachifyMe ha senso, e quando no

**Ha senso:** post 3-7 volte a settimana, content calendar regolare, target di lead generation organica, poco tempo per creare da zero ogni post.

**Non ha senso:** post sporadici (1-2 al mese), brand voice molto specifico che l'AI non cattura, focus su altri canali oltre LinkedIn.

**Caso borderline:** se fai 1-2 post/settimana ma il post è la tua firma professionale, ReachifyMe può aiutare con idee e formattazione, ma il draft finale devi scriverlo tu.

### ReachifyMe vs Buffer vs Hootsuite vs Taplio vs Supergrow

**ReachifyMe vs Buffer.** Buffer è multi-piattaforma, semplice, scheduler eccellente. ReachifyMe è LinkedIn-only con tool di generazione AI. Se il tuo bisogno è solo scheduling, Buffer è più economico. Se vuoi generazione AI integrata, ReachifyMe vince.

**ReachifyMe vs Hootsuite.** Hootsuite è enterprise, multi-piattaforma, con analytics avanzate. ReachifyMe è LinkedIn + AI. Per team grandi con social cross-platform, Hootsuite. Per singolo creator LinkedIn-focused, ReachifyMe.

**ReachifyMe vs Taplio.** Taplio è il competitor diretto: AI + LinkedIn, scheduling, analytics, content library. Taplio è più caro (~$50/mese) ma con più features. ReachifyMe è più economico e focalizzato. Per creator con budget che vogliono il top, Taplio. Per chi parte, ReachifyMe.

**ReachifyMe vs Supergrow.** Supergrow è LinkedIn AI + outreach automation. Più caro, più completo. Per social selling serio, Supergrow. Per solo content, ReachifyMe.

### Casi d'uso reali

**Founder B2B con 3-4 post/settimana.** ReachifyMe per generare bozze, formatter per il testo, carousel per i post didattici. Tempo per post: 30 minuti (vs 1.5 ore senza tool).

**Freelance con personal brand.** 1-2 post/settimana, focus su lead generation. ReachifyMe per idee, generatore post, scheduler. 45 minuti per post.

**Sales rep con social selling.** Post regolari per costruire presenza + DM mirati. ReachifyMe per i post, tool separato per i DM.

**Studente con job search.** Post su progetti, learning journey. ReachifyMe per struttura e formattazione.

### Setup pratico: da zero a 1 post/giorno in una settimana

**1. Crea l'account e fai il trial.** Su reachifyme.com, signup, 7 giorni gratis. 5 minuti.

**2. Configura il profilo.** Collega il tuo LinkedIn account, configura timezone, personalizza le preferenze. 15 minuti.

**3. Genera i primi 7 post.** Usa il Post Generator per 7 idee. Non pubblicare ancora, salva in bozza. 30 minuti.

**4. Cura i draft.** Per ogni bozza, aggiungi 2-3 righe di tuo contenuto specifico (un caso, un numero, un'opinione). 1-2 ore.

**5. Schedula.** Programma i 7 post per la settimana prossima, uno al giorno. 15 minuti.

**6. Misura.** Dopo una settimana, guarda engagement, reach, e click. Identifica cosa funziona. 30 minuti di review.

**7. Itera.** Per la settimana 2, raddoppia le idee, seleziona le migliori, ripeti il ciclo.

In una settimana hai un content calendar attivo. In un mese, hai dati su cosa funziona per il tuo pubblico.

### Errori comuni

**Pubblicare senza modificare.** Il draft AI è una base, non un prodotto finito. Aggiungi sempre il tuo punto di vista.

**Ignorare la voce personale.** ReachifyMe genera testi che suonano AI. Il pattern "AI-generated" è immediatamente riconoscibile. Più personalizzi, meno si nota.

**Postare troppo.** 3-5 post/settimana è il sweet spot. Sotto 1, non crei momentum. Sopra 7, saturi il pubblico.

**Non misurare.** Senza analytics, non sai cosa funziona. Traccia engagement, reach, click, e conversion.

**Ignorare i commenti.** LinkedIn premia l'engagement. Rispondere ai commenti aumenta la reach. ReachifyMe non automatizza i commenti, e non dovrebbe — la risposta personale è il valore.

### Le domande che ci fanno più spesso

**ReachifyMe è meglio di Taplio?**
Taplio è più caro ma più completo. Per chi ha budget, Taplio. Per chi parte, ReachifyMe.

**Funziona per la company page?**
Sì, supporta sia profilo personale che company page.

**I post generati sembrano AI?**
Sì, se non li modifichi. Il draft AI è un punto di partenza.

**Quanto costa in un anno?**
Dipende dal tier, ma indicativamente $120-$360/anno.

**Posso automatizzare i DM?**
No, ReachifyMe è per content, non per outreach automation.

**Funziona con il Sales Navigator?**
No, è per organica, non per Sales Navigator.

### Alternative da considerare

- **Taplio.** Più completo, più caro.
- **Buffer.** Multi-piattaforma, meno AI.
- **Hootsuite.** Enterprise, multi-piattaforma.
- **Supergrow.** LinkedIn + outreach automation.
- **Shield Analytics.** Per analytics LinkedIn, non generation.
- **AuthoredUp.** Per personal brand LinkedIn, focus su formattazione.

### Cosa ci aspettiamo da ReachifyMe nei prossimi mesi

**Più AI features.** Generator più intelligenti, hook migliori, integrazione con trend analysis.

**Analytics più profonde.** Post performance, audience insights, competitor tracking.

**Multi-piattaforma?** LinkedIn-first è la loro scelta. Possibili estensioni, ma il focus su LinkedIn è una delle ragioni del successo.

**Integrazione con CRM.** Per chi usa LinkedIn per lead generation, integrazione con HubSpot o Salesforce sarebbe potente.

### In sintesi

ReachifyMe è uno dei tool più accessibili per accelerare la creazione di contenuti LinkedIn. Il prezzo è entry-level per la categoria, le feature coprono il 90% del workflow di un creator LinkedIn, e il tool è focalizzato — non cerca di fare tutto.

Le limitazioni sono: dipendenza dall'AI che genera testi riconoscibili se non personalizzati, mancanza di outreach automation, focus esclusivo su LinkedIn. Per il target giusto — creator e freelance con content regolare su LinkedIn — è una delle scelte più efficienti.

### Prossimi passi

- **Apri la scheda tool di ReachifyMe** per confrontare con Taplio, Buffer, e altri LinkedIn tool.
- **Esplora la raccolta su LinkedIn e social selling** per casi d'uso affini.
- **Salva ReachifyMe nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "flowise-ai",
    title: 'Flowise AI: costruire agenti e flussi RAG senza scrivere codice',
    dek: 'Canvas visuale per LLM, vector store, memory e tool: come funziona davvero.',
    summary:
      "Flowise AI è un framework open source per costruire applicazioni LLM, agenti, e flussi RAG con un" +
      "canvas visuale drag-and-drop. In questa guida vediamo come funziona, quando ha senso adottarlo" +
      "rispetto a LangChain e LlamaIndex, e come portarlo in produzione senza sorprese.",
    kind: "guide",
    tool_slug: 'flowise',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/flowise-ai",
    featured: false,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Flowise, in una frase

Flowise è un layer visuale sopra LangChain, LangGraph e LlamaIndex: colleghi nodi su una canvas invece di scrivere orchestration code, e ottieni un'app LLM funzionante — chatbot, agente RAG, flusso multi-agent — che puoi esporre come API, embeddare come widget, o self-hostare gratis.

Non è un chatbot builder. È un programma per chi vuole costruire applicazioni LLM senza reinventare l'orchestrazione ogni volta.

### A chi serve davvero, e a chi no

Flowise ha un fit molto preciso. Funziona bene per:

- **Team engineering che prototipano agenti LLM in ore invece di settimane.** Un senior che conosce LangChain può costruire un agente RAG completo in un pomeriggio. Un junior che non lo conosce può costruirlo in un giorno, guardando la canvas invece di leggere documentazione.
- **Team di prodotto che vogliono testare interi flussi AI prima di impegnare risorse in una build custom.** Drag, drop, eval, itera. Quando la logica è giusta, puoi esportare il JSON e portarlo in codice.
- **Aziende che vogliono self-hostare per ragioni di data residency, compliance, o semplice costo.** Il core è Apache 2.0, gira in Docker, ed è gratis anche per uso commerciale.
- **Team che devono costruire POC per pitch interni o clienti.** Funziona meglio di una slide per dimostrare "abbiamo un agente che fa X".

Non è la scelta giusta per:

- **Team che non hanno nessuna competenza tecnica.** Non è un no-code "per tutti". Devi capire cosa fa un LLM, cosa fa un vector store, perché chunking e retrieval contano. Se non hai almeno una persona tecnica nel team, Flowise ti darà più problemi che soluzioni.
- **Applicazioni mission-critical in produzione senza engineering di guardia.** Flowise aiuta a costruire velocemente, ma quando il flusso gestisce transazioni o decisioni importanti, ti serve comunque un team che possa intervenire, monitorare, debuggare a livello di log. La canvas non ti salva da una catena di tool calls che impazzisce.
- **Casi d'uso che richiedono un controllo fine su modelli custom, GPU interne, o architetture di inference non standard.** Funziona, ma stai lottando contro lo strumento. Per quel livello di customizzazione, meglio scrivere il codice.

### Le tre modalità di build: Assistant, Chatflow, Agentflow

Flowise organizza il lavoro in tre livelli di complessità crescente. Capire la differenza è il primo passo per non usare lo strumento nel modo sbagliato.

**Assistant** è il livello più semplice. Crei un assistente che segue istruzioni, chiama tool se servono, e risponde da una knowledge base di file che carichi. È quello che useresti per un chatbot di supporto che sa rispondere solo su una serie di documenti caricati, oppure per un "assistente interno" che conosce le policy aziendali. Il flusso in canvas è corto: prompt, documenti, memoria opzionale, output.

**Chatflow** è il livello intermedio, per sistemi single-agent più articolati. Hai retrieval-augmented generation (RAG) con supporto per reranking, graph-based RAG, hybrid search, e la possibilità di collegare decine di data loader (PDF, Notion, Confluence, Google Drive, siti web, S3, SQL). La canvas diventa una pipeline visuale: input → query rewriting → retriever → reranker → LLM → output, con la possibilità di ramificare, fare fallback, mantenere memoria conversazionale.

**Agentflow** è il livello agente. Qui costruisci sistemi in cui un agente principale analizza la richiesta, decide quali tool chiamare, instrada verso sotto-agenti specializzati, e orchestra l'esecuzione. È la modalità giusta per research assistant, data agent, internal copilots dove servono più step, hand-off di contesto, e decisioni dinamiche. Più potenza, più complessità, più cose che possono andare storte.

In produzione la maggior parte dei team usa Chatflow e Agentflow. Assistant è utile per prototipi o chatbot molto verticali.

### Architettura pratica: come è fatta davvero un'app Flowise

Una canvas Flowise non è un diagramma qualsiasi. È un grafo di esecuzione. Ogni nodo ha:

- **Input tipizzati.** Un nodo retriever si aspetta un query. Un nodo LLM si aspetta un prompt. Le connessioni tra nodi sono type-checked a runtime, e Flowise segnala quando manca un input o l'output non è compatibile.
- **Configurazione specifica.** Un nodo OpenAI LLM ha dentro il modello, la temperatura, il numero di token massimo, le credenziali (memorizzate cifrate nel credential store). Un nodo retriever Pinecone ha l'indicizzazione, il namespace, il numero di risultati. Espandere un nodo mostra decine di parametri.
- **Esecuzione tracciata.** Quando il flusso gira, ogni step lascia un trace: input, output, latenza, numero di token, modello usato, costo stimato. Questo è il materiale grezzo con cui fai debug, eval, e ottimizzazione. Senza traces, stai lavorando al buio.

L'output del flusso è esposto in tre modi:

- **API generata automaticamente.** Ogni flow ha un endpoint REST pronto, con auth, rate limiting, e configurazione CORS. Non devi scrivere backend code per esporlo.
- **Embedded chat widget.** Un componente JavaScript che inietti in un sito, e il flusso diventa un chatbot live. Personalizzi branding, posizione, lingua, behavior di apertura.
- **SDK TypeScript e Python.** Se l'app non è un sito web, usi le SDK per integrare il flusso nel tuo backend, mobile app, o flusso server-to-server.

Tutto questo è gratis nella self-hosted open source edition. La versione cloud aggiunge managed hosting, team workspaces, RBAC, e supporto prioritario — paghi per non dover gestire l'infrastruttura.

### Il modello di pricing, spiegato onestamente

Il pricing di Flowise è in due dimensioni: la piattaforma e i modelli.

**Piattaforma.** Self-hosted è gratis sotto Apache 2.0, con tutti i nodi, API, embedded widget, e accesso completo. Paghi solo l'infrastruttura (un server per il docker container, ~10-30 dollari al mese su Hetzner o DigitalOcean per workload leggeri) e il costo dei modelli LLM che usi. Per team che partono, è la strada più economica in assoluto.

La versione cloud ha tre tier: Free ($0/mese, 2 flow, 100 predictions, 5MB storage), Starter ($35/mese, flow illimitati, 10.000 predictions, 1GB storage), e Pro ($65/mese, 50.000 predictions, 10GB storage, workspaces illimitati, RBAC, priority support). Enterprise è custom, di solito per on-premise con SSO/SAML e SLA. I numeri sono stati verificati sulla pagina ufficiale di Flowise a luglio 2026 — cambiano spesso, ricontrolla prima di firmare un budget.

Attenzione: Workday ha annunciato l'acquisizione di Flowise il 14 agosto 2025. Al momento Flowise continua a operare come prodotto indipendente sotto Workday, la licenza Apache 2.0 è stata mantenuta, e il pricing non è cambiato sostanzialmente. Tuttavia, è una variabile da tenere d'occhio: le roadmap delle acquisizioni cambiano.

**Modelli.** Questa è la parte che il marketing di Flowise tende a nascondere. Ogni prediction consuma token, e ogni token si paga al provider del modello scelto. Se usi GPT-4o su 50.000 predictions al mese con un context medio, il conto modello è nell'ordine di 200-500 dollari al mese sopra i 65 della piattaforma. Il pricing cloud copre forse il 10-30% del vero costo totale di un deployment reale. Per un calcolo onesto, prendi il tier cloud e aggiungi il costo modello — e poi aggiungi il costo vettoriale storage se usi Pinecone, Weaviate, o simili.

Una regola pratica: budget realistico per un POC serio è 200-500 dollari al mese, 500-1500 per un deployment di produzione medio, e cifra da definire per volumi enterprise. Non è un tool "gratis che fa tutto".

### I tre setup operativi, e quando scegliere ognuno

**Self-hosting open source.** Scarichi il docker, lo fai girare, accedi alla UI su localhost:3000. Tempo di setup: 15-30 minuti per chi ha familiarità con Docker, un'ora per chi parte da zero. Costi ricorrenti: server (10-50 dollari al mese a seconda delle dimensioni) + LLM API calls. Pro: controllo totale, nessun vendor lock-in, privacy, data residency. Contro: devi gestire aggiornamenti, backup, sicurezza, e monitoring. Adatto a team con competenza DevOps o SysAdmin.

**Flowise Cloud.** Ti iscrivi, crei l'account, accedi alla canvas via browser. Tempo di setup: 5 minuti. Costi ricorrenti: tier cloud (35-65 dollari al mese) + LLM API. Pro: zero gestione infrastruttura, team collaboration pronta, SSO su Pro. Contro: costi più alti a lungo termine, dati ospitati da Flowise/Workday. Adatto a team che vogliono andare veloce e accettano di pagare per la gestione.

**Enterprise on-premise.** Self-hosted ma con contratto enterprise: SSO/SAML, audit log, support dedicato, SLA. Costi: da definire con il vendor, generalmente migliaia di dollari al mese. Pro: sicurezza enterprise, compliance. Contro: lock-in contrattuale. Adatto a organizzazioni con requisiti di compliance specifici (sanità, finanza, pubblica amministrazione).

La scelta si riduce a tre domande: il vostro team ha competenza DevOps? Avete requisiti di data residency stringenti? Quanto è grande il deployment? Se la prima è sì e le altre due sono basse, self-host. Se la prima è no e la terza è medio-bassa, cloud. Se la terza è alta o avete requisiti stringenti, enterprise.

### Cosa puoi costruire, in concreto

Flowise non è solo chatbot. Le applicazioni che i team mettono in produzione coprono almeno queste aree:

**Internal copilot aziendale.** L'utente carica documenti aziendali (policy, manuali, contratti tipo, knowledge base), Flowise indicizza tutto in un vector store, e il dipendente fa domande in linguaggio naturale. La differenza rispetto a un classico search è che il sistema risponde con citazioni, sintetizza, e gestisce domande ibride ("confronta la policy ferie con il contratto del nuovo assunto"). Casi d'uso tipici: onboarding, supporto IT interno, help desk HR.

**Customer support automation.** L'agente accede a FAQ, knowledge base pubblica, storico conversazioni, e tool interni (controllo ordine, verifica account). Quando non sa rispondere, instrada a un umano con tutto il contesto. È la differenza tra un chatbot che frustrerebbe il cliente e uno che effettivamente riduce il volume al support team.

**Document processing pipeline.** Carichi contratti, fatture, CV, o report, l'agente li estrae, li classifica, li struttura in output JSON, e li manda a un sistema downstream. Sostituisce settimane di data entry manuale in processi finance, legal, HR.

**Research assistant.** Data analyst o researcher che interrogano un corpus di paper, articoli, o documentazione tecnica. L'agente fa retrieval, riassume, compara, e cita. Risparmia ore di lettura manuale.

**Sales enablement.** L'agente conosce le schede prodotto, i casi studio, le objection handling. Il sales rep chiede "come rispondo a un cliente che dice che il pricing è troppo alto per il volume?" e l'agente genera una risposta contestualizzata.

**Code assistant verticale.** Flowise si collega a un repository Git, indicizza il codice, e permette di fare domande sull'architettura, trovare pattern, generare documentazione. È quello che fa Cursor o Copilot, ma con il tuo codice dentro e la possibilità di integrarlo con tool esterni (issue tracker, CI/CD, documentazione interna).

Queste sono applicazioni reali in produzione, non demo. Richiedono tutte una fase di valutazione, monitoring, e iterazione — non è "metti Flowise, funziona". Ma sono fattibili in settimane, non in trimestri.

### Limiti e trade-off, dichiarati onestamente

Flowise non è una bacchetta magica. Ci sono almeno cinque limiti strutturali che devi conoscere prima di impegnare tempo e budget.

**Debug dei flussi complessi è difficile.** Quando un agente sbaglia, può essere per il prompt, il modello, il retriever, il chunking, o la logica di orchestrazione. La canvas aiuta, ma la tracciabilità a livello di singola decisione non è nativa — devi costruirtela tu o esportare i log in un observability tool esterno (LangSmith, Helicone, o il tuo sistema). I nodi "if/else" diventano rapidamente illeggibili quando il flusso supera una certa soglia di complessità.

**Il costo modello è imprevedibile.** Un agente con 5 tool calls per task, su 1000 task al giorno, può spendere 50 dollari o 500 a seconda della qualità delle risposte, dei modelli scelti, e del context che si porta dietro. Senza budget guardrails, una settimana di traffico anomalo può triplicare la fattura. Lavora con budget alerts, rate limiting, e modelli più piccoli dove possibile.

**Versioning e governance sono deboli.** Le canvas sono oggetti JSON, ma il flusso di lavoro (chi ha cambiato cosa, perché, quando) non è una funzione nativa di Flowise. Per team che devono tracciare decisioni AI per compliance, serve un layer esterno (Git per la canvas JSON, ticket system per le decisioni). Per team piccoli non è un problema. Per aziende regolamentate, è un blocker parziale.

**LangChain è in costante mutazione.** Flowise segue LangChain da vicino, ma il wrapper visuale non sempre copre tutte le funzionalità LangChain di ultima generazione. Se LangChain introduce un nuovo pattern (graph agents, reflection, planner-executor), Flowise può richiedere settimane per integrarlo. È il prezzo di essere sopra un framework invece di essere il framework.

**Il flusso JSON esportato non è production-ready.** Puoi esportare la canvas come JSON, ma non è codice LangChain pulito. È un dump dello stato. Per portare il flusso in produzione in modo sostenibile, o lo ri-scrivi in codice LangChain a mano, o lo mantieni su Flowise per tutta la vita. La prima opzione è la più sana per il lungo periodo. La seconda è la più veloce.

### Flowise vs i concorrenti diretti

Il panorama dei visual agent builder è affollato. Flowise ha un posizionamento specifico, e vale la pena capire dove si distingue.

**Flowise vs LangFlow.** LangFlow è il concorrente più vicino: stessa base LangChain, stessa interfaccia visuale, open source. La differenza storica è che Flowise ha più nodi, una community più ampia, e un perimetro funzionale leggermente più largo (Agentflow è una distinzione che LangFlow non ha allo stesso modo). LangFlow è un buon fallback se Flowise non ti piace. Per il 90% dei casi, sono intercambiabili.

**Flowise vs n8n.** n8n è una piattaforma di automazione general-purpose con nodi AI aggiunti di recente. È più adatta a orchestrazioni che coinvolgono API esterne, CRM, fogli Google, e tool SaaS, meno a pipeline RAG pure. Se il tuo flusso è "l'utente chiede qualcosa, l'agente decide, chiama un'API, salva il risultato su Notion", n8n è più ergonomico. Se è "l'utente fa una domanda, l'agente cerca in un corpus, genera una risposta con citazioni", Flowise è la scelta giusta.

**Flowise vs LangSmith / LangGraph Studio.** Sono strumenti diversi con obiettivi diversi. LangGraph è un framework per agenti complessi, LangSmith è una piattaforma di observability e eval. Flowise non compete con loro: li complementa. Puoi costruire il flusso in Flowise, esportarlo, e portarlo in LangGraph per orchestrazioni avanzate.

**Flowise vs tool commerciali chiusi (Vellum, Voiceflow, Botpress).** I closed-source hanno spesso UI più rifinite, customer support reattivo, e compliance enterprise certificata. Ma costano 5-10 volte tanto, ti vincolano a un vendor, e hanno meno flessibilità. Per un POC in 48 ore, Flowise open source batte tutti. Per un deployment enterprise con audit e compliance, valuta i closed-source.

**Flowise vs build custom con LangChain.** Costruire da zero ti dà controllo totale, ma costa settimane di sviluppo e ti costringe a mantenere il codice. Flowise ti fa partire in un'ora e ti permette di iterare. Il momento in cui il custom vince è quando il flusso deve scalare in modo molto specifico, o quando hai requisiti che la canvas non esprime bene (es. modelli custom su GPU interne, logica di sicurezza stratificata, integrazione con sistemi legacy).

### Setup pratico: da zero a un agente funzionante in un'ora

Ecco il percorso minimo per portare un agente RAG funzionante dalla zero. Funziona per self-hosting e per cloud.

**1. Crea l'istanza.** Self-hosting: \`docker run -d --name flowise -p 3000:3000 flowiseai/flowise\`. Cloud: iscriviti a flowiseai.com e crea un workspace. Tempo: 5 minuti.

**2. Prepara le credenziali.** Vai in "Credentials", crea una API key OpenAI (o Anthropic, o quello che preferisci). Non usare la chiave root del tuo account. Tempo: 2 minuti.

**3. Carica i documenti.** Vai in "Document Stores", crea uno store, carica 5-10 PDF o file di testo. Per il primo test, file piccoli, sotto 50 pagine ciascuno. Tempo: 5 minuti.

**4. Crea il flow.** Vai in "Chatflows", "Create New". Parti dal template "Document Q&A" o "Conversational Retrieval Agent". Il template è già un agente RAG funzionante. Tempo: 3 minuti.

**5. Configura i nodi.** Apri il nodo "Document Loader" e seleziona lo store che hai creato. Apri il nodo "Embeddings" e configura il modello (OpenAI text-embedding-3-small è il default sensato). Apri il nodo "LLM" e scegli il modello (gpt-4o-mini per test, gpt-4o per qualità). Tempo: 10 minuti.

**6. Indicizza.** Salva il flow, poi clicca "Upsert" sul document store. Indicizza i file (tempo dipende dalla quantità: da secondi a minuti). Tempo: 5 minuti.

**7. Testa.** Apri la chat integrata, fai una domanda sul contenuto dei documenti. Verifica che la risposta abbia citazioni. Tempo: 5 minuti.

**8. Esponi.** Vai su "API", copia l'endpoint generato. Testalo con curl. Tempo: 5 minuti.

**9. Embedda (opzionale).** Vai su "Embedded Chat", copia lo script, incollalo in una pagina web. Tempo: 5 minuti.

In un'ora hai un agente che risponde a domande su un corpus documentale, con citazioni, e che puoi embeddare ovunque. È POC-ready. Per arrivare a produzione, ci vogliono altre iterazioni: eval su un dataset di test, tuning dei prompt, gestione degli errori, monitoring.

### Errori comuni che vedo fare a chi inizia

Dopo aver visto decine di implementazioni, i pattern di errore sono ricorrenti.

**Scegliere il modello sbagliato per il task.** Usare GPT-4o per un chatbot FAQ è sovradimensionato e costoso. gpt-4o-mini o Claude Haiku fanno lo stesso lavoro a un quarto del costo, e per task semplici la qualità è indistinguibile. Usa il modello più piccolo che risolve il task, e scala solo quando la qualità effettivamente migliora.

**Chunking sbagliato.** Il chunking decide come il testo viene spezzato per l'embedding. Default troppo grandi o troppo piccoli uccidono la qualità del retrieval. Per documenti densi (paper accademici, contratti), chunking ricorsivo con overlap 10-20% è un buon punto di partenza. Per FAQ, chunking per sezione. Misura sempre con un set di domande rappresentative.

**Dimenticare la valutazione.** "Funziona" è diverso da "funziona bene". Senza un dataset di eval (20-50 domande con risposta attesa), stai navigando a vista. Crea un set di eval il primo giorno, e misura su quel set a ogni iterazione seria. Altrimenti cambi il prompt e non sai se hai migliorato o peggiorato.

**Self-hosting senza monitoring.** Self-hostare senza logging e monitoring centralizzato significa che il primo bug in produzione ti arriva via email dall'utente. Metti Loki, Datadog, o anche solo un buon syslog davanti al container, prima di andare live.

**Progettare senza pensare ai limiti del modello.** I modelli attuali hanno finestra di context limitata (8K-200K token, a seconda del modello). Flussi che mandano 100K token per task sono lenti e costosi. Riassumi, filtra, prioritizza. Lavora sul contesto che conta, non su quello che hai.

**Sottovalutare il tempo di iterazione.** Un agente in produzione richiede settimane di iterazione su prompt, retrieval, chunking, e valutazione. Non è un deliverable da una settimana. Se hai un cliente che si aspetta "agente in produzione in 5 giorni", Flowise non ti salva. Rinegoziare le aspettative o non partire.

### Il futuro di Flowise: cosa guardare nei prossimi mesi

L'ecosistema LLM si muove velocemente. Le aree da osservare su Flowise specificamente:

- **Workday integration.** L'acquisizione del 2025 può significare integrazione profonda con l'ecosistema HR/finance di Workday. Utile se sei un'azienda Workday, neutro se non lo sei. Possibile lock-in a lungo termine da monitorare.
- **Agent evaluation framework.** Flowise ha iniziato a includere eval nel prodotto. Se migliora la qualità del debugging, diventa molto più production-ready. Tieni d'occhio le release notes.
- **Multi-agent orchestration.** Agentflow è relativamente giovane rispetto a LangGraph puro. Se i framework concorrenti (CrewAI, AutoGen) consolidano pattern migliori, Flowise potrebbe rincorrere.
- **MCP (Model Context Protocol).** Supporto crescente per collegare tool esterni via MCP standard, che potrebbe diventare il modo principale di integrare sistemi.

Per ora Flowise è una delle migliori opzioni per il visual agent building open source. La combinazione Apache 2.0 + self-hosting + community attiva + LangChain compatibile lo rende difficile da battere per il target giusto. Ma non è il tool giusto per tutti, e non è gratis come sembra — il costo modello è la vera variabile di spesa.

### Le domande che ci fanno più spesso

**Flowise è davvero gratis?**
Il core open source è gratis sotto Apache 2.0, anche per uso commerciale. Paghi solo server e modelli LLM. La versione cloud ha tier a pagamento per chi non vuole gestire infrastruttura. Il "gratis" finisce quando hai un deployment di produzione serio, perché i costi modello crescono velocemente.

**Posso esportare il flusso in codice LangChain?**
Sì, ogni canvas esporta un JSON con la struttura del flusso. Non è codice Python pulito pronto per produzione, ma puoi leggerlo, capirlo, e ri-scriverlo in LangChain. È un buon modo per prototipare velocemente e poi consolidare in codice manutenibile.

**Flowise vs LangGraph?**
LangGraph è un framework Python per agenti, con il massimo controllo. Flowise è sopra LangChain/LangGraph/LlamaIndex, con una UI. Se il tuo team è Python-native e vuole codice production-ready, LangGraph. Se vuoi velocità di prototipazione e visualizzazione del flusso, Flowise.

**Funziona con Claude e Gemini oltre a OpenAI?**
Sì. Flowise supporta OpenAI, Anthropic, Google, Cohere, HuggingFace, modelli locali via Ollama, e qualsiasi provider OpenAI-compatible. La scelta del modello è una decisione per nodo, non un'impostazione globale.

**Quanto è sicuro self-hostarlo?**
Dipende da quanto fai hardening. Out of the box, Flowise richiede auth di base, e le credenziali sono cifrate a riposo. Per ambienti enterprise, devi aggiungere reverse proxy con TLS, secret management esterno (Vault), audit logging, e SSO. Non è zero-config per ambienti regolamentati.

**Posso usarlo per un chatbot commerciale sul mio sito?**
Sì, e in effetti è uno dei casi d'uso più comuni. L'embedded widget è production-ready. Le consideration sono: modello e costi, gestione del context a lungo termine, fallback a umano quando l'agente non sa rispondere, monitoring della qualità.

### Alternative da considerare

- **LangFlow.** Alternativa diretta, stessa base LangChain, open source. Pro: nessun lock-in, interfamiliare. Contro: meno nodi, community più piccola. Adatto se Flowise non ti convince per qualche ragione.
- **LangGraph.** Framework Python puro. Pro: massimo controllo, codice production-ready. Contro: zero visuale, devi sapere Python bene.
- **n8n.** Automazione general-purpose con nodi AI. Pro: enorme libreria di integrazioni. Contro: meno specializzato per AI.
- **Voiceflow.** Piattaforma chiusa con buona UX. Pro: interfaccia rifinita, customer support. Contro: costoso, lock-in.
- **CrewAI / AutoGen.** Framework Python per multi-agent. Pro: pattern di orchestrazione potenti. Contro: richiede competenza Python, no visuale.
- **Build custom con LangChain.** Per quando il flusso è critico e ti serve il pieno controllo. Costo: settimane di sviluppo iniziale.

### Cosa ci aspettiamo da Flowise nei prossimi mesi

Il 2026 è l'anno in cui i visual agent builder passano da "POC veloce" a "production-grade". Le aree da osservare:

- **Eval nativo.** Se Flowise costruisce un framework di valutazione integrato, diventa molto più serio per uso di produzione. La eval è il collo di bottiglia attuale.
- **Observability.** Tracciamento granulare di token, costo, latenza, errori per flusso. I closed-source ce l'hanno, open source arranca.
- **MCP e integrazione tool standardizzata.** Il Model Context Protocol sta diventando lo standard per collegare tool. Se Flowise lo supporta bene, è un vantaggio competitivo.
- **Agent versioning e collaboration.** Più utenti su un flow, conflitti, merge. Git-like per canvas.
- **Modelli on-device e privacy.** Esecuzione locale di modelli via Ollama, LM Studio, vLLM. Già supportato in parte, da consolidare.

### In sintesi

Flowise è un buon prodotto per un target preciso: team con competenza tecnica che vogliono costruire applicazioni LLM velocemente, mantenere il controllo del codice, e iterare rapidamente. Non è il tool per chi inizia da zero senza basi tecniche, e non è gratis come sembra — il costo modello è la vera spesa. Per il target giusto, è probabilmente la migliore opzione open source nel 2026. Per il target sbagliato, è frustrante e costoso.

La decisione chiave non è "Flowise sì o no" — è "abbiamo le competenze per usarlo bene, e il budget per i modelli?". Se sì a entrambe, Flowise è una scelta solida. Se no a una delle due, meglio costruire con un closed-source gestito o tornare al codice.

### Prossimi passi

- **Apri la scheda tool di Flowise** per confrontare con altri agent builder nel catalogo.
- **Esplora le raccolte su agenti AI e automazioni** per vedere casi d'uso affini.
- **Salva Flowise nei preferiti** se vuoi tornarci dopo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "lemon-squeezy",
    title: 'Lemon Squeezy: merchant of record per SaaS e prodotti digitali',
    dek: 'Pagamenti internazionali, tasse, fatturazione e dunning senza una fintech interna.',
    summary:
      "Lemon Squeezy è un merchant of record (MoR) che gestisce pagamenti internazionali, tasse (VAT, GST," +
      "sales tax US), fatturazione e dunning per SaaS e prodotti digitali. In questa guida vediamo come" +
      "funziona, quando conviene rispetto a Stripe + TaxJar, e quali sono le insidie per le aziende" +
      "europee.",
    kind: "guide",
    tool_slug: 'lemon-squeezy',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/lemon-squeezy",
    featured: false,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Lemon Squeezy, in una frase

Lemon Squeezy è un merchant of record per chi vende prodotti digitali e SaaS: si mette come venditore legale su ogni transazione, e in cambio gestisce tasse globali, fatturazione ricorrente, licenze software, chargeback, e pagamenti internazionali — lasciando a te il prodotto e il marketing.

Non è un payment processor. È un'azienda che compra la tua fattura e si assume il rischio fiscale.

### Cosa significa "merchant of record" e perché è importante

Il merchant of record (MoR) è l'entità che appare sulla carta di credito del cliente come venditore. Quando un cliente americano compra il tuo plugin WordPress e vede "Lemon Squeezy" sull'estratto conto, Lemon Squeezy è il MoR. Tu sei il fornitore del prodotto. Lemon Squeezy è il commerciante.

Questo ribaltamento ha conseguenze operative enormi:

**Tasse.** Il MoR è legalmente responsabile del calcolo, della riscossione, e del versamento di IVA, GST, e sales tax in ogni giurisdizione dove vende. Se vendi a un cliente in Germania, è Lemon Squeezy che calcola l'aliquota IVA tedesca del 19%, la aggiunge al checkout, la versa al fisco tedesco, e ti rende conto a fine mese. Tu non devi registrarti al VAT MOSS, non devi fare dichiarazioni intracomunitarie, non devi sapere che la Svizzera ha cambiato l'aliquota al 8.1% a gennaio 2024. Lemon Squeezy lo sa.

**Chargeback.** Se un cliente contesta il pagamento, è Lemon Squeezy che gestisce la disputa, fornisce la documentazione al circuito, e si fa carico del rischio economico. Tu vieni notificato, e nei casi gravi può esserci un impatto sul tuo account, ma non sei tu a dover rispondere al cliente arrabbiato e al rappresentante Visa.

**Compliance.** Anti-money laundering, KYC, GDPR per i dati di pagamento, PCI-DSS per la gestione delle carte — tutto a carico del MoR. Se non hai mai letto il PCI-DSS, è una pagina da 300+ pagine di requisiti tecnici e operativi. Lemon Squeezy lo gestisce.

**Fatturazione internazionale.** Il cliente italiano vuole fattura con partita IVA? Lemon Squeezy la genera. Il cliente UK vuole fattura con VAT number? Lemon Squeezy la genera. Il cliente canadese vuole fattura in dollari con il suo HST? Anche. Tu non devi sapere come si fa.

Questo è il valore vero. Non è "pagare meno" — è "non dover gestire un dipartimento fiscale".

### Chi dovrebbe usare Lemon Squeezy, e chi no

Lemon Squeezy è ideale per un profilo specifico:

**Indie hacker, solo founder, micro-team** che vendono il primo SaaS, plugin, template, o corso. Il founder tipico ha un'azienda semplice (spesso una LLC, SRL, o partita IVA), vende a clienti internazionali, non ha un CFO, e vuole passare il minor tempo possibile a gestire la fiscalità. Lemon Squeezy gli toglie un mese di burocrazia al primo setup, e gli toglie il costo di un commercialista internazionale ogni anno.

**SaaS in fase early-stage** con abbonamenti mensili o annuali, che hanno bisogno di merchant of record perché stanno vendendo in paesi dove non hanno un'entità legale. Senza MoR, vendere a clienti europei da una LLC americana è un incubo fiscale.

**Creatori di prodotti digitali** (corsi, ebook, template, asset) che vogliono vendere globalmente senza diventare esperti di sales tax.

**Shopify brands** che passano a prodotti digitali o ibridi.

**Team che vogliono dunning e subscription management senza scrivere il proprio sistema.** La gestione dei mancati pagamenti (carte scadute, fondi insufficienti, frodi) è uno dei lavori più noiosi del billing. Lemon Squeezy la fa, con retry automatici, email di sollecito, e grace period configurabili.

Non è la scelta giusta per:

**SaaS con MRR superiore a 50-100k dollari al mese.** A quel punto i volumi sono tali che il 5% di Lemon Squeezy diventa un costo significativo, e probabilmente hai bisogno di un setup più flessibile (Stripe + un servizio tax automation come Stripe Tax, Quaderno, o TaxJar). Inoltre, l'integrazione con il tuo prodotto diventa abbastanza complessa che il lock-in conta.

**Marketplace o piattaforme multi-vendor.** Lemon Squeezy non è progettato per essere il payment layer di un marketplace dove hai venditori terzi che ricevono pagamenti. Per quello servono Stripe Connect, Adyen for Platforms, o simili.

**Aziende che hanno bisogno di una vera entità locale in Europa.** Se devi fatturare in Italia con partita IVA italiana per ragioni di soglia, di compliance, o di credibilità commerciale, Lemon Squeezy non ti risolve. Ti serve una SRL italiana (o equivalente), e probabilmente Stripe o un'altra soluzione MoR con entity locale.

**Prodotti fisici.** Lemon Squeezy è progettato per digitali. Per i fisici servono Shopify, WooCommerce, o soluzioni e-commerce generali.

### Come funziona, tecnicamente

Il flusso operativo è lineare. Una volta configurato, funziona così.

**Setup iniziale.** Crei l'account su lemonsqueezy.com (gratis, no carta di credito richiesta). Configuri il tuo profilo venditore: dati fiscali di base, metodi di pagamento da accettare, valuta di pagamento. Tempo: 15-30 minuti.

**Creazione del primo prodotto.** Vai su "Products", "New Product". Definisci nome, descrizione, prezzo, immagine. Scegli il tipo: one-time purchase, subscription, pay-what-you-want, free, o bundle. Configuri opzioni di variante (es. licenza singola vs. team), trial, sconti. Tempo: 10-20 minuti per il primo prodotto.

**Generazione del checkout.** Lemon Squeezy genera automaticamente un URL di checkout ospitato. Lo embeddi nel tuo sito come overlay, o lo condividi come link diretto, o lo inserisci in un pulsante. Tempo: 5 minuti.

**Integrazione con il tuo prodotto.** Per SaaS e software con licenze, colleghi Lemon Squeezy al tuo backend via webhook o API: quando un pagamento è confermato, Lemon Squeezy ti manda un POST, e tu attivi la licenza, sblocchi l'account, o fai quello che devi. Per prodotti non software, puoi anche ignorare le webhook e basta usare la gestione clienti integrata.

**Gestione clienti e abbonamenti.** Il cliente ha un suo account sul customer portal di Lemon Squeezy (ospitato da loro o sul tuo dominio custom), dove può aggiornare il metodo di pagamento, scaricare le fatture, cancellare l'abbonamento, vedere la cronologia. Tu non devi costruire nessuna di queste UI.

**Dunning e retry.** Se un pagamento fallisce, Lemon Squeezy riprova automaticamente secondo una schedule (smart retries basati sul tipo di fallimento, non random), manda email al cliente, e ti notifica solo se l'azione richiede il tuo intervento. La "involuntary churn" da carte scadute scende drasticamente.

### Il modello di pricing reale, non quello dichiarato

Lemon Squeezy dichiara "5% + 50¢ per transazione". È la base. Il conto reale è quasi sempre più alto, e capire perché è fondamentale prima di scegliere.

**La fee base.** 5% + 50¢ per transazione andata a buon fine. Su una vendita da 100 dollari, paghi $5.50 a Lemon Squeezy.

**International card fee.** +1.5% quando il cliente paga con una carta emessa in un paese diverso dal tuo. Su una vendita da 100 dollari a un cliente tedesco con carta tedesca (e tu sei in Italia), paghi un altro $1.50. Totale: $7.00.

**PayPal fee.** +1.5% per pagamenti PayPal. Anche qui, $1.50 in più su $100.

**Recurring subscription fee.** +0.5% su ogni rinnovo di abbonamento. Su $100/anno, paghi 50¢ extra al mese successivo. Su $10/mese, paghi 5¢. Trascurabile a basso volume, misurabile a volumi alti.

**Abandoned cart recovery fee.** +5% quando converti un carrello abbandonato via email automation di Lemon Squeezy. Una tantum, ma il 5% è salato.

**Affiliate referred sale fee.** +3% per vendite che arrivano tramite il programma affiliate integrato. Se usi l'affiliate program, è un costo significativo.

Facciamo i conti su uno scenario realistico per un SaaS indie:

Cliente tedesco, subscription mensile da 30 dollari, paga con carta, abbonamento ricorrente, e dopo tre mesi la carta scade → dunning → retry → recovery.

- Primo mese: 5% + 50¢ + 1.5% internazionale = $2.10. Incassi netti: $27.90.
- Mesi 2-12 (rinnovi senza problemi): 5% + 50¢ + 1.5% + 0.5% recurring = $2.25. Incassi netti: $27.75.
- Mese in cui la carta fallisce e poi viene aggiornata: due addebiti, doppio costo.

Su un cliente lifetime value di $360 (12 mesi × $30), Lemon Squeezy incassa circa $26.50 — il 7.4% del ricavo, non il 5%. Su volumi più alti, le fee internazionali e PayPal pesano meno in proporzione, ma il conto resta salato rispetto a un setup Stripe + tax automation (dove paghi 2.9% + 30¢ + $0.5%-$1.5% su un tax automation, totale circa 3.5-4.5%).

Il break-even point dove Lemon Squeezy conviene rispetto a Stripe + tax automation è quando il costo di gestire la compliance fiscale internazionale da soli è superiore al delta di fee. Per la maggior parte dei piccoli SaaS, quel break-even arriva presto, già al primo cliente europeo.

**Email marketing è separato.** Lemon Squeezy include email marketing gratis fino a 500 subscribers, poi si paga un tier separato basato sul numero di subscribers. Se ti serve solo transactional email, è gratis. Se vuoi fare drip campaigns, automation, segmentation serie, è un costo aggiuntivo.

**Custom pricing per alti volumi.** Lemon Squeezy offre pricing custom per merchant che generano volumi significativi. Se arrivi a $10k-$20k/mese di ricavi, parla con il sales team. Il pricing pubblico è il massimo, non il minimo.

### Le feature chiave che devi conoscere

**Storefronts e checkout ospitati.** Ogni prodotto ha una pagina checkout ospitata su Lemon Squeezy (sottodominio o tuo dominio custom). Conversioni: l'ottimizzazione del checkout è il loro lavoro, non il tuo. Supportano upsells, downsells, order bumps, coupon codes, e bundles.

**Subscription management robusto.** Pause, riprendi, upgrade, downgrade, downgrade con prorating, cancellation flow con survey, winback email, dunning con smart retry. Se hai mai provato a costruire tutto questo, sai quanto è noioso. Lemon Squeezy lo dà gratis.

**License key generation.** Per prodotti software, generi e gestisci license keys associate alle vendite. Il cliente riceve la chiave via email, può attivarla, e tu verifichi via API. Supporta attivazioni multiple, deactivation, rotation.

**Email marketing integrato.** Non è un tool di email marketing serio (non compete con ConvertKit o Mailchimp), ma copre le basi: opt-in forms, broadcast, automation semplici. Sufficiente per il transactional, insufficiente per marketing automation seria.

**Affiliates integrato.** Programma affiliate nativo: definisci commissione (percentuale o flat), generi link, tracci conversioni, paghi tramite PayPal o Wise. Niente tool esterni, niente costi aggiuntivi. Il costo è il 3% di fee sulle vendite affiliate — è il prezzo dell'integrazione.

**Webhooks e API.** Per integrazioni custom, hai webhooks (ordine creato, ordine pagato, subscription creata, cancellata, etc.) e una API REST. Il pattern è: il tuo backend riceve il webhook, verifica la firma, aggiorna lo stato utente. Per SaaS è il pattern standard.

**Tassazione globale automatica.** Questo è il valore centrale. EU VAT, UK VAT, GST australiano, sales tax USA (dove applicabile), GST canadese, IVA messicana. Lemon Squeezy si tiene aggiornata sulle aliquote e sui threshold. Tu non guardi mai un regolamento fiscale.

**GDPR e data residency.** Lemon Squeezy è basato in UK, opera sotto GDPR, e memorizza i dati di pagamento su infrastruttura PCI-compliant. Il dato "chi ha comprato cosa" è tuo (lo esporti), il dato "carte di credito" è loro e mai tuo.

### Casi d'uso reali che funzionano bene

**SaaS indie con prezzi $5-$50/mese.** Il taglio di mercato perfetto. Subscription management, license keys, dunning, tasse globali: tutto risolto. Il 5%+50¢ è un costo accettabile.

**Corsi online e cohort-based programs.** Vendor di corsi che vendono a clienti internazionali. Checkout ospitato, gestione studenti, integrazione con piattaforme esterne via webhook.

**Plugin e temi WordPress, software desktop, asset digitali.** Vendor che vendono licenze una tantum o annuali. License key generation, activation tracking, e protezione da chargeback per licensing dispute.

**Template, UI kit, design asset.** Venditori individuali su Gumroad che passano a Lemon Squeezy per avere merchant of record e tasse gestite.

**Indie developer su AppSumo o Product Hunt launch.** Quando lanci un prodotto e hai bisogno di checkout pronto in 5 minuti senza setup tecnico.

**Studios e freelance che vendono servizi ricorrenti.** Subscription mensile per manutenzione, retainer, o servizi a canone. Lemon Squeezy gestisce la fatturazione, tu gestisci il lavoro.

### Casi in cui Lemon Squeezy non è la scelta giusta

**Se stai costruendo un marketplace.** Multi-vendor richiede Connect-like, e Lemon Squeezy non lo è. Stripe Connect, Adyen for Platforms.

**Se devi fatturare in valuta locale come entità locale.** Se devi emettere fatture italiane con partita IVA italiana, devi avere una SRL italiana, e Lemon Squeezy non ti sostituisce.

**Se il tuo MRR supera i $50k e vuoi negoziare fee.** A quel punto contatti il sales team, ma se non ottieni fee migliori di ~3-4%, potrebbe convenirti Stripe + tax automation.

**Se hai bisogno di compliance specifica di settore.** HIPAA per il medical, PCI-DSS per il gaming con denaro reale, etc. Lemon Squeezy è PCI-DSS per il processing, ma non copre compliance specifiche di settore. Per HIPAA ti serve un BAA, e Lemon Squeezy probabilmente non lo offre.

**Se vendi prodotti che richiedono licenze particolari.** Gambling, armi, software crittografico in certi paesi, prodotti regolamentati. Lemon Squeezy si riserva il diritto di rifiutare categorie specifiche. Verifica i ToS prima di impegnarti.

### Lemon Squeezy vs Paddle vs Gumroad vs Stripe

Il mercato ha diverse opzioni. Le differenze sono sottili e contano.

**Lemon Squeezy vs Paddle.** Sono i due MoR più diretti. Paddle è più enterprise-oriented, ha un tier Pro a $650/mese pensato per SaaS più strutturati, e supporta multi-entity (puoi avere più MoR in paesi diversi per compliance locale). Lemon Squeezy è più indie-friendly, ha un pricing più semplice, e un'affiliate program nativo. Per il 90% degli indie SaaS, sono intercambiabili. Paddle vince su compliance enterprise, Lemon Squeezy vince su semplicità e costi per piccoli volumi.

**Lemon Squeezy vs Gumroad.** Gumroad è il precursore del mercato "MoR per creatori". È più semplice, più adatto a creatori puri (chi vende un singolo ebook o corso), meno a SaaS con subscription. Fee simili (10% flat su Gumroad vs 5%+50¢ su Lemon Squeezy), ma Gumroad ha meno strumenti di subscription management. Se vendi un solo prodotto e non ti serve subscription, Gumroad va bene. Se vendi subscription o licenze, Lemon Squeezy è superiore.

**Lemon Squeezy vs Stripe + tax automation.** Stripe è solo payment processor (non MoR), quindi il vendor è tecnicamente tu. Ma puoi aggiungere Stripe Tax, Quaderno, o TaxJar per automatizzare la tassazione. Il costo totale: 2.9% + 30¢ (Stripe) + $0.5-1.5% (tax automation) = 3.5-4.5%. Più economico del 5% di Lemon Squeezy. Ma devi gestirti la complessità del setup, l'integrazione con il tuo backend, e in certi paesi avrai bisogno di un'entità locale per essere veramente MoR. Per team che hanno già un developer dedicato, Stripe + tax automation è spesso la scelta giusta sopra una certa soglia di volumi.

**Lemon Squeezy vs Stripe Managed Payments.** Stripe ha lanciato Managed Payments, una funzionalità MoR simile a Lemon Squeezy. È in beta, disponibile per un sottoinsieme di clienti, e la roadmap è di migrazione progressiva dei merchant Lemon Squeezy. Se stai pensando a lungo termine e vuoi restare nell'ecosistema Stripe, tienilo d'occhio. Per ora, Lemon Squeezy ha più funzionalità merchant of record mature.

### Setup pratico: da zero a una prima vendita in un'ora

**1. Crea l'account.** Su lemonsqueezy.com, registrazione con email, no carta richiesta. 2 minuti.

**2. Configura il profilo.** Settings → Store. Aggiungi nome dello store, URL (sottodominio o custom), valuta di default, paese fiscale. 10 minuti.

**3. Crea il primo prodotto.** Products → New Product. Definisci nome, descrizione, prezzo. Scegli il tipo (one-time o subscription). Configura variante se necessario. 15 minuti.

**4. Configura il checkout.** Per ogni prodotto, hai un checkout URL. Customizzi i colori, il logo, le opzioni di upsell. 10 minuti.

**5. Testa con un pagamento vero.** Lemon Squeezy ha una modalità test che simula transazioni. Fai un giro, verifica che le email arrivino, che il webhook funzioni (se ne hai configurato uno). 10 minuti.

**6. Integra nel tuo sito.** Aggiungi il link al checkout, o embeddi l'overlay via JS. Per SaaS, configura i webhook per attivare la licenza. 15 minuti.

Totale: un'ora. Hai un prodotto in vendita con tasse, fatturazione, subscription, dunning, e merchant of record attivi. Per un SaaS custom con licenze, aggiungi un'ora per l'integrazione webhook.

### Errori comuni che vedo fare

**Non configurare il webhook correttamente.** Il webhook è dove la vendita diventa attivazione utente. Se lo sbagli, vendi ma non attivi, e l'utente si arrabbia. Testalo con cura. Lemon Squeezy ha un sistema di firma sui webhook per evitare spoofing — usalo.

**Sottovalutare l'impatto del 5%+50¢ su small-ticket.** Se vendi un plugin da $5 una tantum, il 50¢ fisso è il 10% del ricavo. Sommato al 5%, stai dando via il 20%. Per small-ticket products, le fee pesano in modo sproporzionato. Considera bundle, free trials, o piani annuali per alzare il ticket medio.

**Non testare il dunning flow.** Il 20-30% dei mancati pagamenti su subscription è involuntary (carte scadute, fondi insufficienti). Se il tuo dunning è mal configurato, perdi soldi che potresti recuperare. Testa cosa succede quando una carta scade: il cliente riceve l'email? Il retry avviene? La notifica ti arriva?

**Pensare che MoR sostituisca l'accountant.** Lemon Squeezy gestisce le tasse di vendita (sales tax, VAT, GST). Non gestisce le tasse sul reddito della tua azienda (corporate tax, imposta sui redditi delle società). Per quelle ti serve ancora un commercialista. MoR è per il lato "entrate" della fatturazione, non per il lato "profitti" della tua contabilità.

**Ignorare le restrictions geografiche.** Lemon Squeezy ha una lista di paesi a restricted trade. Se i tuoi clienti sono in paesi sanzionati o in settori vietati, le transazioni vengono rifiutate. Verifica i ToS e la restricted countries list prima di promettere vendite globali.

### Il futuro di Lemon Squeezy

Le aree da osservare:

- **Migrazione verso Stripe Managed Payments.** Stripe possiede Lemon Squeezy dal 2024. La roadmap a lungo termine è un consolidamento, ma Lemon Squeezy continua a operare come prodotto indipendente. Tieni d'occhio le comunicazioni ufficiali se sei un merchant esistente.
- **Tassazione globale e compliance.** Le regole cambiano. EU VAT, UK VAT post-Brexit, sales tax US per stato (alcuni stati stanno introducendo nuove regole per SaaS), GST indiana. Lemon Squeezy si tiene aggiornata. Tu devi assicurarti di avere il setup giusto per il tuo modello.
- **Funzionalità enterprise.** Al momento Lemon Squeezy è fortemente indie. Se iniziano a investire in SSO, audit log, multi-entity, e compliance enterprise, può diventare una scelta valida anche per SaaS più grandi.
- **Affiliates e discovery.** Il programma affiliate integrato è una delle feature più distintive. Se lo sviluppano (più analytics, attribution migliore, payout methods aggiuntivi), diventa un canale di crescita interessante.

### Le domande che ci fanno più spesso

**Lemon Squeezy è davvero merchant of record?**
Sì, e questo è il valore centrale. Il tuo nome non appare sull'estratto del cliente, e Lemon Squeezy si assume le responsabilità fiscali e di chargeback.

**Quanto costa davvero?**
5% + 50¢ base, ma con international card fee, PayPal fee, recurring fee, e altri add-on, il costo reale è spesso 6-8% per un SaaS con clienti internazionali. Calcola il tuo caso specifico.

**Funziona per SaaS o solo per prodotti digitali?**
Funziona per entrambi. Il SaaS è supportato nativamente con subscription, license keys, webhook. I prodotti digitali (ebook, template, corsi) sono il caso d'uso originale.

**Posso migrare a Stripe Managed Payments o Paddle?**
Migrare è sempre possibile ma doloroso: devi re-emettere license keys, re-importare customers, riconfigurare i webhook. Pianifica bene prima di partire.

**C'è un trial?**
No trial. Crei un account gratis e testi in modalità test prima di andare live. Non c'è costo fino a quando non vendi.

**Posso vendere in valuta diversa dal dollaro?**
Sì, supportano USD, EUR, GBP, AUD, CAD e altre. Il cliente paga nella sua valuta, tu ricevi in quella che hai configurato, con conversione automatica.

**Come funziona per le società europee con partita IVA?**
Lemon Squeezy genera fatture con VAT reverse charge per clienti B2B intra-EU, e con VAT normale per clienti finali. Tu fornisci il tuo VAT number, e le fatture ai clienti lo riflettono.

### Alternative da considerare

- **Paddle.** MoR enterprise-oriented, multi-entity, fee comparabili. Adatto per SaaS più strutturati.
- **Gumroad.** Più semplice, meno adatto a SaaS. Buono per creatori puri.
- **Stripe + tax automation.** Più economico sopra certi volumi, richiede più setup. Stripe Tax, Quaderno, TaxJar come tax automation.
- **Stripe Managed Payments.** In beta, da monitorare per la roadmap.
- **Pabbly Subscription Billing.** Alternativa con fee più basse ma MoR limitato. Buono per mercati a basso volume dove le fee pesano molto.
- **Chargebee + payment processor.** Per subscription management serio sopra $50k MRR, Chargebee si integra con Stripe, Adyen, Braintree, e aggiunge layer di subscription logic, dunning, e revenue recognition. Non è MoR, è un tool di subscription management.

### In sintesi

Lemon Squeezy è una scelta eccellente per indie SaaS, micro-team, e creator che vendono prodotti digitali a clienti internazionali. Il merchant of record vero è il valore centrale, e giustifica le fee superiori rispetto a Stripe puro. Le fee diventano meno convenienti sopra $50-100k MRR, e a quel punto è ragionevole valutare Paddle, Stripe + tax automation, o soluzioni ibride.

Non è la scelta giusta per tutti, e non è gratis. Ma per il target giusto — un founder con 100 clienti internazionali che non vuole diventare esperto di sales tax — è probabilmente la scelta migliore sul mercato.

### Prossimi passi

- **Apri la scheda tool di Lemon Squeezy** per confrontare con Paddle, Stripe, e altri payment processor.
- **Esplora la raccolta su pagamenti e billing** per casi d'uso affini.
- **Salva Lemon Squeezy nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "agentxai",
    title: 'AgentX: costruire agenti AI no-code per lead e flussi automatizzati',
    dek: 'Quando un agent builder no-code ha senso, e quando è meglio costruire da zero.',
    summary:
      "AgentX è una piattaforma no-code per costruire agenti AI specializzati, con flussi multi-step, tool" +
      "integration, e gestione lead. In questa guida vediamo come funziona, quali use case regge bene" +
      "(qualificazione lead, supporto di primo livello, automazioni interne), e dove invece un approccio" +
      "custom è ancora preferibile.",
    kind: "guide",
    tool_slug: 'agentx',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/agentxai",
    featured: false,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa AgentX, in una frase

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
`,
  },

  {
    slug: "omi-app-ai",
    title: 'Omi: il wearable open-source che ascolta, trascrive e ricorda',
    dek: 'Cosa fa il dispositivo AI indossabile di Based Hardware, e a chi serve davvero.',
    summary:
      "Omi è un wearable AI open-source prodotto da Based Hardware: si aggancia al collo o all'orecchio," +
      "ascolta le conversazioni, le trascrive, le riassume, e le organizza in memoria ricercabile. In" +
      "questa guida vediamo come funziona, quando ha senso per freelancer, executive, e persone con ADHD, e" +
      "quali sono i limiti reali (batteria, privacy, precisione).",
    kind: "guide",
    tool_slug: 'omi',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/omi-app-ai",
    featured: false,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Omi, in una frase

Omi è un dispositivo wearable che ascolta le tue conversazioni, le trascrive in tempo reale, genera riassunti strutturati, e ti permette di cercare nella tua memoria conversazionale — un "secondo cervello" ambient che vive appeso al collo.

Non è un registratore vocale. Non è un'app di note con AI. È un dispositivo di memoria personale continua che richiede decisioni consapevoli su privacy, consenso sociale, e data ownership.

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

**Hardware.** Omi Dev Kit 2 a $89 (prezzo di pre-order al momento). Include il dispositivo, custodia in silicone, lanyard, caricatore USB-C magnetico. È un prezzo entry-level per un wearable AI — competitivo vs Plaud Note ($179), Limitless Pendant ($99), Friend ($129).

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
$89 hardware + $199 (annual Unlimited) = $288 anno uno. Se ti basta Basic, $89 anno uno. Se usi BYO API key, $89 hardware + costo API (variabile, $10-50/mese per uso moderato).

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
`,
  },

  {
    slug: "wegic",
    title: 'Wegic: il website team AI per lanciare un sito in pochi minuti',
    dek: 'Design, copy e code generati da una conversazione: quando funziona, quando no.',
    summary:
      "Wegic è un website builder AI conversazionale: descrivi cosa vuoi, l'AI genera design, copy e" +
      "codice. In questa guida vediamo come funziona, per quali progetti è adatto (landing page," +
      "micro-siti, MVP), e dove invece è meglio usare un website builder tradizionale o un CMS.",
    kind: "guide",
    tool_slug: 'wegic',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/wegic",
    featured: true,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Wegic, in una frase

Wegic è un website builder conversazionale: descrivi cosa vuoi, l'AI genera un sito completo in 60 secondi, e iteri con prompt in linguaggio naturale invece di drag-and-drop — pensato per chi vuole un sito credibile rapidamente senza competenze tecniche o di design.

### A chi serve davvero, e a chi no

Wegic è per:

**Freelance e piccole attività** che vogliono un sito vetrina o una landing page senza pagare un designer o imparare WordPress. Il workflow conversazionale è più veloce di qualsiasi drag-and-drop builder.

**Persone che hanno procrastinato il sito per anni** perché il processo tradizionale è troppo scoraggiante. Wegic abbatte la barriera d'ingresso.

**Side project e MVP** che hanno bisogno di una presenza online in pochi minuti. Test di mercato, validazione, early traction.

**Micro-imprese locali** (ristoranti, studi professionali, artigiani) che vogliono una presenza web basic senza complessità.

**Creator che vogliono un sito portfolio** veloce. Designer, fotografi, scrittori.

Non è per:

**Aziende con siti complessi.** E-commerce avanzato, multi-language, membership, blog articolato. Per quello, WordPress, Shopify, o soluzioni custom.

**Designer professionisti.** Se vuoi controllo pixel-perfect sul design, Wegic non è il tool. Figma o Webflow sono superiori.

**Siti con contenuti dinamici complessi.** Database-driven, login area, custom forms con logica complessa. Wegic gestisce form base, non applicazioni web.

**E-commerce avanzato.** C'è un'integrazione pagamenti base, ma per shop seri Shopify rimane lo standard.

### Cosa fa, in pratica

Wegic si basa su Kimmy, l'AI assistant, che gestisce l'intero workflow.

**1. Conversazione iniziale.** Apri Wegic, Kimmy ti chiede: business, target, stile, pagine necessarie, tone. Pochi scambi, ~5 minuti.

**2. Generazione del sito.** In 60-90 secondi, Kimmy genera un sito multi-pagina completo: layout, copy, immagini AI, responsive design. Non un mockup, un sito pronto.

**3. Modifica conversazionale.** Da qui in poi, tutte le modifiche avvengono via chat. "Cambia il colore dell'header", "Aggiungi una sezione servizi", "Il testo è troppo formale". Kimmy interpreta ed esegue.

**4. Voice input.** Per chi pensa meglio parlando, puoi dettare le modifiche invece di digitarle.

**5. Sketch/circling.** Disegna direttamente sulla pagina per indicare quale elemento modificare. Più preciso del text-only per layout adjustments.

**6. AI visitor assistant.** Sul sito pubblicato, un chatbot AI risponde a domande dei visitatori sulla tua attività. Customer service lightweight incluso.

**7. Multi-language generation.** Genera il sito in più lingue contemporaneamente. Per chi serve audience internazionale.

**8. Publishing.** One-click publishing. Hosting incluso, SSL, dominio custom su tier pagati.

**9. Code export.** Esporta il codice (HTML/CSS/JS) durante la subscription attiva. Per chi vuole migrare altrove o customizzare oltre.

### Pricing, onestamente

I prezzi cambiano frequentemente (verifica su wegic.ai):

- **Free trial, $2.99 one-time.** Una generazione completa di sito. Pubblicato con branding Wegic.
- **Free tier.** Limitato: pochi siti, pochi crediti AI, dominio Wegic. I siti pubblicati vanno offline senza subscription attiva.
- **Starter, ~$11.90-$23.90/mese (varia per billing cycle).** 400-600 crediti/mese (~10-15 generazioni o 40-60 modifiche), 10 pagine per sito, 10.000 visitatori/mese, dominio custom, badge Wegic rimosso, 1 sito pubblicato.
- **Premium, ~$19.90-$41.90/mese.** 1000+ crediti/mese (25 generazioni o 100+ modifiche), pagine illimitate, dominio custom, visitatori illimitati, Google Analytics, siti illimitati.
- **Ultra, $2.999/mese.** Managed service, 7-day delivery, design revisions illimitate, advanced integrations. Enterprise.

**Annual billing** risparmia circa il 40% su Starter e Premium.

**Caveat importante: i crediti non roll-over.** Ogni mese ricominci da zero. Se sprechi crediti in modifiche che non funzionano, li perdi.

**Caveat più critico: i crediti si consumano anche per modifiche che falliscono.** Se chiedi una modifica che l'AI non riesce a fare bene, i crediti sono comunque spesi. Questo è documentato come il principale complaint.

### Cosa fa bene, e cosa no

**Fa bene:** generazione iniziale del sito, modifiche semplici, design responsive automatico, multi-language, fast iteration. Il punto di forza è la velocità di setup.

**Fa meno bene:** personalizzazione avanzata del design, ottimizzazione SEO tecnica profonda, integrazioni custom complesse, performance optimization.

**Fa male:** siti che richiedono logica di business complessa (booking systems, calcolatori prezzi, aree riservate con permessi granulari).

### Quando Wegic ha senso, e quando no

**Ha senso:** sito vetrina per piccola attività, landing page per prodotto/servizio, portfolio personale, sito per side project. Tempo dal brief al live: sotto 1 ora.

**Non ha senso:** e-commerce serio, blog con centinaia di articoli, sito corporate con pagine dinamiche, applicazione web.

**Caso borderline:** se hai bisogno di un sito "credibile" ma non perfetto, e iterare velocemente ti conviene più del controllo assoluto, Wegic è OK. Se vuoi pixel-perfect e customizzazione totale, no.

### Wegic vs Framer vs Wix AI vs Durable vs 10Web

**Wegic vs Framer.** Framer è più designer-oriented, con più controllo ma learning curve più ripida. Wegic è più conversazionale. Per designer che vogliono customizzazione, Framer. Per non-designer, Wegic.

**Wegic vs Wix AI.** Wix è il re dei website builder tradizionali, con AI features aggiunte. Wix ha più template, più app, più flessibilità, ma è più complesso. Wegic è più snello. Per chi vuole semplicità estrema, Wegic. Per chi vuole un ecosistema maturo, Wix.

**Wegic vs Durable.** Durable è il competitor più diretto: AI website builder, conversazionale, simile posizionamento. Durable è più economico, Wegic ha più utenti. Differenze minime, prova entrambi.

**Wegic vs 10Web.** 10Web è focalizzato su WordPress + AI, conversion di siti statici a WordPress. Più complesso, più adatto a chi vuole restare in WordPress ecosystem.

**Wegic vs Squarespace AI.** Squarespace è design-first, con template premium. AI features sono basic. Per chi cerca design premium senza AI, Squarespace. Per chi cerca AI + velocità, Wegic.

### Casi d'uso reali

**Ristorante che vuole un sito vetrina.** Wegic Free trial → Premium. 1 ora dal brief al live. Include menu, orari, location, contatti.

**Freelance designer che vuole un portfolio.** Wegic Starter. Sito con progetti, bio, contatti. Tempo di creazione: 30 minuti.

**SaaS che vuole una landing page per testare un nuovo prodotto.** Wegic Starter. Landing con copy generata, hero section, form di signup. Tempo: 1-2 ore.

**Coach che vuole un sito per vendere servizi.** Wegic Premium con integrazione pagamenti (colleghi il tuo Stripe). Sito + sistema di booking base.

**Artigiano che vuole una presenza online.** Wegic Free o Starter. Sito semplice, portfolio, contatti.

### Setup pratico: da zero al sito live in 1-2 ore

**1. Crea l'account.** Su wegic.ai, signup con Google o email. 3 minuti.

**2. Inizia la conversazione con Kimmy.** Rispondi alle domande su business, target, stile. 5-10 minuti.

**3. Genera il primo draft.** 60-90 secondi di attesa, sito pronto. 2 minuti.

**4. Itera via chat.** 5-10 round di "cambia X", "aggiungi Y", "riformula Z". 30-60 minuti.

**5. Connetti dominio custom (opzionale).** Su Starter o Premium, configura tuodominio.com. 10 minuti.

**6. Configura analytics (opzionale).** Google Analytics su Premium. 10 minuti.

**7. Pubblica.** Click "Publish". Sito live. 5 minuti.

**8. Setup AI visitor assistant (opzionale).** Configura il chatbot per il tuo sito. 15 minuti.

In 1-2 ore hai un sito live, responsive, multi-page, con dominio custom. Per un sito vetrina, è un risultato onesto.

### Errori comuni

**Sprecare crediti su modifiche generiche.** "Migliora il design" è vago e consuma crediti senza risultato. Meglio: "Cambia il colore dell'header da blu a verde scuro".

**Non rivedere il draft iniziale.** Il primo draft è decente ma generico. Senza iterazione, resta generico. La personalizzazione è nel prompt delle iterazioni.

**Aspettarsi controllo totale.** Wegic non è Figma. Se vuoi spostare un singolo pixel, non è il tool. Per quel livello, Framer o Webflow.

**Ignorare le performance.** I siti Wegic sono accettabili ma non ottimizzati per performance. Per Lighthouse score 90+, ti serve un dev che lavori sul codice esportato.

**Pubblicare senza testare mobile.** Il design è responsive, ma la resa su mobile può differire. Testa sempre su 360px e 390px prima di pubblicare.

### Le domande che ci fanno più spesso

**Wegic è meglio di Squarespace?**
Per chi vuole velocità di setup e non ha competenze di design, sì. Per chi vuole template premium e flessibilità di design, Squarespace.

**Posso esportare il codice?**
Sì, durante la subscription attiva. Il codice è HTML/CSS/JS standard. Per migrare altrove, contatta il supporto.

**Quanto costa davvero?**
Starter ~$11.90-$23.90/mese, Premium ~$19.90-$41.90/mese, con annual saving. Ultra è enterprise.

**Wegic fa e-commerce?**
Funzionalità base (colleghi il tuo Stripe/PayPal), ma non è un e-commerce platform. Per shop seri, Shopify.

**Funziona per portfolio?**
Sì, è uno dei suoi use case migliori.

**I siti Wegic sono SEO-friendly?**
Base. Puoi configurare meta tags, ma non hai controllo su URL structure, sitemap, o structured data avanzato. Per SEO serio, devi intervenire manualmente.

### Alternative da considerare

- **Durable.** Simile, più economico.
- **Framer.** Più designer-oriented, più controllo.
- **Wix AI.** Più maturo, più complesso.
- **Squarespace.** Design premium, meno AI.
- **10Web.** WordPress + AI, più complesso.
- **Carrd.** Ultra-minimalist, per one-page site.

### Cosa ci aspettiamo da Wegic nei prossimi mesi

**Modelli AI migliori per generazione.** Ogni release migliora la qualità del primo draft.

**Code export migliore.** Esportazione più pulita, più portabile.

**Analytics integrate.** Oltre Google Analytics, dashboard Wegic.

**Più integrazioni.** CRM, email marketing, payment, automazioni.

**Miglioramento del credit system.** È il principale pain point. Se risolvono il problema dei crediti sprecati su modifiche fallite, diventa molto più user-friendly.

### In sintesi

Wegic è una delle opzioni più accessibili per chi vuole un sito AI-generated in tempi brevi. Il workflow conversazionale è il suo superpotere, e i 300.000+ siti generati sono una validation del market fit.

Le limitazioni principali sono: credit system che non rolla-over e consuma su errori, mancanza di controllo design pixel-perfect, performance non ottimali, e-commerce limitato. Per il target giusto — non-designer che vogliono un sito vetrina — è una scelta eccellente. Per siti complessi, no.

### Prossimi passi

- **Apri la scheda tool di Wegic** per confrontare con Durable, Framer, e altri AI website builder.
- **Esplora la raccolta su website builder e no-code** per casi d'uso affini.
- **Salva Wegic nei preferiti** se pensi di usarlo.
- **Ricevi aggiornamenti editoriali** iscrivendoti al feed delle guide TooolVibes.
`,
  },

  {
    slug: "tolt",
    title: 'Tolt: lanciare un programma affiliate per SaaS senza fee iniziali',
    dek: 'Dashboard self-serve, commissioni ricorrenti, payout globali: come funziona.',
    summary:
      "Tolt è una piattaforma self-serve per lanciare e gestire un programma di affiliazione per SaaS," +
      "senza commissioni upfront e con modello revenue-share. In questa guida vediamo come funziona, quando" +
      "conviene rispetto a FirstPromoter, PartnerStack, e Lemon Squeezy affiliates, e quali sono le best" +
      "practice per far decollare il programma.",
    kind: "guide",
    tool_slug: 'tolt',
    published_at: "2025-07-14",
    updated_at: "2026-08-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/posts/tolt",
    featured: false,
    highlights: [],
    details: [],
    cautions: [],
      content_markdown: `### Cosa fa Tolt, in una frase

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
`,
  },

];

// `supabase/fixtures/staging_seed.sql` uses this UUID for its local-only
// restore record. The public database query cannot infer fixture intent from
// publish status, so retain the exact immutable identifier at this boundary.
const LOCAL_RESTORE_FIXTURE_ARTICLE_ID =
  "60000000-0000-4000-8000-000000000001";

/** Keeps the deterministic restore fixture out of every public consumer. */
export function isPublicAuthoredArticle(article: BlogArticleRecord) {
  return article.id !== LOCAL_RESTORE_FIXTURE_ARTICLE_ID;
}

function sortPosts(posts: EditorialPostRecord[]) {
  return [...posts].sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }

    return right.published_at.localeCompare(left.published_at);
  });
}

export async function loadCatalogEditorialPosts(): Promise<EditorialPostRecord[]> {
  const tools = await getPublishedTools();
  const guideSlugs = new Set(guideSeeds.map((seed) => seed.slug));
  const toolWriteups = tools
    .map(buildToolWriteup)
    .filter((post): post is EditorialPostRecord => {
      if (!post) return false;
      return !guideSlugs.has(post.slug);
    });

  return sortPosts([
    ...guideSeeds.map((item) => ({
      ...item,
      updated_at: item.published_at,
    })),
    ...toolWriteups,
  ]);
}

async function loadAuthoredEditorialPosts(): Promise<EditorialPostRecord[]> {
  if (!isSupabasePublicEnabled()) {
    return [];
  }

  try {
    const articles = await getPublishedArticlesFromSupabase();
    return articles
      .filter(isPublicAuthoredArticle)
      .map(mapArticleToEditorialPost);
  } catch {
    try {
      const articles = await getPublishedArticlesFromArticleStorage();
      return articles
        .filter(isPublicAuthoredArticle)
        .map(mapArticleToEditorialPost);
    } catch {
      return [];
    }
  }
}

function mergeEditorialPosts(
  authoredPosts: EditorialPostRecord[],
  catalogPosts: EditorialPostRecord[],
) {
  const seen = new Set<string>();
  const merged: EditorialPostRecord[] = [];

  for (const post of [...authoredPosts, ...catalogPosts]) {
    if (seen.has(post.slug)) {
      continue;
    }

    seen.add(post.slug);
    merged.push(post);
  }

  return sortPosts(merged);
}

async function loadEditorialPosts(): Promise<EditorialPostRecord[]> {
  const [authoredPosts, catalogPosts] = await Promise.all([
    loadAuthoredEditorialPosts(),
    loadCatalogEditorialPosts(),
  ]);

  return mergeEditorialPosts(authoredPosts, catalogPosts);
}

export const getPublishedEditorialPosts = cache(async (): Promise<EditorialPostRecord[]> => {
  return loadEditorialPosts();
});

export const getFeaturedEditorialPosts = cache(async (limit = 3): Promise<EditorialPostRecord[]> => {
  const posts = await loadEditorialPosts();
  const featured = posts.filter((post) => post.featured);

  return sortPosts((featured.length > 0 ? featured : posts).slice(0, limit));
});

export const getToolWriteupPosts = cache(async (): Promise<EditorialPostRecord[]> => {
  const posts = await loadEditorialPosts();
  return posts.filter((post) => post.kind === "tool-writeup");
});

export const getGuidePosts = cache(async (): Promise<EditorialPostRecord[]> => {
  const posts = await loadEditorialPosts();
  return posts.filter((post) => post.kind === "guide");
});

export const getBlogPosts = cache(async (): Promise<EditorialPostRecord[]> => {
  const posts = await loadEditorialPosts();
  return posts.filter((post) => post.kind === "editorial");
});

export const getEditorialPostBySlug = cache(async (slug: string): Promise<EditorialPostRecord | null> => {
  const posts = await loadEditorialPosts();
  return posts.find((post) => post.slug === slug) ?? null;
});

export const getEditorialPostByToolSlug = cache(async (
  toolSlug: string,
): Promise<EditorialPostRecord | null> => {
  const posts = await loadEditorialPosts();
  return posts.find((post) => post.tool_slug === toolSlug) ?? null;
});
