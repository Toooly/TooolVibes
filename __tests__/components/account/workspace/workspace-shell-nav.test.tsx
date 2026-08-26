// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { navRuntime } = vi.hoisted(() => ({
  navRuntime: {
    pathname: "/account",
    search: "",
    push: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navRuntime.pathname,
  useSearchParams: () => new URLSearchParams(navRuntime.search),
  useRouter: () => ({ push: navRuntime.push }),
}));

vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => ({
    authEnabled: true,
    status: "authenticated",
    user: { email: "mario@example.com" },
    session: { access_token: "token-a" },
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: vi.fn(),
    restoreQuarantinedWorkspace: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/discovery/canonical-discovery-persistence-provider", () => ({
  useDiscoveryPersistence: () => ({ mode: "local", phase: "local-only" }),
}));

vi.mock("@/lib/discovery/client-store", () => ({
  useDiscoverySnapshot: () => ({
    visitedTools: [],
    exploredCategories: [],
    shortlist: [],
    compare: [],
    shortlistStages: {},
    decisionMemories: {},
    toolStateMeta: {},
    compareMeta: {},
  }),
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => [],
}));

import { LoopShellProvider } from "@/components/layout/loop-shell-context";
import { WorkspaceShell } from "@/components/account/workspace/workspace-shell";

function hrefsNamed(name: string) {
  return screen.queryAllByRole("link", { name }).map((link) => link.getAttribute("href"));
}

function currentNamed(name: string) {
  return screen
    .getAllByRole("link", { name })
    .map((link) => link.getAttribute("aria-current"));
}

describe("WorkspaceShell — URL-driven navigation", () => {
  beforeEach(() => {
    navRuntime.pathname = "/account";
    navRuntime.search = "";
    navRuntime.push.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("marks Salvati as the current page when ?view=salvati", () => {
    navRuntime.search = "view=salvati";
    render(createElement(WorkspaceShell));

    expect(currentNamed("Salvati").every((value) => value === "page")).toBe(true);
    expect(currentNamed("Home").every((value) => value !== "page")).toBe(true);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("maps legacy ?view=biblioteca onto canonical Salvati", () => {
    navRuntime.search = "view=biblioteca";
    render(createElement(WorkspaceShell));

    expect(currentNamed("Salvati").every((value) => value === "page")).toBe(true);
  });

  it("falls back to Home for an invalid view", () => {
    navRuntime.search = "view=nope";
    render(createElement(WorkspaceShell));

    expect(currentNamed("Home").every((value) => value === "page")).toBe(true);
    expect(currentNamed("Salvati").every((value) => value !== "page")).toBe(true);
  });

  it("builds real workspace view links, shows Recenti, and keeps Segnale out of chrome while Signal flags are off", () => {
    render(createElement(WorkspaceShell));

    expect(hrefsNamed("Home").every((href) => href === "/account")).toBe(true);
    expect(hrefsNamed("Salvati").every((href) => href === "/account?view=salvati")).toBe(
      true,
    );
    expect(hrefsNamed("Stack").every((href) => href === "/account?view=stack")).toBe(true);
    expect(hrefsNamed("Decisioni").every((href) => href === "/account?view=decisioni")).toBe(
      true,
    );
    expect(hrefsNamed("Recenti").every((href) => href === "/account?view=recenti")).toBe(true);
    expect(hrefsNamed("Recenti").length).toBeGreaterThan(0);
    expect(hrefsNamed("Segnale")).toEqual([]);
    expect(screen.getByLabelText("Stato del toolbox")).toBeTruthy();
  });

  it("drops atelier primary chrome when rendered inside LoopShell", () => {
    render(createElement(LoopShellProvider, null, createElement(WorkspaceShell)));

    expect(screen.queryByLabelText("Spazio personale")).toBeNull();
    expect(screen.queryByLabelText("Altre destinazioni")).toBeNull();
    expect(hrefsNamed("Decisioni")).toEqual([]);
    expect(hrefsNamed("Recenti")).toEqual([]);
    expect(screen.getByLabelText("Stato del toolbox")).toBeTruthy();
  });
});
