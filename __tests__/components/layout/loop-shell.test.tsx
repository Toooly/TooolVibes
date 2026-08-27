// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import fs from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { navRuntime, accountRuntime, compareCountState } = vi.hoisted(() => ({
  navRuntime: {
    pathname: "/account" as string,
    search: "",
  },
  accountRuntime: {
    status: "authenticated" as
      | "loading"
      | "guest"
      | "authenticated"
      | "unavailable",
    authEnabled: true,
    signOut: vi.fn(),
    user: { email: "mario@example.com" } as { email: string } | null,
  },
  compareCountState: { current: 0 },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navRuntime.pathname,
  useSearchParams: () => new URLSearchParams(navRuntime.search),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => ({
    authEnabled: accountRuntime.authEnabled,
    status: accountRuntime.status,
    user: accountRuntime.user,
    session: null,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: vi.fn(),
    restoreQuarantinedWorkspace: vi.fn(),
    signOut: accountRuntime.signOut,
  }),
}));

vi.mock("@/lib/stores/tool-workspace-store", () => ({
  useToolWorkspaceStore: (
    selector: (state: {
      compareSlugs: string[];
      setCommandOpen: (open: boolean) => void;
    }) => unknown,
  ) =>
    selector({
      compareSlugs: Array.from(
        { length: compareCountState.current },
        (_, index) => `compare-${index}`,
      ),
      setCommandOpen: vi.fn(),
    }),
}));

vi.mock("@/components/app/page-transition", () => ({
  PageTransition: ({ children }: { children: ReactNode }) =>
    createElement("div", { "data-testid": "page-transition" }, children),
}));

vi.mock("@/components/layout/site-footer-v2", () => ({
  SiteFooterV2: () => createElement("footer", { "data-testid": "site-footer-v2" }),
}));

vi.mock("@/components/ads/tinyadz-loader", () => ({
  TinyAdzLoader: () => createElement("div", { "data-testid": "tinyadz-loader" }),
}));

import { LoopShell } from "@/components/layout/loop-shell";
import {
  LoopShellProvider,
  useLoopShell,
} from "@/components/layout/loop-shell-context";

function renderShell() {
  return render(
    createElement(LoopShell, null, createElement("div", null, "loop-body")),
  );
}

function tabNav() {
  return document.querySelector('[data-loop-primary-nav="tabs"]') as HTMLElement;
}

function destIds(nav: HTMLElement | null) {
  if (!nav) return [];
  return Array.from(nav.querySelectorAll("[data-loop-dest]")).map((node) =>
    node.getAttribute("data-loop-dest"),
  );
}

function destLabels(nav: HTMLElement | null) {
  if (!nav) return [];
  return Array.from(nav.querySelectorAll(".tv-loop__dest-label")).map(
    (node) => node.textContent,
  );
}

