// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { navRuntime } = vi.hoisted(() => ({
  navRuntime: { pathname: "/archivio" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navRuntime.pathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { CompareLiveChip } from "@/components/layout/compare-live-chip";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import { markGuestWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";

const T0 = "2026-07-17T10:00:00.000Z";

function compareState(...slugs: string[]): WorkspaceStateV1 {
  return slugs.reduce(
    (state, slug) =>
      reduceWorkspaceState(state, { type: "compare/toggle", slug, at: T0 }),
    createEmptyWorkspaceState(),
  );
}

function seedWorkspace(state: WorkspaceStateV1) {
  window.localStorage.clear();
  expect(markGuestWorkspaceOwner(window.localStorage)).toBe(true);
  activateToolWorkspaceOwner({ kind: "guest" }, state);
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

describe("CompareLiveChip — Wave 7 collector", () => {
  beforeEach(() => {
    navRuntime.pathname = "/archivio";
    seedWorkspace(createEmptyWorkspaceState());
  });

  afterEach(() => {
    cleanup();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    window.localStorage.clear();
  });

  it("hides at count 0", () => {
    render(<CompareLiveChip placement="dock" />);
    expect(screen.queryByRole("link", { name: /Confronta/ })).toBeNull();
    expect(document.querySelector("[data-compare-live-chip]")).toBeNull();
  });

  it("updates the Confronta n/5 label from 1 to 5", () => {
    seedWorkspace(compareState("atlas-ai"));
    const { rerender } = render(<CompareLiveChip placement="dock" />);
    expect(screen.getByRole("link", { name: "Confronta 1 su 5" }).textContent).toBe(
      "Confronta 1/5",
    );

    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    rerender(<CompareLiveChip placement="dock" />);
    expect(screen.getByRole("link", { name: "Confronta 2 su 5" }).textContent).toBe(
      "Confronta 2/5",
    );

    seedWorkspace(compareState("a", "b", "c", "d", "e"));
    rerender(<CompareLiveChip placement="dock" />);
    expect(screen.getByRole("link", { name: "Confronta 5 su 5" }).textContent).toBe(
      "Confronta 5/5",
    );
  });

  it("reads the same compare.slugs as the workbench store", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<CompareLiveChip placement="header" />);
    const chip = screen.getByRole("link", { name: "Confronta 2 su 5" });
    expect(chip.getAttribute("href")).toBe("/compare");
    expect(chip.getAttribute("data-compare-live-chip")).toBe("header");
  });

  it("stays visible on /compare and sets aria-current", () => {
    navRuntime.pathname = "/compare";
    seedWorkspace(compareState("atlas-ai"));
    render(<CompareLiveChip placement="dock" />);
    const chip = screen.getByRole("link", { name: "Confronta 1 su 5" });
    expect(chip.getAttribute("aria-current")).toBe("page");
    expect(chip.getAttribute("data-active")).toBe("true");
    expect(chip.getAttribute("href")).toBe("/compare");
  });

  it("does not mark current off the workbench route", () => {
    navRuntime.pathname = "/archivio";
    seedWorkspace(compareState("atlas-ai"));
    render(<CompareLiveChip placement="dock" />);
    const chip = screen.getByRole("link", { name: "Confronta 1 su 5" });
    expect(chip.getAttribute("aria-current")).toBeNull();
    expect(chip.getAttribute("data-active")).toBeNull();
  });
});
