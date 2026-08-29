import type { SalvatiRelationship } from "@/lib/account/salvati-relationship";
import { matchesSalvatiSearch } from "@/lib/account/salvati-relationship";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import {
  parsePersonalSearchQuery,
  personalSearchEmptyMessage,
  normalizedEquals,
  normalizedIncludes,
  type PersonalSearchFilter,
  type PersonalSearchQuery,
  type PersonalSearchStatus,
} from "@/lib/search/personal-search-query";
import {
  searchTools,
  scoreToolForQuery,
  type ToolSearchDocument,
} from "@/lib/search/tool-search";
import {
  buildWorkspaceSearchIndex,
  resolveStackIds,
  type WorkspaceSearchIndex,
} from "@/lib/search/workspace-search-index";

export type PersonalSearchHit = {
  slug: string;
  reasons: string[];
  catalogScore: number;
};

export type PersonalSearchCatalogTool = ToolSearchDocument & {
  categoryLabel: string;
  name: string;
};

function statusMatches(
  slug: string,
  status: PersonalSearchStatus,
  index: WorkspaceSearchIndex,
) {
  const outcome = index.outcomeBySlug.get(slug) ?? null;
  const usage = index.usageBySlug.get(slug) ?? null;
  const column = index.columnBySlug.get(slug);
  if (status === "scelti") return outcome === "selected" && usage !== "using";
  if (status === "rimandati") return outcome === "deferred";
  if (status === "scartati") return outcome === "rejected";
  return (
    outcome == null &&
    usage !== "using" &&
    (column === "salvato" || column === "da_valutare" || column === "candidato")
  );
}

function stackSlugSet(index: WorkspaceSearchIndex, value: string) {
  const ids = resolveStackIds(index, value);
  const slugs = new Set<string>();
  for (const id of ids) {
    const stack = index.stackById.get(id);
    if (!stack) continue;
    for (const slug of stack.slugs) slugs.add(slug);
  }
  return { ids, slugs };
}

function alternativeToSlugs(
  slug: string,
  catalog: readonly PersonalSearchCatalogTool[],
  index: WorkspaceSearchIndex,
) {
  const matches = new Set<string>();
  const declared = index.alternativesBySlug.get(slug) ?? [];
  for (const alt of declared) {
    if (alt !== slug) matches.add(alt);
  }
  const target = catalog.find((tool) => tool.slug === slug);
  if (!target) return matches;
  for (const tool of catalog) {
    if (tool.slug === slug) continue;
    if (normalizedEquals(tool.categoryLabel, target.categoryLabel)) {
      matches.add(tool.slug);
    }
  }
  return matches;
}

function passesFilter(
  slug: string,
  filter: PersonalSearchFilter,
  index: WorkspaceSearchIndex,
  catalogBySlug: Map<string, PersonalSearchCatalogTool>,
  catalog: readonly PersonalSearchCatalogTool[],
) {
  if (filter.type === "in") {
    return index.savedSet.has(slug);
  }
  if (filter.type === "status") {
    return statusMatches(slug, filter.value, index);
  }
  if (filter.type === "usage") {
    return index.usageBySlug.get(slug) === filter.value;
  }
  if (filter.type === "stack") {
    return stackSlugSet(index, filter.value).slugs.has(slug);
  }
  if (filter.type === "revisit") {
    return index.reviewDueSet.has(slug);
  }
  if (filter.type === "note") {
    return index.noteBySlug.has(slug);
  }
  if (filter.type === "q_note") {
    const note = index.noteBySlug.get(slug);
    return Boolean(note && normalizedIncludes(note, filter.value));
  }
  if (filter.type === "not") {
    return index.outcomeBySlug.get(slug) !== "rejected";
  }
  if (filter.type === "alternativeTo") {
    return alternativeToSlugs(filter.value, catalog, index).has(slug);
  }
  const tool = catalogBySlug.get(slug);
  if (!tool) return false;
  return normalizedIncludes(tool.categoryLabel, filter.value);
}

