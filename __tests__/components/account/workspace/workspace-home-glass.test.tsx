// @vitest-environment jsdom

import { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

/**
 * HOME 2.0 — AERO / LIQUID GLASS visual contract.
 *
 * jsdom non applica la cascade del CSS reale: il contract visuale è
 * verificato su due livelli — (1) markup contrattuale dei componenti Home
 * (elementi decorativi marcati, tile Radar, CTA primario Home-scoped) e
 * (2) verifica statica sulla sorgente account.css, single source of truth
 * dei materiali glass e delle guardie reduced-motion (pattern dei
 * contract test stile shell-floating-dock).
 */

const NOW = "2026-08-01T00:00:00.000Z";

const accountCss = readFileSync(
  resolve(process.cwd(), "app/(marketing)/account/account.css"),
  "utf8",
);

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

const radarRuntime = vi.hoisted(() => ({
  payload: undefined as ProductHuntPayload | undefined,
  isLoading: false,
  isFetching: false,
}));

const actions = vi.hoisted(() => ({
  markWorkspaceToolUsing: vi.fn(),
  setWorkspaceRevisit: vi.fn(),
  markWorkspaceRevisited: vi.fn(),
  reopenWorkspaceDecision: vi.fn(),
  toggleWorkspaceCompare: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/account/workspace-actions", () => ({
  markWorkspaceToolUsing: actions.markWorkspaceToolUsing,
  setWorkspaceRevisit: actions.setWorkspaceRevisit,
  markWorkspaceRevisited: actions.markWorkspaceRevisited,
  commitWorkspaceDecision: vi.fn(),
  reopenWorkspaceDecision: actions.reopenWorkspaceDecision,
  toggleWorkspaceCompare: actions.toggleWorkspaceCompare,
}));

vi.mock("@/lib/radar/use-product-hunt-radar", () => ({
  useProductHuntRadar: () => ({
    payload: radarRuntime.payload,
    isLoading: radarRuntime.isLoading,
    isFetching: radarRuntime.isFetching,
    refetch: () => {},
  }),
}));

vi.mock("@/components/tools/stack-pick-or-create", () => ({
  StackPickOrCreate: ({ slug }: { slug: string }) =>
    createElement(
      "div",
      { "data-testid": "stack-pick-or-create", "data-slug": slug },
      "Aggiungi a uno stack",
    ),
}));

vi.mock("@/lib/discovery/workspace-owner-storage", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/discovery/workspace-owner-storage")
  >();
  return {
    ...actual,
    getActiveWorkspaceOwner: () => ({ kind: "account" as const, userId: "test" }),
  };
});

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

import { WorkspaceRiprendi } from "@/components/account/workspace/workspace-riprendi";

