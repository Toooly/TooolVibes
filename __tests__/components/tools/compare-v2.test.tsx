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
  return screen.findByRole("region", { name: "Tool a confronto" });
}
describe("Compare V2 shared state and distinct presentations", () => {
  it("shows the entire selection and retains the filter on resize with one renderer", async () => {
    const { container } = render(<ToolBattleView tools={tools} />);
    await ready();
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
    expect(within(screen.getByRole("region", { name: "Tool a confronto" })).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByRole("combobox", { name: "Secondo tool" })).toBeNull();
    expect(container.querySelectorAll(".cv-key__values > div").length % 3).toBe(0);
    expect(screen.getByRole("button", { name: "Scegli gamma" })).toBeTruthy();
    expect(useToolWorkspaceStore.getState().compareSlugs).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
    expect(useToolWorkspaceStore.getState().savedSlugs).toEqual(["alpha"]);
  });
  it("unmounts closed details and compares differences across the entire selection", async () => {
    seed(["alpha", "beta"]);
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
    fireEvent.click(screen.getByRole("button", { name: "Gestisci tool" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /gamma/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(
      container.querySelector('.cv-criterion[data-criterion="best-for"]'),
    ).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^In sintesi/ }));
    expect(container.querySelectorAll(".cv-group__rows")).toHaveLength(0);
  });
  it("replaces at the canonical cap and preserves saved state with a valid focus target", async () => {
    seed(["alpha", "beta", "gamma", "delta", "epsilon"]);
    render(<ToolBattleView tools={tools} />);
    await ready();
    const first = screen.getByRole("button", { name: "Sostituisci alpha" });
    first.focus();
    fireEvent.click(first);
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
    expect(screen.queryByRole("button", { name: "Sostituisci alpha" })).toBeNull();
    expect(screen.getByRole("button", { name: "Sostituisci zeta" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Scegli zeta" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Gestisci tool" }));
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
  it("opens the target section and moves focus from desktop section navigation", async () => {
    resize(true);
    render(<ToolBattleView tools={tools} />);
    await waitFor(() =>
      expect(document.querySelector(".cv-desktop")).not.toBeNull(),
    );
    fireEvent.click(screen.getByRole("link", { name: "Prezzi e condizioni" }));
    const trigger = screen.getByRole("button", {
      name: /^Prezzi e condizioni/,
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();
  });
  it("clears from the manager, preserves Save and restores focus to the empty-state action", async () => {
    render(<ToolBattleView tools={tools} />);
    await ready();
    const manage = screen.getByRole("button", { name: "Gestisci tool" });
    manage.focus();
    fireEvent.click(manage);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Azzera confronto" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(useToolWorkspaceStore.getState().compareSlugs).toEqual([]);
    expect(useToolWorkspaceStore.getState().savedSlugs).toEqual(["alpha"]);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /Aggiungi tool/ }),
    );
  });
  it("closes only a press that starts on the backdrop and remains reopenable", async () => {
    render(<ToolBattleView tools={tools} />);
    await ready();
    const manage = screen.getByRole("button", { name: "Gestisci tool" });
    manage.focus();
    fireEvent.click(manage);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(dialog);
    expect(screen.getByRole("dialog")).toBe(dialog);
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(manage);
    fireEvent.click(manage);
    expect(await screen.findByRole("dialog")).toBeTruthy();
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
