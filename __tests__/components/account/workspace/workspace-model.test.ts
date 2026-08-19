import { describe, expect, it } from "vitest";

import {
  WORKSPACE_VIEWS,
  parseWorkspaceView,
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
});
