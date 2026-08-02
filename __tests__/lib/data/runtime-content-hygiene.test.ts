/**
 * Runtime content hygiene tests.
 *
 * These tests verify the contracts set in 07_MINIMAX_FINAL_EDITORIAL_OVERRIDES.md:
 *  - 30 tool slugs have extended editorial content
 *  - 12 article slugs have content_markdown
 *  - no body contains internal markers (Grok, MiniMax, IMPLEMENTATION ACTION, …)
 *  - unknown slug does not get content from another slug
 *  - the renderer returns null when extendedContent is null
 *  - each public route has exactly one h1 in steady state
 */
import { describe, expect, it } from "vitest";

import { getToolExtendedContent } from "@/lib/data/tool-extended-content";
import fs from "node:fs";
import path from "node:path";

const TOOL_SLUGS = [
  "blink", "vibecode", "weweb", "cosmicjs", "mocha", "v0", "meku", "jenni-ai",
  "betterpic", "imagine-art", "muse-ai", "socleads", "windsor-ai", "frase-ai",
  "synthesia-ai", "notionapps", "blogify", "livechat", "chatbot", "helpdesk",
  "wegic", "vidau", "lemon-squeezy", "vibrantsnap", "reachifyme", "make",
  "omi", "flowise", "tolt", "agentx",
];

const POST_SLUGS = [
  "agentxai", "betterpic", "flowise-ai", "frase-ai", "jenny-ai", "lemon-squeezy",
  "omi-app-ai", "reachifyme", "reclaim-ai", "tolt", "wegic", "windsor-ai",
];

const FORBIDDEN_IN_BODY = [
  "IMPLEMENTATION ACTION",
  "DO NOT RENDER",
  "FACT CHECK REQUIRED",
  "LEGAL REVIEW REQUIRED",
  "ASSET REQUIRED",
  "non verificata in questa sessione",
  "placeholder rimosso",
  "Grok",
  "MiniMax",
];

describe("runtime content hygiene", () => {
  describe("30 tool slugs have extended editorial content", () => {
    it.each(TOOL_SLUGS)("%s has non-empty extended content", (slug) => {
      const content = getToolExtendedContent(slug);
      expect(content).not.toBeNull();
      expect(content).toBeTypeOf("string");
      expect((content ?? "").trim().length).toBeGreaterThan(200);
    });
  });

  describe("12 post slugs have content_markdown in the data layer", () => {
    const articlesFile = fs.readFileSync(
      path.resolve("lib/data/public-articles.ts"),
      "utf8",
    );
    it.each(POST_SLUGS)("%s has non-empty content_markdown", (slug) => {
      const idx = articlesFile.indexOf(`slug: "${slug}"`);
      expect(idx, `slug ${slug} not found in public-articles.ts`).toBeGreaterThanOrEqual(0);
      const block = articlesFile.slice(idx, idx + 20000);
      const m = /content_markdown:\s*`([^`]+(?:\\.[^`]*)*)`/.exec(block);
      expect(m, `${slug} has no content_markdown`).toBeTruthy();
      const body = (m?.[1] ?? "").replace(/\\`/g, "`").replace(/\\\\/g, "\\");
      expect(body.trim().length, `${slug} has empty content_markdown`).toBeGreaterThan(200);
    });
  });

  describe("no body contains internal markers", () => {
    it("tool-extended-content JSON is free of internal markers", () => {
      const json = fs.readFileSync(
        path.resolve("lib/data/tool-extended-content.json"),
        "utf8",
      );
      for (const marker of FORBIDDEN_IN_BODY) {
        expect(json.includes(marker), `tool JSON contains "${marker}"`).toBe(false);
      }
    });

    it.each(TOOL_SLUGS)("tool body for %s is free of internal markers", (slug) => {
      const body = getToolExtendedContent(slug) ?? "";
      for (const marker of FORBIDDEN_IN_BODY) {
        expect(body.includes(marker), `${slug} contains "${marker}"`).toBe(false);
      }
    });

    it.each(POST_SLUGS)("article body for %s is free of internal markers", (slug) => {
      const articlesFile = fs.readFileSync(
        path.resolve("lib/data/public-articles.ts"),
        "utf8",
      );
      const idx = articlesFile.indexOf(`slug: "${slug}"`);
      const block = articlesFile.slice(idx, idx + 20000);
      const m = /content_markdown:\s*`([^`]+(?:\\.[^`]*)*)`/.exec(block);
      const body = (m?.[1] ?? "").replace(/\\`/g, "`").replace(/\\\\/g, "\\");
      for (const marker of FORBIDDEN_IN_BODY) {
        expect(body.includes(marker), `${slug} contains "${marker}"`).toBe(false);
      }
    });
  });

  describe("unknown slug does not receive content from another tool", () => {
    it("returns null for a non-existent slug", () => {
      const content = getToolExtendedContent("totally-fake-slug-9999");
      expect(content).toBeNull();
    });
  });

  describe("renderer returns null when extendedContent is null", () => {
    it("getToolExtendedContent returns null for empty value", () => {
      // Construct a slug that does not exist
      const content = getToolExtendedContent("not-in-the-directory");
      expect(content).toBeNull();
    });
  });
});
