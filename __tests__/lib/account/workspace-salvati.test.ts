import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { salvatiHref } from "@/components/account/workspace/workspace-model";
import {
  setWorkspaceDecision,
  setWorkspaceNote,
  toggleWorkspaceCompare,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import { listPipelineItems } from "@/lib/account/workspace-pipeline";
import { buildWorkspaceExportPayload } from "@/lib/account/workspace-export";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
});

describe("Wave 3 one Salvati corpus", () => {
  it("W3-T1/T2: guest saves land in one saved corpus", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceSaved("cursor");
    toggleWorkspaceSaved("v0");
    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toEqual(["cursor", "v0"]);
    expect(listPipelineItems(state).map((item) => item.slug)).toEqual([
      "cursor",
      "v0",
    ]);
  });

  it("W3-T4/T7/T8/T10/T11/T12: auth Salvati uses the same corpus and canonical decide", () => {
    activateToolWorkspaceOwner({ kind: "account", userId: "user-w3" }, createEmptyWorkspaceState());
    toggleWorkspaceSaved("cursor");
    toggleWorkspaceSaved("v0");
    toggleWorkspaceCompare("cursor");
    toggleWorkspaceCompare("v0");
    setWorkspaceNote("cursor", "per scrivere");
    setWorkspaceDecision("cursor", "selected");

    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toEqual(["cursor", "v0"]);
    expect(state.compare.slugs).toEqual([]);
    expect(state.toolStates.cursor?.note).toBe("per scrivere");
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(state.events.some((event) => event.type === "decided")).toBe(true);

    toggleWorkspaceSaved("v0");
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
  });

  it("W3-T9: post-Decide Salvati destination is auth-aware", () => {
    expect(salvatiHref(false)).toBe("/shortlist");
    expect(salvatiHref(true)).toBe("/account?view=salvati");
  });

  it("W3-T13: export still includes events after Salvati writes", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceSaved("cursor");
    setWorkspaceDecision("cursor", "selected");
    const payload = buildWorkspaceExportPayload(getCanonicalToolWorkspaceState());
    expect(payload.state.events).toHaveLength(1);
  });

  it("W3-T14: 150 saved relationships stay one corpus", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    for (let index = 0; index < 150; index += 1) {
      toggleWorkspaceSaved(`tool-${index}`);
    }
    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toHaveLength(150);
    expect(listPipelineItems(state)).toHaveLength(150);
  });
});

describe("W3-T15 no live authenticated second saved corpus", () => {
  const root = process.cwd();

  function read(rel: string) {
    return readFileSync(join(root, rel), "utf8");
  }

  it("canonical dest helpers and live CTAs use Salvati, not Biblioteca", () => {
    const model = read("components/account/workspace/workspace-model.ts");
    const panel = read("components/tools/compare-decision-panel.tsx");
    const link = read("components/tools/shortlist-link.tsx");
    const gate = read("components/tools/shortlist-route-gate.tsx");
    const biblioteca = read("components/account/workspace/workspace-biblioteca.tsx");

    expect(model).toContain('salvati: "Salvati"');
    expect(model).toContain('biblioteca: "salvati"');
    expect(panel).toContain("salvatiHref");
    expect(link).toContain("salvatiHref");
    expect(gate).toContain('workspaceViewHref("salvati")');
    expect(biblioteca).toContain(">Salvati<");
    expect(biblioteca).not.toContain(">Biblioteca<");
  });
});
