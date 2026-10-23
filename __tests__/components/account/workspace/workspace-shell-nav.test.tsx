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

vi.mock("@/lib/radar/use-product-hunt-radar", () => ({
  useProductHuntRadar: () => ({
    payload: undefined,
    isLoading: false,
    isFetching: false,
  }),
}));


import { LoopShellProvider } from "@/components/layout/loop-shell-context";
import { WorkspaceShell } from "@/components/account/workspace/workspace-shell";
import { AccountWorkspaceFrame } from "@/components/account/workspace/account-workspace-frame";

describe("WorkspaceShell — URL-driven navigation", () => {
  beforeEach(() => {
    navRuntime.pathname = "/account";
    navRuntime.search = "";
    navRuntime.push.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("reveals the active settings link horizontally without scrolling the page", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("tv-space-switch")) return new DOMRect(0, 0, 320, 44);
      if (this.getAttribute("href") === "/account/settings") return new DOMRect(430, 0, 110, 44);
      return new DOMRect(8, 0, 100, 44);
    });
    const pageScroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { rerender } = render(<AccountWorkspaceFrame surface="workspace">{null}</AccountWorkspaceFrame>);
    const nav = screen.getByRole("navigation", { name: "Il tuo spazio" });
    nav.scrollTop = 37;

    rerender(<AccountWorkspaceFrame surface="settings">{null}</AccountWorkspaceFrame>);

    expect(screen.getByRole("link", { name: "Impostazioni" }).getAttribute("aria-current")).toBe("page");
    expect(nav.scrollLeft).toBe(228);
    expect(nav.scrollTop).toBe(37);
    expect(pageScroll).not.toHaveBeenCalled();
  });

  it("keeps an already visible active destination still", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return this.classList.contains("tv-space-switch")
        ? new DOMRect(0, 0, 320, 44)
        : new DOMRect(80, 0, 100, 44);
    });
    render(<AccountWorkspaceFrame view="salvati">{null}</AccountWorkspaceFrame>);
    expect(screen.getByRole("navigation", { name: "Il tuo spazio" }).scrollLeft).toBe(0);
  });

  it("marks Salvati as the current page when ?view=salvati", () => {
    navRuntime.search = "view=salvati";
    render(createElement(WorkspaceShell));

    expect(screen.getByRole("heading", { name: "Salvati" })).toBeTruthy();
    expect(screen.getByText("Nessun tool salvato ancora")).toBeTruthy();
    expect(screen.queryByText("Il tuo spazio è pronto")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("maps legacy ?view=biblioteca onto canonical Salvati", () => {
    navRuntime.search = "view=biblioteca";
    render(createElement(WorkspaceShell));

    expect(screen.getByRole("heading", { name: "Salvati" })).toBeTruthy();
    expect(screen.getByText("Nessun tool salvato ancora")).toBeTruthy();
  });

  it("falls back to Home for an invalid view", () => {
    navRuntime.search = "view=nope";
    render(createElement(WorkspaceShell));

    expect(screen.getByText("Il tuo spazio è pronto")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Salvati" })).toBeNull();
  });

  it("exposes interior destinations without replacing the public shell", () => {
    render(createElement(WorkspaceShell));
    const nav = screen.getByRole("navigation", { name: "Il tuo spazio" });
    expect(nav).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Il tuo spazio" }).getAttribute("href"),
    ).toBe("/account?view=riprendi");
    expect(screen.getByRole("link", { name: "Stack" }).getAttribute("href")).toBe(
      "/account?view=stack",
    );
  });

  it("does not mount atelier sidebar/chips chrome or Decisioni/Recenti/Segnale dests", () => {
    render(createElement(WorkspaceShell));

    expect(screen.queryByLabelText("Spazio personale")).toBeNull();
    expect(screen.queryByLabelText("Altre destinazioni")).toBeNull();
    expect(screen.getByRole("link", { name: "Decisioni" }).getAttribute("href")).toBe(
      "/account?view=decisioni",
    );
    expect(screen.queryByRole("link", { name: "Recenti" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Segnale" })).toBeNull();
    expect(screen.queryByLabelText("Stato del toolbox")).toBeNull();
    expect(document.querySelector(".tv-app__sidebar")).toBeNull();
    expect(document.querySelector(".tv-hud")).toBeNull();
  });

  it("drops atelier primary chrome when rendered inside LoopShell", () => {
    render(createElement(LoopShellProvider, null, createElement(WorkspaceShell)));

    expect(screen.queryByLabelText("Spazio personale")).toBeNull();
    expect(screen.queryByLabelText("Altre destinazioni")).toBeNull();
    expect(screen.getByRole("link", { name: "Decisioni" }).getAttribute("href")).toBe(
      "/account?view=decisioni",
    );
    expect(screen.queryByRole("link", { name: "Recenti" })).toBeNull();
    expect(screen.queryByLabelText("Stato del toolbox")).toBeNull();
  });
});
