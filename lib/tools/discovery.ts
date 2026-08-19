import type {
  SaveReason,
  ShortlistStage,
  ToolCategory,
  ToolDecisionMemory,
  ToolEditorialState,
  ToolPricing,
  ToolRecord,
} from "@/lib/types/tool";

export type ToolSortKey = "recent" | "featured" | "name" | "updated";
export type ToolTaskKey =
  | "all"
  | "writing"
  | "prototyping"
  | "video-content"
  | "research"
  | "automation"
  | "design-landing"
  | "productivity"
  | "founder-stack";

export type ToolFilterState = {
  query?: string;
  category?: ToolCategory | "all";
  tag?: string | null;
  savedOnly?: boolean;
  shortlist?: string[];
  task?: ToolTaskKey;
  shortcut?: "all" | "new" | "featured" | "watch" | "developer" | "design" | "assistant";
};

const stageRank: Record<ShortlistStage, number> = {
  top: 0,
  review: 1,
  saved: 2,
};

const saveReasonMeta: Record<
  SaveReason,
  { label: string; tone: string; background: string }
> = {
  test: {
    label: "Da testare",
    tone: "var(--accent-strong)",
    background: "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))",
  },
  compare: {
    label: "Da confrontare",
    tone: "var(--muted-strong)",
    background: "linear-gradient(180deg, rgba(255,248,239,0.96), rgba(249,239,212,0.9))",
  },
  "design-fit": {
    label: "Uso visuale",
    tone: "var(--muted-strong)",
    background: "linear-gradient(180deg, rgba(242,248,255,0.96), rgba(228,240,255,0.88))",
  },
  "marketing-fit": {
    label: "Uso nel lancio",
    tone: "var(--muted-strong)",
    background: "linear-gradient(180deg, rgba(244,251,239,0.96), rgba(232,245,220,0.88))",
  },
  "client-project": {
    label: "Per progetto",
    tone: "var(--muted-strong)",
    background: "linear-gradient(180deg, rgba(255,246,241,0.96), rgba(250,232,221,0.9))",
  },
  observe: {
    label: "Da tenere d'occhio",
    tone: "var(--muted-strong)",
    background: "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
  },
};

const taskMeta: Record<
  Exclude<ToolTaskKey, "all">,
  { label: string; keywords: string[] }
> = {
  writing: {
    label: "Per scrivere",
    keywords: ["writing", "scrivere", "copy", "content", "documentazione", "note", "workspace"],
  },
  prototyping: {
    label: "Per prototipare",
    keywords: ["prototype", "prototipi", "builder", "scaffold", "no-code", "mockup"],
  },
  "video-content": {
    label: "Video e contenuti",
    keywords: ["video", "editing", "creator", "contenuti", "content", "post-produzione"],
  },
  research: {
    label: "Ricerca e sintesi",
    keywords: ["research", "search", "sintesi", "ricerca", "fonti", "answers", "knowledge"],
  },
  automation: {
    label: "Per automazione",
    keywords: ["automation", "automazione", "workflow", "agentic", "task", "ops", "developer"],
  },
  "design-landing": {
    label: "Design e landing",
    keywords: ["design", "landing", "branding", "visual", "image", "moodboard"],
  },
  productivity: {
    label: "Produttività personale",
    keywords: ["produttivita", "workspace", "task", "knowledge base", "personale", "note"],
  },
  "founder-stack": {
    label: "Founder e solopreneur",
    keywords: ["founder", "marketing", "landing", "research", "workspace", "brand", "solo", "team piccoli"],
  },
};

export const saveReasonOptions = Object.keys(saveReasonMeta) as SaveReason[];
export const taskShortcutOptions = ["all", ...Object.keys(taskMeta)] as ToolTaskKey[];

export function getToolEditorialState(
  tool: ToolRecord,
  index = 0,
): ToolEditorialState {
  if (tool.editorial_state) {
    return tool.editorial_state;
  }

  if (tool.is_featured) {
    return "In evidenza";
  }

  if (index === 0) {
    return "Nuovo in archivio";
  }

  if (index < 4) {
    return "Da tenere d'occhio";
  }

  return "Selezione core";
}

export function getToolPricing(tool: Pick<ToolRecord, "pricing">): ToolPricing {
  return tool.pricing ?? "Freemium";
}

