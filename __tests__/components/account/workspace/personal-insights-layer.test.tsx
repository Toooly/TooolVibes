/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/toools/cursor",
}));

import { AccountPreviewProvider, type AccountContextValue } from "@/components/account/account-provider";
import { AuthContinuationProvider } from "@/components/account/auth-continuation-provider";
import { PersonalInsightsLayer } from "@/components/account/workspace/personal-insights-layer";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { PublicToolCatalogProvider } from "@/lib/data/public-tool-catalog-context";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";

const catalog = [
  {
    slug: "cursor",
    name: "Cursor",
    categoryLabel: "Vibe coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  },
];

function guestValue() {
  return {
    authEnabled: true,
    status: "guest" as const,
    user: null,
    session: null,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: vi.fn().mockResolvedValue({ ok: true, message: "ok" }),
    restoreQuarantinedWorkspace: vi.fn().mockResolvedValue({ ok: true, message: "ok" }),
    signOut: vi.fn().mockResolvedValue(undefined),
    workspaceReadyForIntentReplay: false,
  };
}

function authValue() {
  return {
    ...guestValue(),
    status: "authenticated" as const,
    user: {
      id: "u1",
      email: "user@example.com",
      aud: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: "2026-01-01T00:00:00.000Z",
    },
    workspaceReadyForIntentReplay: true,
  };
}

function renderLayer(account: AccountContextValue) {
  return render(
    <OverlayProvider>
      <PublicToolCatalogProvider tools={catalog}>
        <AccountPreviewProvider value={account}>
          <AuthContinuationProvider>
            <PersonalInsightsLayer slug="cursor" origin="tool" />
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </PublicToolCatalogProvider>
    </OverlayProvider>,
  );
}

describe("PersonalInsightsLayer", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    window.localStorage.clear();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("min-width: 1024px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    window.localStorage.clear();
  });

  it("INSIGHT-AUTH-01/02 guest sees Per te and opens AuthSheet", async () => {
    renderLayer(guestValue());
    fireEvent.click(screen.getByRole("button", { name: "Per te" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Vedi cosa significa per te")).toBeTruthy();
    expect(screen.queryByText("Lo usi già.")).toBeNull();
  });

  it("INSIGHT-AUTH-03 guest HTML has no private context", () => {
    const state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "cursor",
      saved: true,
      at: "2026-06-01T10:00:00.000Z",
    });
    activateToolWorkspaceOwner({ kind: "guest" }, state);
    renderLayer(guestValue());
    expect(screen.queryByText("È già nei Salvati.")).toBeNull();
    expect(screen.queryByText("AI Coding")).toBeNull();
    expect(screen.getByRole("button", { name: "Per te" })).toBeTruthy();
  });

  it("INSIGHT-AUTH-06 auth using tool shows FIT", () => {
    let state = createEmptyWorkspaceState();
    state = reduceWorkspaceState(state, {
      type: "saved/set",
      slug: "cursor",
      saved: true,
      at: "2026-06-01T10:00:00.000Z",
    });
    state = reduceWorkspaceState(state, {
      type: "tool/usage",
      slug: "cursor",
      usage: "using",
      at: "2026-06-02T10:00:00.000Z",
    });
    activateToolWorkspaceOwner({ kind: "account", userId: "u1" }, state);
    renderLayer(authValue());
    expect(screen.getByText("Per te")).toBeTruthy();
    expect(screen.getByText("Lo usi già.")).toBeTruthy();
  });

  it("INSIGHT-AUTH-07 loading does not flash the guest gate", () => {
    renderLayer({ ...guestValue(), status: "loading" });
    expect(screen.queryByRole("button", { name: "Per te" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
