import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  extractMarkdownTradeOff,
  firstListItemOrSentence,
  parsePublicToolMarkdown,
} from "@/lib/content/tool-markdown-public";
import type { CompareObjective } from "./compare-objective";
import {
  buildCanonicalObjectiveRanking,
  normalise,
  withBattleScores,
  type NormalisedTool,
} from "@/components/tools/tool-battle-shared";

export type ComparisonGroup =
  | "overview"
  | "pricing"
  | "capabilities"
  | "workflow"
  | "trust";
export type ComparisonValue = {
  text: string;
  missing: boolean;
  source?: string;
  comparisonKey?: string;
  items?: string[][];
};
export type ComparisonCriterion = {
  id: string;
  label: string;
  group: ComparisonGroup;
  type: "text" | "list" | "number";
  values: Record<string, ComparisonValue>;
  differs: boolean;
  importance: number;
};
export type ComparisonCandidate = {
  slug: string;
  name: string;
  logoUrl: string;
  rating: number | null;
  category: string;
  bestFor: string;
  strength: string;
  tradeoff: string;
  pricing: ComparisonValue;
  normalised: NormalisedTool;
};
export type ComparisonViewModel = {
  tools: ComparisonCandidate[];
  criteria: ComparisonCriterion[];
  missingSlugs: string[];
};

