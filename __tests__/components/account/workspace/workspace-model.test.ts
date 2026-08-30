import { describe, expect, it } from "vitest";

import {
  WORKSPACE_VIEWS,
  formatWorkspaceDate,
  parseWorkspaceView,
  salvatiHref,
  workspaceFocusHref,
  personalDashboardHref,
  workspaceViewHref,
} from "@/components/account/workspace/workspace-model";

describe("workspace-model", () => {
  it("keeps the canonical view set without attivita", () => {
    expect([...WORKSPACE_VIEWS]).toEqual([
      "riprendi",
      "salvati",
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

  it("parseWorkspaceView accepts canonical views and maps legacy aliases", () => {
    expect(parseWorkspaceView("salvati")).toBe("salvati");
    expect(parseWorkspaceView("biblioteca")).toBe("salvati");
    expect(parseWorkspaceView("recenti")).toBe("recenti");
    expect(parseWorkspaceView("attivita")).toBe("recenti");
  });

  it("salvatiHref is guest /shortlist and auth canonical Salvati", () => {
    expect(salvatiHref(false)).toBe("/shortlist");
    expect(salvatiHref(true)).toBe("/account?view=salvati");
  });

  it("workspaceViewHref is the only view-link builder", () => {
    expect(workspaceViewHref("riprendi")).toBe("/account");
    expect(personalDashboardHref()).toBe("/account?view=riprendi");
    expect(workspaceViewHref("salvati")).toBe("/account?view=salvati");
    expect(workspaceViewHref("recenti")).toBe("/account?view=recenti");
    expect(workspaceViewHref("segnale")).toBe("/account?view=segnale");
  });

  it("workspaceViewHref appends optional focus and stack query params", () => {
    expect(workspaceViewHref("riprendi", { focus: "cursor" })).toBe(
      "/account?view=riprendi&focus=cursor",
    );
    expect(workspaceViewHref("salvati", { focus: "cursor" })).toBe(
      "/account?view=salvati&focus=cursor",
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
