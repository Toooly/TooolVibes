/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/radar",
}));

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { AuthContinuationProvider } from "@/components/account/auth-continuation-provider";
import { RadarExperience } from "@/components/radar/radar-experience";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { PublicToolCatalogProvider } from "@/lib/data/public-tool-catalog-context";
import { PENDING_AUTH_INTENT_STORAGE_KEY } from "@/lib/auth/pending-auth-intent";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";
import {
  activateToolWorkspaceOwner,
} from "@/lib/stores/tool-workspace-store";

vi.mock("@/components/ads/tinyadz-inline-slot", () => ({
  TinyAdzInlineSlot: () => null,
}));

const T0 = "2026-06-01T10:00:00.000Z";

const LIVE: ProductHuntPayload = {
  status: "ok",
  source: "product-hunt-live",
  stale: false,
  range: "day",
  updatedAt: "2026-07-28T08:05:00.000Z",
  items: [
    {
      id: "blink-ph",
      name: "Blink",
      tagline: "Catalog match",
      votesCount: 12,
      commentsCount: 2,
      productHuntUrl: "https://www.producthunt.com/posts/blink",
    },
    {
      id: "external-ph",
      name: "Fixture Canvas",
      tagline: "Unmatched",
      votesCount: 9,
      commentsCount: 1,
      productHuntUrl: "https://www.producthunt.com/posts/fixture-canvas",
    },
  ],
};

const catalog = [
  {
    slug: "blink",
    name: "Blink",
    categoryLabel: "Vibe coding",
    shortDescription: "Blink",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  },
];

function accountValue(status: "guest" | "authenticated" | "loading") {
  return {
    authEnabled: true,
    status,
    user:
      status === "authenticated"
        ? {
            id: "u1",
            email: "user@example.com",
            aud: "authenticated",
            app_metadata: {},
            user_metadata: {},
            created_at: "2026-01-01T00:00:00.000Z",
          }
        : null,
    session: null,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: async () => ({ ok: true, message: "ok" }),
    restoreQuarantinedWorkspace: async () => ({ ok: true, message: "ok" }),
    signOut: async () => {},
    workspaceReadyForIntentReplay: status === "authenticated",
  };
}

function renderRadar(status: "guest" | "authenticated" | "loading") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <OverlayProvider>
      <QueryClientProvider client={queryClient}>
        <PublicToolCatalogProvider tools={catalog}>
          <AccountPreviewProvider value={accountValue(status)}>
            <AuthContinuationProvider>
              <RadarExperience initialVisual="table" />
            </AuthContinuationProvider>
          </AccountPreviewProvider>
        </PublicToolCatalogProvider>
      </QueryClientProvider>
    </OverlayProvider>,
  );
}

describe("Radar personal lens", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(LIVE), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.clear();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("RADAR-AUTH-01 guest public Radar stays public", async () => {
    renderRadar("guest");
    expect((await screen.findAllByText("Blink")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fixture Canvas").length).toBeGreaterThan(0);
    expect(screen.queryByText("Lo avevi salvato.")).toBeNull();
    expect(screen.getByRole("tab", { name: "Per te" })).toBeTruthy();
  });

  it("RADAR-AUTH-03 guest Per te opens AuthSheet", async () => {
    renderRadar("guest");
    await screen.findAllByText("Blink");
    fireEvent.click(screen.getByRole("tab", { name: "Per te" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Scopri cosa conta per te")).toBeTruthy();
  });

  it("RADAR-AUTH-05 dismiss keeps public Radar", async () => {
    renderRadar("guest");
    await screen.findAllByText("Blink");
    fireEvent.click(screen.getByRole("tab", { name: "Per te" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Non ora" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByText("Fixture Canvas").length).toBeGreaterThan(0);
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
  });

  it("RADAR-AUTH-07 loading does not flash the gate", async () => {
    renderRadar("loading");
    expect((await screen.findAllByText("Blink")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("tab", { name: "Per te" })).toBeNull();
  });

  it("RADAR-LENS-02 auth Per te filters to grounded matches", async () => {
    const state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "blink",
      saved: true,
      at: T0,
    });
    activateToolWorkspaceOwner({ kind: "account", userId: "u1" }, state);
    renderRadar("authenticated");
    expect((await screen.findAllByText("Blink")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fixture Canvas").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: "Per te" }));
    await waitFor(() => {
      expect(screen.queryAllByText("Fixture Canvas")).toHaveLength(0);
    });
    expect(screen.getAllByText("Lo avevi salvato.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Nessun segnale personale forte in questo momento.")).toBeNull();
  });

  it("RADAR-LENS-05 empty personal state is calm", async () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
    renderRadar("authenticated");
    await screen.findAllByText("Blink");
    fireEvent.click(screen.getByRole("tab", { name: "Per te" }));
    expect(
      await screen.findByText("Nessun segnale personale forte in questo momento."),
    ).toBeTruthy();
  });

  it("RADAR-PRIV-01 guest HTML has no Stack or decision copy", async () => {
    const { container } = renderRadar("guest");
    await screen.findAllByText("Blink");
    expect(container.textContent).not.toMatch(/Nello Stack|Lo avevi scartato|Nota presente/i);
  });
});
