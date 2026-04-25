import type { ToolRecord } from "@/lib/types/tool";

export const mockTools: ToolRecord[] = [
  {
    id: "1",
    name: "Framer AI",
    slug: "framer-ai",
    category: "Design",
    tags: ["landing page", "no-code", "branding"],
    editorial_state: "In evidenza",
    pricing: "Freemium",
    platforms: ["Web"],
    best_for: "Landing di lancio, micrositi e refresh visuale che devono sembrare gia` maturi",
    editorial_note:
      "Da aprire quando il problema non e` generare un layout, ma dare credibilita` immediata alla superficie pubblica.",
    why_here:
      "Perche' accelera il passaggio da idea a pagina presentabile senza far crollare tono, gerarchia e percezione di maturita`.",
    use_cases: [
      "Landing di pre-lancio",
      "Refresh rapido di una pagina marketing",
      "Micrositi o waitlist page da chiudere in poco tempo",
    ],
    strengths: [
      "Time-to-polish molto corto",
      "Ottimo su gerarchia visuale e ritmo di pagina",
      "Buon fit per founder e piccoli team che devono uscire",
    ],
    cautions: [
      "Non e` il posto giusto se il collo di bottiglia e` la logica applicativa",
      "Senza criterio di copy e struttura rischia pagine belle ma intercambiabili",
    ],
    editorial_scorecard: {
      ease_of_use: "solid",
      versatility: "solid",
      polish: "strong",
      workflow_fit: "solid",
      experimentation_value: "strong",
      editorial_conviction: "strong",
    },
    short_description_it:
      "Per chiudere landing e pagine di lancio con una resa forte e un time-to-polish molto corto.",
    description_it:
      "Framer AI regge bene quando una buona idea rischia ancora di sembrare acerba. In TooolVibes conta perche' aiuta founder, designer e piccoli team a trasformare una direzione in una superficie pubblica piu` credibile senza aprire un workflow troppo pesante.",
    website_url: "https://www.framer.com",
    tooolvibes_post_url: "https://tooolvibes.com/posts/framer-ai",
    cover_image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    source: "Newsletter founder tools",
    date_discovered: "2026-02-10",
    is_featured: true,
    is_published: true,
    created_at: "2026-02-10T09:00:00.000Z",
    updated_at: "2026-02-20T10:30:00.000Z",
  },
  {
    id: "2",
    name: "Cursor",
    slug: "cursor",
    category: "Developer",
    tags: ["vibe-coding", "code editor", "agentic"],
    editorial_state: "In evidenza",
    pricing: "Freemium",
    platforms: ["Mac", "Windows"],
    best_for: "Build, refactor e fix quando vuoi accelerare senza smettere di leggere il codice",
    editorial_note:
      "Resta uno dei pochi tool AI da sviluppo che regge anche dopo il primo entusiasmo, soprattutto nei passaggi fragili.",
    why_here:
      "Perche' accelera il lavoro senza trasformare il codice in una scatola nera, e tiene il vibe-coding piu` vicino a una pratica di sviluppo vera.",
    use_cases: [
      "Refactor assistito su codebase reali",
      "Debugging con contesto e file multipli",
      "Scaffolding di fix o feature senza perdere il filo",
    ],
    strengths: [
      "Ottimo equilibrio tra controllo e velocita`",
      "Buona lettura del contesto su file e passaggi complessi",
      "Si integra bene in workflow reali, non solo in prove rapide",
    ],
    cautions: [
      "Richiede comunque disciplina tecnica e senso del limite",
      "Non sostituisce review, test e ownership del codice",
    ],
    editorial_scorecard: {
      ease_of_use: "solid",
      versatility: "strong",
      polish: "solid",
      workflow_fit: "strong",
      experimentation_value: "strong",
      editorial_conviction: "strong",
    },
    short_description_it:
      "Editor AI-first per scrivere, rifattorizzare e correggere codice restando dentro una lettura tecnica credibile.",
    description_it:
      "Cursor e` uno dei riferimenti piu` solidi quando vuoi velocita` ma non vuoi mollare controllo, leggibilita` e responsabilita` sul codice. Per TooolVibes vale perche' regge bene sia il prototipo che il momento in cui il prototipo inizia davvero a sporcarsi.",
    website_url: "https://www.cursor.com",
    tooolvibes_post_url: "https://tooolvibes.com/posts/cursor",
    cover_image_url:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    source: "Product Hunt",
    date_discovered: "2026-01-18",
    is_featured: true,
    is_published: true,
    created_at: "2026-01-18T10:20:00.000Z",
    updated_at: "2026-02-22T11:00:00.000Z",
  },
  {
    id: "3",
    name: "Notion AI",
    slug: "notion-ai",
    category: "Produttivita",
    tags: ["knowledge base", "workspace", "team"],
    editorial_state: "Selezione core",
    pricing: "Paid",
    platforms: ["Web", "Mac", "Windows"],
    best_for: "Knowledge base condivise e flussi team leggeri",
    editorial_note:
      "Funziona bene quando la scoperta tool si sposta dal singolo output al sistema operativo del team.",
    why_here:
      "Perche' unisce AI e organizzazione senza far sembrare il prodotto solo un add-on di feature.",
    use_cases: [
      "Knowledge base team",
      "Documentazione operativa",
      "Workspace condivisi",
    ],
    strengths: [
      "Forte come sistema, non solo come singolo tool",
      "Adottabile rapidamente",
      "Buon equilibrio tra struttura e flessibilita`",
    ],
    cautions: [
      "Puo` diventare dispersivo se non governi la struttura",
      "L'AI qui e` utile, ma non e` il vero differenziante",
    ],
    editorial_scorecard: {
      ease_of_use: "strong",
      versatility: "strong",
      polish: "solid",
      workflow_fit: "strong",
      experimentation_value: "solid",
      editorial_conviction: "solid",
    },
    short_description_it:
      "Organizza note, documentazione e task con un layer AI dentro un workspace gia` noto.",
    description_it:
      "Per team e creator che vogliono centralizzare conoscenza e operazioni leggere. La forza non e` solo l’AI, ma la combinazione tra contenuto strutturato e collaborazione.",
    website_url: "https://www.notion.so/product/ai",
    tooolvibes_post_url: "https://tooolvibes.com/posts/notion-ai",
    cover_image_url:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    source: "Community",
    date_discovered: "2026-01-06",
    is_featured: false,
    is_published: true,
    created_at: "2026-01-06T08:45:00.000Z",
    updated_at: "2026-02-16T12:15:00.000Z",
  },
  {
    id: "4",
    name: "Runway",
    slug: "runway",
    category: "Video",
    tags: ["video", "gen-ai", "editing"],
    editorial_state: "In evidenza",
    pricing: "Paid",
    platforms: ["Web"],
    best_for: "Concept video, cut promozionali e post-produzione rapida per creator e launch asset",
    editorial_note:
      "Interessante quando devi pesare insieme impatto visivo, rapidita` di esecuzione e qualita` percepita del workflow.",
    why_here:
      "Perche' resta uno dei nomi piu` completi quando il criterio non e` solo AI, ma anche maturita` del prodotto e tenuta del flusso.",
    use_cases: [
      "Video concept rapidi per campagne o launch",
      "Post-produzione assistita e variazioni visuali",
      "Asset video per creator, brand e pagine prodotto",
    ],
    strengths: [
      "Output moderni e subito leggibili",
      "Buona fluidita` tra generazione e rifinitura",
      "Percezione prodotto premium sopra la media della categoria",
    ],
    cautions: [
      "Il costo cresce in fretta se il volume aumenta",
      "Serve occhio editoriale per non fermarsi al solo wow effect",
    ],
    editorial_scorecard: {
      ease_of_use: "solid",
      versatility: "solid",
      polish: "strong",
      workflow_fit: "strong",
      experimentation_value: "strong",
      editorial_conviction: "strong",
    },
    short_description_it:
      "Suite visual AI per chiudere concept, variazioni e post-produzione con un feeling prodotto molto piu` maturo della media.",
    description_it:
      "Runway conta quando devi produrre asset video credibili senza costruire un workflow studio-grade. In TooolVibes e` forte perche' tiene insieme sperimentazione, velocita` e una sensazione premium che regge bene anche in contesti launch o content-first.",
    website_url: "https://runwayml.com",
    tooolvibes_post_url: "https://tooolvibes.com/posts/runway",
    cover_image_url:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
    source: "Creator economy feeds",
    date_discovered: "2026-02-02",
    is_featured: true,
    is_published: true,
    created_at: "2026-02-02T13:00:00.000Z",
    updated_at: "2026-02-19T09:20:00.000Z",
  },
  {
    id: "5",
    name: "Perplexity",
    slug: "perplexity",
    category: "Assistente AI",
    tags: ["research", "search", "answers"],
    editorial_state: "Da tenere d'occhio",
    pricing: "Freemium",
    platforms: ["Web", "iOS"],
    best_for: "Orientamento iniziale, raccolta fonti e definizione del perimetro prima della sintesi",
    editorial_note:
      "Funziona meglio come prima mappa che come risposta definitiva: apre bene il campo, non chiude da solo la ricerca.",
    why_here:
      "Perche' comprime molto bene il tempo tra domanda iniziale e primo perimetro di ricerca, soprattutto quando devi ancora capire dove guardare.",
    use_cases: [
      "Mappare velocemente un tema nuovo",
      "Raccogliere fonti e primi riferimenti",
      "Capire cosa approfondire davvero prima della sintesi",
    ],
    strengths: [
      "Velocita` molto alta nel first-pass",
      "Buon feeling da strumento di orientamento, non solo da chat",
      "Molto utile quando la ricerca e` ancora aperta e poco strutturata",
    ],
    cautions: [
      "Le fonti importanti vanno comunque verificate a mano",
      "Rischia overtrust se lo usi come risposta finale e non come primo layer",
    ],
    editorial_scorecard: {
      ease_of_use: "strong",
      versatility: "solid",
      polish: "solid",
      workflow_fit: "solid",
      experimentation_value: "solid",
      editorial_conviction: "strong",
    },
    short_description_it:
      "Motore di ricerca AI utile per aprire un tema, leggere le fonti e capire rapidamente dove vale la pena andare piu` a fondo.",
    description_it:
      "Perplexity e` forte quando devi togliere attrito alla fase iniziale della ricerca. In TooolVibes lo leggiamo come strumento di orientamento e raccolta fonti, non come verita` finale: il suo valore sta nel primo perimetro che ti consegna.",
    website_url: "https://www.perplexity.ai",
    tooolvibes_post_url: "https://tooolvibes.com/posts/perplexity",
    cover_image_url:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    source: "AI workflow digest",
    date_discovered: "2026-01-25",
    is_featured: false,
    is_published: true,
    created_at: "2026-01-25T14:30:00.000Z",
    updated_at: "2026-02-24T07:55:00.000Z",
  },
  {
    id: "6",
    name: "Midjourney",
    slug: "midjourney",
    category: "Design",
    tags: ["image", "concept", "creative"],
    editorial_state: "Selezione core",
    pricing: "Paid",
    platforms: ["Web", "Discord"],
    best_for: "Concept visivi, moodboard e direzioni creative",
    editorial_note:
      "Da consultare quando l'obiettivo e` capire qualita` estetica, non solo produttivita`.",
    why_here:
      "Perche' resta un riferimento quando il criterio principale e` impatto estetico e non industrializzazione del processo.",
    use_cases: [
      "Moodboard",
      "Concept creativo",
      "Direzione visuale esplorativa",
    ],
    strengths: [
      "Resa estetica molto forte",
      "Ottimo per fasi divergenti",
      "Identita` visuale riconoscibile",
    ],
    cautions: [
      "Meno efficiente se cerchi precisione operativa",
      "Il workflow non e` il piu` lineare del gruppo",
    ],
    editorial_scorecard: {
      ease_of_use: "measured",
      versatility: "measured",
      polish: "strong",
      workflow_fit: "measured",
      experimentation_value: "strong",
      editorial_conviction: "solid",
    },
    short_description_it:
      "Generazione immagini con forte resa estetica per concept, campagne e direzioni creative.",
    description_it:
      "Midjourney resta rilevante quando la priorita` e` l’impatto visivo. Utile per moodboard, concept editoriali e direzioni visuali in fase esplorativa.",
    website_url: "https://www.midjourney.com",
    tooolvibes_post_url: "https://tooolvibes.com/posts/midjourney",
    cover_image_url:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    source: "Design curation",
    date_discovered: "2026-01-12",
    is_featured: false,
    is_published: true,
    created_at: "2026-01-12T10:30:00.000Z",
    updated_at: "2026-02-18T09:40:00.000Z",
  },
  {
    id: "7",
    name: "Descript",
    slug: "descript",
    category: "Writing",
    tags: ["audio", "podcast", "editing"],
    editorial_state: "In evidenza",
    pricing: "Freemium",
    platforms: ["Mac", "Windows"],
    best_for: "Walkthrough, voiceover, podcast e contenuti parlati da editare come testo",
    editorial_note:
      "Molto forte quando vuoi abbassare la complessita` dell'editing senza dare al contenuto un feeling impoverito.",
    why_here:
      "Perche' trasforma un workflow spesso tecnico in qualcosa di piu` editoriale, leggibile e facile da far reggere a team piccoli.",
    use_cases: [
      "Editing podcast e interviste",
      "Walkthrough o voiceover per launch asset",
      "Video e contenuti parlati gestiti con logica text-first",
    ],
    strengths: [
      "Curva di accesso molto morbida",
      "Interfaccia leggibile anche per profili non tecnici",
      "Ottimo ponte tra editing, script e contenuto finale",
    ],
    cautions: [
      "Non e` il piu` profondo per chi fa audio pro come mestiere",
      "La comodita` non basta: il risultato finale va comunque diretto",
    ],
    editorial_scorecard: {
      ease_of_use: "strong",
      versatility: "solid",
      polish: "strong",
      workflow_fit: "strong",
      experimentation_value: "solid",
      editorial_conviction: "strong",
    },
    short_description_it:
      "Editing audio e video via testo, ideale per contenuti parlati, walkthrough e team molto agili.",
    description_it:
      "Descript conta quando il collo di bottiglia non e` la post-produzione avanzata, ma la velocita` con cui devi arrivare a un contenuto parlato pulito e pubblicabile. Per TooolVibes e` prezioso perche' rende piu` accessibile un lavoro che spesso resta troppo tecnico.",
    website_url: "https://www.descript.com",
    tooolvibes_post_url: "https://tooolvibes.com/posts/descript",
    cover_image_url:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80",
    source: "Podcast creator list",
    date_discovered: "2026-02-08",
    is_featured: true,
    is_published: true,
    created_at: "2026-02-08T11:10:00.000Z",
    updated_at: "2026-02-23T08:25:00.000Z",
  },
  {
    id: "8",
    name: "Lovable",
    slug: "lovable",
    category: "Developer",
    tags: ["app builder", "vibe-coding", "prototype"],
    editorial_state: "Nuovo in archivio",
    pricing: "Freemium",
    platforms: ["Web"],
    best_for: "Prime versioni di prodotto, proof of concept e superfici navigabili da prompt",
    editorial_note:
      "Da aprire quando devi capire se un'idea riesce a diventare interfaccia prima di diventare stack vero.",
    why_here:
      "Perche' accorcia molto il passaggio tra intuizione e artefatto navigabile, con una sensazione piu` app-like di molti builder prompt-first.",
    use_cases: [
      "Proof of concept rapidi",
      "Idea testing con interfacce navigabili",
      "Esplorazione di flow e UI prima del build vero",
    ],
    strengths: [
      "Molto veloce nel passaggio idea > interfaccia",
      "Buon feeling di prodotto gia` nei primi output",
      "Interessante per iterazioni rapide e prime prove convincenti",
    ],
    cautions: [
      "Va validato non appena la complessita` cresce o arrivano logiche piu` vere",
      "Il rischio principale e` confondere velocita` con solidita` del prodotto",
    ],
    editorial_scorecard: {
      ease_of_use: "solid",
      versatility: "solid",
      polish: "solid",
      workflow_fit: "solid",
      experimentation_value: "strong",
      editorial_conviction: "strong",
    },
    short_description_it:
      "Per trasformare prompt, flow e UI in un prototipo navigabile con una velocita` molto allineata alla cultura vibe-coding.",
    description_it:
      "Lovable e` forte quando l'obiettivo e` capire in poche ore se una direzione prodotto respira davvero come interfaccia. In TooolVibes conta perche' tiene bene la prima prova, ma resta da leggere con disciplina appena serve trasformarlo in qualcosa di piu` solido.",
    website_url: "https://lovable.dev",
    tooolvibes_post_url: "https://tooolvibes.com/posts/lovable",
    cover_image_url:
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=80",
    source: "Founder circles",
    date_discovered: "2026-02-14",
    is_featured: true,
    is_published: true,
    created_at: "2026-02-14T08:15:00.000Z",
    updated_at: "2026-02-26T14:05:00.000Z",
  }
];
