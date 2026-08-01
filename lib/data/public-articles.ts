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

type GuideSeed = Omit<EditorialPostRecord, "tool_slug" | "updated_at" | "kind"> & {
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
    title: "BetterPic",
    dek: "Headshot AI credibili in meno di un'ora, senza studio fotografico.",
    summary:
      "BetterPic trasforma selfie casuali in ritratti professionali rapidi e convenienti, pronti per LinkedIn, curriculum e press kit.",
    kind: "guide",
    published_at: "2025-07-14",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/betterpic_1",
    featured: true,
    highlights: [
      "4K headshots in meno di un'ora",
      "Molto più economico di uno shooting tradizionale",
      "Ottimo quando il personal brand deve sembrare subito curato",
    ],
    details: [
      "Funziona bene con 15-25 selfie diversi e ben esposti",
      "Include preset di stile e ritocchi umani opzionali",
      "Si presta a LinkedIn, CV e press kit senza flussi lunghi",
    ],
    cautions: [
      "Richiede un set di foto vario per restare credibile",
      "I ritocchi opzionali possono cambiare il costo finale",
    ],
  },
  {
    slug: "frase-ai",
    title: "Frase AI",
    dek: "Brief SEO, drafting e ottimizzazione nello stesso flusso.",
    summary:
      "Frase unisce analisi SERP, brief contenuti e scrittura assistita per team che devono produrre contenuti utili e ben posizionati.",
    kind: "guide",
    published_at: "2025-07-14",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/frase-ai_1",
    featured: true,
    highlights: [
      "Brief SEO guidati dai risultati SERP",
      "Scrittura e ottimizzazione nello stesso spazio",
      "Buon fit per content team, agenzie e in-house",
    ],
    details: [
      "Integra WordPress, Google Docs e strumenti per la voce del brand",
      "Aggiunge punteggio dei topic e analisi dei gap contenuti",
      "Si chiude bene con un flusso editoriale già disciplinato",
    ],
    cautions: [
      "Rende meglio se il processo contenuti è già chiaro",
      "Il prezzo cresce quando il lavoro coinvolge tutto il team",
    ],
  },
  {
    slug: "jenny-ai",
    title: "Jenni AI",
    dek: "Spazio di scrittura accademica con citazioni, note e controllo.",
    summary:
      "Jenni aiuta studenti e ricercatori a scrivere più velocemente, citare con precisione e tenere insieme fonti, PDF e revisioni.",
    kind: "guide",
    published_at: "2025-07-16",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/jenny-ai_2",
    featured: true,
    highlights: [
      "Autocomplete per sbloccare la bozza",
      "Citazioni in migliaia di stili",
      "PDF, note e controllo antiplagio nello stesso flusso",
    ],
    details: [
      "Adatto a paper, ricerche e contenuti specialistici",
      "Sincronizza documenti e appunti su più dispositivi",
      "Lavora bene quando DOI e fonti sono già ordinati",
    ],
    cautions: [
      "Richiede controllo umano sul testo finale",
      "Funziona meglio in un flusso di ricerca serio, non improvvisato",
    ],
  },
  {
    slug: "reclaim-ai",
    title: "Reclaim AI",
    dek: "Pianificazione intelligente che protegge concentrazione, task e routine.",
    summary:
      "Reclaim si innesta su Google e Outlook per difendere il tempo di lavoro profondo e alleggerire il calendario di team e singoli.",
    kind: "guide",
    published_at: "2025-07-17",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/reclaim-ai_1",
    featured: true,
    highlights: [
      "Blocca tempo di concentrazione e abitudini automatiche",
      "Si collega a Google, Outlook e agli strumenti per le attività",
      "Riduce il burnout senza cambiare calendario",
    ],
    details: [
      "Sincronizza Asana, Jira, Todoist, ClickUp e Linear",
      "Supporta margini tra riunioni, pause e pianificazione intelligente",
      "Ha senso quando la giornata è già piena e va difesa",
    ],
    cautions: [
      "Funziona meglio se il calendario di partenza è leggibile",
      "Richiede abitudine alla pianificazione e ai blocchi di tempo",
    ],
  },
  {
    slug: "windsor-ai",
    title: "Windsor AI",
    dek: "Connettori, dati e attribuzione per leggere meglio il ROI.",
    summary:
      "Windsor unifica fonti marketing, CRM e analytics per dare a growth team e BI una vista più affidabile della spesa e dei ritorni.",
    kind: "guide",
    published_at: "2025-07-16",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/windsor-ai_2",
    featured: true,
    highlights: [
      "Oltre 300 connettori inclusi nel piano",
      "Prezzi senza costi nascosti per singola sorgente",
      "Attribuzione multi-touch nello stesso spazio dati",
    ],
    details: [
      "Porta i dati in Sheets, BigQuery, Snowflake o Looker Studio",
      "Refresh automatici e onboarding no-code",
      "Ha più senso quando i sistemi sono già numerosi e frammentati",
    ],
    cautions: [
      "Meno utile se hai una sola fonte e un solo problema",
      "Conviene solo quando la lettura del ROI è davvero il collo di bottiglia",
    ],
  },
  {
    slug: "reachifyme",
    title: "ReachifyMe",
    dek: "Content engine per LinkedIn con drafting, hook e scheduling.",
    summary:
      "ReachifyMe aiuta professionisti e creator a trasformare idee sparse in post LinkedIn pubblicabili, con un flusso rapido e orientato alla reach.",
    kind: "guide",
    published_at: "2025-07-16",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/reachifyme",
    featured: false,
    highlights: [
      "Idea, post e schedule nello stesso tab",
      "Molto forte su LinkedIn-first personal branding",
      "Caroselli, hook e formatting integrati",
    ],
    details: [
      "Real-time tips per mantenere il tono coerente",
      "Input rapido via WhatsApp o email",
      "Utile quando la produzione social è il vero lavoro",
    ],
    cautions: [
      "È davvero focalizzato su LinkedIn",
      "Rende meno se il posizionamento personale non è chiaro",
    ],
  },
  {
    slug: "flowise-ai",
    title: "Flowise AI",
    dek: "Canvas visuale per agenti AI, flussi RAG e orchestrazione.",
    summary:
      "Flowise permette a team tecnici di costruire agenti e pipeline senza scrivere tutto da zero, ma restando vicini al controllo operativo.",
    kind: "guide",
    published_at: "2025-07-16",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/flowise-ai_1",
    featured: false,
    highlights: [
      "Assistant, Chatflow e Agentflow nello stesso canvas",
      "Tracing, evals e human-in-the-loop integrati",
      "Buon ponte tra prototipo e produzione",
    ],
    details: [
      "Connettori e loader per modelli, vector DB e API",
      "SDK, CLI e API per portarlo nel CI",
      "Utile quando il problema è orchestrare, non solo conversare",
    ],
    cautions: [
      "Richiede una certa maturità tecnica",
      "Ha più senso se devi davvero orchestrare AI systems",
    ],
  },
  {
    slug: "lemon-squeezy",
    title: "Lemon Squeezy",
    dek: "Merchant of record per SaaS, tasse e billing internazionale.",
    summary:
      "Lemon Squeezy alleggerisce vendite, imposte e abbonamenti per founder e team digitali che vogliono evitare un sistema fai-da-te.",
    kind: "guide",
    published_at: "2025-07-16",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/lemon-squeezy_2",
    featured: false,
    highlights: [
      "Gestisce pagamenti, tasse e compliance",
      "License key, dunning e subscription dentro lo stesso flusso",
      "Prezzo trasparente per transazione",
    ],
    details: [
      "Supporta multi-currency e PayPal",
      "Riduce la complessità operativa del billing",
      "Ha senso quando vendi software o asset digitali",
    ],
    cautions: [
      "Le commissioni vanno considerate nel margine reale",
      "Conviene se il prodotto è davvero vendibile via checkout",
    ],
  },
  {
    slug: "agentxai",
    title: "AgentX",
    dek: "Builder no-code per agenti, raccolta lead e flussi autonomi.",
    summary:
      "AgentX permette di mettere in piedi chatbot e agenti di vendita o supporto con un setup rapido e una logica molto orientata all'azione.",
    kind: "guide",
    published_at: "2025-07-08",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/agentxai",
    featured: false,
    highlights: [
      "Setup in pochi minuti",
      "Tool calling e azioni autonome",
      "Pensato per conversioni e flussi reali",
    ],
    details: [
      "Supporta multi-LLM e integrazioni esterne",
      "Buon fit per sales rep virtuali o assistenti operativi",
      "Meglio quando il caso d'uso è molto definito",
    ],
    cautions: [
      "Non sostituisce un processo commerciale confuso",
      "Rende più quando il perimetro è stretto",
    ],
  },
  {
    slug: "omi-app-ai",
    title: "Omi App AI",
    dek: "Wearable open-source che registra, ricorda e rielabora contesto.",
    summary:
      "Omi porta la memoria AI fuori dallo schermo: ascolta, trascrive e trasforma conversazioni in azioni e promemoria.",
    kind: "guide",
    published_at: "2025-07-16",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/omi-app-ai",
    featured: false,
    highlights: [
      "Memoria sempre attiva",
      "Marketplace di app open-source",
      "Hardware one-time, senza subscription",
    ],
    details: [
      "Trascrive e riassume conversazioni scelte dall'utente",
      "L'ecosistema si estende con app community-built",
      "Ha senso quando il wearable diventa una vera abitudine",
    ],
    cautions: [
      "Richiede fiducia nel form factor e nella privacy",
      "Il valore dipende molto da come lo usi ogni giorno",
    ],
  },
  {
    slug: "wegic",
    title: "Wegic",
    dek: "Website team AI per lanciare siti in tempi molto rapidi.",
    summary:
      "Wegic combina design, code e growth in una superficie conversazionale che punta a portarti online in pochi minuti.",
    kind: "guide",
    published_at: "2025-07-16",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/wegic_1",
    featured: true,
    highlights: [
      "Design, code e growth nello stesso flusso",
      "Publish mobile-ready molto rapido",
      "Form e payments già integrati",
    ],
    details: [
      "Buon fit per landing e siti snelli",
      "Autopilot per ottimizzazioni continue",
      "Riduce parecchio la curva di apprendimento",
    ],
    cautions: [
      "Meno adatto a prodotti con logica complessa",
      "La personalizzazione profonda resta limitata",
    ],
  },
  {
    slug: "tolt",
    title: "Tolt",
    dek: "Affiliate program launcher per SaaS con commissioni zero.",
    summary:
      "Tolt semplifica il lancio di un programma affiliate con portal white-label, payout automatici e integrazione rapida con i principali billing system.",
    kind: "guide",
    published_at: "2025-07-15",
    source_label: "Guida TooolVibes",
    source_url: "https://tooolvibes.com/all-tools/tolt",
    featured: false,
    highlights: [
      "Setup veloce con Stripe, Paddle o Chargebee",
      "Commissioni zero e auto payout",
      "Portal white-label sul tuo dominio",
    ],
    details: [
      "Tracking referral end-to-end",
      "Payout via PayPal o Wise",
      "Buon fit quando l'affiliate diventa un canale GTM reale",
    ],
    cautions: [
      "Ha senso solo se hai davvero un programma partner",
      "Rende meglio quando la revenue motion è già chiara",
    ],
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
  const toolWriteups = tools
    .map(buildToolWriteup)
    .filter((post): post is EditorialPostRecord => Boolean(post));

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
