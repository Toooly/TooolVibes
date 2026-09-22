// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

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

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/radar/use-product-hunt-radar", () => ({
  useProductHuntRadar: () => ({
    payload: undefined,
    isLoading: false,
    isFetching: false,
  }),
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

import { WorkspaceShell } from "@/components/account/workspace/workspace-shell";

function catalogFor(slugs: string[]): PublicToolCatalogItem[] {
  const named: Record<string, string> = {
    cursor: "Cursor",
    v0: "v0",
    meku: "Meku",
  };
  return slugs.map((slug) => ({
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

describe("WorkspaceDecisions dest — Wave 8 redirect", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    HTMLElement.prototype.hasPointerCapture = () => false;
    HTMLElement.prototype.setPointerCapture = () => undefined;
    HTMLElement.prototype.releasePointerCapture = () => undefined;
  });

  beforeEach(() => {
    catalogRuntime.value = catalogFor(["cursor", "v0", "meku"]);
    navRuntime.pathname = "/account";
    navRuntime.search = "";
    navRuntime.push.mockReset();
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.reviewDue);
  });

  afterEach(() => {
    cleanup();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  it("view=decisioni renders the decision memory, not a journal editor", () => {
    navRuntime.search = "view=decisioni";
    render(createElement(WorkspaceShell));
    expect(screen.queryByLabelText("Caso d’uso")).toBeNull();
    expect(screen.getByRole("heading", { name: "Decisioni" })).toBeTruthy();
  });

  it("view=decisioni&focus opens DecisionSheet from Home", () => {
    navRuntime.search = "view=decisioni&focus=meku";
    render(createElement(WorkspaceShell));
    expect(document.querySelector("[data-decision-sheet]")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Valuta Meku" })).toBeTruthy();
  });

});
