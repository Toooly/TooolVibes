import type { CuratedCollectionRecord } from "@/lib/types/collection";

// V1 public collection source. These records are intentionally independent from
// the legacy mock fixtures so a deployed build stays deterministic.
export const contentCollections: CuratedCollectionRecord[] = [
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
    source_kind: "content",
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
      "Qui conta la qualità della lettura più della quantità dei tool. La raccolta è costruita per esplorare, convergere e arrivare a una superficie presentabile senza perdere coerenza di tono.",
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
    source_kind: "content",
  },
  {
    id: "collection-03",
    title: "Kit creator per video e voce",
    slug: "creator-video-stack",
    description:
      "Una selezione per chi lavora su video, audio e contenuti visuali con bisogno di velocità, resa e flussi leggibili.",
    cover_image_url:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Percorso creator",
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
    source_kind: "content",
  },
];