function catalogFor(state: WorkspaceStateV1): PublicToolCatalogItem[] {
  const named: Record<string, string> = {
    cursor: "Cursor",
    v0: "v0",
    meku: "Meku",
    blink: "Blink",
    linear: "Linear",
  };
  const slugs = new Set([
    ...state.saved.slugs,
    ...state.compare.slugs,
    ...Object.keys(state.toolStates),
  ]);
  for (const stack of state.personalStacks) {
    for (const slug of stack.slugs) slugs.add(slug);
  }
  return [...slugs].map((slug) => ({
    slug,
    name: named[slug] ?? slug,
    categoryLabel: "Coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  }));
}

function renderHome(state: WorkspaceStateV1) {
  catalogRuntime.value = catalogFor(state);
  return render(createElement(WorkspaceRiprendi, { state }));
}

function radarItems(count: number): ProductHuntPayload {
  return {
    status: "ok",
    source: "qa-fixture",
    stale: false,
    range: "day",
    updatedAt: NOW,
    items: Array.from({ length: count }, (_, index) => ({
      id: `ph-${index + 1}`,
      name: `Radar Tool ${index + 1}`,
      tagline: `Tagline ${index + 1}`,
      votesCount: 10 + index,
      commentsCount: 2,
      productHuntUrl: `https://www.producthunt.com/posts/radar-tool-${index + 1}`,
    })),
  };
}

describe("Workspace Home — Liquid Glass visual contract", () => {
  beforeEach(() => {
    catalogRuntime.value = [];
    radarRuntime.payload = undefined;
    radarRuntime.isLoading = false;
    radarRuntime.isFetching = false;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("LG-T1 decorative hero light is marked non-interactive in DOM and CSS", () => {
    renderHome(workspaceTestFixtures.mature);
    const decor = document.querySelectorAll(".tv-home [data-tv-decor]");
    expect(decor.length).toBeGreaterThan(0);
    for (const element of decor) {
      expect(element.getAttribute("aria-hidden")).toBe("true");
    }
    // The CSS is the source of truth for pointer-events in jsdom.
    const rule = accountCss.match(/\.tv-home \[data-tv-decor\]\s*\{[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule?.[0]).toContain("pointer-events: none");
  });

  it("LG-T2 Radar renders one discovery tile per capped item, each linking to /radar", () => {
    radarRuntime.payload = radarItems(4);
    renderHome(workspaceTestFixtures.newAuthenticated);
    const heading = screen.getByRole("heading", { name: "Dal Radar" });
    const section = heading.closest("section");
    expect(section).toBeTruthy();
    const tiles = (section as HTMLElement).querySelectorAll(".tv-home-tile");
    expect(tiles).toHaveLength(4);
    for (let index = 1; index <= 4; index += 1) {
      expect(screen.getByText(`Radar Tool ${index}`)).toBeTruthy();
    }
    const radarSection = section as HTMLElement;
    const tileLinks = within(radarSection).getAllByRole("link");
    const tileHrefs = tileLinks
      .filter((link) => link.classList.contains("tv-home-tile"))
      .map((link) => link.getAttribute("href"));
    expect(tileHrefs).toHaveLength(4);
    expect(tileHrefs.every((href) => href === "/radar")).toBe(true);
    expect(screen.getByRole("link", { name: "Apri Radar" }).getAttribute("href")).toBe("/radar");
  });

  it("LG-T3 Radar tiles use the canonical deterministic tool mark (no random avatars)", () => {
    radarRuntime.payload = radarItems(2);
    renderHome(workspaceTestFixtures.newAuthenticated);
    const marks = document.querySelectorAll(
      ".tv-home-radar__tiles .tv-tool-mark",
    );
    expect(marks).toHaveLength(2);
    for (const mark of marks) {
      expect(mark.getAttribute("aria-hidden")).toBe("true");
      // Deterministic identity: inline gradient derived from slug/name hash.
      expect(mark.getAttribute("style")).toContain("linear-gradient");
    }
  });

  it("LG-T4 primary CTAs use the Home-scoped glass CTA class", () => {
    renderHome(workspaceTestFixtures.withDecisions);
    const primary = screen.getByRole("button", { name: "Lo sto usando" });
    expect(primary.classList.contains("tv-home-cta")).toBe(true);
    expect(primary.classList.contains("tv-home-cta--primary")).toBe(true);
    expect(primary.classList.contains("account-btn-primary")).toBe(false);
    // Home never uses the app-wide flat primary inside .tv-home markup.
    expect(document.querySelector(".tv-home .account-btn-primary")).toBeNull();
  });

  it("LG-T5 CTA material and focus contract live in account.css", () => {
    const primaryBlock = accountCss.match(/\.tv-home-cta--primary\s*\{[^}]*\}/);
    expect(primaryBlock).not.toBeNull();
    // Phase 5 (V3 CTA law): the primary action is activation yellow,
    // never the legacy layered violet glass.
    expect(primaryBlock?.[0]).toContain("var(--tv-button-activation-bg)");
    expect(primaryBlock?.[0]).toContain("var(--tv-button-activation-text)");
    expect(primaryBlock?.[0]).not.toContain("linear-gradient");
    const disabledBlock = accountCss.match(
      /\.tv-home-cta--primary:disabled[^{]*\{[^}]*\}/,
    );
    expect(disabledBlock).not.toBeNull();
  });

  it("LG-T6 new motion is guarded by prefers-reduced-motion and the app reduce flag", () => {
    expect(accountCss).toContain("@media (prefers-reduced-motion: no-preference)");
    const guard = accountCss.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.tv-home-cta--primary[\s\S]*?transition: none;[\s\S]*?\}/,
    );
    expect(guard).not.toBeNull();
    const appFlagGuard = accountCss.match(
      /html\[data-tv-reduce-motion="true"\][^{]*\.tv-home-tile[\s\S]*?transition: none;/,
    );
    expect(appFlagGuard).not.toBeNull();
  });

  it("LG-T7 glass material ladder is tokenised and never nested blur-on-blur", () => {
    // 3-level ladder defined on the Home scope.
    for (const level of ["g1", "g2", "g3"]) {
      expect(accountCss).toContain(`--tv-home-${level}-veil`);
      expect(accountCss).toContain(`--tv-home-${level}-filter`);
      expect(accountCss).toContain(`--tv-home-${level}-shadow`);
    }
    // Inner materials inside Level 1 shells are solid (no backdrop-filter).
    const unfinishedMini = accountCss.match(
      /\.tv-home__unfinished \.tv-home-mini\s*\{[^}]*\}/,
    );
    expect(unfinishedMini).not.toBeNull();
    expect(unfinishedMini?.[0]).not.toContain("backdrop-filter");
    const radarTile = accountCss.match(/\.tv-home-tile\s*\{[^}]*\}/);
    expect(radarTile).not.toBeNull();
    expect(radarTile?.[0]).not.toContain("backdrop-filter");
  });

  it("LG-T8 sync info banner has a compact Home-scope wrapper contract", () => {
    const strip = accountCss.match(
      /\.tv-workspace-sync \.account-message--info\s*\{[^}]*\}/,
    );
    expect(strip).not.toBeNull();
    expect(strip?.[0]).toContain("padding");
    // Warning tones inside the same wrapper stay untouched by the strip rule.
    expect(accountCss).not.toMatch(
      /\.tv-workspace-sync \.account-message--warning/,
    );
  });
});
