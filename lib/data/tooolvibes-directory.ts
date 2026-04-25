export type DirectoryFilterGroup =
  | "all"
  | "vibe-coding"
  | "ai-app-builder"
  | "no-code"
  | "headless-cms"
  | "ui-builder";

export type DirectoryTool = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryLabel: string;
  segments: DirectoryFilterGroup[];
  description: string;
  longDescription: string;
  whyItMatters: string;
  url: string;
  originalArticleUrl: string;
  featured: boolean;
  toolOfWeek?: boolean;
  tags: string[];
  ctaLabel: string;
  publishedAt: string;
  readingTime: string;
  domain: string;
  useCases: string[];
  highlights: string[];
  accentFrom: string;
  accentTo: string;
};

export const directoryFilterGroups: { key: DirectoryFilterGroup; label: string }[] = [
  { key: "all", label: "Tutti" },
  { key: "vibe-coding", label: "Vibe Coding" },
  { key: "ai-app-builder", label: "AI App Builder" },
  { key: "no-code", label: "No-Code" },
  { key: "headless-cms", label: "Headless CMS" },
  { key: "ui-builder", label: "UI Builder" },
];

export const directoryTools: DirectoryTool[] = [
  {
    id: "blink",
    name: "Blink",
    slug: "blink",
    category: "Vibe Coding",
    categoryLabel: "Vibe Coding / AI App Builder",
    segments: ["vibe-coding", "ai-app-builder"],
    description:
      "L'AI app builder che trasforma un'idea in un'app o web app funzionante in pochi minuti.",
    longDescription:
      "Blink \u00E8 pensato per chi vuole passare da prompt a interfaccia, logica e prima esperienza prodotto senza aprire subito un ciclo di sviluppo pesante. \u00C8 uno di quei tool che accorciano davvero il tempo tra intuizione, prototipo e primo test con utenti o team.",
    whyItMatters:
      "Se vuoi validare un'idea in fretta con una resa credibile, Blink \u00E8 il profilo pi\u00F9 diretto da aprire per primo.",
    url: "https://blink.new/?aff=toool",
    originalArticleUrl: "https://www.tooolvibes.com/p/blink-new",
    featured: true,
    toolOfWeek: true,
    tags: ["vibe coding", "ai app builder", "prompt-to-app", "web app", "prototype"],
    ctaLabel: "Prova Blink",
    publishedAt: "2026-02-05",
    readingTime: "2 min di lettura",
    domain: "blink.new",
    useCases: [
      "Validare un MVP in ore invece che in settimane",
      "Costruire una web app da prompt per un test rapido",
      "Mostrare un concept navigabile a clienti o investitori",
    ],
    highlights: ["Prompt-to-app veloce", "Output subito navigabili", "Ottimo per test e MVP"],
    accentFrom: "#6d3bff",
    accentTo: "#43c6ff",
  },
  {
    id: "vibecode",
    name: "VibeCode",
    slug: "vibecode",
    category: "AI App Builder",
    categoryLabel: "Vibe Coding / AI App Builder",
    segments: ["vibe-coding", "ai-app-builder"],
    description:
      "Builder AI per creare app da prompt, iterare rapidamente e pubblicare progetti mobile e web.",
    longDescription:
      "VibeCode spinge forte sulla velocit\u00E0 di iterazione. \u00C8 adatto quando vuoi generare una prima base applicativa, rifinirla velocemente e capire se il prodotto ha abbastanza sostanza per il passaggio successivo. Ha un taglio molto allineato ai team piccoli che ragionano per sprint rapidi.",
    whyItMatters:
      "\u00C8 uno dei builder da considerare quando la priorit\u00E0 \u00E8 testare, iterare e pubblicare velocemente.",
    url: "https://www.vibecodeapp.com/sign-up?code=ref-39fsyj6mgbtp",
    originalArticleUrl: "https://www.tooolvibes.com/p/vibecode",
    featured: true,
    tags: ["vibe coding", "ai app builder", "mobile app", "iteration", "deploy"],
    ctaLabel: "Prova VibeCode",
    publishedAt: "2026-02-05",
    readingTime: "3 min di lettura",
    domain: "www.vibecodeapp.com",
    useCases: [
      "Iterare una app mobile o web da prompt",
      "Accelerare il passaggio da idea a demo pubblicabile",
      "Ridurre il tempo tra concept e feedback reale",
    ],
    highlights: ["Iterazione rapida", "Focus mobile e web", "Buon ritmo per sprint brevi"],
    accentFrom: "#5b34ff",
    accentTo: "#9f5bff",
  },
  {
    id: "weweb",
    name: "WeWeb",
    slug: "weweb",
    category: "No-Code",
    categoryLabel: "No-Code / Web App Builder",
    segments: ["no-code", "ai-app-builder"],
    description:
      "Piattaforma AI/no-code per costruire web app production-grade con editor visuale e integrazioni backend.",
    longDescription:
      "WeWeb ha un profilo pi\u00F9 maturo e strutturato rispetto ai builder prompt-first pi\u00F9 leggeri. \u00C8 utile quando vuoi restare veloce, ma senza rinunciare a controllo sul front-end, integrazioni e tenuta del progetto nel tempo. Per molti team \u00E8 il passaggio naturale tra prototipo e prodotto pi\u00F9 serio.",
    whyItMatters:
      "Quando il progetto deve restare no-code ma sembrare gi\u00E0 pronto per andare in produzione, WeWeb merita attenzione vera.",
    url: "https://dashboard.weweb.io/sign-up/e97a27ca-e319-49f0-a2b7-ea042d3c6b36",
    originalArticleUrl: "https://www.tooolvibes.com/p/blink-61f26b689a7da189",
    featured: true,
    tags: ["no-code", "web app builder", "frontend", "backend integrations", "production"],
    ctaLabel: "Prova WeWeb",
    publishedAt: "2026-02-05",
    readingTime: "3 min di lettura",
    domain: "www.weweb.io",
    useCases: [
      "Costruire una web app senza ripartire da zero",
      "Collegare frontend visuale e backend esterni",
      "Portare un progetto no-code a uno standard pi\u00F9 serio",
    ],
    highlights: ["Editor visuale solido", "Integrazioni backend", "Buon fit per progetti reali"],
    accentFrom: "#2c5cff",
    accentTo: "#43c6ff",
  },
  {
    id: "cosmicjs",
    name: "CosmicJS",
    slug: "cosmicjs",
    category: "Headless CMS",
    categoryLabel: "Headless CMS / AI Workflow",
    segments: ["headless-cms", "no-code"],
    description:
      "Headless CMS con AI, API, workflow e strumenti per accelerare progetti content-driven e web app.",
    longDescription:
      "CosmicJS \u00E8 interessante quando contenuti, struttura e API contano quanto la UI. Ti aiuta a organizzare modelli, workflow editoriali e delivery dei dati in modo pi\u00F9 pulito. \u00C8 una scelta sensata se vuoi dare ordine a progetti content-driven, directory o siti con molta logica editoriale.",
    whyItMatters:
      "Non \u00E8 solo un CMS: \u00E8 un buon centro operativo quando contenuti e struttura devono restare gestibili nel tempo.",
    url: "https://app.cosmicjs.com/signup?ref=TOOOLVIBES",
    originalArticleUrl: "https://www.tooolvibes.com/p/cosmicjs",
    featured: true,
    tags: ["headless cms", "api", "content workflow", "directory", "ai workflow"],
    ctaLabel: "Prova CosmicJS",
    publishedAt: "2026-02-05",
    readingTime: "3 min di lettura",
    domain: "www.cosmicjs.com",
    useCases: [
      "Gestire contenuti strutturati via API",
      "Dare ordine a progetti editoriali o directory",
      "Velocizzare workflow tra contenuti, team e frontend",
    ],
    highlights: ["API-first", "Workflow puliti", "Molto utile per progetti content-driven"],
    accentFrom: "#6f3cff",
    accentTo: "#ffb14a",
  },
  {
    id: "mocha",
    name: "Mocha",
    slug: "mocha",
    category: "AI App Builder",
    categoryLabel: "AI App Builder / No-Code",
    segments: ["ai-app-builder", "no-code"],
    description:
      "AI no-code app builder full-stack con backend, database, autenticazione, hosting e deploy integrati.",
    longDescription:
      "Mocha si posiziona bene quando vuoi un builder che non si fermi alla UI. Backend, database, auth e deploy fanno parte della promessa, e questo lo rende molto interessante per chi cerca una soluzione compatta per costruire e pubblicare senza cucire troppi pezzi separati.",
    whyItMatters:
      "\u00C8 un builder da valutare quando vuoi pi\u00F9 stack integrato e meno frizione operativa tra idea e rilascio.",
    url: "https://getmocha.com/?via=toool",
    originalArticleUrl: "https://www.tooolvibes.com/p/mocha",
    featured: false,
    tags: ["ai app builder", "no-code", "full-stack", "database", "deploy"],
    ctaLabel: "Prova Mocha",
    publishedAt: "2026-02-05",
    readingTime: "3 min di lettura",
    domain: "getmocha.com",
    useCases: [
      "Costruire una app con backend e auth inclusi",
      "Ridurre i passaggi tra build, data layer e deploy",
      "Lanciare velocemente un prodotto no-code pi\u00F9 completo",
    ],
    highlights: ["Stack integrato", "Backend incluso", "Deploy pi\u00F9 lineare"],
    accentFrom: "#8a3cff",
    accentTo: "#ff6eb3",
  },
  {
    id: "v0",
    name: "v0",
    slug: "v0",
    category: "UI Builder",
    categoryLabel: "AI Coding / UI Builder",
    segments: ["ui-builder", "ai-app-builder"],
    description:
      "AI builder di Vercel per creare interfacce, app, componenti e progetti pronti al deploy.",
    longDescription:
      "v0 \u00E8 fortissimo quando la partita si gioca su UI, componenti e velocit\u00E0 di esecuzione front-end. \u00C8 uno strumento da tenere vicino se vuoi prototipare interfacce credibili, esplorare direzioni visive e portare il codice in un flusso moderno vicino all'ecosistema Vercel.",
    whyItMatters:
      "Per UI, componenti e frontend veloci da validare, v0 resta uno dei riferimenti pi\u00F9 chiari del panorama AI builder.",
    url: "https://v0.app/",
    originalArticleUrl: "https://www.tooolvibes.com/p/v0",
    featured: false,
    tags: ["ui builder", "ai coding", "components", "frontend", "vercel"],
    ctaLabel: "Prova v0",
    publishedAt: "2026-02-05",
    readingTime: "3 min di lettura",
    domain: "v0.app",
    useCases: [
      "Generare UI e componenti da prompt",
      "Accelerare il lavoro su prototipi frontend",
      "Passare da idea visuale a codice pi\u00F9 in fretta",
    ],
    highlights: ["Molto forte sulla UI", "Perfetto per componenti", "Vicino al deploy"],
    accentFrom: "#3d4357",
    accentTo: "#6d3bff",
  },
  {
    id: "meku",
    name: "Meku",
    slug: "meku",
    category: "Vibe Coding",
    categoryLabel: "AI Site Builder / Vibe Coding",
    segments: ["vibe-coding", "ai-app-builder"],
    description:
      "AI web app e site builder per generare progetti React/Tailwind, iterare, esportare e pubblicare.",
    longDescription:
      "Meku \u00E8 interessante per chi vuole restare nel mondo React/Tailwind ma partire da una spinta AI pi\u00F9 concreta. Il valore sta nel riuscire a generare una base moderna, iterarla con velocit\u00E0 e poi riprendere il controllo del progetto senza dover ripartire da zero.",
    whyItMatters:
      "\u00C8 il tipo di builder che piace a chi vuole accelerare senza perdere del tutto il filo del codice e della struttura.",
    url: "https://meku.dev/?aff=YFlSqMxPUaEb",
    originalArticleUrl: "https://www.tooolvibes.com/p/meku",
    featured: false,
    tags: ["vibe coding", "react", "tailwind", "site builder", "export"],
    ctaLabel: "Prova Meku",
    publishedAt: "2026-02-05",
    readingTime: "3 min di lettura",
    domain: "meku.dev",
    useCases: [
      "Generare basi React/Tailwind da cui partire",
      "Costruire siti o web app con iterazione veloce",
      "Esportare e continuare un progetto fuori dal builder",
    ],
    highlights: ["React/Tailwind native", "Buona flessibilit\u00E0", "Molto interessante per builder ibridi"],
    accentFrom: "#11b8d8",
    accentTo: "#5b34ff",
  },
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
  return directoryTools.filter((tool) => tool.featured).slice(0, limit);
}

export function getDirectoryTags() {
  return directoryTools.reduce<Record<string, number>>((accumulator, tool) => {
    tool.tags.forEach((tag) => {
      accumulator[tag] = (accumulator[tag] ?? 0) + 1;
    });

    return accumulator;
  }, {});
}

export function getRelatedDirectoryTools(tool: DirectoryTool, limit = 3) {
  return directoryTools
    .filter((item) => item.slug !== tool.slug)
    .map((item) => {
      const sharedSegments = item.segments.filter((segment) =>
        tool.segments.includes(segment),
      ).length;
      const sharedTags = item.tags.filter((tag) => tool.tags.includes(tag)).length;

      return {
        tool: item,
        score: sharedSegments * 3 + sharedTags * 2 + Number(item.featured),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.tool);
}
