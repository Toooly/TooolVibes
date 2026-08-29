import { excerptPrivateNote } from "@/lib/account/private-note";
import { formatRevisitAt, OUTCOME_STATE_LABELS } from "@/lib/account/workspace-lifecycle";
import { listFiloEvents } from "@/lib/account/workspace-filo";
import type {
  WorkspaceStateV1,
  WorkspaceUsage,
} from "@/lib/discovery/types";
import {
  buildWorkspaceSearchIndex,
  type WorkspaceSearchIndex,
} from "@/lib/search/workspace-search-index";

export const PERSONAL_INSIGHT_TYPES = [
  "FIT",
  "WHY_NOT",
  "OVERLAP",
  "ALREADY_KNOW",
  "STACK_FIT",
  "REPLACEMENT",
  "DECISION_CONTEXT",
  "RECENT_SIGNAL",
] as const;

export type PersonalInsightType = (typeof PERSONAL_INSIGHT_TYPES)[number];

export type InsightSource =
  | { kind: "workspace"; fields: string[] }
  | { kind: "catalog"; fields: string[] };

export type PersonalInsightEvidence = {
  kind:
    | "RELATIONSHIP_STATUS"
    | "SAVED"
    | "USAGE"
    | "DECISION"
    | "DECISION_REASON"
    | "STACK_MEMBERSHIP"
    | "PRIVATE_NOTE_PRESENT"
    | "REVISIT_DUE"
    | "REPLACEMENT"
    | "ALTERNATIVE"
    | "CATEGORY_OVERLAP"
    | "PUBLIC_METADATA";
  slug?: string;
  field?: string;
};

export type PersonalInsightAction = {
  label: string;
  href: string;
};

export type PersonalInsight = {
  id: string;
  type: PersonalInsightType;
  toolSlug: string;
  title: string;
  explanation: string;
  source: InsightSource;
  evidence: PersonalInsightEvidence[];
  priority: number;
  evidenceKey: string;
  action?: PersonalInsightAction;
};

export type InsightCatalogHint = {
  slug: string;
  name: string;
  categoryLabel: string;
};

export const MAX_TOOL_PAGE_INSIGHTS = 3;
export const MAX_COMPARE_INSIGHTS = 1;

const PRIORITY = {
  WHY_NOT: 10,
  REPLACEMENT: 20,
  OVERLAP: 25,
  DECISION_CONTEXT_DUE: 30,
  DECISION_CONTEXT: 35,
  FIT: 40,
  STACK_FIT: 50,
  ALREADY_KNOW: 60,
} as const;

function unique(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))];
}

function nameOf(catalogBySlug: Map<string, InsightCatalogHint>, slug: string) {
  return catalogBySlug.get(slug)?.name ?? slug;
}

function categoryOf(catalogBySlug: Map<string, InsightCatalogHint>, slug: string) {
  return catalogBySlug.get(slug)?.categoryLabel ?? "";
}

function stackNamesFor(index: WorkspaceSearchIndex, slug: string) {
  const ids = index.stackIdsBySlug.get(slug) ?? [];
  return ids
    .map((id) => index.stackById.get(id)?.name)
    .filter((name): name is string => Boolean(name));
}

function declaredRelatedSlugs(index: WorkspaceSearchIndex, slug: string) {
  const related = [...(index.alternativesBySlug.get(slug) ?? [])];
  for (const [other, alts] of index.alternativesBySlug) {
    if (other !== slug && alts.includes(slug)) related.push(other);
  }
  return unique(related).filter((item) => item !== slug);
}

function lastDecided(
  state: WorkspaceStateV1,
  slug: string,
): { at: string | null; reason: string | null } {
  const events = listFiloEvents(state, slug);
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event?.type !== "decided") continue;
    return {
      at: event.at,
      reason: event.reason?.trim() || null,
    };
  }
  const decision = state.toolStates[slug]?.decision;
  return {
    at: decision?.updatedAt ?? null,
    reason: null,
  };
}

