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
    category: "Vibe Coding",
    categoryLabel: "Vibe coding / builder app AI",
    level: "beginner",
    segments: ["vibe-coding", "ai-app-builder"],
    shortDescription:
      "AI app builder che trasforma un'idea in un'app funzionante in pochi minuti.",
    longDescription:
      "Blink è pensato per passare da prompt a interfaccia, logica e prima esperienza prodotto senza aprire subito un ciclo di sviluppo pesante. Accorcia il tempo tra intuizione, prototipo e primo test reale.",
    whyItMatters:
      "Se vuoi validare un'idea in fretta con una resa credibile, Blink è il profilo più diretto da aprire per primo.",
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
      "Validare un MVP in ore invece che in settimane",
      "Costruire una web app da prompt per un test rapido",
      "Mostrare un concept navigabile a clienti o investitori",
    ],
    highlights: ["Dal prompt all'app", "MVP rapido", "Web app"],
    accentFrom: "#6d3bff",
    accentTo: "#43c6ff",
  }),
  defineTool({
    id: "vibecode",
    name: "VibeCode",
    slug: "vibecode",
    category: "Builder app AI",
    categoryLabel: "Vibe coding / builder app AI",
    level: "beginner",
    segments: ["vibe-coding", "ai-app-builder"],
    shortDescription:
      "Builder AI per creare app da prompt, iterare rapidamente e pubblicare progetti mobile/web.",
    longDescription:
      "VibeCode spinge sulla velocità di iterazione: generi una base applicativa, la rifinisci rapidamente e capisci se il prodotto merita il passaggio successivo.",
    whyItMatters:
      "È uno dei builder da considerare quando la priorità è testare, iterare e pubblicare velocemente.",
    externalUrl: "https://www.vibecodeapp.com/sign-up?code=ref-39fsyj6mgbtp",
    originalSourceUrl: "https://www.tooolvibes.com/p/vibecode",
    featured: true,
    tags: ["vibe coding", "builder app AI", "app mobile", "iterazione", "pubblicazione"],
    ctaLabel: "Prova VibeCode",
    publishedAt: "2026-02-06",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Iterare una app mobile o web da prompt",
      "Accelerare il passaggio da idea a demo pubblicabile",
      "Ridurre il tempo tra concept e feedback reale",
    ],
    highlights: ["Iterazione", "Mobile e web", "Pubblicazione"],
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
      "Piattaforma visuale no-code/AI per creare web app production-grade.",
    longDescription:
      "WeWeb è una scelta matura quando vuoi restare veloce senza perdere controllo sul front-end, sulle integrazioni e sulla tenuta del progetto nel tempo.",
    whyItMatters:
      "Quando il progetto deve restare no-code ma sembrare pronto per andare in produzione, WeWeb merita attenzione vera.",
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
      "Costruire web app senza ripartire da zero",
      "Collegare frontend visuale e backend esterni",
      "Portare un progetto no-code a uno standard serio",
    ],
    highlights: ["No-code pro", "Backend", "Produzione"],
    accentFrom: "#2c5cff",
    accentTo: "#43c6ff",
  }),
  defineTool({
    id: "cosmicjs",
    name: "CosmicJS",
    slug: "cosmicjs",
    category: "Headless CMS",
    categoryLabel: "CMS headless / flussi AI",
    level: "intermediate",
    segments: ["headless-cms", "no-code", "automation"],
    shortDescription:
      "CMS headless con AI, API, flussi e strumenti per accelerare progetti guidati dai contenuti.",
    longDescription:
      "CosmicJS aiuta a organizzare contenuti, modelli, API e flussi editoriali in modo pulito. È un buon centro operativo per cataloghi, siti editoriali e web app guidate dai contenuti.",
    whyItMatters:
      "Non è solo un CMS: è un centro operativo quando contenuti e struttura devono restare gestibili nel tempo.",
    externalUrl: "https://app.cosmicjs.com/signup?ref=TOOOLVIBES",
    originalSourceUrl: "https://www.tooolvibes.com/p/cosmicjs",
    featured: true,
    tags: ["cms headless", "api", "flussi contenuti", "cataloghi", "flussi ai"],
    ctaLabel: "Prova CosmicJS",
    publishedAt: "2026-02-08",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Gestire contenuti strutturati via API",
      "Dare ordine a progetti editoriali o cataloghi",
      "Velocizzare flussi tra contenuti, team e frontend",
    ],
    highlights: ["API al centro", "Flussi", "CMS"],
    accentFrom: "#6f3cff",
    accentTo: "#ffb14a",
  }),
  defineTool({
    id: "mocha",
    name: "Mocha",
    slug: "mocha",
    category: "Builder app AI",
    categoryLabel: "Builder app AI / no-code",
    level: "beginner",
    segments: ["ai-app-builder", "no-code"],
    shortDescription:
      "Builder no-code per app AI con backend, database, autenticazione, hosting e pubblicazione integrati.",
    longDescription:
      "Mocha si posiziona bene quando vuoi un builder che non si fermi alla UI: backend, database, accesso e pubblicazione fanno parte della promessa.",
    whyItMatters:
      "È un builder da valutare quando vuoi un sistema più integrato e meno frizione operativa tra idea e rilascio.",
    externalUrl: "https://getmocha.com/?via=toool",
    originalSourceUrl: "https://www.tooolvibes.com/p/mocha",
    featured: true,
    tags: ["builder app AI", "no-code", "app completa", "database", "pubblicazione"],
    ctaLabel: "Prova Mocha",
    publishedAt: "2026-02-09",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Costruire una app con backend e accesso inclusi",
      "Ridurre i passaggi tra costruzione, dati e pubblicazione",
      "Lanciare velocemente un prodotto no-code completo",
    ],
    highlights: ["App completa", "Database", "Accesso"],
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
      "Builder AI di Vercel per creare interfacce, app, componenti e progetti pronti alla pubblicazione.",
    longDescription:
      "v0 è forte quando la partita si gioca su UI, componenti e velocità di esecuzione front-end. Aiuta a esplorare direzioni visuali e portare il codice in un flusso moderno.",
    whyItMatters:
      "Per UI, componenti e frontend veloci da validare, v0 resta uno dei riferimenti più chiari del panorama AI builder.",
    externalUrl: "https://v0.app/",
    originalSourceUrl: "https://www.tooolvibes.com/p/v0",
    featured: true,
    tags: ["ui builder", "ai coding", "components", "frontend", "vercel"],
    ctaLabel: "Prova v0",
    publishedAt: "2026-02-10",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Generare UI e componenti da prompt",
      "Accelerare il lavoro su prototipi frontend",
      "Passare da idea visuale a codice più in fretta",
    ],
    highlights: ["UI", "Componenti", "Frontend"],
    accentFrom: "#3d4357",
    accentTo: "#6d3bff",
  }),
  defineTool({
    id: "meku",
    name: "Meku",
    slug: "meku",
    category: "Vibe Coding",
    categoryLabel: "Builder siti AI / vibe coding",
    level: "beginner",
    segments: ["vibe-coding", "ai-app-builder", "website-builder"],
    shortDescription:
      "AI web app & site builder per generare progetti React/Tailwind, iterare, esportare e pubblicare.",
    longDescription:
      "Meku interessa chi vuole restare nel mondo React/Tailwind ma partire da una spinta AI concreta: genera una base moderna, la iteri e poi puoi riprendere controllo del progetto.",
    whyItMatters:
      "È il tipo di builder che piace a chi vuole accelerare senza perdere il filo del codice e della struttura.",
    externalUrl: "https://meku.dev/?aff=YFlSqMxPUaEb",
    originalSourceUrl: "https://www.tooolvibes.com/p/meku",
    featured: true,
    tags: ["vibe coding", "react", "tailwind", "site builder", "export"],
    ctaLabel: "Prova Meku",
    publishedAt: "2026-02-11",
    readingTime: "3 min",
    sourceSite: "tooolvibes.com",
    useCases: [
      "Generare basi React/Tailwind da cui partire",
      "Costruire siti o web app con iterazione veloce",
      "Esportare e continuare un progetto fuori dal builder",
    ],
    highlights: ["React", "Tailwind", "Esportazione"],
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
      "Assistente AI per scrittura, ricerca, citazioni e documenti accademici.",
    longDescription:
      "Jenni AI aiuta a trasformare appunti e ricerche in documenti più ordinati, con supporto a citazioni, outline e scrittura assistita.",
    whyItMatters:
      "È un buon punto di ingresso per chi vuole usare l'AI sulla scrittura senza costruire flussi complessi.",
    externalUrl: "https://jenni.ai/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/jenny-ai_2",
    featured: false,
    tags: ["writing", "research", "citations", "academic", "documents"],
    ctaLabel: "Prova Jenni AI",
    publishedAt: "2026-01-15",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Preparare bozze e documenti lunghi",
      "Gestire citazioni e fonti",
      "Velocizzare ricerca e struttura dei testi",
    ],
    highlights: ["Ricerca", "Citazioni", "Scrittura"],
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
      "Generatore AI di headshot professionali per profili, CV, LinkedIn e team.",
    longDescription:
      "BetterPic genera ritratti professionali a partire da foto personali, utile per profili, team page, CV e asset LinkedIn coerenti.",
    whyItMatters:
      "Risolve un bisogno chiaro e veloce: avere headshot credibili senza organizzare uno shooting.",
    externalUrl: "https://www.betterpic.io/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/betterpic_1",
    featured: false,
    tags: ["headshots", "profile", "linkedin", "ai image", "team"],
    ctaLabel: "Prova BetterPic",
    publishedAt: "2026-01-16",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Creare headshot per profili professionali",
      "Uniformare immagini di un team",
      "Aggiornare CV e LinkedIn con asset curati",
    ],
    highlights: ["Ritratti", "LinkedIn", "Team"],
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
      "Suite AI per generare immagini, video, shorts e contenuti creativi da prompt.",
    longDescription:
      "Imagine Art unisce generazione visuale e strumenti creativi per passare da prompt a immagini, video e asset social più rapidamente.",
    whyItMatters:
      "È utile quando vuoi produrre creatività visiva senza rimbalzare tra troppe app separate.",
    externalUrl: "https://www.imagine.art/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/imagine-art-ai_1",
    featured: false,
    tags: ["ai image", "creative suite", "video", "shorts", "prompt"],
    ctaLabel: "Prova Imagine Art",
    publishedAt: "2026-01-17",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Generare immagini da prompt",
      "Creare asset video brevi",
      "Produrre visual per campagne e social",
    ],
    highlights: ["Immagini", "Video", "Creatività"],
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
      "Piattaforma video con hosting, ricerca AI nei video, embed e condivisione.",
    longDescription:
      "Muse AI combina hosting video, ricerca semantica nei contenuti e condivisione tramite embed, rendendo più gestibile un archivio video.",
    whyItMatters:
      "Quando i video diventano tanti, la ricerca interna e l'organizzazione fanno la differenza.",
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
      "Ospitare video e renderli ricercabili",
      "Creare embed per siti e knowledge base",
      "Organizzare archivi video con ricerca AI",
    ],
    highlights: ["Hosting", "Ricerca AI", "Incorporamento"],
    accentFrom: "#2563eb",
    accentTo: "#a855f7",
  }),
  defineTool({
    id: "socleads",
    name: "Socleads",
    slug: "socleads",
    category: "Lead Generation",
    categoryLabel: "Generazione lead / vendite",
    level: "beginner",
    segments: ["sales", "marketing"],
    shortDescription:
      "Tool per estrarre lead verificati da Google Maps, Instagram, LinkedIn e altre fonti pubbliche.",
    longDescription:
      "Socleads aiuta team sales e founder a raccogliere lead da fonti pubbliche, con un flusso pensato per velocizzare prospecting e outreach.",
    whyItMatters:
      "Per chi deve creare una pipeline da zero, riduce il lavoro manuale sulle prime liste di contatti.",
    externalUrl: "https://socleads.com/?ref=_lcMNGtlQjjQ",
    originalSourceUrl: "https://tooolvibes.com/all-tools/socleads_1",
    featured: false,
    tags: ["lead generation", "sales", "google maps", "linkedin", "outreach"],
    ctaLabel: "Prova Socleads",
    publishedAt: "2026-01-19",
    readingTime: "2 min",
    sourceSite: "weblium",
    useCases: [
      "Costruire liste lead per outbound",
      "Raccogliere contatti da fonti pubbliche",
      "Accelerare prospecting commerciale",
    ],
    highlights: ["Lead", "Vendite", "Contatti"],
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
      "Piattaforma per unificare dati marketing, attribution e connettori verso BI/warehouse.",
    longDescription:
      "Windsor AI centralizza dati marketing da canali diversi, li porta verso strumenti BI o warehouse e aiuta a leggere attribution e performance.",
    whyItMatters:
      "È utile quando report e dashboard iniziano a diventare più importanti delle singole campagne.",
    externalUrl: "https://www.windsor.ai/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/windsor-ai_2",
    featured: false,
    tags: ["marketing data", "attribution", "bi", "connectors", "warehouse"],
    ctaLabel: "Prova Windsor AI",
    publishedAt: "2026-01-20",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Unificare dati advertising e analytics",
      "Inviare dati verso BI e warehouse",
      "Costruire report marketing più affidabili",
    ],
    highlights: ["Dati", "Attribuzione", "BI"],
    accentFrom: "#4338ca",
    accentTo: "#22c55e",
  }),
  defineTool({
    id: "frase-ai",
    name: "Frase AI",
    slug: "frase-ai",
    category: "SEO",
    categoryLabel: "SEO / scrittura AI",
    level: "intermediate",
    segments: ["ai-writing", "marketing"],
    shortDescription:
      "Piattaforma AI per brief SEO, scrittura, ottimizzazione contenuti e analisi SERP.",
    longDescription:
      "Frase AI lavora su ricerca SERP, brief, outline e ottimizzazione dei contenuti per rendere il processo SEO più rapido e controllabile.",
    whyItMatters:
      "Per content team e founder, riduce il salto tra keyword research, brief e pubblicazione.",
    externalUrl: "https://www.frase.io/?via=tool57",
    originalSourceUrl: "https://tooolvibes.com/all-tools/frase-ai_1",
    featured: false,
    tags: ["seo", "ai writing", "content brief", "serp", "optimization"],
    ctaLabel: "Prova Frase AI",
    publishedAt: "2026-01-21",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Creare brief SEO più velocemente",
      "Ottimizzare contenuti già pubblicati",
      "Analizzare SERP e intenti di ricerca",
    ],
    highlights: ["SEO", "Brief", "SERP"],
    accentFrom: "#7c3aed",
    accentTo: "#14b8a6",
  }),
  defineTool({
    id: "synthesia-ai",
    name: "Synthesia AI",
    slug: "synthesia-ai",
    category: "Video AI",
    categoryLabel: "Video AI / avatar",
    level: "intermediate",
    segments: ["ai-video"],
    shortDescription:
      "Piattaforma AI video per creare contenuti con avatar, voiceover e script testuali.",
    longDescription:
      "Synthesia trasforma script in video con avatar e voiceover, ideale per formazione, onboarding, contenuti corporate e comunicazione scalabile.",
    whyItMatters:
      "Permette di produrre video professionali senza set, camera e speaker ogni volta.",
    externalUrl: "https://www.synthesia.io/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/synthesia-ai_1",
    featured: false,
    tags: ["ai video", "avatars", "voiceover", "training", "corporate"],
    ctaLabel: "Prova Synthesia",
    publishedAt: "2026-01-22",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Creare video training da script",
      "Produrre contenuti corporate multilingua",
      "Velocizzare onboarding e tutorial",
    ],
    highlights: ["Avatar", "Video", "Voce fuori campo"],
    accentFrom: "#4f46e5",
    accentTo: "#ec4899",
  }),
  defineTool({
    id: "notionapps",
    name: "NotionApps",
    slug: "notionapps",
    category: "No-code",
    categoryLabel: "No-code / app Notion",
    level: "intermediate",
    segments: ["no-code", "productivity"],
    shortDescription:
      "Tool per trasformare database Notion in app web/mobile con permessi e sync.",
    longDescription:
      "NotionApps prende database Notion e li trasforma in app utilizzabili, con permessi, interfacce e sincronizzazione pensate per team e clienti.",
    whyItMatters:
      "È perfetto quando Notion è già il backend operativo e serve un'interfaccia più pulita.",
    externalUrl: "https://www.notionapps.com?via=toool",
    originalSourceUrl: "https://tooolvibes.com/all-tools/notionapps_1",
    featured: false,
    tags: ["notion", "no-code", "mobile app", "database", "internal tools"],
    ctaLabel: "Prova NotionApps",
    publishedAt: "2026-01-23",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Trasformare database Notion in app",
      "Creare portali per clienti o team",
      "Usare Notion come base dati operativa",
    ],
    highlights: ["Notion", "App", "Sincronizzazione"],
    accentFrom: "#111827",
    accentTo: "#8b5cf6",
  }),
  defineTool({
    id: "blogify",
    name: "Blogify",
    slug: "blogify",
    category: "Blogging AI",
    categoryLabel: "Blogging AI / riuso contenuti",
    level: "intermediate",
    segments: ["ai-writing", "marketing"],
    shortDescription:
      "Tool AI per trasformare video, audio, URL e contenuti in blog post SEO-ready.",
    longDescription:
      "Blogify aiuta a riproporre contenuti già esistenti in articoli ottimizzati, riducendo il tempo tra video, audio o link e pubblicazione sul blog.",
    whyItMatters:
      "È utile quando hai asset ma manca il tempo per trasformarli in contenuti evergreen.",
    externalUrl: "https://blogify.ai?fpr=n2ogi",
    originalSourceUrl: "https://tooolvibes.com/all-tools/blogify_1",
    featured: false,
    tags: ["blogging", "content repurposing", "seo", "audio", "video"],
    ctaLabel: "Prova Blogify",
    publishedAt: "2026-01-24",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Trasformare video in blog post",
      "Riproporre contenuti audio in articoli",
      "Aumentare output SEO da asset esistenti",
    ],
    highlights: ["Blog", "Riuso contenuti", "SEO"],
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
      "Software live chat per supporto clienti, vendite e conversazioni realtime.",
    longDescription:
      "LiveChat porta conversazioni realtime su siti e prodotti digitali, con strumenti per supporto, vendita e gestione team.",
    whyItMatters:
      "Quando il traffico cresce, una live chat solida può aumentare conversione e qualità del supporto.",
    externalUrl: "https://www.livechat.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/livechat_1",
    featured: false,
    tags: ["live chat", "support", "sales", "customer service", "realtime"],
    ctaLabel: "Prova LiveChat",
    publishedAt: "2026-01-25",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Gestire chat realtime su sito",
      "Supportare utenti e clienti",
      "Convertire lead durante la navigazione",
    ],
    highlights: ["Chat", "Supporto", "Vendite"],
    accentFrom: "#2563eb",
    accentTo: "#22c55e",
  }),
  defineTool({
    id: "chatbot",
    name: "ChatBot",
    slug: "chatbot",
    category: "AI Chatbot",
    categoryLabel: "Chatbot AI / supporto clienti",
    level: "intermediate",
    segments: ["customer-support", "ai-agents", "automation"],
    shortDescription:
      "Piattaforma per creare chatbot AI di supporto, vendita e automazione conversazionale.",
    longDescription:
      "ChatBot permette di creare assistenti conversazionali per FAQ, vendita, routing e automazioni senza dover costruire ogni flusso da zero.",
    whyItMatters:
      "È una scorciatoia concreta per automatizzare conversazioni frequenti senza perdere controllo sull'esperienza.",
    externalUrl: "https://www.chatbot.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/chatbot_1",
    featured: false,
    tags: ["chatbot", "ai support", "automation", "sales", "faq"],
    ctaLabel: "Prova ChatBot",
    publishedAt: "2026-01-26",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Automatizzare FAQ e supporto iniziale",
      "Qualificare lead tramite conversazione",
      "Collegare chatbot a flussi operativi",
    ],
    highlights: ["Chatbot", "Automazioni", "AI"],
    accentFrom: "#4f46e5",
    accentTo: "#06b6d4",
  }),
  defineTool({
    id: "helpdesk",
    name: "HelpDesk",
    slug: "helpdesk",
    category: "Supporto clienti",
    categoryLabel: "Supporto clienti / ticket",
    level: "intermediate",
    segments: ["customer-support", "automation"],
    shortDescription:
      "Ticketing system per gestire comunicazioni clienti, automazioni e supporto team.",
    longDescription:
      "HelpDesk organizza richieste clienti, ticket, priorità e automazioni per dare struttura al supporto quando email e chat non bastano più.",
    whyItMatters:
      "Aiuta a non perdere conversazioni importanti e rende il supporto più misurabile.",
    externalUrl: "https://www.helpdesk.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/helpdesk_1",
    featured: false,
    tags: ["helpdesk", "ticketing", "support", "automation", "team"],
    ctaLabel: "Prova HelpDesk",
    publishedAt: "2026-01-27",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Gestire ticket clienti",
      "Automatizzare priorità e assegnazioni",
      "Tenere traccia di SLA e conversazioni",
    ],
    highlights: ["Ticket", "Supporto", "SLA"],
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
      "AI website builder che crea, modifica e pubblica siti tramite conversazione.",
    longDescription:
      "Wegic porta la creazione di siti in una logica conversazionale: descrivi cosa vuoi, iteri con l'assistente e pubblichi un risultato pronto.",
    whyItMatters:
      "È adatto a chi vuole un sito credibile rapidamente senza perdersi nei dettagli del builder.",
    externalUrl: "https://wegic.ai/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/wegic_1",
    featured: false,
    tags: ["website builder", "ai site", "conversation", "no-code", "publish"],
    ctaLabel: "Prova Wegic",
    publishedAt: "2026-01-28",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Creare siti tramite chat",
      "Iterare copy e layout velocemente",
      "Pubblicare una presenza online in poco tempo",
    ],
    highlights: ["Sito", "Chat", "Pubblicazione"],
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
      "AI video ad generator per trasformare URL, immagini e testi in video ads pronti.",
    longDescription:
      "Vidau aiuta a creare video ads partendo da URL, immagini e testi, con un flusso pensato per campagne, ecommerce e creatività performance.",
    whyItMatters:
      "Riduce il tempo tra idea creativa e prima variante video testabile.",
    externalUrl: "https://www.vidau.ai/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/vidau_1",
    featured: false,
    tags: ["video ads", "ai video", "marketing", "ecommerce", "creative"],
    ctaLabel: "Prova VidAU",
    publishedAt: "2026-01-29",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Creare video ads da URL prodotto",
      "Testare varianti creative velocemente",
      "Produrre asset video per ecommerce",
    ],
    highlights: ["Annunci", "Video", "Creatività"],
    accentFrom: "#db2777",
    accentTo: "#7c3aed",
  }),
  defineTool({
    id: "lemon-squeezy",
    name: "Lemon Squeezy",
    slug: "lemon-squeezy",
    category: "Pagamenti",
    categoryLabel: "Pagamenti / Merchant of Record",
    level: "intermediate",
    segments: ["payments"],
    shortDescription:
      "Piattaforma per pagamenti SaaS, abbonamenti, tax compliance e Merchant of Record.",
    longDescription:
      "Lemon Squeezy gestisce pagamenti, abbonamenti, tasse e Merchant of Record, alleggerendo la complessità commerciale per prodotti digitali e SaaS.",
    whyItMatters:
      "È utile quando vuoi vendere software o prodotti digitali senza costruire subito tutta la gestione fiscale e dei pagamenti.",
    externalUrl: "https://www.lemonsqueezy.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/lemon-squeezy_1",
    featured: false,
    tags: ["payments", "saas", "merchant of record", "subscriptions", "tax"],
    ctaLabel: "Prova Lemon Squeezy",
    publishedAt: "2026-01-30",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Vendere prodotti digitali",
      "Gestire abbonamenti SaaS",
      "Demandare tax compliance e billing",
    ],
    highlights: ["Pagamenti", "MoR", "SaaS"],
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
      "Tool AI per trasformare screen recording in video demo/tutorial professionali.",
    longDescription:
      "VibrantSnap prende screen recording e li trasforma in demo o tutorial più rifiniti, con un output più adatto a prodotto, onboarding e marketing.",
    whyItMatters:
      "Per SaaS e creator, migliora la qualità percepita delle demo senza montaggi lunghi.",
    externalUrl: "https://www.vibrantsnap.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/vibrantsnap_1",
    featured: false,
    tags: ["product demo", "screen recording", "ai video", "tutorial", "saas"],
    ctaLabel: "Prova VibrantSnap",
    publishedAt: "2026-01-31",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Trasformare registrazioni schermo in demo",
      "Creare tutorial prodotto più curati",
      "Migliorare video per onboarding e marketing",
    ],
    highlights: ["Demo", "Schermo", "Tutorial"],
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
      "Tool AI per creare contenuti LinkedIn, personal branding e crescita professionale.",
    longDescription:
      "ReachifyMe supporta la creazione di contenuti LinkedIn e personal branding con idee, testi e ritmo editoriale più sostenibile.",
    whyItMatters:
      "È utile quando LinkedIn è un canale di crescita ma manca una routine di contenuti chiara.",
    externalUrl: "https://reachifyme.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/reachifyme_1",
    featured: false,
    tags: ["linkedin", "personal branding", "ai writing", "content", "growth"],
    ctaLabel: "Prova ReachifyMe",
    publishedAt: "2026-02-01",
    readingTime: "3 min",
    sourceSite: "weblium",
    useCases: [
      "Creare post LinkedIn con più continuità",
      "Costruire personal branding",
      "Trasformare idee in contenuti pubblicabili",
    ],
    highlights: ["LinkedIn", "Contenuti", "Brand"],
    accentFrom: "#2563eb",
    accentTo: "#8b5cf6",
  }),
  defineTool({
    id: "make",
    name: "Make",
    slug: "make",
    category: "Automazioni",
    categoryLabel: "Automazioni / builder flussi",
    level: "expert",
    segments: ["automation", "no-code"],
    shortDescription:
      "Piattaforma visuale per creare automazioni, flussi e integrazioni tra app e API.",
    longDescription:
      "Make permette di progettare automazioni visuali tra app, API e dati, con una potenza superiore ai flussi semplici quando serve orchestrare processi reali.",
    whyItMatters:
      "È uno dei pilastri no-code per automatizzare operazioni, marketing, dati e processi interni.",
    externalUrl: "https://www.make.com/en/register?pc=imaketoool",
    originalSourceUrl: "https://tooolvibes.com/all-tools/makecom_1",
    featured: false,
    tags: ["automazioni", "flussi", "integrazioni", "api", "no-code"],
    ctaLabel: "Prova Make",
    publishedAt: "2026-02-02",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Automatizzare flussi tra strumenti",
      "Collegare app, API e database",
      "Costruire processi operativi scalabili",
    ],
    highlights: ["Flussi", "API", "Automazioni"],
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
      "Wearable AI open-source che registra, trascrive, ricorda e trasforma conversazioni in azioni.",
    longDescription:
      "Omi porta l'AI personale su un dispositivo wearable, con trascrizione, memoria e azioni generate dalle conversazioni quotidiane.",
    whyItMatters:
      "È interessante per chi vuole sperimentare personal AI e memoria aumentata oltre la classica app web.",
    externalUrl: "https://www.omi.me/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/omi-app-ai",
    featured: false,
    tags: ["wearable", "personal ai", "transcription", "memory", "open-source"],
    ctaLabel: "Prova Omi",
    publishedAt: "2026-02-03",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Trascrivere conversazioni importanti",
      "Creare memoria personale consultabile",
      "Trasformare meeting e dialoghi in azioni",
    ],
    highlights: ["Wearable", "Memoria", "Assistente personale"],
    accentFrom: "#111827",
    accentTo: "#06b6d4",
  }),
  defineTool({
    id: "flowise",
    name: "Flowise",
    slug: "flowise",
    category: "Agenti AI",
    categoryLabel: "Agenti AI / LangChain / flussi AI",
    level: "expert",
    segments: ["ai-agents", "automation"],
    shortDescription:
      "Builder visuale open-source per creare agenti AI, RAG, chat e flussi LangChain.",
    longDescription:
      "Flowise è un builder visuale per creare flussi AI, agenti e RAG basati su LangChain con maggiore controllo tecnico.",
    whyItMatters:
      "È una scelta forte per chi vuole costruire automazioni AI serie senza scrivere tutto da zero.",
    externalUrl: "https://flowiseai.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/flowise-ai_1",
    featured: false,
    tags: ["agenti ai", "langchain", "rag", "open-source", "flussi ai"],
    ctaLabel: "Prova Flowise",
    publishedAt: "2026-02-04",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Creare chatflow e agenti AI",
      "Prototipare flussi RAG",
      "Costruire automazioni AI più controllabili",
    ],
    highlights: ["Agenti", "RAG", "LangChain"],
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
      "Software affiliate/referral per startup SaaS, integrabile con Stripe, Paddle e Chargebee.",
    longDescription:
      "Tolt aiuta startup SaaS a creare programmi affiliate e referral, collegandosi a sistemi di pagamento e tracciando partner, commissioni e performance.",
    whyItMatters:
      "È utile quando vuoi trasformare utenti, creator o partner in un canale di crescita misurabile.",
    externalUrl: "https://tolt.com/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/tolt_1",
    featured: false,
    tags: ["affiliate", "referral", "saas", "stripe", "paddle"],
    ctaLabel: "Prova Tolt",
    publishedAt: "2026-02-05",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Lanciare un programma affiliate SaaS",
      "Tracciare partner e commissioni",
      "Collegare referral a billing e pagamenti",
    ],
    highlights: ["Affiliazioni", "Referral", "SaaS"],
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
      "Piattaforma no-code e multi-agent per creare agenti AI specializzati e flussi business.",
    longDescription:
      "AgentX permette di creare agenti AI specializzati e flussi multi-agent senza partire da una struttura tecnica complessa.",
    whyItMatters:
      "È rilevante per chi vuole portare agenti AI dentro processi business senza un setup troppo pesante.",
    externalUrl: "https://www.agentx.so/",
    originalSourceUrl: "https://tooolvibes.com/all-tools/agentx_1",
    featured: false,
    tags: ["agenti ai", "no-code", "multi-agent", "flussi business", "automazioni"],
    ctaLabel: "Prova AgentX",
    publishedAt: "2026-02-06",
    readingTime: "4 min",
    sourceSite: "weblium",
    useCases: [
      "Creare agenti AI specializzati",
      "Automatizzare processi business",
      "Prototipare flussi multi-agent",
    ],
    highlights: ["Agenti", "No-code", "Flussi"],
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
