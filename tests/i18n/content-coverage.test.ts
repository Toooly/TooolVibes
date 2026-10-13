import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import dictionary from "@/public/locales/en.json";
import tools from "@/lib/data/tool-extended-content.json";
import { createTranslator, ENGLISH_DICTIONARY_URL, translateMarkdown } from "@/lib/i18n/locale";

const t = createTranslator(dictionary);
function urls(source: string) { return [...source.matchAll(/https?:\/\/[^\s)<>]+/g)].map((match) => match[0]); }

describe("English editorial content", () => {
  it("versions the dictionary from its exact content to prevent stale caches", () => {
    const content = readFileSync(new URL("../../public/locales/en.json", import.meta.url));
    const fingerprint = createHash("sha256").update(content).digest("hex").slice(0, 12);
    expect(ENGLISH_DICTIONARY_URL).toBe(`/locales/en.json?v=${fingerprint}`);
  });
  it("covers all authored tool bodies and preserves technical links and code", () => {
    const bodies: string[] = [];
    function collect(value: unknown) {
      if (typeof value === "string" && value.includes("\n")) bodies.push(value);
      else if (value && typeof value === "object") Object.values(value).forEach(collect);
    }
    collect(tools);
    expect(bodies.length).toBeGreaterThanOrEqual(30);
    for (const source of bodies) {
      const translated = translateMarkdown(source, t);
      expect(translated).not.toBe(source);
      expect(urls(translated)).toEqual(urls(source));
      const code = (text: string) => [...text.matchAll(/`[^`\n]+`/g)].map((match) => match[0]);
      expect(code(translated)).toEqual(code(source));
      expect(translated).not.toMatch(/ZXQ\d+Z/);
    }
  });
  it("uses consistent navigation and actionable labels", () => {
    expect(t("Catalogo")).toBe("Catalog");
    expect(t("Salvati")).toBe("Saved");
    expect(t("Apri scheda")).toBe("View details");
    expect(t("SCELTA DELLA REDAZIONE")).toBe("EDITOR'S PICK");
    expect(t("4 risultati su 30")).toBe("4 results out of 30");
  });
});
