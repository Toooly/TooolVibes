// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { ToolBattleView } from "@/components/tools/tool-battle-view";
import { createToolPublicView } from "@/lib/data/tool-public-view";
import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import { markGuestWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { COMPARE_OBJECTIVE_STORAGE_KEY } from "@/lib/compare/compare-objective";

function selectedValue(element: HTMLElement) {
  if (!(element instanceof HTMLSelectElement))
    throw new Error("Expected a select control");
  return element.value;
}

const tools = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"].map(
  (slug, index) =>
    createToolPublicView({
      ...completeToolPublicFixture,
      slug,
      name: slug,
      content: {
        ...completeToolPublicFixture.content,
        bestFor: index > 1 ? `Scenario ${index}` : "Stesso scenario",
      },
    }),
);
let desktop = false;
const listeners = new Set<() => void>();
function resize(value: boolean) {
  desktop = value;
  act(() => listeners.forEach((listener) => listener()));
}
function seed(slugs = ["alpha", "beta", "gamma"]) {
  let state = createEmptyWorkspaceState();
  state = reduceWorkspaceState(state, {
    type: "saved/toggle",
    slug: "alpha",
    at: "2026-10-15T12:00:00Z",
  });
  for (const slug of slugs)
    state = reduceWorkspaceState(state, {
      type: "compare/toggle",
      slug,
      at: "2026-10-15T12:00:00Z",
    });
  markGuestWorkspaceOwner(window.localStorage);
  activateToolWorkspaceOwner({ kind: "guest" }, state);
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}
beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/compare");
  desktop = false;
  vi.stubGlobal("matchMedia", (media: string) => ({
    media,
    get matches() {
      return desktop;
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  seed();
});
afterEach(() => {
  cleanup();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  vi.unstubAllGlobals();
});
async function ready() {
  return screen.findByRole("combobox", { name: "Primo tool" });
}
describe("Compare V2 shared state and distinct presentations", () => {
  it("compares a pair, retains pool and filter on resize, mounts one renderer", async () => {
    const { container } = render(<ToolBattleView tools={tools} />);
    await ready();
    fireEvent.change(screen.getByRole("combobox", { name: "Secondo tool" }), {
      target: { value: "gamma" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Mostra solo differenze" }),
    );
    resize(true);
    await waitFor(() =>
      expect(
        container.querySelectorAll('[data-compare-renderer="desktop"]'),
      ).toHaveLength(1),
    );
    expect(
      container.querySelector('[data-compare-renderer="mobile"]'),
    ).toBeNull();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    resize(false);
    await ready();
    expect(
      selectedValue(screen.getByRole("combobox", { name: "Secondo tool" })),
    ).toBe("gamma");
    expect(useToolWorkspaceStore.getState().compareSlugs).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
    expect(useToolWorkspaceStore.getState().savedSlugs).toEqual(["alpha"]);
  });
  it("unmounts closed details and removes equivalent rows from the matrix", async () => {
    const { container } = render(<ToolBattleView tools={tools} />);
    await ready();
    expect(container.querySelectorAll(".cv-group__rows")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /^In sintesi/ }));
    expect(
      container.querySelector('.cv-criterion[data-criterion="best-for"]'),
    ).not.toBeNull();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(
      container.querySelector('.cv-criterion[data-criterion="best-for"]'),
    ).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "Secondo tool" }), {
      target: { value: "gamma" },
    });
    expect(
      container.querySelector('.cv-criterion[data-criterion="best-for"]'),
    ).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^In sintesi/ }));
    expect(container.querySelectorAll(".cv-group__rows")).toHaveLength(0);
  });
  it("replaces at the canonical cap and preserves saved state and pair position", async () => {
    seed(["alpha", "beta", "gamma", "delta", "epsilon"]);
    render(<ToolBattleView tools={tools} />);
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Sostituisci alpha" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByRole("searchbox"), {
      target: { value: "zeta" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /zeta/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(useToolWorkspaceStore.getState().compareSlugs).toEqual([
      "beta",
      "gamma",
      "delta",
      "epsilon",
      "zeta",
    ]);
    expect(
      selectedValue(screen.getByRole("combobox", { name: "Primo tool" })),
    ).toBe("zeta");
    expect(useToolWorkspaceStore.getState().savedSlugs).toEqual(["alpha"]);
  });
  it("manages tools in place, including an empty or incomplete comparison", async () => {
    seed([]);
    render(<ToolBattleView tools={tools} />);
    expect(screen.getByText("Scegli almeno due tool.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi tool/ }));
    let dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /alpha/ }));
    expect(useToolWorkspaceStore.getState().compareSlugs).toEqual(["alpha"]);
    fireEvent.click(screen.getByRole("button", { name: /Gestisci tool/ }));
    dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /beta/ }));
    await ready();
    fireEvent.click(screen.getByRole("button", { name: /Gestisci tool/ }));
    dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Rimuovi alpha" }),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Chiudi" }));
    expect(useToolWorkspaceStore.getState().compareSlugs).toEqual(["beta"]);
    expect(useToolWorkspaceStore.getState().savedSlugs).toEqual(["alpha"]);
  });
  it("restores a deep-linked goal and persists changes across surfaces", async () => {
    window.history.replaceState(
      null,
      "",
      "/compare?objective=save-money&keep=1",
    );
    render(<ToolBattleView tools={tools} />);
    await ready();
    expect(
      selectedValue(screen.getByRole("combobox", { name: "Obiettivo" })),
    ).toBe("save-money");
    fireEvent.change(screen.getByRole("combobox", { name: "Obiettivo" }), {
      target: { value: "quality" },
    });
    resize(true);
    await waitFor(() =>
      expect(document.querySelector(".cv-desktop")).not.toBeNull(),
    );
    expect(localStorage.getItem(COMPARE_OBJECTIVE_STORAGE_KEY)).toBe("quality");
    expect(window.location.search).toContain("keep=1");
    expect(
      selectedValue(screen.getByRole("combobox", { name: "Obiettivo" })),
    ).toBe("quality");
  });
  it("respects objective and decision feature flags", async () => {
    render(
      <ToolBattleView
        tools={tools}
        objectiveEnabled={false}
        decisionEnabled={false}
      />,
    );
    await ready();
    expect(screen.queryByRole("combobox", { name: "Obiettivo" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Scegli alpha/ })).toBeNull();
  });
  it("has accessible labels and disclosure controls", async () => {
    const { container } = render(<ToolBattleView tools={tools} />);
    await ready();
    const result = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });
    expect(result.violations.map((item) => item.id)).toEqual([]);
  });
});
