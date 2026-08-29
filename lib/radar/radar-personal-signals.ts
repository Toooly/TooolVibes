import {
  derivePersonalInsightsForSlugs,
  type InsightCatalogHint,
  type PersonalInsight,
  type PersonalInsightEvidence,
} from "@/lib/account/personal-insights";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import type { ProductHuntItem } from "@/lib/radar/product-hunt-contract";
import { matchRadarItemToCatalog } from "@/lib/radar/radar-catalog-match";

export const RADAR_PERSONAL_KINDS = [
  "rejected",
  "stopped",
  "replaced",
  "alternative-to-using",
  "review-due",
  "postponed",
  "using",
  "selected",
  "stack",
  "saved",
  "known-signal",
] as const;

export type RadarPersonalKind = (typeof RADAR_PERSONAL_KINDS)[number];

export type RadarPersonalSignal = {
  radarItemId: string;
  toolSlug: string;
  kind: RadarPersonalKind;
  title: string;
  explanation: string;
  evidence: PersonalInsightEvidence[];
  priority: number;
};

const PRIORITY: Record<RadarPersonalKind, number> = {
  rejected: 10,
  stopped: 11,
  replaced: 12,
  "alternative-to-using": 20,
  "review-due": 30,
  postponed: 35,
  using: 40,
  selected: 45,
  stack: 50,
  saved: 60,
  "known-signal": 70,
};

const COPY: Record<RadarPersonalKind, { title: string; explanation: string }> = {
  rejected: { title: "Lo avevi scartato", explanation: "Lo avevi scartato." },
  stopped: { title: "Non lo usi più", explanation: "Lo avevi smesso di usare." },
  replaced: { title: "Sostituito", explanation: "Lo avevi sostituito." },
  "alternative-to-using": {
    title: "Alternativa a un tool in uso",
    explanation: "È un’alternativa a un tool che stai usando.",
  },
  "review-due": {
    title: "Da rivedere",
    explanation: "Lo avevi rimandato: è anche da rivedere.",
  },
  postponed: {
    title: "Rimandato",
    explanation: "Lo avevi rimandato e ora è tornato nel Radar.",
  },
  using: { title: "Lo usi già", explanation: "È tornato nel Radar e lo stai già usando." },
  selected: { title: "Già scelto", explanation: "Lo avevi scelto." },
  stack: { title: "Nello Stack", explanation: "È già in uno dei tuoi Stack." },
  saved: { title: "Già salvato", explanation: "Lo avevi salvato." },
  "known-signal": { title: "Nel Radar", explanation: "È nel Radar e lo conosci già." },
};

function kindFromInsight(insight: PersonalInsight): RadarPersonalKind | null {
  if (insight.type === "WHY_NOT") {
    if (insight.evidenceKey === "stopped") return "stopped";
    if (insight.evidenceKey === "rejected") return "rejected";
    return "rejected";
  }
  if (insight.type === "REPLACEMENT") {
    if (insight.evidenceKey.startsWith("alt:")) return "alternative-to-using";
    return "replaced";
  }
  if (insight.type === "DECISION_CONTEXT") {
    if (insight.evidenceKey === "review-due") return "review-due";
    if (insight.evidenceKey === "deferred") return "postponed";
    if (insight.evidenceKey === "selected") return "selected";
    return null;
  }
  if (insight.type === "FIT") {
    if (insight.evidenceKey === "compare-category") return null;
    if (insight.evidenceKey === "using" || insight.evidenceKey === "using-stack") {
      return "using";
    }
    if (insight.evidenceKey === "selected") return "selected";
    return null;
  }
  if (insight.type === "STACK_FIT") return "stack";
  if (insight.type === "ALREADY_KNOW") return "saved";
  if (insight.type === "OVERLAP") {
    if (insight.evidenceKey.startsWith("category:")) return null;
    if (insight.evidenceKey.startsWith("using:") || insight.evidenceKey.startsWith("alt:")) {
      return "alternative-to-using";
    }
    return null;
  }
  if (insight.type === "RECENT_SIGNAL") return "known-signal";
  return null;
}

function explanationFor(kind: RadarPersonalKind, insight: PersonalInsight) {
  if (kind === "alternative-to-using") {
    const other = insight.evidence.find((item) => item.kind === "ALTERNATIVE")?.slug;
    if (other && insight.explanation.includes("alternativa")) {
      return insight.explanation.replace(
        /^Potrebbe essere rilevante come alternativa a /,
        "È un’alternativa a ",
      ).replace(/, che stai usando\.$/, ", che stai usando.");
    }
    if (insight.explanation.startsWith("Si sovrappone a ")) {
      return insight.explanation.replace("Si sovrappone a ", "È un’alternativa a ");
    }
  }
  if (kind === "stack") return insight.explanation.replace("Fa già parte dello Stack ", "È già nello Stack ");
  if (kind === "replaced" && insight.explanation.startsWith("Hai sostituito")) {
    return insight.explanation.replace("Hai sostituito questo tool con ", "Lo avevi sostituito con ");
  }
  return COPY[kind].explanation;
}

function projectInsight(insight: PersonalInsight): Omit<RadarPersonalSignal, "radarItemId"> | null {
  const kind = kindFromInsight(insight);
  if (!kind) return null;
  return {
    toolSlug: insight.toolSlug,
    kind,
    title: COPY[kind].title,
    explanation: explanationFor(kind, insight),
    evidence: insight.evidence,
    priority: PRIORITY[kind],
  };
}

export function listRadarPersonalSignals(input: {
  items: readonly ProductHuntItem[];
  workspace: WorkspaceStateV1;
  catalog: readonly InsightCatalogHint[];
  nowIso?: string;
}): RadarPersonalSignal[] {
  const matched: { item: ProductHuntItem; slug: string }[] = [];
  const seen = new Set<string>();
  for (const item of input.items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const match = matchRadarItemToCatalog(item, input.catalog);
    if (match.status !== "matched") continue;
    matched.push({ item, slug: match.slug });
  }
  if (matched.length === 0) return [];

  const slugs = [...new Set(matched.map((entry) => entry.slug))];
  const radarActiveSlugs = new Set(slugs);
  const bySlug = derivePersonalInsightsForSlugs({
    slugs,
    workspace: input.workspace,
    catalog: input.catalog,
    nowIso: input.nowIso,
    limit: 8,
    radarActiveSlugs,
  });

  const signals: RadarPersonalSignal[] = [];
  for (const entry of matched) {
    const projected = (bySlug.get(entry.slug) ?? [])
      .map(projectInsight)
      .filter((value): value is NonNullable<typeof value> => value !== null)
      .sort((left, right) => left.priority - right.priority || left.kind.localeCompare(right.kind));
    const primary = projected[0];
    if (!primary) continue;
    signals.push({
      radarItemId: entry.item.id,
      ...primary,
    });
  }
  return signals.sort(
    (left, right) =>
      left.priority - right.priority ||
      left.radarItemId.localeCompare(right.radarItemId),
  );
}

export function radarPersonalByItemId(signals: readonly RadarPersonalSignal[]) {
  return new Map(signals.map((signal) => [signal.radarItemId, signal]));
}
