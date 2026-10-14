export type DirectoryToolLevel = "featured" | "beginner" | "intermediate" | "expert";

export type DirectoryFilterGroup =
  | "all"
  | "vibe-coding"
  | "ai-app-builder"
  | "no-code"
  | "headless-cms"
  | "ui-builder"
  | "ai-writing"
  | "ai-image"
  | "ai-video"
  | "marketing"
  | "sales"
  | "customer-support"
  | "automation"
  | "ai-agents"
  | "payments"
  | "website-builder"
  | "productivity";

export type PricingPlan = { name: string; price: string; period: string };

export type DirectoryTool = {
  logoUrl?: string;
  pricingStatus?: string;
  pricingPlans?: PricingPlan[];
  pricingSourceUrl?: string;
  pricingLastVerifiedAt?: string;
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryLabel: string;
  level: DirectoryToolLevel;
  levelLabel: string;
  segments: DirectoryFilterGroup[];
  shortDescription: string;
  description: string;
  longDescription: string;
  whyItMatters: string;
  tldr: string;
  whatItDoes: string;
  idealUseCase: string;
  editorialReview: string;
  externalUrl: string;
  affiliateUrl?: string;
  url: string;
  originalSourceUrl: string;
  originalArticleUrl: string;
  fallbackUrl?: string;
  featured: boolean;
  toolOfWeek?: boolean;
  tags: string[];
  ctaLabel: string;
  publishedAt: string;
  readingTime: string;
  domain: string;
  sourceSite: "tooolvibes.com" | "weblium";
  useCases: string[];
  highlights: string[];
  accentFrom: string;
  accentTo: string;
};

type DirectoryToolInput = Omit<
  DirectoryTool,
  | "url"
  | "originalArticleUrl"
  | "description"
  | "levelLabel"
  | "domain"
  | "tldr"
  | "whatItDoes"
  | "idealUseCase"
  | "editorialReview"
  | "affiliateUrl"
> & {
  domain?: string;
  affiliateUrl?: string;
};

export const levelLabels: Record<DirectoryToolLevel, string> = {
  featured: "In evidenza",
  beginner: "Base",
  intermediate: "Intermedio",
  expert: "Avanzato",
};

export const levelRank: Record<DirectoryToolLevel, number> = {
  featured: 0,
  beginner: 1,
  intermediate: 2,
  expert: 3,
};

export const directoryFilterGroups: { key: DirectoryFilterGroup; label: string }[] = [
  { key: "all", label: "Tutti" },
  { key: "vibe-coding", label: "Vibe coding" },
  { key: "ai-app-builder", label: "Builder app AI" },
  { key: "no-code", label: "No-code" },
  { key: "headless-cms", label: "CMS headless" },
  { key: "ui-builder", label: "Builder UI" },
  { key: "ai-writing", label: "Scrittura AI" },
  { key: "ai-image", label: "Immagini AI" },
  { key: "ai-video", label: "Video AI" },
  { key: "marketing", label: "Marketing" },
  { key: "sales", label: "Vendite" },
  { key: "customer-support", label: "Supporto clienti" },
  { key: "automation", label: "Automazioni" },
  { key: "ai-agents", label: "Agenti AI" },
  { key: "payments", label: "Pagamenti" },
  { key: "website-builder", label: "Builder siti" },
  { key: "productivity", label: "Produttività" },
];

export const directoryLevelFilters: { key: DirectoryToolLevel | "all"; label: string }[] = [
  { key: "all", label: "Tutti i livelli" },
  { key: "featured", label: "In evidenza" },
  { key: "beginner", label: "Base" },
  { key: "intermediate", label: "Intermedio" },
  { key: "expert", label: "Avanzato" },
];

function getDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function defineTool(tool: DirectoryToolInput): DirectoryTool {
  const idealUseCase =
    tool.useCases[0] ?? "Capire rapidamente se il tool merita un test, un salvataggio o un confronto.";

  return {
    ...tool,
    description: tool.shortDescription,
    tldr: tool.shortDescription,
    whatItDoes: tool.longDescription,
    idealUseCase,
    editorialReview: tool.whyItMatters,
    url: tool.affiliateUrl ?? tool.externalUrl,
    originalArticleUrl: tool.originalSourceUrl,
    levelLabel: levelLabels[tool.level],
    domain: tool.domain ?? getDomain(tool.externalUrl),
  };
}

