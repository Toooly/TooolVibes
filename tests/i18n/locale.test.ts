import { describe, expect, it } from "vitest";
import { createTranslator, detectLocale, parseLanguagePreference, resolveLocale, translateMarkdown } from "@/lib/i18n/locale";

describe("language resolution", () => {
  it("recognizes supported device languages in priority order", () => {
    expect(detectLocale(["fr-FR", "it-CH", "en-US"])).toBe("it");
    expect(detectLocale(["en-GB", "it-IT"])).toBe("en");
    expect(detectLocale(["IT_it"])).toBe("it");
    expect(detectLocale(["de-DE"])).toBe("en");
    expect(detectLocale([])).toBe("en");
  });
  it("gives manual choice precedence and tolerates corrupt storage", () => {
    expect(resolveLocale("it", ["en-US"])).toBe("it");
    expect(resolveLocale("en", ["it-IT"])).toBe("en");
    expect(resolveLocale("auto", ["it-IT"])).toBe("it");
    for (const value of [null, "fr", {}, "EN"]) expect(parseLanguagePreference(value)).toBe("auto");
  });
});

describe("authored text", () => {
  const t = createTranslator({ "{0} tool": "{0} tools", "Livello {0}": "Level: {0}", "Base": "Beginner", "Salva": "Save", "Apri {0}, {1} segnali": "Open {0}, {1} signals", "{0} su {1}": "{0} of {1}", "Confronta (max. {0})": "Compare (max. {0})", "Guida pratica": "Practical guide", "Usa [Claude](https://claude.ai) e `npm run build`.": "Use [Claude](https://claude.ai) and `npm run build`." });
  it("preserves whitespace, unknown content, product names and user notes", () => {
    expect(t(" Salva\n")).toBe(" Save\n");
    expect(t("La mia nota personale su Claude")).toBe("La mia nota personale su Claude");
    expect(t("Claude")).toBe("Claude");
  });
  it("fills templates without corrupting names, counts or regex punctuation", () => {
    expect(t("Apri Claude, 12 segnali")).toBe("Open Claude, 12 signals");
    expect(t("4 su 5")).toBe("4 of 5");
    expect(t("Confronta (max. 5)")).toBe("Compare (max. 5)");
    expect(t("Confronta x max. 5")).toBe("Confronta x max. 5");
  });
  it("localizes plain excerpts without leaving Markdown formatting in brief text", () => {
    const translate = createTranslator({ "**Il compromesso principale:** Configurazione **complessa**.": "**The main trade-off:** **Complex** setup." });
    expect(translate("Il compromesso principale: Configurazione complessa.")).toBe("The main trade-off: Complex setup.");
    expect(translate("Configurazione complessa.")).toBe("Complex setup.");
  });
  it("localizes composite summaries and monthly prices without converting currencies", () => {
    expect(t("3 tool · €0–30/mese · Livello Base")).toBe("3 tools · €0–30/month · Level: Beginner");
    expect(t("€0/mese")).toBe("€0/month");
    expect(t("My personal summary · Claude")).toBe("My personal summary · Claude");
  });
  it("localizes dates without changing freeform prose", () => {
    expect(t("13 ottobre 2026")).toBe("13 October 2026");
    expect(t("ottobre 2026")).toBe("October 2026");
    expect(t("13 ott 2026")).toBe("13 Oct 2026");
  });
  it("keeps Markdown structure, links, code and callout markers intact", () => {
    const source = "## Guida pratica\n\n::: tip Guida pratica\nUsa [Claude](https://claude.ai) e `npm run build`.\n:::\n\n```js\nSalva\n```\n\n[ref]: https://example.com/Salva\n- Salva";
    expect(translateMarkdown(source, t)).toBe("## Practical guide\n\n::: tip Practical guide\nUse [Claude](https://claude.ai) and `npm run build`.\n:::\n\n```js\nSalva\n```\n\n[ref]: https://example.com/Salva\n- Save");
  });
});
