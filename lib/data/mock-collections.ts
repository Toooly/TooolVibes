import type { CuratedCollectionRecord } from "@/lib/types/collection";

export const mockCollections: CuratedCollectionRecord[] = [
  {
    id: "collection-01",
    title: "Stack AI per founder solo",
    slug: "ai-stack-solo-founders",
    description:
      "Una raccolta per chi vuole passare da idea a prodotto leggibile con pochi strumenti ma con un buon equilibrio tra ricerca, prova iniziale e shipping.",
    cover_image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Stack essenziale",
    rationale:
      "Questa collection tiene insieme orientamento, prova iniziale, superficie pubblica e memoria operativa. Non prova a fare tutto: serve a chiudere bene i primi passaggi che contano davvero quando lavori da solo e vuoi evitare uno stack troppo frammentato.",
    highlights: [
      "Passaggio corto da idea a prototipo condivisibile",
      "Attrito operativo basso per chi lavora solo o con team molto piccoli",
      "Tool che reggono sia la prima prova sia i primi giorni di lavoro reale",
    ],
    premium_teaser:
      "Quando serve andare oltre il setup iniziale, questo stack si apre bene a una issue piu` densa su sequencing, launch notes e handoff.",
    theme: "founder-stack",
    audience: "Solo founders",
    difficulty: "starter",
    tone: "starter-stack",
    access: "open",
    editorial_state: "featured",
    surface: "collection",
    featured_slot: "home-hero",
    editorial_order: 10,
    included_tools: [
      {
        tool_slug: "lovable",
        role: "Dall'idea all'interfaccia",
        note: "Per trasformare un'intuizione in una prima interfaccia navigabile senza attrito iniziale.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "cursor",
        role: "Build e rifinitura",
        note: "Quando il prototipo inizia a chiedere struttura, refactor e controllo vero del codice.",
        order: 2,
      },
      {
        tool_slug: "framer-ai",
        role: "Superficie di lancio",
        note: "Per dare credibilita` visiva alla presentazione pubblica o alla landing di validazione.",
        order: 3,
      },
      {
        tool_slug: "notion-ai",
        role: "Memoria operativa",
        note: "Per tenere insieme note, roadmap leggera e materiali di lavoro senza uscire dal flusso.",
        order: 4,
      },
      {
        tool_slug: "perplexity",
        role: "Layer di ricerca",
        note: "Da usare come orientamento rapido prima di decidere cosa approfondire davvero.",
        order: 5,
      },
    ],
    created_at: "2026-03-14T09:00:00.000Z",
    updated_at: "2026-03-16T09:00:00.000Z",
    first_published_at: "2026-03-14T12:00:00.000Z",
    published_at: "2026-03-16T09:00:00.000Z",
  },
  {
    id: "collection-02",
    title: "Essenziali per design sprint",
    slug: "design-sprint-essentials",
    description:
      "Una sequenza corta per concept, moodboard, prova iniziale e landing quando vuoi validare velocemente una direzione prodotto o campagna.",
    cover_image_url:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Bundle compatto",
    rationale:
      "Qui conta la qualita` della lettura piu` della quantita` dei tool. La raccolta e` costruita per esplorare, convergere e arrivare a una superficie presentabile senza perdere tono editoriale.",
    highlights: [
      "Moodboard e direzione visiva forti in poco tempo",
      "Passaggio rapido da concept a prototipo navigabile",
      "Landing e superficie finale coerenti col tono del concept",
    ],
    theme: "design-sprint",
    audience: "Designer-builders",
    difficulty: "growing",
    tone: "focused-bundle",
    access: "open",
    editorial_state: "featured",
    surface: "collection",
    featured_slot: "home-secondary",
    editorial_order: 20,
    included_tools: [
      {
        tool_slug: "midjourney",
        role: "Esplorazione visuale",
        note: "Per esplorare direzioni creative e materializzare rapidamente il tono visuale del progetto.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "framer-ai",
        role: "Rifinitura landing",
        note: "Per consolidare il concept in una pagina leggibile e credibile.",
        order: 2,
      },
      {
        tool_slug: "lovable",
        role: "Prototipo interattivo",
        note: "Per testare il feeling app-like e l'architettura di base prima di costruire davvero.",
        order: 3,
      },
      {
        tool_slug: "notion-ai",
        role: "Memoria sprint",
        note: "Per catturare ipotesi, insight e passaggi decisionali durante il lavoro.",
        order: 4,
      },
    ],
    created_at: "2026-03-13T10:00:00.000Z",
    updated_at: "2026-03-16T09:20:00.000Z",
    first_published_at: "2026-03-13T16:00:00.000Z",
    published_at: "2026-03-16T09:20:00.000Z",
  },
  {
    id: "collection-03",
    title: "Stack creator per video e voice",
    slug: "creator-video-stack",
    description:
      "Una selezione per chi lavora su video, audio e contenuti visuali con bisogno di velocita`, resa e workflow leggibili.",
    cover_image_url:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Scelta curatoriale",
    rationale:
      "La raccolta non guarda solo alla generazione. Tiene insieme ideazione visuale, post-produzione e contenuto text-first, cosi` il creator stack non si spezza tra tool brillanti ma scollegati.",
    highlights: [
      "Video e post-produzione con un taglio creator-first",
      "Bridge naturale tra contenuto parlato, visual e publishing",
      "Buona resa anche in piccoli team content o media-driven",
    ],
    theme: "creator-video",
    audience: "Creator teams",
    difficulty: "growing",
    tone: "editorial-picks",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 30,
    included_tools: [
      {
        tool_slug: "runway",
        role: "Motore visuale",
        note: "Per concept video, generazione e rifinitura con una sensazione prodotto piu` matura della media.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "descript",
        role: "Editing via testo",
        note: "Per alleggerire il lavoro su audio e video quando il contenuto conta piu` dell'editing tecnico puro.",
        order: 2,
      },
      {
        tool_slug: "midjourney",
        role: "Frame di concept",
        note: "Per visual direction, moodboard e frame references prima della produzione finale.",
        order: 3,
      },
      {
        tool_slug: "notion-ai",
        role: "Memoria produzione",
        note: "Per organizzare scalette, appunti, publishing notes e richiami editoriali.",
        order: 4,
      },
    ],
    created_at: "2026-03-12T11:00:00.000Z",
    updated_at: "2026-03-16T08:40:00.000Z",
    first_published_at: "2026-03-12T15:00:00.000Z",
    published_at: "2026-03-16T08:40:00.000Z",
  },
  {
    id: "collection-04",
    title: "Toolkit ricerca e sintesi",
    slug: "research-synthesis-toolkit",
    description:
      "Una raccolta piu` asciutta per aprire una ricerca, orientarsi bene, sintetizzare e trasformare insight in materiale davvero riutilizzabile.",
    cover_image_url:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Bundle compatto",
    rationale:
      "Questa collection da` forma a un workflow di orientamento e sintesi. I tool qui non devono stupire da soli: devono ridurre il tempo tra domanda iniziale, lettura delle fonti e conoscenza riusabile.",
    highlights: [
      "Piu` orientamento iniziale, meno rumore da tool generici",
      "Passaggio fluido da search a sintesi interna e output operativo",
      "Buon equilibrio tra velocita`, verificabilita` e leggibilita` finale",
    ],
    theme: "research-synthesis",
    audience: "Research-led teams",
    difficulty: "starter",
    tone: "focused-bundle",
    access: "premium-preview",
    premium_teaser:
      "La parte pubblica resta utile anche da sola; il layer member aggiunge note di lettura, sequencing e stack commentary piu` densi.",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 40,
    included_tools: [
      {
        tool_slug: "perplexity",
        role: "Orientamento iniziale",
        note: "Per costruire il primo perimetro della ricerca e capire cosa vale davvero approfondire.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "notion-ai",
        role: "Archivio di sintesi",
        note: "Per salvare insight, domande aperte e materiali operativi in un sistema che resta leggibile.",
        order: 2,
      },
      {
        tool_slug: "cursor",
        role: "Trasformazione finale",
        note: "Quando la sintesi deve diventare specifica, strutturata o pronta a entrare in un output tecnico.",
        order: 3,
      },
    ],
    created_at: "2026-03-11T12:00:00.000Z",
    updated_at: "2026-03-15T18:10:00.000Z",
    first_published_at: "2026-03-11T17:00:00.000Z",
    published_at: "2026-03-15T18:10:00.000Z",
  },
  {
    id: "collection-05",
    title: "Stack di lancio indie",
    slug: "indie-launch-stack",
    description:
      "Una special issue stretta e narrativa, costruita intorno al pre-launch e gia` leggibile come superficie premium reale.",
    cover_image_url:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Special issue",
    rationale:
      "Non e` un elenco di tool per fare tutto. E` una raccolta piu` stretta e piu` intenzionale che accompagna il momento del lancio con sequencing, passaggi leggibili e un ordine preciso tra concept, superficie pubblica e shipping.",
    highlights: [
      "Setup corto per arrivare a una prima uscita credibile",
      "Tool che si tengono bene tra loro nel momento piu` delicato del pre-launch",
      "Base giusta per una issue member che aggiunge profondita`, non solo framing premium",
    ],
    premium_teaser:
      "La parte pubblica fa vedere il taglio e il setup. L'issue completa aggiunge sequencing, note operative e asset di lancio con un livello curatoriale piu` denso.",
    theme: "indie-launch",
    audience: "Indie launchers",
    difficulty: "advanced",
    tone: "special-issue",
    access: "premium",
    editorial_state: "featured",
    surface: "special-issue",
    featured_slot: "special-issue",
    editorial_order: 15,
    advanced_issue: {
      format: "advanced-special-issue",
      reading_flow: "Tesi launch -> momenti stack -> tensione compare -> workflow -> takeaway",
      intro:
        "Questa issue non prova a coprire tutto il lancio. Isola i passaggi che fanno davvero differenza quando devi trasformare un prodotto ancora fragile in una superficie che sembra gia` pronta da mostrare.",
      thesis:
        "Un indie launch credibile nasce quando concept, presentazione e disciplina di shipping smettono di vivere in strumenti separati e iniziano davvero a sostenersi a vicenda.",
      takeaways: [
        "Il tool migliore non e` quello piu` brillante da solo, ma quello che regge bene il passaggio successivo.",
        "La superficie pubblica del lancio va progettata come parte del prodotto, non come asset finale aggiunto alla fine.",
        "Shortlist e compare servono a chiudere il cerchio dell'issue, non a uscire dal racconto.",
      ],
      blocks: [
        {
          id: "issue-opening",
          type: "opening-note",
          eyebrow: "Nota iniziale",
          title: "Uno stack di lancio non deve sembrare grande. Deve rendere inevitabile il prossimo passo.",
          body:
            "La forza di questa issue sta nella selezione stretta. Ogni tool incluso regge un momento preciso: concept, shipping discipline, asset di lancio e memoria operativa. Il formato piu` ricco serve a mostrare come questi passaggi si tengono insieme senza rumore.",
        },
        {
          id: "issue-thesis",
          type: "thesis",
          eyebrow: "Tesi del launch",
          title: "Il prodotto convince prima quando anche il racconto operativo sembra gia` allineato.",
          statement:
              "Il launch non chiede piu` tool: chiede una sequenza leggibile in cui prova iniziale, landing, asset e memoria non si contraddicano.",
          points: [
            "Framer AI regge il momento pubblico e il tono percepito.",
            "Lovable fa da ponte tra idea e artefatto navigabile.",
            "Cursor tiene basso il rischio quando il prototipo si sporca di codice vero.",
          ],
        },
        {
          id: "issue-picks",
          type: "curated-picks",
          eyebrow: "Momenti chiave",
          title: "I passaggi del launch che cambiano davvero il feeling dello stack.",
          body:
            "Qui non conta solo cosa usi, ma quando lo fai entrare. Questi sono i tre passaggi che spostano davvero la percezione del prodotto nei giorni piu` sensibili del pre-launch.",
          tool_moments: [
            {
              tool_slug: "framer-ai",
              label: "Credibilita` della superficie",
              note:
                "Entra quando hai gia` chiaro il concept e devi trasformarlo in una landing che faccia sembrare il lancio piu` maturo del suo stadio reale.",
              emphasis: "anchor",
            },
            {
              tool_slug: "lovable",
              label: "Narrazione del prototipo",
              note:
                "Tiene insieme il prodotto raccontato e il prodotto navigabile, cosi` la prima prova non resta solo una promessa.",
              emphasis: "support",
            },
            {
              tool_slug: "descript",
              label: "Asset di lancio",
              note:
                "Fa da ponte tra walkthrough, voice e asset di contenuto senza costringerti a un workflow media troppo tecnico.",
              emphasis: "watch",
            },
          ],
        },
        {
          id: "issue-compare",
          type: "compare-insight",
          eyebrow: "Lettura compare",
          title: "La tensione vera qui non e` scegliere un vincitore assoluto, ma capire quale ruolo regge meglio il passaggio successivo.",
          body:
            "Lovable, Framer AI e Cursor sembrano strumenti di fasi diverse. In pratica si sfiorano molto di piu`: il punto e` capire chi regge la transizione tra prova, percezione e shipping.",
          compare: {
            compared_tool_slugs: ["lovable", "framer-ai", "cursor"],
            insight:
              "Lovable vince quando devi far sembrare l'idea gia` viva. Framer AI vince quando il launch chiede una superficie credibile. Cursor vince quando la promessa deve reggere nel codice.",
            differentiators: [
              "Lovable: piu` rapido nella prima prova e sulla sensazione app-like",
              "Framer AI: piu` forte sulla superficie pubblica e sul launch polish",
              "Cursor: piu` adatto quando la prova iniziale inizia a richiedere struttura reale",
            ],
            recommendation:
              "Mettili in compare quando il dubbio non e` quale sia migliore, ma quale dei tre debba entrare per primo nel tuo launch stack.",
          },
        },
        {
          id: "issue-workflow",
          type: "workflow",
          eyebrow: "Sequenza operativa",
          title: "Una sequenza corta che porta da concept a launch surface senza dispersione.",
          body:
            "Questo e` il flusso che la special issue prova a rendere leggibile: partire da un concetto vivo, consolidarlo e preparare gli asset che servono davvero per uscire.",
          steps: [
            {
              title: "Dai corpo al concept",
              body: "Usa la prova iniziale per rendere l'idea spiegabile prima ancora di renderla perfetta.",
              tool_slug: "lovable",
              outcome: "Hai un artefatto navigabile e condivisibile.",
            },
            {
              title: "Rendi il launch credibile",
              body: "Porta il concept in una superficie pubblica con tono, posizionamento e gerarchia piu` maturi.",
              tool_slug: "framer-ai",
              outcome: "Landing e messaggio iniziano a sembrare allineati al prodotto.",
            },
            {
              title: "Proteggi la parte fragile",
              body: "Quando la prova iniziale tocca codice reale, usa disciplina e refactor minimo per non perdere fluidita`.",
              tool_slug: "cursor",
              outcome: "La prima prova non collassa appena provi a evolverla.",
            },
            {
              title: "Chiudi gli asset di lancio",
              body: "Prepari walkthrough, voice e materiali che aiutano il prodotto a presentarsi bene anche fuori dalla landing.",
              tool_slug: "descript",
              outcome: "Il launch ha un racconto piu` coeso e piu` leggibile.",
            },
          ],
        },
        {
          id: "issue-why",
          type: "why-this-matters",
          eyebrow: "Perche' conta",
          title: "Il valore di questa issue e` mostrare una progressione, non solo una lista.",
          body:
            "Per chi costruisce da solo o in team molto piccoli, la differenza la fa il ritmo tra i passaggi. Questa issue serve a rendere il launch stack meno casuale e piu` intenzionale.",
          points: [
            "Riduce il rischio di passare troppo presto da concept a shipping.",
            "Aiuta a distinguere tool da presentazione, tool da costruzione e tool da supporto.",
            "Tiene shortlist e compare dentro il racconto, invece di farli sembrare feature parallele.",
          ],
        },
        {
          id: "issue-takeaway",
          type: "editorial-takeaway",
          eyebrow: "Takeaway editoriale",
          title: "Se questa issue funziona, ti lascia con una shortlist piu` corta e con dubbi migliori.",
          body:
            "L'obiettivo non e` uscire con piu` tool salvati. L'obiettivo e` capire quale combinazione regge davvero il tuo momento di launch.",
          takeaways: [
            "Metti in shortlist solo i tool che spostano il passaggio successivo.",
            "Usa il compare per leggere la tensione tra prova iniziale, superficie e shipping.",
            "Torna ai profili singoli solo dopo aver capito il ruolo di ciascun tool nello stack.",
          ],
        },
        {
          id: "issue-closing",
          type: "premium-closing",
          eyebrow: "Member layer",
          title: "Il layer member deve spingersi oltre il semplice elenco dei tool.",
          body:
            "Questa issue prepara gia` il terreno per sequencing piu` esplicito, note operative e varianti di stack per momenti di launch diversi.",
          member_note:
            "Nel layer completo possono vivere handoff piu` dettagliati, micro-rubriche decisionali e passaggi alternativi per founder solo, piccoli team e launch creator-led.",
        },
      ],
    },
    included_tools: [
      {
        tool_slug: "framer-ai",
        role: "Superficie pubblica",
        note: "Per la superficie di presentazione: landing, posizionamento e feeling finale.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "lovable",
        role: "Concept di prodotto",
        note: "Per trasformare il concetto in un artefatto navigabile e spiegabile.",
        order: 2,
      },
      {
        tool_slug: "cursor",
        role: "Disciplina di shipping",
        note: "Per tenere la parte piu` tecnica sotto controllo quando la prova iniziale inizia a crescere.",
        order: 3,
      },
      {
        tool_slug: "descript",
        role: "Asset di lancio",
        note: "Per voice, walkthrough e materiali di contenuto a supporto del lancio.",
        order: 4,
      },
      {
        tool_slug: "notion-ai",
        role: "Memoria del lancio",
        note: "Per centralizzare checklist, positioning notes e decisioni editoriali.",
        order: 5,
      },
    ],
    created_at: "2026-03-10T12:00:00.000Z",
    updated_at: "2026-03-16T09:40:00.000Z",
    first_published_at: "2026-03-10T18:00:00.000Z",
    published_at: "2026-03-16T09:40:00.000Z",
  },
  {
    id: "collection-06",
    title: "Issue di sintesi profonda",
    slug: "deep-synthesis-issue",
    description:
      "Una special issue in coda editoriale, pensata per legare ricerca, note e trasformazione dell'insight in un output piu` denso.",
    cover_image_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Issue in coda",
    rationale:
      "Questa issue serve come prova di una superficie piu` narrativa e piu` densa, pronta a ospitare sequencing e note di lettura senza diventare magazine puro.",
    highlights: [
      "Sequencing piu` esplicito tra orientamento e sintesi",
      "Ritmo da special issue, non da elenco lineare",
      "Base per future note premium e operating guidance",
    ],
    premium_teaser:
      "La preview resta gia` leggibile; l'issue completa entrera` nel layer pubblico solo quando sequencing e note saranno chiusi.",
    theme: "research-synthesis",
    audience: "Research-led teams",
    difficulty: "advanced",
    tone: "special-issue",
    access: "premium-preview",
    editorial_state: "draft",
    surface: "special-issue",
    editorial_order: 60,
    included_tools: [
      {
        tool_slug: "perplexity",
        role: "Question shaping",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "notion-ai",
        role: "Synthesis spine",
        order: 2,
      },
      {
        tool_slug: "cursor",
        role: "Output handoff",
        order: 3,
      },
    ],
    created_at: "2026-03-16T10:00:00.000Z",
    updated_at: "2026-03-16T10:30:00.000Z",
  },
  {
    id: "collection-07",
    title: "Percorso creator per il lancio",
    slug: "creator-launch-cut",
    description:
      "Un bundle pianificato per creator e piccoli team che devono passare da concept a publish moment in modo piu` disciplinato.",
    cover_image_url:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "In programmazione",
    rationale:
      "La raccolta e` quasi pronta: resta un ultimo giro di editing per chiarire meglio priorita`, sequencing e ruolo dei tool inclusi.",
    highlights: [
      "Creator workflow piu` corto e piu` intenzionale",
      "Bridge naturale tra tool visuali e memoria editoriale",
      "Buona candidata a featured strip futura",
    ],
    theme: "creator-video",
    audience: "Creator teams",
    difficulty: "growing",
    tone: "focused-bundle",
    access: "open",
    editorial_state: "scheduled",
    surface: "collection",
    featured_slot: "archive-strip",
    editorial_order: 50,
    included_tools: [
      {
        tool_slug: "runway",
        role: "Visual build",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "descript",
        role: "Narrative edit",
        order: 2,
      },
      {
        tool_slug: "notion-ai",
        role: "Publishing memory",
        order: 3,
      },
    ],
    created_at: "2026-03-16T07:00:00.000Z",
    updated_at: "2026-03-16T11:00:00.000Z",
    scheduled_for: "2026-03-24T09:00:00.000Z",
  },
  {
    id: "collection-08",
    title: "Primo bundle operativo",
    slug: "first-prototype-bundle",
    description:
      "Una vecchia raccolta di transizione usata per testare il framing stack-first nelle prime iterazioni editoriali.",
    cover_image_url:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Percorso archiviato",
    rationale:
      "Resta come traccia interna del percorso editoriale: utile a capire cosa ha funzionato, ma non abbastanza solida per restare nel layer pubblico.",
    highlights: [
      "Buona come memoria di tono e sequencing",
      "Non abbastanza nitida per una superficie pubblica stabile",
      "Utile per test interni e confronto con versioni piu` mature",
    ],
    theme: "design-sprint",
    audience: "Designer-builders",
    difficulty: "starter",
    tone: "starter-stack",
    access: "open",
    editorial_state: "archived",
    surface: "collection",
    editorial_order: 80,
    included_tools: [
      {
        tool_slug: "lovable",
        role: "Prototype shell",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "framer-ai",
        role: "Landing polish",
        order: 2,
      },
      {
        tool_slug: "midjourney",
        role: "Visual reference",
        order: 3,
      },
    ],
    created_at: "2026-03-05T09:00:00.000Z",
    updated_at: "2026-03-09T17:00:00.000Z",
    first_published_at: "2026-03-05T13:00:00.000Z",
    published_at: "2026-03-07T10:00:00.000Z",
    archived_at: "2026-03-09T17:00:00.000Z",
  },
];