export const directoryTools: DirectoryTool[] = [
  defineTool({
    id: "blink",
    name: "Blink",
    slug: "blink",
    affiliateUrl: "https://blink.new/?aff=toool",
    category: "Vibe Coding",
    categoryLabel: "Vibe coding / builder app AI",
    level: "beginner",
    segments: ["vibe-coding", "ai-app-builder"],
    shortDescription:
      "Crea app da una descrizione, con database, accesso utenti e pubblicazione nello stesso ambiente.",
    longDescription:
      "Blink riunisce la costruzione dell’app e i servizi necessari a metterla online. Puoi partire da un’idea, ottenere una prima versione navigabile e modificarla attraverso la conversazione con l’AI.",
    whyItMatters:
      "Il vantaggio è poter provare un flusso completo prima di investire nello sviluppo di un prodotto più articolato.",
    externalUrl: "https://blink.new/?aff=toool",
    originalSourceUrl: "https://www.tooolvibes.com/p/blink-new",
    featured: true,
    toolOfWeek: true,
    tags: ["vibe coding", "ai app builder", "prompt-to-app", "web app", "prototype"],
    ctaLabel: "Prova Blink",
    publishedAt: "2026-02-05",
    readingTime: "2 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Validare un’idea con un prototipo utilizzabile.",
      "Preparare una demo che mostri il percorso dall’inizio al risultato.",
      "Realizzare un piccolo strumento interno per un processo definito.",
    ],
    highlights: [
      "Flusso unificato",
      "Iterazione rapida",
      "Test concreti",
    ],
    accentFrom: "#6d3bff",
    accentTo: "#43c6ff",
  }),
  defineTool({
    id: "vibecode",
    name: "VibeCode",
    slug: "vibecode",
    affiliateUrl: "https://www.vibecodeapp.com/sign-up?code=ref-39fsyj6mgbtp",
    category: "Builder app AI",
    categoryLabel: "Vibe coding / builder app AI",
    level: "beginner",
    segments: ["vibe-coding", "ai-app-builder"],
    shortDescription:
      "Costruisci app mobile e web descrivendo l’idea e affinando il risultato con l’AI.",
    longDescription:
      "VibeCode porta un’idea a una prima applicazione utilizzabile attraverso un’interfaccia conversazionale. È pensato per esplorare e modificare un progetto mobile o web senza partire da un ambiente di sviluppo vuoto.",
    whyItMatters:
      "Aiuta a capire se un’idea funziona quando viene usata, oltre a mostrarne l’aspetto.",
    externalUrl: "https://www.vibecodeapp.com/sign-up?code=ref-39fsyj6mgbtp",
    originalSourceUrl: "https://www.tooolvibes.com/p/vibecode",
    featured: true,
    tags: ["vibe coding", "builder app AI", "app mobile", "iterazione", "pubblicazione"],
    ctaLabel: "Prova VibeCode",
    publishedAt: "2026-02-06",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Provare un’app mobile con un percorso essenziale.",
      "Condividere una demo web per raccogliere riscontri.",
      "Confrontare due soluzioni di navigazione prima dello sviluppo.",
    ],
    highlights: [
      "Avvio guidato",
      "Due contesti",
      "Revisioni successive",
    ],
    accentFrom: "#5b34ff",
    accentTo: "#9f5bff",
  }),
  defineTool({
    id: "weweb",
    name: "WeWeb",
    slug: "weweb",
    category: "No-code",
    categoryLabel: "No-code / builder web app",
    level: "intermediate",
    segments: ["no-code", "ai-app-builder", "website-builder"],
    shortDescription:
      "Progetta web app con un editor visuale, collegando interfaccia, dati e logica.",
    longDescription:
      "WeWeb permette di costruire il frontend di una web app con strumenti visuali e di collegarlo ai servizi che gestiscono i dati. È adatto a chi cerca un approccio no-code con maggiore controllo sulla struttura del progetto.",
    whyItMatters:
      "Rende più accessibile la costruzione dell’interfaccia senza confondere il lavoro visuale con la gestione del backend.",
    externalUrl:
      "https://dashboard.weweb.io/sign-up/e97a27ca-e319-49f0-a2b7-ea042d3c6b36",
    originalSourceUrl: "https://www.tooolvibes.com/p/blink-61f26b689a7da189",
    featured: true,
    tags: ["no-code", "builder web app", "frontend", "backend", "produzione"],
    ctaLabel: "Prova WeWeb",
    publishedAt: "2026-02-07",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Costruire un portale clienti collegato a un backend esistente.",
      "Creare un gestionale interno con schermate dedicate.",
      "Prototipare una web app con dati e azioni reali.",
    ],
    highlights: [
      "Controllo visuale",
      "Servizi separati",
      "Struttura riutilizzabile",
    ],
    accentFrom: "#2c5cff",
    accentTo: "#43c6ff",
  }),
  defineTool({
    id: "cosmicjs",
    name: "CosmicJS",
    slug: "cosmicjs",
    logoUrl: "/tool-logos/cosmicjs.svg",
    pricingStatus: "verified" as const,
    pricingPlans: [
      { name: "Free", price: "$0", period: "forever" },
      { name: "Builder", price: "$99", period: "per month" },
      { name: "Team", price: "$299", period: "per month" },
      { name: "Business", price: "$499", period: "per month" },
      { name: "Enterprise", price: "Custom", period: "" },
    ],
    pricingSourceUrl: "https://www.cosmicjs.com/pricing",
    pricingLastVerifiedAt: "2026-09-29",
    affiliateUrl: "https://app.cosmicjs.com/signup?ref=TOOOLVIBES",
    category: "Headless CMS",
    categoryLabel: "CMS headless / flussi AI",
    level: "intermediate",
    segments: ["headless-cms", "no-code", "automation"],
    shortDescription:
      "Organizza contenuti strutturati in un CMS headless e distribuiscili alle tue applicazioni.",
    longDescription:
      "Cosmic separa la gestione dei contenuti dal sito o dall’app che li presenta. Redattori e sviluppatori possono lavorare sullo stesso patrimonio informativo, con modelli e API dedicati.",
    whyItMatters:
      "È utile quando gli stessi contenuti devono restare ordinati e raggiungere più interfacce.",
    externalUrl: "https://app.cosmicjs.com/signup?ref=TOOOLVIBES",
    originalSourceUrl: "https://www.tooolvibes.com/p/cosmicjs",
    featured: true,
    tags: ["cms headless", "api", "flussi contenuti", "cataloghi", "flussi ai"],
    ctaLabel: "Prova CosmicJS",
    publishedAt: "2026-02-08",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Gestire un catalogo con schede e campi ricorrenti.",
      "Pubblicare contenuti su un sito e su un’app.",
      "Separare il lavoro della redazione da quello sul frontend.",
    ],
    highlights: [
      "Contenuti strutturati",
      "Frontend indipendente",
      "Ruoli distinti",
    ],
    accentFrom: "#6f3cff",
    accentTo: "#ffb14a",
  }),
  defineTool({
    id: "mocha",
    name: "Mocha",
    slug: "mocha",
    affiliateUrl: "https://getmocha.com/?via=toool",
    category: "Builder app AI",
    categoryLabel: "Builder app AI / no-code",
    level: "beginner",
    segments: ["ai-app-builder", "no-code"],
    shortDescription:
      "Builder AI dismesso: la chiusura del servizio era prevista per il 1° agosto 2026.",
    longDescription:
      "Mocha proponeva la creazione di app con database, backend, accesso utenti e hosting integrati. Il team ha annunciato la chiusura del servizio per il 1° agosto 2026: questa scheda conserva il contesto del prodotto e non lo presenta come una scelta per nuovi progetti.",
    whyItMatters:
      "Prima di scegliere un builder conta anche la continuità del servizio: Mocha è ora un caso da consultare in ottica di migrazione.",
    externalUrl: "https://getmocha.com/?via=toool",
    originalSourceUrl: "https://www.tooolvibes.com/p/mocha",
    featured: true,
    tags: ["builder app AI", "no-code", "app completa", "database", "pubblicazione"],
    ctaLabel: "Prova Mocha",
    publishedAt: "2026-02-09",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Ricostruire il contesto di un progetto già realizzato con Mocha.",
      "Valutare una migrazione verso un builder ancora operativo.",
      "Controllare dove sono conservati codice e dati esportati.",
    ],
    highlights: [
      "Contesto conservato",
      "Fonte consultabile",
      "Lezione operativa",
    ],
    accentFrom: "#8a3cff",
    accentTo: "#ff6eb3",
  }),
  defineTool({
    id: "v0",
    name: "v0",
    slug: "v0",
    category: "UI Builder",
    categoryLabel: "Coding AI / builder UI",
    level: "beginner",
    segments: ["ui-builder", "ai-app-builder"],
    shortDescription:
      "Trasforma descrizioni e riferimenti visuali in interfacce e applicazioni con l’AI di Vercel.",
    longDescription:
      "v0 aiuta a costruire e modificare interfacce e applicazioni attraverso la conversazione. La prima versione diventa una base da rivedere, collegare ai dati e integrare nel progetto.",
    whyItMatters:
      "È utile quando vuoi rendere concreta una direzione visuale e lavorare subito su una versione navigabile.",
    externalUrl: "https://v0.app/",
    originalSourceUrl: "https://www.tooolvibes.com/p/v0",
    featured: true,
    tags: ["ui builder", "ai coding", "components", "frontend", "vercel"],
    ctaLabel: "Prova v0",
    publishedAt: "2026-02-10",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Esplorare un’interfaccia prima di svilupparla in dettaglio.",
      "Preparare componenti da integrare in un progetto web.",
      "Costruire una demo con percorsi e contenuti realistici.",
    ],
    highlights: [
      "Risultato concreto",
      "Revisioni mirate",
      "Continuità tecnica",
    ],
    accentFrom: "#3d4357",
    accentTo: "#6d3bff",
  }),
  defineTool({
    id: "meku",
    name: "Meku",
    slug: "meku",
    affiliateUrl: "https://meku.dev/?aff=YFlSqMxPUaEb",
    category: "Vibe Coding",
    categoryLabel: "Builder siti AI / vibe coding",
    level: "beginner",
    segments: ["vibe-coding", "ai-app-builder", "website-builder"],
    shortDescription:
      "Crea siti e web app da prompt, poi modifica, esporta o pubblica il progetto.",
    longDescription:
      "Meku combina generazione AI, modifiche conversazionali e strumenti di pubblicazione. È rivolto a chi vuole partire da una base web utilizzabile e conservare la possibilità di proseguire sul codice.",
    whyItMatters:
      "Riduce il lavoro iniziale senza obbligarti a valutare il progetto soltanto attraverso una demo chiusa.",
    externalUrl: "https://meku.dev/?aff=YFlSqMxPUaEb",
    originalSourceUrl: "https://www.tooolvibes.com/p/meku",
    featured: true,
    tags: ["vibe coding", "react", "tailwind", "site builder", "export"],
    ctaLabel: "Prova Meku",
    publishedAt: "2026-02-11",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Preparare una prima versione di un sito o di una web app.",
      "Costruire una demo da condividere con clienti e collaboratori.",
      "Consegnare una base di progetto a un team di sviluppo.",
    ],
    highlights: [
      "Partenza rapida",
      "Codice disponibile",
      "Flusso continuo",
    ],
    accentFrom: "#11b8d8",
    accentTo: "#5b34ff",
  }),
  defineTool({
    id: "jenni-ai",
    name: "Jenni AI",
    slug: "jenni-ai",
    category: "Scrittura AI",
    categoryLabel: "Scrittura AI / ricerca",
    level: "beginner",
    segments: ["ai-writing", "productivity"],
    shortDescription:
      "Scrivi documenti di ricerca con supporto AI, fonti consultabili e citazioni.",
    longDescription:
      "Jenni AI riunisce scrittura assistita e lavoro sulle fonti in un ambiente dedicato alla ricerca. Può aiutare a organizzare una bozza, sviluppare paragrafi e collegare le citazioni ai materiali utilizzati.",
    whyItMatters:
      "Il valore è tenere vicini argomentazione e fonti, riducendo i passaggi tra lettura, scrittura e bibliografia.",
    externalUrl: "https://jenni.ai/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/jenny-ai_2",
    featured: false,
    tags: ["writing", "research", "citations", "academic", "documents"],
    ctaLabel: "Prova Jenni AI",
    publishedAt: "2026-01-15",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Organizzare una prima bozza di tesi o articolo.",
      "Rielaborare paragrafi mantenendo il legame con le fonti.",
      "Preparare una revisione della letteratura da controllare.",
    ],
    highlights: [
      "Fonti vicine al testo",
      "Bozza più ordinata",
      "Citazioni assistite",
    ],
    accentFrom: "#7c4dff",
    accentTo: "#38bdf8",
  }),
  defineTool({
    id: "betterpic",
    name: "BetterPic",
    slug: "betterpic",
    category: "Immagini AI",
    categoryLabel: "Immagini AI / ritratti",
    level: "beginner",
    segments: ["ai-image"],
    shortDescription:
      "Trasforma le tue fotografie in ritratti professionali per profili, CV e pagine team.",
    longDescription:
      "BetterPic genera ritratti con l’AI a partire dalle fotografie caricate. È una soluzione da valutare quando servono immagini coerenti per una presenza professionale, senza organizzare subito un servizio fotografico.",
    whyItMatters:
      "Risponde a un bisogno preciso: aggiornare l’immagine professionale con un flusso guidato.",
    externalUrl: "https://www.betterpic.io/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/betterpic_1",
    featured: false,
    tags: ["headshots", "profile", "linkedin", "ai image", "team"],
    ctaLabel: "Prova BetterPic",
    publishedAt: "2026-01-16",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Aggiornare la fotografia di un profilo professionale.",
      "Preparare immagini per CV e presentazioni personali.",
      "Dare una direzione visiva comune alla pagina di un team.",
    ],
    highlights: [
      "Obiettivo definito",
      "Scelta tra varianti",
      "Preparazione semplificata",
    ],
    accentFrom: "#6d3bff",
    accentTo: "#f472b6",
  }),
  defineTool({
    id: "imagine-art",
    name: "Imagine Art",
    slug: "imagine-art",
    category: "Immagini AI",
    categoryLabel: "Immagini AI / suite creativa",
    level: "beginner",
    segments: ["ai-image", "ai-video"],
    shortDescription:
      "Esplora immagini e video generati con l’AI in una piattaforma creativa dedicata.",
    longDescription:
      "Imagine Art riunisce strumenti per generare e rielaborare contenuti visuali. Può servire per esplorare una direzione creativa, preparare varianti e sviluppare materiali da rifinire prima della pubblicazione.",
    whyItMatters:
      "Aiuta a confrontare più possibilità visuali prima di scegliere dove investire il lavoro di produzione.",
    externalUrl: "https://www.imagine.art/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/imagine-art-ai_1",
    featured: false,
    tags: ["ai image", "creative suite", "video", "shorts", "prompt"],
    ctaLabel: "Prova Imagine Art",
    publishedAt: "2026-01-17",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Esplorare una direzione per una campagna o un progetto.",
      "Preparare riferimenti visuali per un brief creativo.",
      "Creare varianti da valutare in un layout reale.",
    ],
    highlights: [
      "Esplorazione veloce",
      "Più formati",
      "Iterazione guidata",
    ],
    accentFrom: "#8b5cf6",
    accentTo: "#06b6d4",
  }),
  defineTool({
    id: "muse-ai",
    name: "Muse AI",
    slug: "muse-ai",
    category: "Video AI",
    categoryLabel: "Video AI / hosting video",
    level: "beginner",
    segments: ["ai-video", "productivity"],
    shortDescription:
      "Ospita video e ritrova i passaggi che ti interessano attraverso la ricerca nei contenuti.",
    longDescription:
      "Muse AI combina gestione video e ricerca all’interno delle registrazioni. È utile per organizzare lezioni, webinar e archivi che devono essere consultati anche senza guardare ogni video dall’inizio.",
    whyItMatters:
      "Il valore cresce quando ritrovare un passaggio conta quanto conservare la registrazione.",
    externalUrl: "https://muse.ai/",
    fallbackUrl: "https://skiv.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/muse_1",
    featured: false,
    tags: ["video hosting", "ai search", "embed", "sharing", "archive"],
    ctaLabel: "Prova Muse AI",
    publishedAt: "2026-01-18",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Rendere consultabile un archivio di webinar.",
      "Organizzare lezioni e materiali di formazione.",
      "Ritrovare un passaggio in una registrazione lunga.",
    ],
    highlights: [
      "Ricerca contestuale",
      "Archivio condiviso",
      "Consultazione mirata",
    ],
    accentFrom: "#2563eb",
    accentTo: "#a855f7",
  }),
  defineTool({
    id: "socleads",
    name: "Socleads",
    slug: "socleads",
    affiliateUrl: "https://socleads.com/?ref=_lcMNGtlQjjQ",
    category: "Lead Generation",
    categoryLabel: "Generazione lead / vendite",
    level: "beginner",
    segments: ["sales", "marketing"],
    shortDescription:
      "Raccogli contatti da fonti pubbliche per costruire liste di aziende e potenziali clienti.",
    longDescription:
      "Socleads aiuta a trovare e organizzare contatti attraverso ricerche su fonti pubbliche. È una base per la ricerca commerciale: qualità, pertinenza e modalità di utilizzo dei dati richiedono comunque una valutazione.",
    whyItMatters:
      "Riduce la raccolta manuale quando hai già definito quali aziende cerchi e perché potrebbero essere pertinenti.",
    externalUrl: "https://socleads.com/?ref=_lcMNGtlQjjQ",
    originalSourceUrl: "https://tooolvibes.com/all-tools/socleads_1",
    featured: false,
    tags: ["lead generation", "sales", "google maps", "linkedin", "outreach"],
    ctaLabel: "Prova Socleads",
    publishedAt: "2026-01-19",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Ricercare aziende in un settore e in un’area specifici.",
      "Preparare una lista da qualificare prima del contatto.",
      "Confrontare la copertura di diverse fonti pubbliche.",
    ],
    highlights: [
      "Meno ricerca manuale",
      "Liste mirate",
      "Dati riutilizzabili",
    ],
    accentFrom: "#0ea5e9",
    accentTo: "#7c3aed",
  }),
  defineTool({
    id: "windsor-ai",
    name: "Windsor AI",
    slug: "windsor-ai",
    category: "Dati marketing",
    categoryLabel: "Dati marketing / attribuzione",
    level: "intermediate",
    segments: ["marketing", "automation"],
    shortDescription:
      "Collega dati marketing e aziendali agli strumenti di analisi, ai database e ai sistemi AI.",
    longDescription:
      "Windsor AI raccoglie dati da servizi diversi e li porta negli ambienti in cui vengono analizzati. È utile quando report e dashboard richiedono importazioni manuali ricorrenti.",
    whyItMatters:
      "Sposta il lavoro dalla preparazione ripetitiva dei file alla lettura e al controllo dei dati.",
    externalUrl: "https://www.windsor.ai/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/windsor-ai_2",
    featured: false,
    tags: ["marketing data", "attribution", "bi", "connectors", "warehouse"],
    ctaLabel: "Prova Windsor AI",
    publishedAt: "2026-01-20",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Preparare una dashboard con dati di più piattaforme.",
      "Centralizzare report marketing per un team o un cliente.",
      "Alimentare un database destinato all’analisi.",
    ],
    highlights: [
      "Fonti collegate",
      "Report ripetibili",
      "Destinazioni diverse",
    ],
    accentFrom: "#4338ca",
    accentTo: "#22c55e",
  }),
  defineTool({
    id: "frase-ai",
    name: "Frase AI",
    slug: "frase-ai",
    affiliateUrl: "https://www.frase.io/?via=tool57",
    category: "SEO",
    categoryLabel: "SEO / scrittura AI",
    level: "intermediate",
    segments: ["ai-writing", "marketing"],
    shortDescription:
      "Analizza argomenti e risultati di ricerca per preparare brief e contenuti più completi.",
    longDescription:
      "Frase AI supporta la ricerca editoriale, la costruzione di brief e la revisione dei contenuti. Aiuta a individuare domande e temi da trattare, lasciando all’autore il compito di sviluppare una risposta utile e originale.",
    whyItMatters:
      "Rende più ordinata la preparazione di un articolo, soprattutto quando ricerca e scrittura sono affidate a persone diverse.",
    externalUrl: "https://www.frase.io/?via=tool57",
    originalSourceUrl: "https://tooolvibes.com/all-tools/frase-ai_1",
    featured: false,
    tags: ["seo", "ai writing", "content brief", "serp", "optimization"],
    ctaLabel: "Prova Frase AI",
    publishedAt: "2026-01-21",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Preparare un brief prima di scrivere un articolo.",
      "Aggiornare una pagina che non risponde più bene alle domande dei lettori.",
      "Coordinare ricerca e scrittura in un team editoriale.",
    ],
    highlights: [
      "Ricerca organizzata",
      "Brief condivisibili",
      "Revisione mirata",
    ],
    accentFrom: "#7c3aed",
    accentTo: "#14b8a6",
  }),
  defineTool({
    id: "synthesia-ai",
    name: "Synthesia AI",
    slug: "synthesia-ai",
    logoUrl: "/tool-logos/synthesia-ai.svg",
    pricingStatus: "verified" as const,
    pricingPlans: [
      { name: "Free", price: "$0", period: "forever" },
      { name: "Starter", price: "$18", period: "per month (yearly)" },
      { name: "Creator", price: "Custom", period: "" },
      { name: "Enterprise", price: "Custom", period: "" },
    ],
    pricingSourceUrl: "https://www.synthesia.io/pricing",
    pricingLastVerifiedAt: "2026-09-29",
    category: "Video AI",
    categoryLabel: "Video AI / avatar",
    level: "intermediate",
    segments: ["ai-video"],
    shortDescription:
      "Crea video con avatar e voce a partire da uno script, per formazione e comunicazione.",
    longDescription:
      "Synthesia AI trasforma testi in video presentati da avatar. È utile per materiali che devono essere prodotti o aggiornati con regolarità, come formazione, procedure e comunicazioni interne.",
    whyItMatters:
      "Riduce il lavoro di ripresa quando il contenuto cambia spesso ma il formato può restare coerente.",
    externalUrl: "https://www.synthesia.io/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/synthesia-ai_1",
    featured: false,
    tags: ["ai video", "avatars", "voiceover", "training", "corporate"],
    ctaLabel: "Prova Synthesia",
    publishedAt: "2026-01-22",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Preparare un modulo di formazione interna.",
      "Spiegare una procedura che viene aggiornata spesso.",
      "Adattare una comunicazione per pubblici di lingue diverse.",
    ],
    highlights: [
      "Aggiornamenti semplici",
      "Formato coerente",
      "Produzione senza riprese",
    ],
    accentFrom: "#4f46e5",
    accentTo: "#ec4899",
  }),
  defineTool({
    id: "notionapps",
    name: "NotionApps",
    slug: "notionapps",
    affiliateUrl: "https://www.notionapps.com?via=toool",
    category: "No-code",
    categoryLabel: "No-code / app Notion",
    level: "intermediate",
    segments: ["no-code", "productivity"],
    shortDescription:
      "Trasforma i dati di Notion in un’app con schermate e accessi dedicati.",
    longDescription:
      "NotionApps permette di costruire interfacce utilizzabili a partire da database Notion. È utile per portali e piccoli strumenti operativi quando i dati sono già organizzati in Notion e devono raggiungere altri utenti.",
    whyItMatters:
      "Evita di spostare subito i dati in un nuovo sistema per offrire un’esperienza più semplice a chi li consulta.",
    externalUrl: "https://www.notionapps.com?via=toool",
    originalSourceUrl: "https://tooolvibes.com/all-tools/notionapps_1",
    featured: false,
    tags: ["notion", "no-code", "mobile app", "database", "internal tools"],
    ctaLabel: "Prova NotionApps",
    publishedAt: "2026-01-23",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Creare un portale clienti basato su dati Notion.",
      "Pubblicare un catalogo o una raccolta consultabile.",
      "Offrire a un team una vista operativa più semplice.",
    ],
    highlights: [
      "Dati riutilizzati",
      "Interfaccia dedicata",
      "Avvio contenuto",
    ],
    accentFrom: "#111827",
    accentTo: "#8b5cf6",
  }),
  defineTool({
    id: "blogify",
    name: "Blogify",
    slug: "blogify",
    affiliateUrl: "https://blogify.ai?fpr=n2ogi",
    category: "Blogging AI",
    categoryLabel: "Blogging AI / riuso contenuti",
    level: "intermediate",
    segments: ["ai-writing", "marketing"],
    shortDescription:
      "Trasforma video, audio e altri materiali in bozze di articoli da rivedere e pubblicare.",
    longDescription:
      "Blogify aiuta a riutilizzare contenuti esistenti in forma scritta. È pensato per chi produce video, interviste o podcast e vuole ricavarne articoli leggibili senza riscrivere tutto dalla pagina bianca.",
    whyItMatters:
      "Dà una seconda vita ai contenuti già prodotti, a patto di adattarli alle esigenze della lettura.",
    externalUrl: "https://blogify.ai?fpr=n2ogi",
    originalSourceUrl: "https://tooolvibes.com/all-tools/blogify_1",
    featured: false,
    tags: ["blogging", "content repurposing", "seo", "audio", "video"],
    ctaLabel: "Prova Blogify",
    publishedAt: "2026-01-24",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Ricavare un articolo da un episodio di podcast.",
      "Trasformare un webinar in un contenuto consultabile.",
      "Riutilizzare un’intervista in un formato editoriale diverso.",
    ],
    highlights: [
      "Materiali valorizzati",
      "Bozza iniziale",
      "Formato consultabile",
    ],
    accentFrom: "#a855f7",
    accentTo: "#f97316",
  }),
  defineTool({
    id: "livechat",
    name: "LiveChat",
    slug: "livechat",
    category: "Supporto clienti",
    categoryLabel: "Supporto clienti / chat live",
    level: "intermediate",
    segments: ["customer-support", "sales"],
    shortDescription:
      "Gestisci conversazioni con i visitatori del sito e offri supporto durante la navigazione.",
    longDescription:
      "LiveChat offre una chat per parlare con clienti e visitatori, organizzare le conversazioni e collegarle al lavoro del team. È utile quando una risposta tempestiva può chiarire un dubbio o sbloccare una richiesta.",
    whyItMatters:
      "Avvicina il supporto al momento in cui la persona incontra il problema.",
    externalUrl: "https://www.livechat.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/livechat_1",
    featured: false,
    tags: ["live chat", "support", "sales", "customer service", "realtime"],
    ctaLabel: "Prova LiveChat",
    publishedAt: "2026-01-25",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Rispondere ai dubbi prima di un acquisto.",
      "Aiutare chi incontra un problema sul sito.",
      "Raccogliere richieste da riprendere con un contesto chiaro.",
    ],
    highlights: [
      "Supporto contestuale",
      "Conversazioni organizzate",
      "Collegamenti operativi",
    ],
    accentFrom: "#2563eb",
    accentTo: "#22c55e",
  }),
  defineTool({
    id: "chatbot",
    name: "ChatBot",
    slug: "chatbot",
    pricingStatus: "verified" as const,
    pricingPlans: [
      { name: "Free", price: "$0", period: "forever" },
      { name: "Team", price: "$29", period: "per month" },
      { name: "Business", price: "$50", period: "per month" },
    ],
    pricingSourceUrl: "https://www.chatbot.com/pricing",
    pricingLastVerifiedAt: "2026-09-29",
    category: "AI Chatbot",
    categoryLabel: "Chatbot AI / supporto clienti",
    level: "intermediate",
    segments: ["customer-support", "ai-agents", "automation"],
    shortDescription:
      "Crea un chatbot per rispondere a domande ricorrenti e guidare richieste di supporto o vendita.",
    longDescription:
      "ChatBot permette di progettare assistenti conversazionali per siti e flussi di assistenza. È utile quando molte richieste seguono percorsi simili e possono essere gestite con contenuti e passaggi definiti.",
    whyItMatters:
      "Può alleggerire le richieste ripetitive, mantenendo un percorso chiaro verso il supporto umano.",
    externalUrl: "https://www.chatbot.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/chatbot_1",
    featured: false,
    tags: ["chatbot", "ai support", "automation", "sales", "faq"],
    ctaLabel: "Prova ChatBot",
    publishedAt: "2026-01-26",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Rispondere alle domande più frequenti sul servizio.",
      "Raccogliere informazioni iniziali prima del supporto umano.",
      "Guidare una richiesta commerciale attraverso passaggi definiti.",
    ],
    highlights: [
      "Perimetro definito",
      "Risposte organizzate",
      "Primo filtro",
    ],
    accentFrom: "#4f46e5",
    accentTo: "#06b6d4",
  }),
  defineTool({
    id: "helpdesk",
    name: "HelpDesk",
    slug: "helpdesk",
    pricingStatus: "verified" as const,
    pricingPlans: [
      { name: "Free", price: "$0", period: "forever" },
      { name: "Standard", price: "$19", period: "per user/month" },
    ],
    pricingSourceUrl: "https://www.helpdesk.com/pricing",
    pricingLastVerifiedAt: "2026-09-29",
    category: "Supporto clienti",
    categoryLabel: "Supporto clienti / ticket",
    level: "intermediate",
    segments: ["customer-support", "automation"],
    shortDescription:
      "Riunisci richieste clienti in ticket assegnabili, con stato, storico e responsabilità chiari.",
    longDescription:
      "HelpDesk organizza il lavoro di assistenza attraverso ticket e flussi condivisi. Serve a evitare che una richiesta resti dispersa tra email, persone e passaggi senza un responsabile.",
    whyItMatters:
      "Rende visibile chi sta seguendo una richiesta e quale passaggio manca per risolverla.",
    externalUrl: "https://www.helpdesk.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/helpdesk_1",
    featured: false,
    tags: ["helpdesk", "ticketing", "support", "automation", "team"],
    ctaLabel: "Prova HelpDesk",
    publishedAt: "2026-01-27",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Centralizzare le email di assistenza.",
      "Gestire richieste che passano tra più persone.",
      "Seguire arretrati e casi ancora aperti.",
    ],
    highlights: [
      "Contesto conservato",
      "Responsabilità visibile",
      "Processo condiviso",
    ],
    accentFrom: "#0f766e",
    accentTo: "#6366f1",
  }),
  defineTool({
    id: "wegic",
    name: "Wegic",
    slug: "wegic",
    category: "Builder siti AI",
    categoryLabel: "Builder siti AI",
    level: "intermediate",
    segments: ["website-builder", "ai-app-builder", "no-code"],
    shortDescription:
      "Crea e modifica un sito attraverso una conversazione, senza partire da un editor vuoto.",
    longDescription:
      "Wegic costruisce siti a partire da descrizioni e indicazioni visuali. Puoi chiedere modifiche alla struttura e ai contenuti, preparando una prima presenza online da controllare prima della pubblicazione.",
    whyItMatters:
      "Abbassa la soglia di partenza per chi sa cosa vuole comunicare ma non vuole comporre ogni pagina manualmente.",
    externalUrl: "https://wegic.ai/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/wegic_1",
    featured: false,
    tags: ["website builder", "ai site", "conversation", "no-code", "publish"],
    ctaLabel: "Prova Wegic",
    publishedAt: "2026-01-28",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Preparare un sito vetrina per un’attività.",
      "Realizzare una pagina dedicata a un servizio.",
      "Provare la struttura di un sito prima di un lavoro su misura.",
    ],
    highlights: [
      "Partenza semplice",
      "Revisioni accessibili",
      "Percorso guidato",
    ],
    accentFrom: "#6d3bff",
    accentTo: "#38bdf8",
  }),
  defineTool({
    id: "vidau",
    name: "Vidau",
    slug: "vidau",
    category: "Annunci video AI",
    categoryLabel: "Annunci video AI",
    level: "intermediate",
    segments: ["ai-video", "marketing"],
    shortDescription:
      "Trasforma immagini, testi e pagine prodotto in bozze di video pubblicitari.",
    longDescription:
      "Vidau aiuta a creare video promozionali partendo da materiali già disponibili. È utile per esplorare messaggi e varianti creative prima di investire in una produzione più articolata.",
    whyItMatters:
      "Rende più semplice preparare varianti da testare, senza trattare il primo video generato come un annuncio già validato.",
    externalUrl: "https://www.vidau.ai/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/vidau_1",
    featured: false,
    tags: ["video ads", "ai video", "marketing", "ecommerce", "creative"],
    ctaLabel: "Prova VidAU",
    publishedAt: "2026-01-29",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Esplorare messaggi diversi per lo stesso prodotto.",
      "Preparare bozze video per una campagna.",
      "Adattare materiali esistenti a un formato promozionale.",
    ],
    highlights: [
      "Asset riutilizzati",
      "Varianti confrontabili",
      "Produzione iniziale ridotta",
    ],
    accentFrom: "#db2777",
    accentTo: "#7c3aed",
  }),
  defineTool({
    id: "lemon-squeezy",
    name: "Lemon Squeezy",
    slug: "lemon-squeezy",
    logoUrl: "/tool-logos/lemon-squeezy.svg",
    pricingStatus: "verified" as const,
    pricingPlans: [
      { name: "Free to start", price: "$0", period: "forever" },
      { name: "Transaction fee", price: "5% + 50¢", period: "per transaction" },
    ],
    pricingSourceUrl: "https://www.lemonsqueezy.com/pricing",
    pricingLastVerifiedAt: "2026-09-29",
    category: "Pagamenti",
    categoryLabel: "Pagamenti / Merchant of Record",
    level: "intermediate",
    segments: ["payments"],
    shortDescription:
      "Gestisci la vendita di software e prodotti digitali con pagamenti e abbonamenti in un servizio Merchant of Record.",
    longDescription:
      "Lemon Squeezy gestisce la vendita di prodotti digitali come Merchant of Record. Riunisce checkout, abbonamenti e gestione delle imposte sulle transazioni coperte dal servizio.",
    whyItMatters:
      "Può ridurre il numero di sistemi da coordinare per vendere un prodotto digitale a clienti di paesi diversi.",
    externalUrl: "https://www.lemonsqueezy.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/lemon-squeezy_1",
    featured: false,
    tags: ["payments", "saas", "merchant of record", "subscriptions", "tax"],
    ctaLabel: "Prova Lemon Squeezy",
    publishedAt: "2026-01-30",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Vendere un software o un prodotto digitale ammesso.",
      "Gestire un abbonamento con un checkout dedicato.",
      "Ridurre la frammentazione tra vendita e gestione delle transazioni.",
    ],
    highlights: [
      "Vendita integrata",
      "Ricorrenze gestite",
      "Ambito internazionale",
    ],
    accentFrom: "#f59e0b",
    accentTo: "#8b5cf6",
  }),
  defineTool({
    id: "vibrantsnap",
    name: "VibrantSnap",
    slug: "vibrantsnap",
    category: "Video AI",
    categoryLabel: "Video AI / demo prodotto",
    level: "intermediate",
    segments: ["ai-video", "marketing"],
    shortDescription:
      "Trasforma registrazioni dello schermo in demo e tutorial con narrazione e montaggio assistiti dall’AI.",
    longDescription:
      "VibrantSnap lavora sulle registrazioni dello schermo per creare video che spiegano un prodotto. Aiuta a rifinire la narrazione e a rendere più chiari i passaggi mostrati in demo, tutorial e materiali di onboarding.",
    whyItMatters:
      "Riduce il lavoro di rifinitura delle spiegazioni video che il team deve produrre e aggiornare spesso.",
    externalUrl: "https://www.vibrantsnap.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/vibrantsnap_1",
    featured: false,
    tags: ["product demo", "screen recording", "ai video", "tutorial", "saas"],
    ctaLabel: "Prova VibrantSnap",
    publishedAt: "2026-01-31",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Spiegare una nuova funzione con una demo breve.",
      "Preparare un tutorial per il centro assistenza.",
      "Aggiornare una registrazione utilizzata nell’onboarding.",
    ],
    highlights: [
      "Percorso visibile",
      "Narrazione rivedibile",
      "Dettagli più leggibili",
    ],
    accentFrom: "#06b6d4",
    accentTo: "#7c3aed",
  }),
  defineTool({
    id: "reachifyme",
    name: "ReachifyMe",
    slug: "reachifyme",
    category: "LinkedIn",
    categoryLabel: "LinkedIn / brand personale",
    level: "intermediate",
    segments: ["marketing", "ai-writing"],
    shortDescription:
      "Organizza idee e bozze per pubblicare contenuti LinkedIn con maggiore continuità.",
    longDescription:
      "ReachifyMe aiuta a sviluppare contenuti per LinkedIn, dalle idee alla bozza. È utile quando vuoi costruire una routine editoriale senza affidare all’AI la tua esperienza o il tuo punto di vista.",
    whyItMatters:
      "Riduce l’attrito tra un’idea annotata e un post che puoi rivedere e pubblicare.",
    externalUrl: "https://reachifyme.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/reachifyme_1",
    featured: false,
    tags: ["linkedin", "personal branding", "ai writing", "content", "growth"],
    ctaLabel: "Prova ReachifyMe",
    publishedAt: "2026-02-01",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Trasformare un’esperienza professionale in un post.",
      "Dare ordine a una raccolta di idee per LinkedIn.",
      "Preparare bozze da rivedere prima della pubblicazione.",
    ],
    highlights: [
      "Canale definito",
      "Avvio più semplice",
      "Routine sostenibile",
    ],
    accentFrom: "#2563eb",
    accentTo: "#8b5cf6",
  }),
  defineTool({
    id: "make",
    name: "Make",
    slug: "make",
    affiliateUrl: "https://www.make.com/en/register?pc=imaketoool",
    category: "Automazioni",
    categoryLabel: "Automazioni / builder flussi",
    level: "expert",
    segments: ["automation", "no-code"],
    shortDescription:
      "Collega app e API con automazioni visuali che trasformano dati e coordinano azioni.",
    longDescription:
      "Make permette di costruire scenari che collegano servizi, elaborano informazioni e avviano azioni. È utile per processi ripetitivi che oggi richiedono passaggi manuali tra più strumenti.",
    whyItMatters:
      "Rende visibile il percorso dei dati e aiuta a trasformare una sequenza operativa in un flusso ripetibile.",
    externalUrl: "https://www.make.com/en/register?pc=imaketoool",
    originalSourceUrl: "https://tooolvibes.com/all-tools/makecom_1",
    featured: false,
    tags: ["automazioni", "flussi", "integrazioni", "api", "no-code"],
    ctaLabel: "Prova Make",
    publishedAt: "2026-02-02",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Trasferire richieste da un modulo al CRM.",
      "Aggiornare dati tra servizi che devono restare allineati.",
      "Preparare report o notifiche da eventi ricorrenti.",
    ],
    highlights: [
      "Flusso visibile",
      "Logica configurabile",
      "Passaggi riutilizzabili",
    ],
    accentFrom: "#6d3bff",
    accentTo: "#ec4899",
  }),
  defineTool({
    id: "omi",
    name: "Omi",
    slug: "omi",
    category: "AI Wearable",
    categoryLabel: "Wearable AI / assistente personale",
    level: "expert",
    segments: ["productivity", "ai-agents"],
    shortDescription:
      "Un dispositivo indossabile che trascrive conversazioni e le trasforma in appunti consultabili.",
    longDescription:
      "Omi combina un dispositivo indossabile e un’app per conservare informazioni dalle conversazioni. Può aiutare a ritrovare dettagli e preparare appunti, con attenzione a contesto, consenso e gestione dei dati.",
    whyItMatters:
      "È interessante quando il problema è ricordare e riorganizzare conversazioni frequenti, oltre alle sole riunioni online.",
    externalUrl: "https://www.omi.me/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/omi-app-ai",
    featured: false,
    tags: ["wearable", "personal ai", "transcription", "memory", "open-source"],
    ctaLabel: "Prova Omi",
    publishedAt: "2026-02-03",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Conservare appunti di una conversazione concordata.",
      "Ritrovare decisioni e dettagli da rivedere.",
      "Preparare un promemoria da verificare dopo una riunione.",
    ],
    highlights: [
      "Contesto fuori dal desktop",
      "Informazioni consultabili",
      "Estensibilità",
    ],
    accentFrom: "#111827",
    accentTo: "#06b6d4",
  }),
  defineTool({
    id: "flowise",
    name: "Flowise",
    slug: "flowise",
    logoUrl: "/tool-logos/flowise.png",
    category: "Agenti AI",
    categoryLabel: "Agenti AI / LangChain / flussi AI",
    level: "expert",
    segments: ["ai-agents", "automation"],
    shortDescription:
      "Costruisci flussi e agenti AI con un editor visuale open-source.",
    longDescription:
      "Flowise permette di collegare modelli, fonti dati e strumenti in applicazioni AI visuali. È utile per team tecnici che vogliono prototipare e organizzare flussi senza scrivere ogni collegamento da zero.",
    whyItMatters:
      "Rende più leggibile l’orchestrazione di un’applicazione AI, mantenendo visibili componenti e passaggi.",
    externalUrl: "https://flowiseai.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/flowise-ai_1",
    featured: false,
    tags: ["agenti ai", "langchain", "rag", "open-source", "flussi ai"],
    ctaLabel: "Prova Flowise",
    publishedAt: "2026-02-04",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Prototipare una chat basata su documenti.",
      "Disegnare un flusso AI con più componenti.",
      "Valutare un agente con azioni circoscritte.",
    ],
    highlights: [
      "Architettura visibile",
      "Base open-source",
      "Prototipi modulari",
    ],
    accentFrom: "#0f766e",
    accentTo: "#7c3aed",
  }),
  defineTool({
    id: "tolt",
    name: "Tolt",
    slug: "tolt",
    category: "Marketing affiliate",
    categoryLabel: "Marketing affiliate / SaaS",
    level: "expert",
    segments: ["marketing", "sales"],
    shortDescription:
      "Organizza un programma di affiliazione SaaS con tracciamento, commissioni e gestione dei partner.",
    longDescription:
      "Tolt aiuta a gestire programmi di affiliazione per prodotti SaaS. Collega i risultati dei referral alle commissioni e al lavoro con i partner, secondo le integrazioni e le regole configurate.",
    whyItMatters:
      "Dà struttura a un canale di crescita che altrimenti rischia di essere gestito con fogli e verifiche manuali.",
    externalUrl: "https://tolt.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/tolt_1",
    featured: false,
    tags: ["affiliate", "referral", "saas", "stripe", "paddle"],
    ctaLabel: "Prova Tolt",
    publishedAt: "2026-02-05",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Lanciare un programma di affiliazione per un SaaS.",
      "Seguire referral e commissioni senza un foglio separato.",
      "Organizzare la collaborazione con partner e creator.",
    ],
    highlights: [
      "Programma organizzato",
      "Regole tracciabili",
      "Meno verifiche manuali",
    ],
    accentFrom: "#7c3aed",
    accentTo: "#22c55e",
  }),
  defineTool({
    id: "agentx",
    name: "AgentX",
    pricingStatus: "verified" as const,
    pricingPlans: [
      { name: "Free", price: "$0", period: "forever" },
      { name: "Solo Builder", price: "$49", period: "per month" },
      { name: "Professional", price: "$199", period: "per month" },
      { name: "Business", price: "$299", period: "per month" },
      { name: "Enterprise", price: "Custom", period: "" },
    ],
    pricingSourceUrl: "https://agentx.so/pricing",
    pricingLastVerifiedAt: "2026-09-29",
    slug: "agentx",
    category: "Agenti AI",
    categoryLabel: "Agenti AI / builder no-code",
    level: "expert",
    segments: ["ai-agents", "automation", "no-code"],
    shortDescription:
      "Crea agenti AI specializzati e coordina flussi con conoscenze e strumenti dedicati.",
    longDescription:
      "AgentX permette di costruire agenti AI per compiti definiti e di combinarli in flussi di lavoro. È utile per esplorare assistenza e automazioni quando puoi specificare fonti, azioni consentite e risultato atteso.",
    whyItMatters:
      "Aiuta a passare da un assistente generico a un compito operativo con un perimetro riconoscibile.",
    externalUrl: "https://www.agentx.so/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/agentx_1",
    featured: false,
    tags: ["agenti ai", "no-code", "multi-agent", "flussi business", "automazioni"],
    ctaLabel: "Prova AgentX",
    publishedAt: "2026-02-06",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Preparare un assistente per domande su materiali aziendali.",
      "Prototipare un agente con azioni limitate e controllabili.",
      "Suddividere un processo AI in compiti verificabili.",
    ],
    highlights: [
      "Compiti definiti",
      "Informazioni dedicate",
      "Coordinamento",
    ],
    accentFrom: "#4f46e5",
    accentTo: "#f97316",
  }),
];

