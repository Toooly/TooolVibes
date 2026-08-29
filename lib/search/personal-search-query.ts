import { normalizeSearchText } from "@/lib/search/tool-search";
export const MAX_PERSONAL_SEARCH_QUERY_LENGTH = 400;

export type PersonalSearchStatus =
  | "da_valutare"
  | "scelti"
  | "rimandati"
  | "scartati";

export type PersonalSearchUsage = "using" | "stopped" | "replaced";

export type PersonalSearchFilter =
  | { type: "in"; value: "saved" }
  | { type: "status"; value: PersonalSearchStatus }
  | { type: "usage"; value: PersonalSearchUsage }
  | { type: "stack"; value: string }
  | { type: "revisit"; value: "due" }
  | { type: "note"; value: "yes" }
  | { type: "q_note"; value: string }
  | { type: "not"; value: "rejected" }
  | { type: "alternativeTo"; value: string }
  | { type: "category"; value: string };

export type PersonalSearchParseError =
  | "unclosed-quote"
  | "invalid-filter"
  | "empty-filter-value"
  | "oversized";

export type PersonalSearchQuery = {
  raw: string;
  textTerms: string[];
  text: string;
  filters: PersonalSearchFilter[];
  unknownFilters: string[];
  errors: PersonalSearchParseError[];
  personal: boolean;
};

const STATUS_VALUES = new Set<PersonalSearchStatus>([
  "da_valutare",
  "scelti",
  "rimandati",
  "scartati",
]);

const USAGE_VALUES = new Set<PersonalSearchUsage>([
  "using",
  "stopped",
  "replaced",
]);

const PERSONAL_KEYS = new Set([
  "in",
  "status",
  "usage",
  "stack",
  "revisit",
  "note",
  "q_note",
  "not",
  "alternative-to",
]);

const PUBLIC_KEYS = new Set(["category"]);

const ALIASES: { pattern: RegExp; filter: PersonalSearchFilter }[] = [
  {
    pattern: /\bda\s+rivedere\b|\bda\s+riprendere\b|\briprendi\b/gi,
    filter: { type: "revisit", value: "due" },
  },
  {
    pattern: /\brimandati\b|\brimanda\b/gi,
    filter: { type: "status", value: "rimandati" },
  },
  {
    pattern: /\bscartati\b|\bscarto\b/gi,
    filter: { type: "status", value: "scartati" },
  },
  {
    pattern: /\bin\s+uso\b|\busando\b/gi,
    filter: { type: "usage", value: "using" },
  },
  { pattern: /\bscelti\b/gi, filter: { type: "status", value: "scelti" } },
  { pattern: /\bcon\s+note\b/gi, filter: { type: "note", value: "yes" } },
];

function emptyQuery(raw: string): PersonalSearchQuery {
  return {
    raw,
    textTerms: [],
    text: "",
    filters: [],
    unknownFilters: [],
    errors: [],
    personal: false,
  };
}

function tokenizeKeepingQuotes(input: string): {
  tokens: string[];
  unclosed: boolean;
} {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    if (!inQuotes && /\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return { tokens, unclosed: inQuotes };
}

function splitFilterToken(token: string): { key: string; value: string } | null {
  const colon = token.indexOf(":");
  if (colon <= 0) return null;
  const key = token.slice(0, colon).toLowerCase();
  if (!/^[a-z][a-z0-9_-]*$/.test(key)) return null;
  let value = token.slice(colon + 1);
  if (value.startsWith('"')) {
    if (value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1);
    } else {
      value = value.slice(1);
    }
  }
  return { key, value };
}

function parseKnownFilter(
  key: string,
  value: string,
): PersonalSearchFilter | "invalid" | "empty" {
  const trimmed = value.trim();
  if (!trimmed) return "empty";

  if (key === "in") {
    return trimmed.toLowerCase() === "saved"
      ? { type: "in", value: "saved" }
      : "invalid";
  }
  if (key === "status") {
    const normalized = trimmed.toLowerCase() as PersonalSearchStatus;
    return STATUS_VALUES.has(normalized)
      ? { type: "status", value: normalized }
      : "invalid";
  }
  if (key === "usage") {
    const normalized = trimmed.toLowerCase() as PersonalSearchUsage;
    return USAGE_VALUES.has(normalized)
      ? { type: "usage", value: normalized }
      : "invalid";
  }
  if (key === "stack") {
    return { type: "stack", value: trimmed };
  }
  if (key === "revisit") {
    return trimmed.toLowerCase() === "due"
      ? { type: "revisit", value: "due" }
      : "invalid";
  }
  if (key === "note") {
    return trimmed.toLowerCase() === "yes"
      ? { type: "note", value: "yes" }
      : "invalid";
  }
  if (key === "q_note") {
    return { type: "q_note", value: trimmed };
  }
  if (key === "not") {
    return trimmed.toLowerCase() === "rejected"
      ? { type: "not", value: "rejected" }
      : "invalid";
  }
  if (key === "alternative-to") {
    return { type: "alternativeTo", value: trimmed.toLowerCase() };
  }
  if (key === "category") {
    return { type: "category", value: trimmed };
  }
  return "invalid";
}

