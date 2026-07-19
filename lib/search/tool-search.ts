/* ═══════════════════════════════════════════════════════════════
   Tool search service — canonical, deterministic ranking (B31).

   Single search engine shared by the archive catalog, the header
   search entry points and the global command palette (IA-504):
   same query over the same catalog produces the same tools in the
   same order for every consumer.

   Contract:
   - deterministic: pure function of (tools, query); ties break on
     localized name, then slug, then original index — never on
     Math.random, Date or iteration-order accidents;
   - accent-insensitive: "caffe" matches "caffè", "produttivita"
     matches "produttività" (NFD + diacritic strip);
   - typo-tolerant: a query token of 4+ chars still matches name/tag
     tokens within one Damerau edit (transposition included), at a
     reduced weight so typos never outrank exact/prefix hits;
   - precise: every query token must match somewhere (AND
     semantics); URLs, source URLs and domains are NOT searchable,
     so a mention inside a tracked link cannot create an
     unjustified false positive.
   ═══════════════════════════════════════════════════════════════ */

export type ToolSearchDocument = {
  slug: string;
  name: string;
  categoryLabel: string;
  shortDescription: string;
  tags: string[];
};

export type ToolSearchOptions = {
  limit?: number;
};

const SEARCH_WEIGHTS = {
  exactName: 100,
  exactSlug: 95,
  namePrefix: 70,
  nameSubstring: 55,
  exactTag: 60,
  nameTokenExact: 40,
  slugTokenExact: 38,
  tagTokenExact: 35,
  nameTokenPrefix: 30,
  slugTokenPrefix: 28,
  tagTokenPrefix: 25,
  nameTokenTypo: 20,
  tagTokenTypo: 15,
  categoryToken: 12,
  descriptionToken: 8,
} as const;

/** Minimum query-token length eligible for typo tolerance. */
const TYPO_MIN_TOKEN_LENGTH = 4;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchText(value: string): string[] {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.split(" ") : [];
}

/**
 * Optimal string alignment (Damerau) distance, computed only when the
 * length delta makes `maxDistance` reachable; returns maxDistance + 1
 * as soon as the cap is exceeded. Tokens are short, so the full DP
 * matrix stays trivial in size.
 */
export function editDistanceWithin(
  left: string,
  right: string,
  maxDistance = 1,
): number {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > maxDistance) {
    return maxDistance + 1;
  }

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix: number[] = new Array(rows * cols);

  for (let i = 0; i < rows; i += 1) matrix[i * cols] = i;
  for (let j = 0; j < cols; j += 1) matrix[j] = j;

  for (let i = 1; i < rows; i += 1) {
    let rowMin = Number.POSITIVE_INFINITY;
    for (let j = 1; j < cols; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      let cell = Math.min(
        matrix[(i - 1) * cols + j] + 1,
        matrix[i * cols + (j - 1)] + 1,
        matrix[(i - 1) * cols + (j - 1)] + substitutionCost,
      );
      if (
        i > 1 &&
        j > 1 &&
        left[i - 1] === right[j - 2] &&
        left[i - 2] === right[j - 1]
      ) {
        cell = Math.min(cell, matrix[(i - 2) * cols + (j - 2)] + 1);
      }
      matrix[i * cols + j] = cell;
      if (cell < rowMin) rowMin = cell;
    }
    if (rowMin > maxDistance) return maxDistance + 1;
  }

  return matrix[rows * cols - 1];
}

function bestTokenScore(
  token: string,
  candidates: string[],
  weights: { exact: number; prefix: number; typo: number },
): number {
  let best = 0;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate === token) {
      best = Math.max(best, weights.exact);
    } else if (candidate.startsWith(token)) {
      best = Math.max(best, weights.prefix);
    } else if (
      weights.typo > 0 &&
      token.length >= TYPO_MIN_TOKEN_LENGTH &&
      editDistanceWithin(token, candidate, 1) <= 1
    ) {
      best = Math.max(best, weights.typo);
    }
  }
  return best;
}

