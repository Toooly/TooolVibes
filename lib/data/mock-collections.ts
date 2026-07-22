import type { CuratedCollectionRecord } from "@/lib/types/collection";

export const mockCollections: CuratedCollectionRecord[] = [
  {
    id: "collection-01",
    title: "Kit AI per founder solo",
    slug: "ai-stack-solo-founders",
    description:
      "Una raccolta per chi vuole passare da idea a prodotto leggibile con pochi strumenti ma con un buon equilibrio tra ricerca, prova iniziale e pubblicazione.",
    cover_image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Kit essenziale",
    rationale:
      "Questa raccolta tiene insieme orientamento, prova iniziale, presenza pubblica e memoria operativa. Non prova a fare tutto: serve a chiudere bene i primi passaggi che contano davvero quando lavori da solo e vuoi evitare strumenti troppo frammentati.",
    highlights: [
      "Passaggio corto da idea a prototipo condivisibile",
      "Attrito operativo basso per chi lavora solo o con team molto piccoli",
      "Tool che reggono sia la prima prova sia i primi giorni di lavoro reale",
    ],
    premium_teaser:
      "Quando serve andare oltre la configurazione iniziale, questo kit si apre bene a una raccolta più densa su sequenza, note di lancio e passaggi operativi.",
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
        tool_slug: "vibecode",
        role: "Dall'idea all'interfaccia",
        note: "Per trasformare un'intuizione in una prima interfaccia navigabile senza attrito iniziale.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "v0",
        role: "Costruzione e rifinitura",
        note: "Quando il prototipo inizia a chiedere struttura, refactor e controllo vero del codice.",
        order: 2,
      },
      {
        tool_slug: "meku",
        role: "Superficie di lancio",
        note: "Per dare credibilità visiva alla presentazione pubblica o alla landing di validazione.",
        order: 3,
      },
      {
        tool_slug: "frase-ai",
        role: "Memoria operativa",
        note: "Per tenere insieme note, roadmap leggera e materiali di lavoro senza uscire dal flusso.",
        order: 4,
      },
      {
        tool_slug: "jenni-ai",
        role: "Ricerca",
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
      "Una sequenza corta per idea, moodboard, prova iniziale e landing quando vuoi validare velocemente una direzione prodotto o campagna.",
    cover_image_url:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Bundle compatto",
    rationale:
      "Qui conta la qualità della lettura più della quantità dei tool. La raccolta è costruita per esplorare, convergere e arrivare a una superficie presentabile senza perdere tono editoriale.",
    highlights: [
      "Moodboard e direzione visiva forti in poco tempo",
      "Passaggio rapido da idea a prototipo navigabile",
      "Landing e presenza finale coerenti col tono dell'idea",
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
        tool_slug: "imagine-art",
        role: "Esplorazione visuale",
        note: "Per esplorare direzioni creative e materializzare rapidamente il tono visuale del progetto.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "meku",
        role: "Rifinitura landing",
        note: "Per consolidare l'idea in una pagina leggibile e credibile.",
        order: 2,
      },
      {
        tool_slug: "vibecode",
        role: "Prototipo interattivo",
        note: "Per testare il feeling app-like e l'architettura di base prima di costruire davvero.",
        order: 3,
      },
      {
        tool_slug: "frase-ai",
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
    title: "Kit creator per video e voce",
    slug: "creator-video-stack",
    description:
      "Una selezione per chi lavora su video, audio e contenuti visuali con bisogno di velocità, resa e flussi leggibili.",
    cover_image_url:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Scelta curatoriale",
    rationale:
      "La raccolta non guarda solo alla generazione. Tiene insieme ideazione visuale, post-produzione e contenuto testuale, così il percorso creator non si spezza tra tool brillanti ma scollegati.",
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
        tool_slug: "vidau",
        role: "Motore visuale",
        note: "Per idee video, generazione e rifinitura con una sensazione prodotto più matura della media.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "synthesia-ai",
        role: "Editing via testo",
        note: "Per alleggerire il lavoro su audio e video quando il contenuto conta più dell'editing tecnico puro.",
        order: 2,
      },
      {
        tool_slug: "imagine-art",
        role: "Frame dell'idea",
        note: "Per visual direction, moodboard e frame references prima della produzione finale.",
        order: 3,
      },
      {
        tool_slug: "frase-ai",
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
      "Una raccolta più asciutta per aprire una ricerca, orientarsi bene, sintetizzare e trasformare insight in materiale davvero riutilizzabile.",
    cover_image_url:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Bundle compatto",
    rationale:
      "Questa raccolta dà forma a un flusso di orientamento e sintesi. I tool qui non devono stupire da soli: devono ridurre il tempo tra domanda iniziale, lettura delle fonti e conoscenza riusabile.",
    highlights: [
      "Più orientamento iniziale, meno rumore da tool generici",
      "Passaggio fluido da ricerca a sintesi interna e risultato operativo",
      "Buon equilibrio tra velocità, verificabilità e leggibilità finale",
    ],
    theme: "research-synthesis",
    audience: "Research-led teams",
    difficulty: "starter",
    tone: "focused-bundle",
    access: "premium-preview",
    premium_teaser:
      "La parte pubblica resta utile anche da sola; l'accesso riservato aggiunge note di lettura, sequenze e commenti più densi sulla scelta dei tool.",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 40,
    included_tools: [
      {
        tool_slug: "jenni-ai",
        role: "Orientamento iniziale",
        note: "Per costruire il primo perimetro della ricerca e capire cosa vale davvero approfondire.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "frase-ai",
        role: "Archivio di sintesi",
        note: "Per salvare insight, domande aperte e materiali operativi in un sistema che resta leggibile.",
        order: 2,
      },
      {
        tool_slug: "v0",
        role: "Trasformazione finale",
        note: "Quando la sintesi deve diventare specifica, strutturata o pronta a entrare in una consegna tecnica.",
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
    title: "Kit di lancio indie",
    slug: "indie-launch-stack",
    description:
      "Una raccolta speciale, stretta e narrativa, costruita intorno al pre-lancio e già leggibile come esperienza premium reale.",
    cover_image_url:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Raccolta speciale",
    rationale:
      "Non è un elenco di tool per fare tutto. È una raccolta più stretta e più intenzionale che accompagna il momento del lancio con una sequenza chiara, passaggi leggibili e un ordine preciso tra idea, presenza pubblica e pubblicazione.",
    highlights: [
      "Setup corto per arrivare a una prima uscita credibile",
      "Tool che si tengono bene tra loro nel momento più delicato del pre-lancio",
      "Base giusta per una raccolta riservata che aggiunge profondità, non solo una veste premium",
    ],
    premium_teaser:
      "La parte pubblica fa vedere taglio e impostazione. La raccolta completa aggiunge sequenza, note operative e materiali di lancio con un livello curatoriale più denso.",
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
      reading_flow: "Tesi del lancio -> momenti chiave -> tensione del confronto -> flusso -> cosa portare via",
      intro:
        "Questa raccolta non prova a coprire tutto il lancio. Isola i passaggi che fanno davvero differenza quando devi trasformare un prodotto ancora fragile in una presenza che sembra già pronta da mostrare.",
      thesis:
        "Un lancio indie credibile nasce quando idea, presentazione e disciplina di pubblicazione smettono di vivere in strumenti separati e iniziano davvero a sostenersi a vicenda.",
      takeaways: [
        "Il tool migliore non è quello più brillante da solo, ma quello che regge bene il passaggio successivo.",
        "La presenza pubblica del lancio va progettata come parte del prodotto, non come materiale finale aggiunto alla fine.",
        "Salvati e confronto servono a chiudere il cerchio della raccolta, non a uscire dal racconto.",
      ],
      blocks: [
        {
          id: "issue-opening",
          type: "opening-note",
          eyebrow: "Nota iniziale",
          title: "Un kit di lancio non deve sembrare grande. Deve rendere inevitabile il prossimo passo.",
          body:
            "La forza di questa raccolta sta nella selezione stretta. Ogni tool incluso regge un momento preciso: idea, disciplina di pubblicazione, materiali di lancio e memoria operativa. Il formato più ricco serve a mostrare come questi passaggi si tengono insieme senza rumore.",
        },
        {
          id: "issue-thesis",
          type: "thesis",
          eyebrow: "Tesi del lancio",
          title: "Il prodotto convince prima quando anche il racconto operativo sembra già allineato.",
          statement:
              "Il lancio non chiede più tool: chiede una sequenza leggibile in cui prova iniziale, landing, materiali e memoria non si contraddicano.",
          points: [
            "Meku regge il momento pubblico e il tono percepito.",
            "VibeCode fa da ponte tra idea e artefatto navigabile.",
            "v0 tiene basso il rischio quando il prototipo si sporca di codice vero.",
          ],
        },
        {
          id: "issue-picks",
          type: "curated-picks",
          eyebrow: "Momenti chiave",
          title: "I passaggi del lancio che cambiano davvero la percezione del kit.",
          body:
            "Qui non conta solo cosa usi, ma quando lo fai entrare. Questi sono i tre passaggi che spostano davvero la percezione del prodotto nei giorni più sensibili del pre-lancio.",
          tool_moments: [
            {
              tool_slug: "meku",
              label: "Credibilità della presenza pubblica",
              note:
                "Entra quando hai già chiara l'idea e devi trasformarla in una landing che faccia sembrare il lancio più maturo del suo stadio reale.",
              emphasis: "anchor",
            },
            {
              tool_slug: "vibecode",
              label: "Narrazione del prototipo",
              note:
                "Tiene insieme il prodotto raccontato e il prodotto navigabile, così la prima prova non resta solo una promessa.",
              emphasis: "support",
            },
            {
              tool_slug: "synthesia-ai",
              label: "Asset di lancio",
              note:
                "Fa da ponte tra walkthrough, voce e materiali di contenuto senza costringerti a un flusso media troppo tecnico.",
              emphasis: "watch",
            },
          ],
        },
        {
          id: "issue-compare",
          type: "compare-insight",
          eyebrow: "Lettura del confronto",
          title: "La tensione vera qui non è scegliere un vincitore assoluto, ma capire quale ruolo regge meglio il passaggio successivo.",
          body:
            "VibeCode, Meku e v0 sembrano strumenti di fasi diverse. In pratica si sfiorano molto di più: il punto è capire chi regge la transizione tra prova, percezione e pubblicazione.",
          compare: {
            compared_tool_slugs: ["vibecode", "meku", "v0"],
            insight:
              "VibeCode vince quando devi far sembrare l'idea già viva. Meku vince quando il lancio chiede una presenza credibile. v0 vince quando la promessa deve reggere nel codice.",
            differentiators: [
              "VibeCode: più rapido nella prima prova e sulla sensazione app-like",
              "Meku: più forte sulla presenza pubblica e sulla cura del lancio",
              "v0: più adatto quando la prova iniziale inizia a richiedere struttura reale",
            ],
            recommendation:
              "Mettili a confronto quando il dubbio non è quale sia migliore, ma quale dei tre debba entrare per primo nel tuo kit di lancio.",
          },
        },
        {
          id: "issue-workflow",
          type: "workflow",
          eyebrow: "Sequenza operativa",
          title: "Una sequenza corta che porta dall'idea alla presenza di lancio senza dispersione.",
          body:
            "Questo è il flusso che la raccolta speciale prova a rendere leggibile: partire da un concetto vivo, consolidarlo e preparare i materiali che servono davvero per uscire.",
          steps: [
            {
              title: "Dai corpo all'idea",
              body: "Usa la prova iniziale per rendere l'idea spiegabile prima ancora di renderla perfetta.",
              tool_slug: "vibecode",
              outcome: "Hai un artefatto navigabile e condivisibile.",
            },
            {
              title: "Rendi il lancio credibile",
              body: "Porta l'idea in una presenza pubblica con tono, posizionamento e gerarchia più maturi.",
              tool_slug: "meku",
              outcome: "Landing e messaggio iniziano a sembrare allineati al prodotto.",
            },
            {
              title: "Proteggi la parte fragile",
              body: "Quando la prova iniziale tocca codice reale, usa disciplina e rifinitura minima per non perdere fluidità.",
              tool_slug: "v0",
              outcome: "La prima prova non collassa appena provi a evolverla.",
            },
            {
              title: "Chiudi i materiali di lancio",
              body: "Prepara walkthrough, voce e materiali che aiutano il prodotto a presentarsi bene anche fuori dalla landing.",
              tool_slug: "synthesia-ai",
              outcome: "Il lancio ha un racconto più coeso e più leggibile.",
            },
          ],
        },
        {
          id: "issue-why",
          type: "why-this-matters",
          eyebrow: "Perché conta",
          title: "Il valore di questa raccolta è mostrare una progressione, non solo una lista.",
          body:
            "Per chi costruisce da solo o in team molto piccoli, la differenza la fa il ritmo tra i passaggi. Questa raccolta serve a rendere il kit di lancio meno casuale e più intenzionale.",
          points: [
            "Riduce il rischio di passare troppo presto dall'idea alla pubblicazione.",
            "Aiuta a distinguere tool da presentazione, tool da costruzione e tool da supporto.",
            "Tiene salvati e confronto dentro il racconto, invece di farli sembrare funzioni parallele.",
          ],
        },
        {
          id: "issue-takeaway",
          type: "editorial-takeaway",
          eyebrow: "Takeaway editoriale",
          title: "Se questa raccolta funziona, ti lascia con una lista più corta e con dubbi migliori.",
          body:
            "L'obiettivo non è uscire con più tool salvati. L'obiettivo è capire quale combinazione regge davvero il tuo momento di lancio.",
          takeaways: [
            "Salva solo i tool che spostano il passaggio successivo.",
            "Usa il confronto per leggere la tensione tra prova iniziale, presenza e pubblicazione.",
            "Torna ai profili singoli solo dopo aver capito il ruolo di ciascun tool nel kit.",
          ],
        },
        {
          id: "issue-closing",
          type: "premium-closing",
          eyebrow: "Accesso riservato",
          title: "La parte riservata deve andare oltre il semplice elenco dei tool.",
          body:
            "Questa raccolta prepara già il terreno per sequenze più esplicite, note operative e varianti del kit per momenti di lancio diversi.",
          member_note:
            "Nella versione completa possono vivere passaggi più dettagliati, micro-rubriche decisionali e alternative per founder solo, piccoli team e lanci guidati dai creator.",
        },
      ],
    },
    included_tools: [
      {
        tool_slug: "meku",
        role: "Superficie pubblica",
        note: "Per la superficie di presentazione: landing, posizionamento e feeling finale.",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "vibecode",
        role: "Concept di prodotto",
        note: "Per trasformare il concetto in un artefatto navigabile e spiegabile.",
        order: 2,
      },
      {
        tool_slug: "v0",
        role: "Disciplina di pubblicazione",
        note: "Per tenere la parte più tecnica sotto controllo quando la prova iniziale inizia a crescere.",
        order: 3,
      },
      {
        tool_slug: "synthesia-ai",
        role: "Asset di lancio",
        note: "Per voce, walkthrough e materiali di contenuto a supporto del lancio.",
        order: 4,
      },
      {
        tool_slug: "frase-ai",
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
    title: "Raccolta di sintesi profonda",
    slug: "deep-synthesis-issue",
    description:
      "Una raccolta speciale in coda editoriale, pensata per legare ricerca, note e trasformazione dell'insight in un risultato più denso.",
    cover_image_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Raccolta in coda",
    rationale:
      "Questa raccolta serve come prova di una lettura più narrativa e più densa, pronta a ospitare sequenze e note senza diventare un magazine generico.",
    highlights: [
      "Sequencing più esplicito tra orientamento e sintesi",
      "Ritmo da raccolta speciale, non da elenco lineare",
      "Base per future note premium e operating guidance",
    ],
    premium_teaser:
      "L'anteprima resta già leggibile; la raccolta completa entrerà nel catalogo pubblico solo quando sequenza e note saranno chiuse.",
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
        tool_slug: "jenni-ai",
        role: "Definizione della domanda",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "frase-ai",
        role: "Struttura della sintesi",
        order: 2,
      },
      {
        tool_slug: "v0",
        role: "Passaggio finale",
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
      "Un bundle pianificato per creator e piccoli team che devono passare da idea a momento di pubblicazione in modo più disciplinato.",
    cover_image_url:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "In programmazione",
    rationale:
      "La raccolta è quasi pronta: resta un ultimo giro di editing per chiarire meglio priorità, sequenza e ruolo dei tool inclusi.",
    highlights: [
      "Flusso creator più corto e più intenzionale",
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
        tool_slug: "vidau",
        role: "Costruzione visuale",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "synthesia-ai",
        role: "Editing narrativo",
        order: 2,
      },
      {
        tool_slug: "frase-ai",
        role: "Memoria di pubblicazione",
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
      "Una vecchia raccolta di transizione usata per testare un taglio centrato sulla scelta dei tool nelle prime iterazioni editoriali.",
    cover_image_url:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Percorso archiviato",
    rationale:
      "Resta come traccia interna del percorso editoriale: utile a capire cosa ha funzionato, ma non abbastanza solida per restare nel catalogo pubblico.",
    highlights: [
      "Buona come memoria di tono e sequenza",
      "Non abbastanza nitida per una superficie pubblica stabile",
      "Utile per test interni e confronto con versioni più mature",
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
        tool_slug: "vibecode",
        role: "Base prototipo",
        featured: true,
        order: 1,
      },
      {
        tool_slug: "meku",
        role: "Rifinitura landing",
        order: 2,
      },
      {
        tool_slug: "imagine-art",
        role: "Riferimento visuale",
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
