// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emptySignalHub } from "@/lib/account/test-fixtures";

const fetchSignalHub = vi.hoisted(() => vi.fn());
const signalUiRuntime = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/lib/signal-progression/client", () => ({
  fetchSignalHub: (...args: unknown[]) => fetchSignalHub(...args),
}));

vi.mock("@/lib/signal-progression/release-context", () => ({
  useSignalProgressUiEnabled: () => signalUiRuntime.enabled,
}));

vi.mock("@/components/account/panel/account-signal-progress-section", () => ({
  AccountSignalProgressSection: () =>
    createElement("div", { "data-testid": "signal-progress-section" }),
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

  it("shows the verified level title without map theatre", async () => {
    fetchSignalHub.mockResolvedValue({
      ...emptySignalHub(),
      level: 3,
      levelTitle: "Builder",
    });

    render(createElement(WorkspaceSignal));

    await waitFor(() => {
      expect(screen.getByText("Livello 3 · Builder")).toBeTruthy();
    });

    expect(screen.queryByRole("list", { name: "Mappa del segnale" })).toBeNull();
    expect(screen.queryByLabelText("Record personali")).toBeNull();
    expect(screen.queryByText(/Cinque territori/)).toBeNull();
  });

  it("does not claim Esploratore when the hub is missing", async () => {
    fetchSignalHub.mockResolvedValue(null);

    render(createElement(WorkspaceSignal));

    await waitFor(() => {
      expect(fetchSignalHub).toHaveBeenCalled();
    });

    expect(screen.queryByText(/Livello 1/)).toBeNull();
    expect(screen.queryByText("Esploratore")).toBeNull();
    expect(screen.getByText(/non ci sono XP/)).toBeTruthy();
  });

  it("keeps the progress section when flags are on", async () => {
    signalUiRuntime.enabled = true;
    fetchSignalHub.mockResolvedValue({
      ...emptySignalHub(),
      level: 2,
      levelTitle: "Selezionatore",
    });

    render(createElement(WorkspaceSignal));

    await waitFor(() => {
      expect(screen.getByText("Livello 2 · Selezionatore")).toBeTruthy();
    });
    expect(screen.getByTestId("signal-progress-section")).toBeTruthy();
  });
});
