import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  GET as getLegacyWorkspace,
  PUT as putLegacyWorkspace,
} from "@/app/api/discovery-state/route";
import { POST as attachLegacyWorkspace } from "@/app/api/discovery-account/attach/route";
import { POST as releaseLegacyWorkspace } from "@/app/api/discovery-account/release/route";

const root = process.cwd();
const legacyRouteFiles = [
  "app/api/discovery-state/route.ts",
  "app/api/discovery-account/attach/route.ts",
  "app/api/discovery-account/release/route.ts",
];

describe("retired discovery workspace routes", () => {
  it.each([
    ["GET /api/discovery-state", getLegacyWorkspace, "/api/workspace-state"],
    ["PUT /api/discovery-state", putLegacyWorkspace, "/api/workspace-state"],
    [
      "POST /api/discovery-account/attach",
      attachLegacyWorkspace,
      "/api/workspace-account/attach",
    ],
    [
      "POST /api/discovery-account/release",
      releaseLegacyWorkspace,
      "/api/workspace-account/release",
    ],
  ])("returns a non-cacheable 410 for %s", async (_name, handler, replacement) => {
    const response = await handler();

    expect(response.status).toBe(410);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Link")).toContain(replacement);
    await expect(response.json()).resolves.toEqual({
      error: "workspace-endpoint-retired",
      replacement,
    });
  });

  it("cannot import or call the retired remote repository", () => {
    for (const relativePath of legacyRouteFiles) {
      const source = fs.readFileSync(path.join(root, relativePath), "utf8");
      expect(source).not.toContain("remote-workspace");
      expect(source).not.toContain("createAdminSupabaseClient");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });
});