export function getToolPlatforms(tool: ToolRecord) {
  return tool.platforms?.length ? tool.platforms : ["Web"];
}

export function getToolBestFor(tool: ToolRecord) {
  return tool.best_for ?? "Capire in fretta se merita davvero un salvataggio o un confronto.";
}

export function getToolEditorialNote(tool: ToolRecord) {
  return (
    tool.editorial_note ??
    "Vale la pena aprirlo quando vuoi capire il suo ruolo operativo reale, non solo il pitch."
  );
}

export function getToolWhyHere(tool: Pick<ToolRecord, "why_here">) {
  return (
    tool.why_here ??
    "È qui perché mostra abbastanza utilità, direzione prodotto e sostanza da meritare una scheda vera, non solo un link salvato."
  );
}

export function getToolUseCases(tool: ToolRecord) {
  return tool.use_cases?.length
    ? tool.use_cases
    : ["Screening iniziale", "Confronto con alternative vicine", "Decisione se salvarlo o no"];
}

export function getToolStrengths(tool: ToolRecord) {
  return tool.strengths?.length
    ? tool.strengths
    : ["Ruolo chiaro", "Lettura rapida del prodotto", "Potenziale reale nel flusso di lavoro"];
}

export function getToolCautions(tool: ToolRecord) {
  return tool.cautions?.length
    ? tool.cautions
    : ["Va verificato sul caso d'uso giusto", "Merita confronto prima di entrare nella lista"];
}

export function getShortlistStageMeta(stage: ShortlistStage) {
  if (stage === "top") {
    return {
      label: "Candidato",
      tone: "var(--accent-strong)",
      background: "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))",
    };
  }

  if (stage === "review") {
    return {
      label: "Da valutare",
      tone: "var(--muted-strong)",
      background: "linear-gradient(180deg, rgba(255,248,239,0.96), rgba(249,239,212,0.9))",
    };
  }

  return {
    label: "Salvato",
    tone: "var(--muted-strong)",
    background: "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
  };
}

export function getSaveReasonMeta(reason: SaveReason) {
  return saveReasonMeta[reason];
}

export function getTaskMeta(task: Exclude<ToolTaskKey, "all">) {
  return taskMeta[task];
}

export function hasToolDecisionMemory(memory: ToolDecisionMemory) {
  return Boolean(memory.note?.trim() || memory.save_reason || memory.is_pinned);
}

export function hasToolDecisionNote(memory: ToolDecisionMemory) {
  return Boolean(memory.note?.trim());
}

export function getToolMemorySignals(memory: ToolDecisionMemory) {
  const signals: { label: string; tone: string; background: string }[] = [];

  if (memory.is_pinned) {
    signals.push({
      label: "In primo piano",
      tone: "var(--accent-strong)",
      background: "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))",
    });
  }

  if (memory.save_reason) {
    signals.push(getSaveReasonMeta(memory.save_reason));
  }

  if (memory.note?.trim()) {
    signals.push({
      label: "Nota",
      tone: "var(--muted-strong)",
      background: "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
    });
  }

  return signals;
}