function reasonsFor(
  slug: string,
  index: WorkspaceSearchIndex,
  query: PersonalSearchQuery,
) {
  const reasons: string[] = [];
  const usage = index.usageBySlug.get(slug);
  const outcome = index.outcomeBySlug.get(slug);
  for (const filter of query.filters) {
    if (filter.type === "status" && filter.value === "rimandati") reasons.push("Rimandati");
    if (filter.type === "status" && filter.value === "scartati") reasons.push("Scartati");
    if (filter.type === "status" && filter.value === "scelti") reasons.push("Scelti");
    if (filter.type === "status" && filter.value === "da_valutare") reasons.push("Da valutare");
    if (filter.type === "usage" && filter.value === "using") reasons.push("In uso");
    if (filter.type === "revisit") reasons.push("Da rivedere");
    if (filter.type === "note" || filter.type === "q_note") reasons.push("Nota presente");
  }
  if (index.savedSet.has(slug) && !reasons.includes("Salvato")) reasons.push("Salvato");
  if (usage === "using" && !reasons.includes("In uso")) reasons.push("In uso");
  else if (usage === "stopped") reasons.push("Non lo uso più");
  else if (usage === "replaced") reasons.push("Sostituito");
  if (outcome === "selected" && usage !== "using" && !reasons.includes("Scelti")) {
    reasons.push("Scelto");
  }
  if (outcome === "deferred" && !reasons.includes("Rimandati")) reasons.push("Rimandato");
  if (outcome === "rejected" && !reasons.includes("Scartati")) reasons.push("Scartato");
  if (index.reviewDueSet.has(slug) && !reasons.includes("Da rivedere")) {
    reasons.push("Da rivedere");
  }
  if (index.noteBySlug.has(slug) && !reasons.includes("Nota presente")) {
    reasons.push("Nota presente");
  }
  const stackFilter = query.filters.find((filter) => filter.type === "stack");
  if (stackFilter && stackFilter.type === "stack") {
    const ids = resolveStackIds(index, stackFilter.value);
    for (const id of ids) {
      const stack = index.stackById.get(id);
      if (stack?.slugs.has(slug)) reasons.push(`Stack: ${stack.name}`);
    }
  } else {
    const stackIds = index.stackIdsBySlug.get(slug) ?? [];
    for (const id of stackIds.slice(0, 2)) {
      const stack = index.stackById.get(id);
      if (stack) reasons.push(`Stack: ${stack.name}`);
    }
  }
  return reasons;
}

function candidateUniverse(
  query: PersonalSearchQuery,
  index: WorkspaceSearchIndex,
  catalog: readonly PersonalSearchCatalogTool[],
) {
  const slugs = new Set<string>();
  const hasWorkspaceFilter = query.filters.some((filter) => filter.type !== "category");
  if (hasWorkspaceFilter) {
    for (const slug of index.savedSet) slugs.add(slug);
    for (const slug of index.noteBySlug.keys()) slugs.add(slug);
    for (const slug of index.usageBySlug.keys()) slugs.add(slug);
    for (const slug of index.reviewDueSet) slugs.add(slug);
    for (const stack of index.stackById.values()) {
      for (const slug of stack.slugs) slugs.add(slug);
    }
  }
  const alternative = query.filters.find((filter) => filter.type === "alternativeTo");
  if (alternative && alternative.type === "alternativeTo") {
    for (const slug of alternativeToSlugs(alternative.value, catalog, index)) {
      slugs.add(slug);
    }
  }
  if (query.text || query.filters.some((filter) => filter.type === "category")) {
    for (const tool of catalog) slugs.add(tool.slug);
  }
  if (slugs.size === 0 && query.filters.length > 0) {
    for (const slug of index.savedSet) slugs.add(slug);
  }
  return slugs;
}