export function getToolBadgeLabel(name: string) {
  if (name.toLowerCase() === "v0") {
    return "v0";
  }

  const compact = name.replace(/[^a-z0-9]/gi, "");

  if (compact.length <= 2) {
    return compact.toUpperCase();
  }

  return compact.slice(0, 2).toUpperCase();
}

export function getDirectoryToolBySlug(slug: string) {
  return directoryTools.find((tool) => tool.slug === slug) ?? null;
}

export function getToolOfTheWeek() {
  return directoryTools.find((tool) => tool.toolOfWeek) ?? directoryTools[0] ?? null;
}

export function getFeaturedDirectoryTools(limit = 4) {
  return directoryTools
    .filter((tool) => tool.level === "featured" || tool.featured)
    .slice(0, limit);
}

export function getDirectoryTags() {
  return directoryTools.reduce<Record<string, number>>((accumulator, tool) => {
    tool.tags.forEach((tag) => {
      accumulator[tag] = (accumulator[tag] ?? 0) + 1;
    });

    return accumulator;
  }, {});
}

export function getToolsByLevel(level: DirectoryToolLevel) {
  return directoryTools.filter((tool) => tool.level === level);
}

export function getRelatedDirectoryTools(tool: DirectoryTool, limit = 3) {
  return directoryTools
    .filter((item) => item.slug !== tool.slug)
    .map((item) => {
      const sharedSegments = item.segments.filter((segment) =>
        tool.segments.includes(segment),
      ).length;
      const sharedTags = item.tags.filter((tag) => tool.tags.includes(tag)).length;
      const sameLevel = item.level === tool.level ? 1 : 0;

      return {
        tool: item,
        score: sharedSegments * 3 + sharedTags * 2 + sameLevel + Number(item.featured),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.tool);
}