describe("LoopShell — Wave 4", () => {
  beforeEach(() => {
    navRuntime.pathname = "/account";
    navRuntime.search = "";
    accountRuntime.status = "authenticated";
    accountRuntime.authEnabled = true;
    compareCountState.current = 0;
    accountRuntime.signOut.mockReset();
  });

  afterEach(() => {
    cleanup();
    delete document.body.dataset.loopShell;
  });

  it("W4-T1 auth tabs are Home Salvati Stack Catalogo", () => {
    renderShell();
    expect(destIds(tabNav())).toEqual(["home", "salvati", "stack", "catalogo"]);
    expect(destLabels(tabNav())).toEqual(["Home", "Salvati", "Stack", "Catalogo"]);
  });

  it("W4-T2 guest tabs are Salvati Catalogo", () => {
    accountRuntime.status = "guest";
    navRuntime.pathname = "/archivio";
    renderShell();
    expect(destIds(tabNav())).toEqual(["salvati", "catalogo"]);
    expect(destLabels(tabNav())).toEqual(["Salvati", "Catalogo"]);
  });

  it("W4-T3 T4 T5 T6 T12 retired destinations stay out of primary nav", () => {
    renderShell();
    const labels = destLabels(tabNav()).join(" ");
    expect(labels).not.toMatch(/Decisioni|Recenti|Segnale|Biblioteca|Confronto|Radar|Esci/);
    expect(destIds(tabNav())).toHaveLength(4);
  });

  it("W4-T7 T8 Salvati and biblioteca alias are current", () => {
    navRuntime.search = "view=salvati";
    const first = renderShell();
    expect(
      tabNav()?.querySelector('[data-loop-dest="salvati"]')?.getAttribute("aria-current"),
    ).toBe("page");
    first.unmount();
    navRuntime.search = "view=biblioteca";
    renderShell();
    expect(
      tabNav()?.querySelector('[data-loop-dest="salvati"]')?.getAttribute("aria-current"),
    ).toBe("page");
  });

  it("W4-T9 T10 T11 Home Stack Catalogo active mapping", () => {
    renderShell();
    expect(
      tabNav()?.querySelector('[data-loop-dest="home"]')?.getAttribute("aria-current"),
    ).toBe("page");
    cleanup();
    navRuntime.search = "view=stack";
    renderShell();
    expect(
      tabNav()?.querySelector('[data-loop-dest="stack"]')?.getAttribute("aria-current"),
    ).toBe("page");
    cleanup();
    navRuntime.pathname = "/archivio";
    navRuntime.search = "";
    renderShell();
    expect(
      tabNav()?.querySelector('[data-loop-dest="catalogo"]')?.getAttribute("aria-current"),
    ).toBe("page");
  });

  it("W4-T12 T20 Compare stays in LoopShell without becoming a tab", () => {
    navRuntime.pathname = "/compare";
    renderShell();
    expect(document.querySelector("[data-loop-shell]")).toBeTruthy();
    expect(destIds(tabNav())).not.toContain("compare");
    expect(tabNav()?.querySelector("[aria-current='page']")).toBeNull();
  });

  it("W7 chip on /compare is current without becoming a tab", () => {
    navRuntime.pathname = "/compare";
    compareCountState.current = 2;
    renderShell();
    const chip = document.querySelector("[data-compare-live-chip]");
    expect(chip?.getAttribute("aria-current")).toBe("page");
    expect(chip?.getAttribute("data-active")).toBe("true");
    expect(destIds(tabNav())).not.toContain("compare");
    expect(tabNav()?.querySelector("[aria-current='page']")).toBeNull();
  });

  it("W4-T13 CompareLiveChip hidden at 0", () => {
    renderShell();
    expect(document.querySelector("[data-compare-live-chip]")).toBeNull();
  });

  it("W4-T14 CompareLiveChip visible at live count", () => {
    compareCountState.current = 2;
    renderShell();
    const chips = document.querySelectorAll("[data-compare-live-chip]");
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0]?.textContent).toContain("Confronta 2/5");
  });

  it("W4-T15 clearing compare removes the live chip", () => {
    compareCountState.current = 3;
    const view = renderShell();
    expect(document.querySelector("[data-compare-live-chip]")).toBeTruthy();
    view.unmount();
    compareCountState.current = 0;
    renderShell();
    expect(document.querySelector("[data-compare-live-chip]")).toBeNull();
  });

  it("W4-T16 T17 Salvati hrefs stay canonical for auth and guest", () => {
    renderShell();
    expect(
      tabNav()?.querySelector('[data-loop-dest="salvati"]')?.getAttribute("href"),
    ).toBe("/account?view=salvati");
    cleanup();
    accountRuntime.status = "guest";
    navRuntime.pathname = "/shortlist";
    renderShell();
    expect(
      tabNav()?.querySelector('[data-loop-dest="salvati"]')?.getAttribute("href"),
    ).toBe("/shortlist");
    expect(destIds(tabNav())).toEqual(["salvati", "catalogo"]);
  });

  it("W4-T18 settings and logout live in the account menu, not tabs", () => {
    renderShell();
    expect(destLabels(tabNav())).not.toContain("Impostazioni");
    expect(destLabels(tabNav())).not.toContain("Esci");
    expect(screen.getByLabelText("Account").tagName).toBe("SUMMARY");
    expect(screen.getByRole("link", { name: "Impostazioni" }).getAttribute("href")).toBe(
      "/account/settings",
    );
    expect(screen.getByRole("button", { name: "Esci" })).toBeTruthy();
  });

  it("W4-T19 labels are never truncated structurally", () => {
    renderShell();
    const css = fs.readFileSync(
      path.join(process.cwd(), "styles/loop-shell.css"),
      "utf8",
    );
    expect(destLabels(tabNav()).every((label) => label && !label.endsWith("…"))).toBe(
      true,
    );
    expect(css).toContain("text-overflow: clip");
    expect(css).not.toContain("text-overflow: ellipsis");
  });

  it("W4-T21 guest save/compare chrome does not invent Home or Stack", () => {
    accountRuntime.status = "guest";
    navRuntime.pathname = "/archivio";
    renderShell();
    expect(destIds(tabNav())).toEqual(["salvati", "catalogo"]);
    expect(screen.getByRole("link", { name: "Accedi" })).toBeTruthy();
  });

  it("does not flash guest tabs while auth is loading", () => {
    accountRuntime.status = "loading";
    renderShell();
    expect(tabNav()).toBeNull();
    expect(screen.getByText("Account").getAttribute("aria-busy")).toBe("true");
  });

  it("W4-T24 reduced-motion wiring is not overwritten by the shell", () => {
    document.documentElement.dataset.tvReduceMotion = "true";
    renderShell();
    expect(document.documentElement.dataset.tvReduceMotion).toBe("true");
    delete document.documentElement.dataset.tvReduceMotion;
  });

  it("exposes loop context for nested frames", () => {
    let seen = false;
    function Probe() {
      seen = useLoopShell();
      return null;
    }
    render(createElement(LoopShellProvider, null, createElement(Probe)));
    expect(seen).toBe(true);
  });

  it("W11-T3 /radar marks Catalogo current and does not add a Radar tab", () => {
    navRuntime.pathname = "/radar";
    renderShell();
    expect(
      tabNav()?.querySelector('[data-loop-dest="catalogo"]')?.getAttribute("aria-current"),
    ).toBe("page");
    expect(destIds(tabNav())).toEqual(["home", "salvati", "stack", "catalogo"]);
    expect(destLabels(tabNav())).not.toContain("Radar");
    expect(destLabels(tabNav())).not.toContain("Segnale");
  });

  it("W11-T2 W11-T26 Radar is not a loop destination", () => {
    renderShell();
    expect(destIds(tabNav())).toHaveLength(4);
    expect(destIds(tabNav())).not.toContain("radar");
    cleanup();
    accountRuntime.status = "guest";
    navRuntime.pathname = "/radar";
    renderShell();
    expect(destIds(tabNav())).toEqual(["salvati", "catalogo"]);
    expect(
      tabNav()?.querySelector('[data-loop-dest="catalogo"]')?.getAttribute("aria-current"),
    ).toBe("page");
  });
});
