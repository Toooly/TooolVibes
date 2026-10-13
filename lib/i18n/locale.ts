export type Locale = "it" | "en";
export type LanguagePreference = Locale | "auto";
export const LANGUAGE_STORAGE_KEY = "tooolvibes.language";
export const ENGLISH_DICTIONARY_URL = "/locales/en.json?v=7dc5e9b88989";

export function parseLanguagePreference(value: unknown): LanguagePreference {
  return value === "it" || value === "en" ? value : "auto";
}

export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split(/[-_]/)[0];
    if (base === "it" || base === "en") return base;
  }
  return "en";
}

export function resolveLocale(preference: LanguagePreference, languages: readonly string[]): Locale {
  return preference === "auto" ? detectLocale(languages) : preference;
}

export type TranslationDictionary = Record<string, string>;
export function normalizeTranslationKey(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function createTranslator(dictionary: TranslationDictionary) {
  const entries = new Map(Object.entries(dictionary).map(([key, value]) => [normalizeTranslationKey(key), value]));
  // Briefs render plain text extracted from authored Markdown.
  for (const [source, target] of [...entries]) {
    const plain = source.replace(/\*\*/g, "");
    if (plain !== source && !entries.has(plain)) entries.set(plain, target.replace(/\*\*/g, ""));
    const sourceBody = source.match(/^\*\*[^*]+:\*\*\s*(.+)$/);
    const targetBody = target.match(/^\*\*[^*]+:\*\*\s*(.+)$/);
    if (sourceBody && targetBody) {
      const key = sourceBody[1].replace(/\*\*/g, "").trim();
      if (!entries.has(key)) entries.set(key, targetBody[1].replace(/\*\*/g, "").trim());
    }
  }
  const lowercaseEntries = new Map([...entries].map(([key, value]) => [key.toLowerCase(), value]));
  const templates = [...entries].filter(([key]) => /\{\d+\}/.test(key) && key.replace(/\{\d+\}/g, "").trim().length > 0 && key.length < 500).map(([key, value]) => {
    const slots: string[] = [];
    const numericOnly = key.replace(/\{\d+\}/g, "").trim().length < 4;
    const escaped = key.split(/(\{\d+\})/).map((part) => {
      if (/^\{\d+\}$/.test(part)) { slots.push(part); return numericOnly ? "(\\d+(?:[.,]\\d+)?)" : "(.+?)"; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("");
    return { pattern: new RegExp(`^${escaped}$`), slots, value };
  });

  return function translate(source: string): string {
    const key = normalizeTranslationKey(source);
    const direct = entries.get(key);
    const uppercase = /[A-ZÀÈÉÌÒÙ]/.test(key) && key === key.toUpperCase();
    let result = direct;
    if (result === undefined && uppercase) {
      const matching = lowercaseEntries.get(key.toLowerCase());
      if (matching) result = matching.toUpperCase();
    }
    if (result === undefined && key.length < 1000) {
      for (const template of templates) {
        const match = template.pattern.exec(key);
        if (!match) continue;
        result = template.value.replace(/\{\d+\}/g, (slot) => {
          const index = template.slots.indexOf(slot);
          return index < 0 ? slot : (entries.get(normalizeTranslationKey(match[index + 1])) ?? match[index + 1]);
        });
        break;
      }
    }
    if (result === undefined && key.includes(" · ")) {
      const parts = source.split(" · ");
      const localized = parts.map(translate);
      if (localized.some((part, index) => part !== parts[index])) return localized.join(" · ");
    }
    if (result === undefined && /^(?:€|\$)[\d\s.,–—-]+\/mese$/.test(key)) result = key.replace("/mese", "/month");
    if (result === undefined) {
      const months: Record<string, string> = { gennaio: "January", febbraio: "February", marzo: "March", aprile: "April", maggio: "May", giugno: "June", luglio: "July", agosto: "August", settembre: "September", ottobre: "October", novembre: "November", dicembre: "December", gen: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", mag: "May", giu: "Jun", lug: "Jul", ago: "Aug", set: "Sep", ott: "Oct", nov: "Nov", dic: "Dec" };
      const date = key.match(/^(?:(\d{1,2})\s+)?([a-z]+)\.?\s+(\d{4})$/i);
      if (date && months[date[2].toLowerCase()]) result = `${date[1] ? date[1] + " " : ""}${months[date[2].toLowerCase()]} ${date[3]}`;
    }
    if (result === undefined) return source;
    return `${source.match(/^\s*/)?.[0] ?? ""}${result}${source.match(/\s*$/)?.[0] ?? ""}`;
  };
}

/** Translate authored prose without changing code, links, block markers or heading anchors. */
export function translateMarkdown(content: string, translate: (source: string) => string): string {
  let fence = "";
  return content.split("\n").map((line) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) { fence = fence ? "" : marker[1][0]; return line; }
    if (fence || !line.trim() || /^\s*\[[^\]]+\]:/.test(line)) return line;
    const prefix = line.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s+|:::\s*(?:tip|warning|pro|decision|takeaways)\s+))(.+)$/);
    if (prefix) return prefix[1] + translate(prefix[2]);
    return translate(line);
  }).join("\n");
}