type PricingEvidence = {
  pricingPlans?: {
    name: string;
    price: string;
    period: string;
    note?: string;
  }[];
  pricingStatus?: string;
  pricingNotes?: string | null;
  pricingSourceUrl?: string | null;
};
const OBJECTIVE_CRITERIA: Record<CompareObjective, string[]> = {
  "save-time": ["automation", "integrations", "best-for"],
  quality: ["strength", "tradeoff", "ai"],
  "save-money": ["entry-price", "pricing-terms", "tradeoff"],
  "learn-fast": ["level", "best-for", "tradeoff"],
  collaborate: ["integrations", "privacy", "best-for"],
  scale: ["developer", "automation", "pricing-terms"],
  experiment: ["ai", "developer", "entry-price"],
};
export const COMPARISON_GROUPS: { id: ComparisonGroup; label: string }[] = [
  { id: "overview", label: "In sintesi" },
  { id: "pricing", label: "Prezzi e condizioni" },
  { id: "capabilities", label: "Funzionalità AI" },
  { id: "workflow", label: "Integrazioni e sviluppo" },
  { id: "trust", label: "Piattaforme e controllo" },
];
const UNKNOWN = "Non documentato";
function value(text?: string | null, source?: string | null): ComparisonValue {
  return {
    text: text?.trim() || UNKNOWN,
    missing: !text?.trim(),
    ...(source ? { source } : {}),
  };
}
/** Case, punctuation and list order do not create artificial differences. */
export function comparisonValueKey(cell: ComparisonValue): string {
  if (cell.missing) return "__missing__";
  return (cell.comparisonKey ?? cell.text)
    .split("\n")
    .map((line) =>
      line
        .normalize("NFKC")
        .toLocaleLowerCase()
        .replace(/[.,;:!?]+$/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .sort()
    .join("|");
}
export function criterionDiffers(values: readonly ComparisonValue[]): boolean {
  return new Set(values.map(comparisonValueKey)).size > 1;
}
export function resolveComparisonPair(
  slugs: readonly string[],
  requested: readonly string[],
): string[] {
  const result = [...new Set(requested)]
    .filter((slug) => slugs.includes(slug))
    .slice(0, 2);
  for (const slug of slugs)
    if (result.length < 2 && !result.includes(slug)) result.push(slug);
  return result;
}
function pricingEntry(tool: ToolPublicView): ComparisonValue {
  const pricing = tool.publicTool as ToolPublicView["publicTool"] &
    PricingEvidence;
  if (pricing.pricingStatus === "discontinued")
    return value("Offerta non più attiva", pricing.pricingSourceUrl);
  if (pricing.pricingStatus === "temporarily_unverifiable")
    return value(null, pricing.pricingSourceUrl);
  const plans = pricing.pricingPlans ?? [];
  const paid = plans.find(
    (plan) =>
      /\d/.test(plan.price) && !/^(?:\$|€|£)?0(?:[.,]00)?$/.test(plan.price),
  );
  const free = plans.find(
    (plan) =>
      /^(?:\$|€|£)?0(?:[.,]00)?$/.test(plan.price) &&
      !/trial|prova/i.test(plan.name),
  );
  const entry = paid ?? free ?? plans[0];
  const result = value(
    entry
      ? `${entry.name} · ${entry.price}${entry.period ? ` ${entry.period}` : ""}`
      : null,
    pricing.pricingSourceUrl,
  );
  return entry
    ? {
        ...result,
        comparisonKey: `${entry.price} ${entry.period}`,
        items: [[entry.name, entry.price, entry.period]],
      }
    : result;
}
function lines(markdown?: string | null): string[] {
  return (markdown ?? "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^[-*]\s+/, "")
        .replace(/\*\*/g, "")
        .trim(),
    )
    .filter(Boolean);
}
/** Quotes editorial statements, never infers a yes/no capability from a category. */
function documentedClaim(tool: ToolPublicView, pattern: RegExp): string | null {
  const parsed = parsePublicToolMarkdown(tool.extendedContent);
  const candidates = [
    ...tool.highlights,
    ...lines(parsed.byId.features),
    ...lines(parsed.byId.limits),
  ];
  return candidates.find((text) => pattern.test(text)) ?? null;
}

export function buildComparisonViewModel(
  catalog: readonly ToolPublicView[],
  slugs: readonly string[],
  objective: CompareObjective | null = null,
): ComparisonViewModel {
  const orderedSlugs = [...new Set(slugs)];
  const selection = orderedSlugs.flatMap((slug) => {
    const tool = catalog.find((item) => item.slug === slug);
    return tool ? [tool] : [];
  });
  const ranked = buildCanonicalObjectiveRanking(
    withBattleScores(normalise([...catalog], orderedSlugs)),
    objective,
  );
  const normalised = new Map(
    ranked.orderedTools.map((tool) => [tool.slug, tool]),
  );
  const tools = selection.map((tool) => {
    const parsed = parsePublicToolMarkdown(tool.extendedContent);
    const normal = normalised.get(tool.slug)!;
    return {
      slug: tool.slug,
      name: tool.name,
      logoUrl: normal.logoUrl,
      rating: normal.editorialScore,
      category: tool.categoryLabel,
      bestFor:
        tool.idealUseCase ??
        tool.publicTool.content.bestFor ??
        tool.useCases[0] ??
        UNKNOWN,
      strength:
        firstListItemOrSentence(parsed.byId.strengths) ??
        tool.highlights[0] ??
        UNKNOWN,
      tradeoff:
        extractMarkdownTradeOff(parsed.byId.verdict) ??
        firstListItemOrSentence(parsed.byId.limits) ??
        tool.cautions[0] ??
        UNKNOWN,
      pricing: pricingEntry(tool),
      normalised: normal,
    };
  });
  const criteria: ComparisonCriterion[] = [];
  const add = (
    id: string,
    label: string,
    group: ComparisonGroup,
    importance: number,
    read: (
      tool: ToolPublicView,
      candidate: ComparisonCandidate,
    ) => ComparisonValue,
    type: ComparisonCriterion["type"] = "text",
  ) => {
    const values = Object.fromEntries(
      selection.map((tool, i) => [tool.slug, read(tool, tools[i])]),
    );
    criteria.push({
      id,
      label,
      group,
      type,
      values,
      importance:
        objective && OBJECTIVE_CRITERIA[objective].includes(id)
          ? 200 - OBJECTIVE_CRITERIA[objective].indexOf(id)
          : importance,
      differs: criterionDiffers(Object.values(values)),
    });
  };
  add("best-for", "Ideale per", "overview", 100, (_, t) =>
    value(t.bestFor === UNKNOWN ? null : t.bestFor),
  );
  add("entry-price", "Prezzo di partenza", "pricing", 98, (_, t) => t.pricing);
  add("strength", "Punto di forza", "overview", 85, (_, t) =>
    value(t.strength === UNKNOWN ? null : t.strength),
  );
  add("tradeoff", "Da considerare", "overview", 92, (_, t) =>
    value(t.tradeoff === UNKNOWN ? null : t.tradeoff),
  );
  add("category", "Categoria", "overview", 30, (t) => value(t.categoryLabel));
  add("level", "Livello di utilizzo", "overview", 45, (t) =>
    value(t.levelLabel),
  );
  add(
    "plans",
    "Piani pubblicati",
    "pricing",
    40,
    (t) => {
      const p = t.publicTool as ToolPublicView["publicTool"] & PricingEvidence;
      if (
        ["discontinued", "temporarily_unverifiable"].includes(
          p.pricingStatus ?? "",
        )
      )
        return value(null, p.pricingSourceUrl);
      const items = p.pricingPlans?.map((plan) => [
        plan.name,
        plan.price,
        plan.period,
        ...(plan.note ? [plan.note] : []),
      ]);
      return {
        ...value(
          items?.map((parts) => parts.join(" · ")).join("\n"),
          p.pricingSourceUrl,
        ),
        ...(items?.length ? { items } : {}),
      };
    },
    "list",
  );
  add("pricing-terms", "Condizioni e consumi", "pricing", 65, (t) =>
    value(
      (t.publicTool as ToolPublicView["publicTool"] & PricingEvidence)
        .pricingNotes,
    ),
  );
  add(
    "ai",
    "Funzioni distintive",
    "capabilities",
    80,
    (t) =>
      value(
        lines(parsePublicToolMarkdown(t.extendedContent).byId.features)
          .slice(0, 3)
          .join("\n") || t.highlights.slice(0, 3).join("\n"),
      ),
    "list",
  );
  add("integrations", "Integrazioni", "workflow", 90, (t) =>
    value(documentedClaim(t, /integra|connet|connector|collega/i)),
  );
  add("automation", "Automazioni", "workflow", 70, (t) =>
    value(documentedClaim(t, /automa|workflow|webhook/i)),
  );
  add("developer", "API e sviluppo", "workflow", 60, (t) =>
    value(documentedClaim(t, /\bAPI\b|esporta.*codice|code export|GitHub/i)),
  );
  add(
    "platforms",
    "Piattaforme",
    "trust",
    55,
    (t) => value(t.publicTool.attributes.platforms.join("\n")),
    "list",
  );
  add("privacy", "Privacy e controllo", "trust", 50, (t) =>
    value(
      documentedClaim(t, /privacy|sicurezza|dati sensibili|accessi|permessi/i),
    ),
  );
  add("open-source", "Open source", "trust", 50, (t) =>
    value(documentedClaim(t, /open[ -]source|Apache|licenza MIT|licenza GPL/i)),
  );
  return {
    tools,
    criteria,
    missingSlugs: orderedSlugs.filter(
      (slug) => !selection.some((tool) => tool.slug === slug),
    ),
  };
}

export function projectComparisonPair(
  model: ComparisonViewModel,
  slugs: readonly string[],
): ComparisonViewModel {
  const tools = slugs.flatMap((slug) => {
    const tool = model.tools.find((item) => item.slug === slug);
    return tool ? [tool] : [];
  });
  const criteria = model.criteria.map((row) => {
    const values = Object.fromEntries(
      tools.map((tool) => [tool.slug, row.values[tool.slug]]),
    );
    return { ...row, values, differs: criterionDiffers(Object.values(values)) };
  });
  return { ...model, tools, criteria };
}
export function comparisonKeyDifferences(
  model: ComparisonViewModel,
  limit = 3,
): ComparisonCriterion[] {
  return model.criteria
    .filter((row) => row.differs)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, limit);
}
