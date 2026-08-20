import { describe, expect, it } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import {
  buildWorkspaceExportPayload,
  isWorkspaceResetConfirmed,
  workspaceExportFilename,
} from "@/lib/account/workspace-export";

describe("workspace export payload", () => {
  it("includes schemaVersion 1 and toolStates", () => {
    const state = workspaceTestFixtures.withSaved;
    const payload = buildWorkspaceExportPayload(
      state,
      new Date("2026-08-20T09:30:00.000Z"),
    );

    expect(payload).toEqual({
      exportedAt: "2026-08-20T09:30:00.000Z",
      product: "tooolvibes-workspace",
      schemaVersion: 1,
      state,
    });
    expect(payload.state.toolStates).toBe(state.toolStates);
    expect(payload.state.toolStates).toHaveProperty("cursor");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("access_token");
  });

  it("names the file tooolvibes-workspace-YYYY-MM-DD.json", () => {
    expect(workspaceExportFilename(new Date("2026-08-20T09:30:00.000Z"))).toBe(
      "tooolvibes-workspace-2026-08-20.json",
    );
  });
});

describe("workspace reset confirmation", () => {
  it("does not confirm without an exact RESET", () => {
    expect(isWorkspaceResetConfirmed("")).toBe(false);
    expect(isWorkspaceResetConfirmed("reset")).toBe(false);
    expect(isWorkspaceResetConfirmed("RESET ")).toBe(false);
    expect(isWorkspaceResetConfirmed(" RESET")).toBe(false);
    expect(isWorkspaceResetConfirmed("RESET")).toBe(true);
  });
});