function joinNames(names: readonly string[]) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names[0]}, ${names[1]} e altri`;
}

function insight(partial: Omit<PersonalInsight, "id">): PersonalInsight {
  return {
    ...partial,
    id: `${partial.type}:${partial.toolSlug}:${partial.evidenceKey}`,
  };
}

function collectCandidates(input: {
  toolSlug: string;
  workspace: WorkspaceStateV1;
  index: WorkspaceSearchIndex;
  catalogBySlug: Map<string, InsightCatalogHint>;
}): PersonalInsight[] {
  const slug = input.toolSlug;
  const { index, workspace, catalogBySlug } = input;
  const tool = workspace.toolStates[slug];
  const saved = index.savedSet.has(slug);
  const outcome = tool?.decision?.outcome ?? index.outcomeBySlug.get(slug) ?? null;
  const usage: WorkspaceUsage | null = tool?.usage ?? index.usageBySlug.get(slug) ?? null;
  const stacks = stackNamesFor(index, slug);
  const note = index.noteBySlug.get(slug) ?? tool?.note ?? null;
  const reviewDue = index.reviewDueSet.has(slug);
  const decided = lastDecided(workspace, slug);
  const candidates: PersonalInsight[] = [];

  const usingSlugs = unique(
    [...index.usageBySlug.entries()]
      .filter(([other, value]) => value === "using" && other !== slug)
      .map(([other]) => other),
  );
  const related = declaredRelatedSlugs(index, slug);
  const relatedUsing = related.filter((item) => index.usageBySlug.get(item) === "using");
  const relatedSaved = related.filter((item) => index.savedSet.has(item));
  const category = categoryOf(catalogBySlug, slug);
  const usingSameCategory = category
    ? usingSlugs.filter((item) => categoryOf(catalogBySlug, item) === category)
    : [];
  const replacedBy = usage === "replaced" ? tool?.replacedBy ?? null : null;
  const replacedThis: string[] = [];
  for (const [other, otherTool] of Object.entries(workspace.toolStates)) {
    if (other === slug) continue;
    if (otherTool.usage === "replaced" && otherTool.replacedBy === slug) {
      replacedThis.push(other);
    }
  }

  const currentNegative =
    usage === "stopped" || usage === "replaced" || (outcome === "rejected" && usage !== "using");

  if (usage === "stopped") {
    candidates.push(
      insight({
        type: "WHY_NOT",
        toolSlug: slug,
        title: "Non lo usi più",
        explanation: "Non lo usi più.",
        source: { kind: "workspace", fields: ["usage"] },
        evidence: [{ kind: "USAGE", field: "stopped" }],
        priority: PRIORITY.WHY_NOT,
        evidenceKey: "stopped",
      }),
    );
  } else if (outcome === "rejected" && usage !== "using") {
    const date = formatRevisitAt(decided.at);
    const reason = excerptPrivateNote(decided.reason, 80);
    const explanation = reason
      ? `Lo avevi scartato${date ? ` il ${date}` : ""}: ${reason}`
      : `Lo avevi scartato${date ? ` il ${date}` : ""}.`;
    candidates.push(
      insight({
        type: "WHY_NOT",
        toolSlug: slug,
        title: "Lo avevi scartato",
        explanation,
        source: { kind: "workspace", fields: reason ? ["decision", "events"] : ["decision"] },
        evidence: [
          { kind: "DECISION", field: "rejected" },
          ...(reason ? [{ kind: "DECISION_REASON" as const }] : []),
        ],
        priority: PRIORITY.WHY_NOT,
        evidenceKey: "rejected",
      }),
    );
  }

  if (replacedBy) {
    const replacementName = nameOf(catalogBySlug, replacedBy);
    candidates.push(
      insight({
        type: "REPLACEMENT",
        toolSlug: slug,
        title: "Sostituito",
        explanation: `Hai sostituito questo tool con ${replacementName}.`,
        source: { kind: "workspace", fields: ["usage", "replacedBy"] },
        evidence: [
          { kind: "USAGE", field: "replaced" },
          { kind: "REPLACEMENT", slug: replacedBy },
        ],
        priority: PRIORITY.REPLACEMENT,
        action: { label: replacementName, href: `/toools/${replacedBy}` },
        evidenceKey: `by:${replacedBy}`,
      }),
    );
  } else if (replacedThis.length > 0) {
    const oldSlug = replacedThis[0]!;
    const oldName = nameOf(catalogBySlug, oldSlug);
    candidates.push(
      insight({
        type: "REPLACEMENT",
        toolSlug: slug,
        title: "Sostituisce un tool",
        explanation: `Hai sostituito ${oldName} con questo tool.`,
        source: { kind: "workspace", fields: ["usage", "replacedBy"] },
        evidence: [{ kind: "REPLACEMENT", slug: oldSlug }],
        priority: PRIORITY.REPLACEMENT,
        evidenceKey: `of:${oldSlug}`,
      }),
    );
  } else if (relatedUsing.length > 0 && usage !== "using") {
    const other = relatedUsing[0]!;
    const otherName = nameOf(catalogBySlug, other);
    candidates.push(
      insight({
        type: "REPLACEMENT",
        toolSlug: slug,
        title: "Alternativa a un tool in uso",
        explanation: `Potrebbe essere rilevante come alternativa a ${otherName}, che stai usando.`,
        source: { kind: "workspace", fields: ["alternatives", "usage"] },
        evidence: [
          { kind: "ALTERNATIVE", slug: other },
          { kind: "USAGE", slug: other, field: "using" },
        ],
        priority: PRIORITY.REPLACEMENT,
        action: { label: otherName, href: `/toools/${other}` },
        evidenceKey: `alt:${other}`,
      }),
    );
  }

  if (relatedUsing.length > 0 && usage === "using") {
    const names = relatedUsing.slice(0, 2).map((item) => nameOf(catalogBySlug, item));
    candidates.push(
      insight({
        type: "OVERLAP",
        toolSlug: slug,
        title: "Si sovrappone a un tool in uso",
        explanation: `Si sovrappone a ${joinNames(names)}, che stai già usando.`,
        source: { kind: "workspace", fields: ["alternatives", "usage"] },
        evidence: relatedUsing.slice(0, 2).map((item) => ({
          kind: "ALTERNATIVE" as const,
          slug: item,
        })),
        priority: PRIORITY.OVERLAP,
        evidenceKey: `using:${relatedUsing.slice(0, 2).join("+")}`,
      }),
    );
  } else if (relatedSaved.length > 0 && relatedUsing.length === 0 && usage !== "replaced") {
    const names = relatedSaved.slice(0, 2).map((item) => nameOf(catalogBySlug, item));
    candidates.push(
      insight({
        type: "OVERLAP",
        toolSlug: slug,
        title: "Già confrontato",
        explanation: `L’hai messo a confronto con ${joinNames(names)}.`,
        source: { kind: "workspace", fields: ["alternatives"] },
        evidence: relatedSaved.slice(0, 2).map((item) => ({
          kind: "ALTERNATIVE" as const,
          slug: item,
        })),
        priority: PRIORITY.OVERLAP,
        evidenceKey: `saved:${relatedSaved.slice(0, 2).join("+")}`,
      }),
    );
  } else if (
    usingSameCategory.length > 0 &&
    relatedUsing.length === 0 &&
    usage !== "using" &&
    usage !== "replaced"
  ) {
    const other = usingSameCategory[0]!;
    const otherName = nameOf(catalogBySlug, other);
    candidates.push(
      insight({
        type: "OVERLAP",
        toolSlug: slug,
        title: "Stessa categoria",
        explanation: `Stessa categoria di ${otherName}, che stai usando.`,
        source: { kind: "catalog", fields: ["categoryLabel"] },
        evidence: [
          { kind: "CATEGORY_OVERLAP", slug: other },
          { kind: "USAGE", slug: other, field: "using" },
          { kind: "PUBLIC_METADATA", field: "categoryLabel" },
        ],
        priority: PRIORITY.OVERLAP,
        evidenceKey: `category:${other}`,
      }),
    );
  }

  if (reviewDue) {
    candidates.push(
      insight({
        type: "DECISION_CONTEXT",
        toolSlug: slug,
        title: "Da rivedere",
        explanation: "Lo avevi rimandato e ora è da rivedere.",
        source: { kind: "workspace", fields: ["decision", "revisitAt"] },
        evidence: [
          { kind: "DECISION", field: "deferred" },
          { kind: "REVISIT_DUE" },
        ],
        priority: PRIORITY.DECISION_CONTEXT_DUE,
        action: {
          label: "Rivedi",
          href: `/account?view=salvati&focus=${slug}`,
        },
        evidenceKey: "review-due",
      }),
    );
  } else if (outcome === "deferred" && usage !== "using") {
    candidates.push(
      insight({
        type: "DECISION_CONTEXT",
        toolSlug: slug,
        title: "Rimandato",
        explanation: "Lo avevi rimandato.",
        source: { kind: "workspace", fields: ["decision"] },
        evidence: [{ kind: "DECISION", field: "deferred" }],
        priority: PRIORITY.DECISION_CONTEXT,
        evidenceKey: "deferred",
      }),
    );
  } else if (outcome === "selected" && usage !== "using" && !currentNegative) {
    const reason = excerptPrivateNote(decided.reason, 80);
    candidates.push(
      insight({
        type: "DECISION_CONTEXT",
        toolSlug: slug,
        title: OUTCOME_STATE_LABELS.selected,
        explanation: reason ? `Lo avevi scelto: ${reason}` : "Lo avevi scelto.",
        source: { kind: "workspace", fields: reason ? ["decision", "events"] : ["decision"] },
        evidence: [
          { kind: "DECISION", field: "selected" },
          ...(reason ? [{ kind: "DECISION_REASON" as const }] : []),
        ],
        priority: PRIORITY.DECISION_CONTEXT,
        evidenceKey: "selected",
      }),
    );
  }

  if (usage === "using") {
    const stackLabel = stacks[0];
    candidates.push(
      insight({
        type: "FIT",
        toolSlug: slug,
        title: "Lo usi già",
        explanation: stackLabel
          ? `Lo usi già nello Stack ${stackLabel}.`
          : "Lo usi già.",
        source: {
          kind: "workspace",
          fields: stackLabel ? ["usage", "personalStacks"] : ["usage"],
        },
        evidence: [
          { kind: "USAGE", field: "using" },
          ...(stackLabel ? [{ kind: "STACK_MEMBERSHIP" as const }] : []),
        ],
        priority: PRIORITY.FIT,
        evidenceKey: stackLabel ? "using-stack" : "using",
      }),
    );
  } else if (outcome === "selected" && !currentNegative && usage !== "using") {
    candidates.push(
      insight({
        type: "FIT",
        toolSlug: slug,
        title: "Già scelto",
        explanation: "Hai già scelto questo tool.",
        source: { kind: "workspace", fields: ["decision"] },
        evidence: [{ kind: "DECISION", field: "selected" }],
        priority: PRIORITY.FIT,
        evidenceKey: "selected",
      }),
    );
  } else if (
    !saved &&
    !currentNegative &&
    category &&
    workspace.compare.slugs.some(
      (item) => item !== slug && categoryOf(catalogBySlug, item) === category,
    )
  ) {
    candidates.push(
      insight({
        type: "FIT",
        toolSlug: slug,
        title: "Stai confrontando questa categoria",
        explanation: `Stai confrontando altri tool in ${category}.`,
        source: { kind: "workspace", fields: ["compare"] },
        evidence: [
          { kind: "PUBLIC_METADATA", field: "categoryLabel" },
          { kind: "RELATIONSHIP_STATUS", field: "compare" },
        ],
        priority: PRIORITY.FIT,
        evidenceKey: "compare-category",
      }),
    );
  }

  if (stacks.length > 0 && usage !== "using") {
    const first = stacks[0]!;
    candidates.push(
      insight({
        type: "STACK_FIT",
        toolSlug: slug,
        title: "Nello Stack",
        explanation:
          stacks.length === 1
            ? `Fa già parte dello Stack ${first}.`
            : `Fa già parte dello Stack ${first} e di altri.`,
        source: { kind: "workspace", fields: ["personalStacks"] },
        evidence: [{ kind: "STACK_MEMBERSHIP" }],
        priority: PRIORITY.STACK_FIT,
        evidenceKey: "membership",
      }),
    );
  }

  if (saved || note) {
    candidates.push(
      insight({
        type: "ALREADY_KNOW",
        toolSlug: slug,
        title: "Già nei Salvati",
        explanation: "È già nei Salvati.",
        source: { kind: "workspace", fields: note ? ["saved", "note"] : ["saved"] },
        evidence: [
          { kind: "SAVED" },
          ...(note ? [{ kind: "PRIVATE_NOTE_PRESENT" as const }] : []),
        ],
        priority: PRIORITY.ALREADY_KNOW,
        evidenceKey: "saved",
      }),
    );
  }

  return candidates;
}

function suppress(candidates: PersonalInsight[]) {
  const types = new Set(candidates.map((item) => item.type));
  const fit = candidates.find((item) => item.type === "FIT");
  const replacement = candidates.find((item) => item.type === "REPLACEMENT");
  const decision = candidates.find((item) => item.type === "DECISION_CONTEXT");
  const whyNot = candidates.find((item) => item.type === "WHY_NOT");

  return candidates.filter((item) => {
    if (item.type === "RECENT_SIGNAL") return false;
    if (item.type === "ALREADY_KNOW") {
      return !(
        types.has("FIT") ||
        types.has("WHY_NOT") ||
        types.has("DECISION_CONTEXT") ||
        types.has("REPLACEMENT") ||
        types.has("STACK_FIT")
      );
    }
    if (item.type === "STACK_FIT" && fit?.explanation.includes("Stack")) {
      return false;
    }
    if (item.type === "FIT" && item.evidenceKey === "selected" && decision?.evidenceKey === "selected") {
      return false;
    }
    if (
      item.type === "OVERLAP" &&
      replacement &&
      (item.evidenceKey.startsWith("using:") || item.evidenceKey.startsWith("alt:"))
    ) {
      const replacementTarget = replacement.evidenceKey.split(":")[1];
      if (replacementTarget && item.evidenceKey.includes(replacementTarget)) {
        return false;
      }
    }
    if (item.type === "FIT" && item.evidenceKey === "compare-category" && (fit?.evidenceKey === "using" || fit?.evidenceKey === "using-stack" || whyNot)) {
      return false;
    }
    return true;
  });
}

function sortInsights(insights: PersonalInsight[]) {
  return [...insights].sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority;
    if (left.type !== right.type) return left.type.localeCompare(right.type);
    return left.id.localeCompare(right.id);
  });
}

export function selectVisibleInsights(
  insights: readonly PersonalInsight[],
  limit = MAX_TOOL_PAGE_INSIGHTS,
) {
  return sortInsights([...insights]).slice(0, Math.max(0, limit));
}

export function derivePersonalInsights(input: {
  toolSlug: string;
  workspace: WorkspaceStateV1;
  catalog?: readonly InsightCatalogHint[];
  nowIso?: string;
  limit?: number;
}): PersonalInsight[] {
  return (
    derivePersonalInsightsForSlugs({
      slugs: [input.toolSlug],
      workspace: input.workspace,
      catalog: input.catalog,
      nowIso: input.nowIso,
      limit: input.limit,
    }).get(input.toolSlug) ?? []
  );
}

export function derivePersonalInsightsForSlugs(input: {
  slugs: readonly string[];
  workspace: WorkspaceStateV1;
  catalog?: readonly InsightCatalogHint[];
  nowIso?: string;
  limit?: number;
}): Map<string, PersonalInsight[]> {
  const index = buildWorkspaceSearchIndex(
    input.workspace,
    input.nowIso ?? new Date().toISOString(),
  );
  const catalogBySlug = new Map((input.catalog ?? []).map((tool) => [tool.slug, tool]));
  const limit = input.limit ?? MAX_TOOL_PAGE_INSIGHTS;
  const result = new Map<string, PersonalInsight[]>();
  for (const slug of input.slugs) {
    result.set(
      slug,
      selectVisibleInsights(
        suppress(
          collectCandidates({
            toolSlug: slug,
            workspace: input.workspace,
            index,
            catalogBySlug,
          }),
        ),
        limit,
      ),
    );
  }
  return result;
}
