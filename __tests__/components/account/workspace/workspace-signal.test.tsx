// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emptySignalHub, workspaceTestFixtures } from "@/lib/account/test-fixtures";

const fetchSignalHub = vi.hoisted(() => vi.fn());
const signalUiRuntime = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/lib/signal-progression/client", () => ({
  fetchSignalHub: (...args: unknown[]) => fetchSignalHub(...args),
}));

vi.mock("@/lib/signal-progression/release-context", () => ({
  useSignalProgressUiEnabled: () => signalUiRuntime.enabled,
}));

vi.mock("@/components/account/workspace/use-canonical-workspace", () => ({
  useCanonicalWorkspace: () => workspaceTestFixtures.mature,
}));

vi.mock("@/components/account/panel/account-signal-progress-section", () => ({
  AccountSignalProgressSection: () => null,
}));

import { WorkspaceSignal } from "@/components/account/workspace/workspace-signal";

describe("WorkspaceSignal", () => {
  beforeEach(() => {
    signalUiRuntime.enabled = false;
    fetchSignalHub.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not force the map to level 1 when the hub is level 3", async () => {
    fetchSignalHub.mockResolvedValue({
      ...emptySignalHub(),
      level: 3,
      levelTitle: "Builder",
    });

    render(createElement(WorkspaceSignal));

    await waitFor(() => {
      expect(screen.getByText("Livello 3 · Builder")).toBeTruthy();
    });

    const map = screen.getByRole("list", { name: "Mappa del segnale" });
    const nodes = within(map).getAllByRole("listitem");
    expect(nodes[0]?.className).toContain("is-earned");
    expect(nodes[0]?.className).not.toContain("is-nearby");
    expect(nodes[2]?.className).toContain("is-nearby");
    expect(nodes[2]?.textContent).toContain("Builder");
  });

  it("does not claim Esploratore when the hub is missing", async () => {
    fetchSignalHub.mockResolvedValue(null);

    render(createElement(WorkspaceSignal));

    await waitFor(() => {
      expect(fetchSignalHub).toHaveBeenCalled();
    });

    expect(screen.queryByText(/Livello 1/)).toBeNull();
    const map = screen.getByRole("list", { name: "Mappa del segnale" });
    const nodes = within(map).getAllByRole("listitem");
    expect(nodes.every((node) => node.className.includes("is-locked"))).toBe(true);
    expect(screen.getByText(/non ci sono XP/)).toBeTruthy();
  });
});
