// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
const MOCK_DOCK_HEIGHT = 40;

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

function trayHeight(): string {
  return document.documentElement.style.getPropertyValue("--tv-tray-height");
}

describe("CompareSessionDock states", () => {
  let rectSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    navRuntime.pathname = "/archivio";
    seedWorkspace(createEmptyWorkspaceState());
    document.documentElement.style.removeProperty("--tv-tray-height");
    rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const height = this.hasAttribute("data-compare-dock") ? MOCK_DOCK_HEIGHT : 0;
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 400,
          bottom: height,
          width: 400,
          height,
          toJSON() {
            return {};
          },
        } as DOMRect;
      });
  });

  afterEach(() => {
    cleanup();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    window.localStorage.clear();
    document.documentElement.style.removeProperty("--tv-tray-height");
    rectSpy?.mockRestore();
  });

  it("stays hidden with zero candidates", () => {
    render(<CompareSessionDock />);
    expect(document.querySelector("[data-compare-dock]")).toBeNull();
    expect(trayHeight()).toBe("0px");
  });

  it("appears with one candidate, expanded on comparison routes", () => {
    seedWorkspace(compareState("atlas-ai"));
    render(<CompareSessionDock />);
    const dock = document.querySelector("[data-compare-dock]");
    expect(dock).toBeTruthy();
    expect(dock?.getAttribute("data-compare-chrome")).toBe("expanded");
    expect(dock?.hasAttribute("data-compare-dock-collapsed")).toBe(false);
    expect(dock?.hasAttribute("data-ready")).toBe(false);
    expect(dock?.getAttribute("data-count")).toBe("1");
    expect(screen.getByRole("link", { name: "Aggiungi un altro" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Togli atlas-ai dal confronto" })).toBeTruthy();
    expect(trayHeight()).toMatch(/^\d+(?:\.\d+)?px$/);
    expect(trayHeight()).not.toBe("0px");
  });

  it("marks ready at two candidates with Confronta", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<CompareSessionDock />);
    const dock = document.querySelector("[data-compare-dock]");
    expect(dock?.hasAttribute("data-ready")).toBe(true);
    expect(dock?.getAttribute("data-count")).toBe("2");
    expect(dock?.getAttribute("data-compare-chrome")).toBe("expanded");
    expect(dock?.hasAttribute("data-compare-dock-collapsed")).toBe(false);
    expect(screen.getByRole("link", { name: "Confronta" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Togli atlas-ai dal confronto" })).toBeTruthy();
  });

  it("hides on the compare route", () => {
    navRuntime.pathname = "/compare";
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<CompareSessionDock />);
    expect(document.querySelector("[data-compare-dock]")).toBeNull();
    expect(trayHeight()).toBe("0px");
  });

  it("collapses on toggle and re-expands from the compact control", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<CompareSessionDock />);
    fireEvent.click(
      screen.getByRole("button", { name: "Nascondi i tool in confronto" }),
    );
    const dock = document.querySelector("[data-compare-dock]");
    expect(dock?.getAttribute("data-compare-chrome")).toBe("compact");
    expect(dock?.hasAttribute("data-compare-dock-collapsed")).toBe(true);
    expect(screen.queryByRole("button", { name: /Togli / })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Mostra i tool in confronto" }),
    );
    expect(dock?.getAttribute("data-compare-chrome")).toBe("expanded");
    expect(screen.getByRole("button", { name: "Togli atlas-ai dal confronto" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Togli gamma-app dal confronto" })).toBeTruthy();
    expect(screen.getByText("atlas-ai")).toBeTruthy();
    expect(screen.getByText("gamma-app")).toBeTruthy();
    expect(trayHeight()).toMatch(/^\d+(?:\.\d+)?px$/);
    expect(trayHeight()).not.toBe("0px");
  });

  it("starts compact on account routes and expands on tap", () => {
    navRuntime.pathname = "/account/settings";
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<CompareSessionDock />);
    const dock = document.querySelector("[data-compare-dock]");
    expect(dock?.getAttribute("data-compare-context")).toBe("compact-first");
    expect(dock?.getAttribute("data-compare-chrome")).toBe("compact");
    expect(screen.queryByRole("button", { name: /Togli / })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mostra i tool in confronto" }));
    expect(dock?.getAttribute("data-compare-chrome")).toBe("expanded");
    expect(screen.getByRole("link", { name: "Confronta" })).toBeTruthy();
  });

  it("stays collapsed on guide routes", () => {
    navRuntime.pathname = "/posts/come-scegliere";
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<CompareSessionDock />);
    const dock = document.querySelector("[data-compare-dock]");
    expect(dock?.hasAttribute("data-compare-dock-collapsed")).toBe(true);
    expect(
      screen.queryByRole("button", { name: "Mostra i tool in confronto" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /Togli / })).toBeNull();
  });
});
