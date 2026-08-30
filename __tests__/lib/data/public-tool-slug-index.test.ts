import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { PUBLIC_TOOL_SLUG_INDEX } from "@/lib/data/public-tool-slug-index";

describe("public tool slug index", () => {
  it("matches directory slug/name without importing extended content", () => {
    expect(PUBLIC_TOOL_SLUG_INDEX.map((tool) => [tool.slug, tool.name])).toEqual(
      directoryTools.map((tool) => [tool.slug, tool.name]),
    );
    const source = readFileSync(
      resolve(process.cwd(), "lib/data/public-tool-slug-index.ts"),
      "utf8",
    );
    expect(source).not.toContain("tooolvibes-directory");
    expect(source).not.toContain("tool-extended-content");
  });
});