export function searchPersonal(input: {
  query: string | PersonalSearchQuery;
  catalog: readonly PersonalSearchCatalogTool[];
  state: WorkspaceStateV1;
  index?: WorkspaceSearchIndex;
  nowIso?: string;
  limit?: number;
}): PersonalSearchHit[] {
  const parsed =
    typeof input.query === "string"
      ? parsePersonalSearchQuery(input.query)
      : input.query;
  if (!parsed.filters.length && !parsed.text) return [];

  const index =
    input.index ?? buildWorkspaceSearchIndex(input.state, input.nowIso);
  const catalogBySlug = new Map(input.catalog.map((tool) => [tool.slug, tool]));
  let slugs = candidateUniverse(parsed, index, input.catalog);

  for (const filter of parsed.filters) {
    const next = new Set<string>();
    for (const slug of slugs) {
      if (passesFilter(slug, filter, index, catalogBySlug, input.catalog)) {
        next.add(slug);
      }
    }
    slugs = next;
  }

  if (parsed.text) {
    const next = new Set<string>();
    for (const slug of slugs) {
      const tool = catalogBySlug.get(slug);
      if (!tool) continue;
      if (scoreToolForQuery(tool, parsed.text) > 0) next.add(slug);
    }
    slugs = next;
  }

  const ranked: PersonalSearchHit[] = [];
  for (const slug of slugs) {
    const tool = catalogBySlug.get(slug);
    ranked.push({
      slug,
      reasons: reasonsFor(slug, index, parsed),
      catalogScore: tool && parsed.text ? scoreToolForQuery(tool, parsed.text) : 0,
    });
  }

  ranked.sort((left, right) => {
    if (right.catalogScore !== left.catalogScore) {
      return right.catalogScore - left.catalogScore;
    }
    const leftName = catalogBySlug.get(left.slug)?.name ?? left.slug;
    const rightName = catalogBySlug.get(right.slug)?.name ?? right.slug;
    return (
      leftName.localeCompare(rightName, "it") || left.slug.localeCompare(right.slug)
    );
  });

  return typeof input.limit === "number" ? ranked.slice(0, input.limit) : ranked;
}

export function matchesSalvatiPersonalQuery(
  item: SalvatiRelationship,
  rawQuery: string,
  catalog: { name: string; categoryLabel: string },
  index: WorkspaceSearchIndex,
) {
  const parsed = parsePersonalSearchQuery(rawQuery);
  if (!parsed.filters.length) {
    return matchesSalvatiSearch(item, rawQuery.trim().toLowerCase(), catalog);
  }
  if (parsed.errors.includes("unclosed-quote") && !parsed.text && parsed.filters.length === 0) {
    return false;
  }
  for (const filter of parsed.filters) {
    if (filter.type === "category") {
      if (!normalizedIncludes(catalog.categoryLabel, filter.value)) return false;
      continue;
    }
    if (filter.type === "in") {
      if (!index.savedSet.has(item.slug)) return false;
      continue;
    }
    if (filter.type === "status") {
      if (!statusMatches(item.slug, filter.value, index)) return false;
      continue;
    }
    if (filter.type === "usage") {
      if (item.usage !== filter.value) return false;
      continue;
    }
    if (filter.type === "stack") {
      if (!stackSlugSet(index, filter.value).slugs.has(item.slug)) return false;
      continue;
    }
    if (filter.type === "revisit") {
      if (!item.reviewDue) return false;
      continue;
    }
    if (filter.type === "note") {
      if (!item.note) return false;
      continue;
    }
    if (filter.type === "q_note") {
      if (!item.note || !normalizedIncludes(item.note, filter.value)) return false;
      continue;
    }
    if (filter.type === "not") {
      if (item.outcome === "rejected") return false;
    }
  }
  if (parsed.text) {
    return matchesSalvatiSearch(item, parsed.text.toLowerCase(), catalog);
  }
  return true;
}

export {
  parsePersonalSearchQuery,
  personalSearchEmptyMessage,
  buildWorkspaceSearchIndex,
  searchTools,
};
