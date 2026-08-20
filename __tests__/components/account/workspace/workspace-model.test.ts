import { describe, expect, it } from "vitest";

import {
  WORKSPACE_VIEWS,
  formatWorkspaceDate,
  parseWorkspaceView,
  workspaceFocusHref,
  workspaceViewHref,
} from "@/components/account/workspace/workspace-model";

describe("workspace-model", () => {
  it("keeps the canonical view set without attivita", () => {
    expect([...WORKSPACE_VIEWS]).toEqual([
      "riprendi",
      "biblioteca",
      "stack",
      "decisioni",
      "recenti",
      "segnale",
    ]);
  });

  it("parseWorkspaceView falls back to riprendi for empty or unknown values", () => {
    expect(parseWorkspaceView(null)).toBe("riprendi");
    expect(parseWorkspaceView(undefined)).toBe("riprendi");
    expect(parseWorkspaceView("")).toBe("riprendi");
    expect(parseWorkspaceView("nope")).toBe("riprendi");
  });

  it("parseWorkspaceView accepts canonical views and maps legacy attivita to recenti", () => {
    expect(parseWorkspaceView("biblioteca")).toBe("biblioteca");
    expect(parseWorkspaceView("recenti")).toBe("recenti");
    expect(parseWorkspaceView("attivita")).toBe("recenti");
  });

  it("workspaceViewHref is the only view-link builder", () => {
    expect(workspaceViewHref("riprendi")).toBe("/account");
    expect(workspaceViewHref("biblioteca")).toBe("/account?view=biblioteca");
    expect(workspaceViewHref("recenti")).toBe("/account?view=recenti");
    expect(workspaceViewHref("segnale")).toBe("/account?view=segnale");
  });

  it("workspaceViewHref appends optional focus and stack query params", () => {
    expect(workspaceViewHref("riprendi", { focus: "cursor" })).toBe(
      "/account?view=riprendi&focus=cursor",
    );
    expect(workspaceViewHref("biblioteca", { focus: "cursor" })).toBe(
      "/account?view=biblioteca&focus=cursor",
    );
    expect(workspaceViewHref("stack", { stack: "ai-coding" })).toBe(
      "/account?view=stack&stack=ai-coding",
    );
    expect(workspaceFocusHref("decisioni", "cursor")).toBe(
      "/account?view=decisioni&focus=cursor",
    );
  });

  it("formats workspace dates in Italian when the value is valid", () => {
    expect(formatWorkspaceDate(null)).toBeNull();
    expect(formatWorkspaceDate("nope")).toBeNull();
    expect(formatWorkspaceDate("2026-06-03T10:00:00.000Z")).toMatch(/giu/i);
  });
});
