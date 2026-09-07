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

import { CompareSessionDock } from "@/components/layout/compare-session-dock";
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

describe("CompareSessionDock states", () => {
  beforeEach(() => {
    navRuntime.pathname = "/archivio";
    seedWorkspace(createEmptyWorkspaceState());
  });

  afterEach(() => {
    cleanup();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    window.localStorage.clear();
  });

  it("stays hidden with zero candidates", () => {
    render(<CompareSessionDock />);
    expect(document.querySelector("[data-compare-dock]")).toBeNull();
  });

  it("appears quietly with one candidate", () => {
    seedWorkspace(compareState("atlas-ai"));
    render(<CompareSessionDock />);
    const dock = document.querySelector("[data-compare-dock]");
    expect(dock).toBeTruthy();
    expect(dock?.hasAttribute("data-ready")).toBe(false);
    expect(dock?.getAttribute("data-count")).toBe("1");
    expect(screen.getByRole("link", { name: "Aggiungi un altro" })).toBeTruthy();
  });

  it("marks ready at two candidates", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<CompareSessionDock />);
    const dock = document.querySelector("[data-compare-dock]");
    expect(dock?.hasAttribute("data-ready")).toBe(true);
    expect(dock?.getAttribute("data-count")).toBe("2");
    expect(screen.getByRole("link", { name: "Confronta" })).toBeTruthy();
  });

  it("hides on the compare route", () => {
    navRuntime.pathname = "/compare";
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<CompareSessionDock />);
    expect(document.querySelector("[data-compare-dock]")).toBeNull();
  });
});