function compileAliases(text: string): {
  filters: PersonalSearchFilter[];
  leftover: string;
} {
  let leftover = text;
  const filters: PersonalSearchFilter[] = [];
  for (const alias of ALIASES) {
    alias.pattern.lastIndex = 0;
    if (alias.pattern.test(leftover)) {
      filters.push(alias.filter);
      leftover = leftover.replace(alias.pattern, " ");
    }
  }
  return { filters, leftover: leftover.replace(/\s+/g, " ").trim() };
}

export function parsePersonalSearchQuery(rawInput: string): PersonalSearchQuery {
  const raw = typeof rawInput === "string" ? rawInput : "";
  if (!raw.trim()) return emptyQuery(raw);

  const errors: PersonalSearchParseError[] = [];
  if (raw.length > MAX_PERSONAL_SEARCH_QUERY_LENGTH) {
    errors.push("oversized");
  }

  const source = raw.slice(0, MAX_PERSONAL_SEARCH_QUERY_LENGTH);
  const { tokens, unclosed } = tokenizeKeepingQuotes(source);
  if (unclosed) errors.push("unclosed-quote");

  const filters: PersonalSearchFilter[] = [];
  const unknownFilters: string[] = [];
  const textParts: string[] = [];

  for (const token of tokens) {
    const split = splitFilterToken(token);
    if (!split) {
      textParts.push(token);
      continue;
    }
    const { key, value } = split;
    if (!PERSONAL_KEYS.has(key) && !PUBLIC_KEYS.has(key)) {
      unknownFilters.push(key);
      textParts.push(token);
      continue;
    }
    const parsed = parseKnownFilter(key, value);
    if (parsed === "empty") {
      errors.push("empty-filter-value");
      continue;
    }
    if (parsed === "invalid") {
      errors.push("invalid-filter");
      continue;
    }
    filters.push(parsed);
  }

  const aliased = compileAliases(textParts.join(" "));
  const mergedFilters = [...filters];
  for (const extra of aliased.filters) {
    if (
      !mergedFilters.some(
        (filter) => filter.type === extra.type && filter.value === extra.value,
      )
    ) {
      mergedFilters.push(extra);
    }
  }

  const text = aliased.leftover;
  const textTerms = text ? text.split(/\s+/).filter(Boolean) : [];
  const personal = mergedFilters.some((filter) => filter.type !== "category");

  return {
    raw,
    textTerms,
    text,
    filters: mergedFilters,
    unknownFilters,
    errors,
    personal,
  };
}

export function filtersFromSalvatiChip(
  filter: string,
): PersonalSearchFilter[] {
  if (filter === "tutti") return [];
  if (filter === "da_valutare") return [{ type: "status", value: "da_valutare" }];
  if (filter === "scelti") return [{ type: "status", value: "scelti" }];
  if (filter === "in_uso") return [{ type: "usage", value: "using" }];
  if (filter === "rimandati") return [{ type: "status", value: "rimandati" }];
  if (filter === "scartati") return [{ type: "status", value: "scartati" }];
  return [{ type: "revisit", value: "due" }];
}

export function personalSearchEmptyMessage(query: PersonalSearchQuery) {
  if (query.filters.some((filter) => filter.type === "usage" && filter.value === "using")) {
    return "Nessun tool in uso corrisponde a questa ricerca.";
  }
  if (query.filters.some((filter) => filter.type === "revisit")) {
    return "Nessun tool da rivedere corrisponde a questa ricerca.";
  }
  if (query.filters.some((filter) => filter.type === "note" || filter.type === "q_note")) {
    return "Nessuna nota corrisponde a questa ricerca.";
  }
  if (query.personal) {
    return "Nessun tool nel tuo spazio corrisponde a questa ricerca.";
  }
  return "Nessun tool corrisponde ai filtri.";
}

export function normalizedEquals(left: string, right: string) {
  return normalizeSearchText(left) === normalizeSearchText(right);
}

export function normalizedIncludes(haystack: string, needle: string) {
  const hay = normalizeSearchText(haystack);
  const need = normalizeSearchText(needle);
  return Boolean(hay && need && hay.includes(need));
}