export function formatDecisionTimestamp(timestamp?: string | null) {
  if (!timestamp) {
    return "Nessun aggiornamento locale";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function matchesToolQuery(tool: ToolRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    tool.name,
    tool.category,
    tool.short_description_it,
    tool.description_it,
    tool.source,
    getToolBestFor(tool),
    ...getToolUseCases(tool),
    ...tool.tags,
    ...getToolPlatforms(tool),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function matchesToolShortcut(
  tool: ToolRecord,
  index: number,
  shortcut: ToolFilterState["shortcut"] = "all",
) {
  switch (shortcut) {
    case "new":
      return index < 8;
    case "featured":
      return tool.is_featured;
    case "watch":
      return getToolEditorialState(tool, index) === "Da tenere d'occhio";
    case "developer":
      return tool.category === "Sviluppo";
    case "design":
      return tool.category === "Design";
    case "assistant":
      return tool.category === "Assistente AI";
    default:
      return true;
  }
}

export function matchesToolTask(
  tool: ToolRecord,
  task: ToolTaskKey = "all",
) {
  if (task === "all") {
    return true;
  }

  const haystack = [
    tool.category,
    tool.short_description_it,
    tool.description_it,
    getToolBestFor(tool),
    ...getToolUseCases(tool),
    ...tool.tags,
  ]
    .join(" ")
    .toLowerCase();

  const meta = getTaskMeta(task);
  const keywordHits = meta.keywords.filter((keyword) => haystack.includes(keyword)).length;

  switch (task) {
    case "writing":
      return tool.category === "Scrittura" || keywordHits > 0;
    case "prototyping":
      return keywordHits > 0 || tool.category === "Design" || tool.category === "Sviluppo";
    case "video-content":
      return tool.category === "Video" || keywordHits > 0;
    case "research":
      return tool.category === "Assistente AI" || keywordHits > 0;
    case "automation":
      return keywordHits > 0 || tool.category === "Sviluppo";
    case "design-landing":
      return keywordHits > 0 || tool.category === "Design" || tool.category === "Marketing";
    case "productivity":
      return tool.category === "Produttività" || keywordHits > 0;
    case "founder-stack":
      return keywordHits > 0 || tool.category === "Marketing" || tool.category === "Produttività";
    default:
      return true;
  }
}

export function filterTools(tools: ToolRecord[], state: ToolFilterState) {
  const shortlistSet = new Set(state.shortlist ?? []);

  return tools.filter((tool, index) => {
    const matchesCategory =
      !state.category || state.category === "all" || tool.category === state.category;
    const matchesTag = !state.tag || tool.tags.includes(state.tag);
    const matchesSaved = !state.savedOnly || shortlistSet.has(tool.slug);
    const matchesShortcut = matchesToolShortcut(tool, index, state.shortcut);
    const matchesTask = matchesToolTask(tool, state.task ?? "all");

    return (
      matchesCategory &&
      matchesTag &&
      matchesSaved &&
      matchesShortcut &&
      matchesTask &&
      matchesToolQuery(tool, state.query ?? "")
    );
  });
}

export function sortToolsBy(tools: ToolRecord[], sortKey: ToolSortKey) {
  const items = [...tools];

  switch (sortKey) {
    case "name":
      return items.sort((left, right) => left.name.localeCompare(right.name));
    case "updated":
      return items.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
    case "featured":
      return items.sort((left, right) => {
        if (Number(right.is_featured) !== Number(left.is_featured)) {
          return Number(right.is_featured) - Number(left.is_featured);
        }

        return right.date_discovered.localeCompare(left.date_discovered);
      });
    default:
      return items.sort((left, right) => right.date_discovered.localeCompare(left.date_discovered));
  }
}

export function sortToolsForWorkspace(
  tools: ToolRecord[],
  shortlistStages: Record<string, ShortlistStage>,
  decisionMemories: Record<string, ToolDecisionMemory>,
) {
  return [...tools].sort((left, right) => {
    const leftMemory = decisionMemories[left.slug] ?? {};
    const rightMemory = decisionMemories[right.slug] ?? {};

    if (Boolean(rightMemory.is_pinned) !== Boolean(leftMemory.is_pinned)) {
      return Number(Boolean(rightMemory.is_pinned)) - Number(Boolean(leftMemory.is_pinned));
    }

    const leftStage = shortlistStages[left.slug] ?? "saved";
    const rightStage = shortlistStages[right.slug] ?? "saved";

    if (stageRank[leftStage] !== stageRank[rightStage]) {
      return stageRank[leftStage] - stageRank[rightStage];
    }

    if (Boolean(rightMemory.note) !== Boolean(leftMemory.note)) {
      return Number(Boolean(rightMemory.note)) - Number(Boolean(leftMemory.note));
    }

    const rightUpdated = rightMemory.updated_at ?? "";
    const leftUpdated = leftMemory.updated_at ?? "";

    if (rightUpdated !== leftUpdated) {
      return rightUpdated.localeCompare(leftUpdated);
    }

    return right.date_discovered.localeCompare(left.date_discovered);
  });
}

export function getRelatedTools(tool: ToolRecord, tools: ToolRecord[], limit = 4) {
  return tools
    .filter((item) => item.slug !== tool.slug)
    .map((item) => {
      let score = 0;

      if (item.category === tool.category) {
        score += 4;
      }

      const sharedTags = item.tags.filter((tag) => tool.tags.includes(tag)).length;
      score += sharedTags * 2;

      if (getToolEditorialState(item) === getToolEditorialState(tool)) {
        score += 1;
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.item.date_discovered.localeCompare(left.item.date_discovered);
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}