/**
 * Scores one document against a raw query. Returns 0 when the document
 * is not a match (any query token unmatched). Exposed for tests and
 * for explanation surfaces; ranking uses `searchTools`.
 */
export function scoreToolForQuery(
  tool: ToolSearchDocument,
  rawQuery: string,
): number {
  const queryTokens = tokenizeSearchText(rawQuery);
  if (queryTokens.length === 0) return 0;

  const query = queryTokens.join(" ");
  const name = normalizeSearchText(tool.name);
  const slug = normalizeSearchText(tool.slug);
  const tags = tool.tags.map(normalizeSearchText);
  const categoryTokens = tokenizeSearchText(tool.categoryLabel);
  const description = normalizeSearchText(tool.shortDescription);

  let score = 0;

  // Whole-query boosts (exact / prefix / substring on the display name,
  // exact slug, exact tag).
  if (name === query) {
    score += SEARCH_WEIGHTS.exactName;
  } else if (slug === query) {
    score += SEARCH_WEIGHTS.exactSlug;
  } else if (name.startsWith(query)) {
    score += SEARCH_WEIGHTS.namePrefix;
  } else if (name.includes(query)) {
    score += SEARCH_WEIGHTS.nameSubstring;
  }
  if (tags.some((tag) => tag === query)) {
    score += SEARCH_WEIGHTS.exactTag;
  }

  const nameTokens = name.split(" ");
  const slugTokens = slug.split(/[-\s]+/);
  const tagTokens = tags.flatMap((tag) => tag.split(" "));

  // AND semantics: every query token must contribute, otherwise the
  // document is excluded (guard against unjustified false positives).
  for (const token of queryTokens) {
    let best = 0;
    best = Math.max(
      best,
      bestTokenScore(token, nameTokens, {
        exact: SEARCH_WEIGHTS.nameTokenExact,
        prefix: SEARCH_WEIGHTS.nameTokenPrefix,
        typo: SEARCH_WEIGHTS.nameTokenTypo,
      }),
    );
    best = Math.max(
      best,
      bestTokenScore(token, slugTokens, {
        exact: SEARCH_WEIGHTS.slugTokenExact,
        prefix: SEARCH_WEIGHTS.slugTokenPrefix,
        typo: 0,
      }),
    );
    best = Math.max(
      best,
      bestTokenScore(token, tagTokens, {
        exact: SEARCH_WEIGHTS.tagTokenExact,
        prefix: SEARCH_WEIGHTS.tagTokenPrefix,
        typo: SEARCH_WEIGHTS.tagTokenTypo,
      }),
    );
    if (
      categoryTokens.some(
        (candidate) => candidate === token || candidate.startsWith(token),
      )
    ) {
      best = Math.max(best, SEARCH_WEIGHTS.categoryToken);
    }
    if (best === 0 && description.includes(token)) {
      best = SEARCH_WEIGHTS.descriptionToken;
    }
    if (best === 0) return 0;
    score += best;
  }

  return score;
}

/**
 * Canonical search entry point. Returns matching tools ordered by
 * descending score with deterministic tie-breaks; an empty/blank
 * query returns an empty array (consumers decide what to show when
 * no query is active).
 */
export function searchTools<T extends ToolSearchDocument>(
  tools: readonly T[],
  rawQuery: string,
  options?: ToolSearchOptions,
): T[] {
  if (!normalizeSearchText(rawQuery)) return [];

  const hits: { item: T; score: number; index: number }[] = [];
  tools.forEach((tool, index) => {
    const score = scoreToolForQuery(tool, rawQuery);
    if (score > 0) hits.push({ item: tool, score, index });
  });

  hits.sort(
    (left, right) =>
      right.score - left.score ||
      left.item.name.localeCompare(right.item.name, "it") ||
      left.item.slug.localeCompare(right.item.slug) ||
      left.index - right.index,
  );

  const ordered = hits.map((hit) => hit.item);
  return options?.limit !== undefined ? ordered.slice(0, options.limit) : ordered;
}
