/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/archivio",
}));

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { AuthContinuationProvider } from "@/components/account/auth-continuation-provider";
import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { closeSaveOverflow } from "@/components/tools/save-overflow-state";
import { makeCatalogTool } from "../directory/catalog-test-fixtures";
import {
  PENDING_AUTH_INTENT_STORAGE_KEY,
  consumePendingAuthIntent,
  writePendingAuthIntent,
} from "@/lib/auth/pending-auth-intent";
import { replayStackCreateIntent } from "@/lib/auth/replay-stack-intent";
import { mergeGuestWorkspaceContribution } from "@/lib/discovery/workspace-sync";
import type { WorkspaceAction } from "@/lib/discovery/types";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

const T0 = "2026-07-17T10:00:00.000Z";

function stubMatchMedia(desktop: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: desktop && query.includes("min-width: 1024px"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function apply(actions: WorkspaceAction[]) {
  return actions.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

const leftover = apply([
  { type: "saved/set", slug: "cursor", saved: true, at: T0 },
  { type: "saved/set", slug: "claude-code", saved: true, at: T0 },
  {
    type: "stacks/create",
    id: "ai-coding",
    name: "AI Coding",
    description: null,
    at: T0,
  },
  { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T0 },
  { type: "stacks/add", id: "ai-coding", slug: "claude-code", at: T0 },
]);

function seedGuest() {
  activateToolWorkspaceOwner({ kind: "guest" }, leftover);
}

function seedAccount(state = leftover) {
  activateToolWorkspaceOwner({ kind: "account", userId: "u1" }, state);
}

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

function renderGuestCard() {
  return render(
    <OverlayProvider>
      <AccountPreviewProvider value={guestValue()}>
        <AuthContinuationProvider>
          <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "windsurf", name: "Windsurf" })} />
        </AuthContinuationProvider>
      </AccountPreviewProvider>
    </OverlayProvider>,
  );
}

async function openOverflow() {
  fireEvent.click(screen.getByRole("button", { name: "Altre azioni per Windsurf" }));
  await waitFor(() => {
    expect(document.querySelector("[data-save-overflow-title]")).toBeTruthy();
  });
}

describe("legacy guest stack gating", () => {
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
    HTMLElement.prototype.hasPointerCapture = () => false;
    HTMLElement.prototype.setPointerCapture = () => undefined;
    HTMLElement.prototype.releasePointerCapture = () => undefined;
  });

  beforeEach(() => {
    window.localStorage.clear();
    stubMatchMedia(false);
    seedGuest();
    closeSaveOverflow();
  });

  afterEach(() => {
    closeSaveOverflow();
    cleanup();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    window.localStorage.clear();
  });

  it("STACK-LEGACY-01 leftover personalStack remains readable", () => {
    const stack = getCanonicalToolWorkspaceState().personalStacks.find(
      (item) => item.id === "ai-coding",
    );
    expect(stack?.name).toBe("AI Coding");
    expect(stack?.slugs).toEqual(["cursor", "claude-code"]);
  });

  it("STACK-LEGACY-02 guest add opens AuthSheet and does not mutate", async () => {
    renderGuestCard();
    await openOverflow();
    expect(screen.getByRole("button", { name: "Aggiungi a AI Coding" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Tieni lo stack con te")).toBeTruthy();
    const stack = getCanonicalToolWorkspaceState().personalStacks.find(
      (item) => item.id === "ai-coding",
    );
    expect(stack?.slugs).toEqual(["cursor", "claude-code"]);
  });

  it("STACK-LEGACY-03 pending intent preserves the existing stack target", async () => {
    renderGuestCard();
    await openOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continua con il tuo account" }));
    await waitFor(() => {
      expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeTruthy();
    });
    const raw = window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY) ?? "";
    expect(raw).toContain("windsurf");
    expect(raw).toContain("ai-coding");
    expect(raw).toContain("AI Coding");
    expect(raw).not.toContain("user@example.com");
    expect(
      getCanonicalToolWorkspaceState().personalStacks.find((item) => item.id === "ai-coding")
        ?.slugs,
    ).toEqual(["cursor", "claude-code"]);
  });

  it("STACK-LEGACY-04 merge keeps the leftover stack", () => {
    const account = createEmptyWorkspaceState();
    const merged = mergeGuestWorkspaceContribution(account, leftover);
    expect(merged.personalStacks).toHaveLength(1);
    expect(merged.personalStacks[0]?.id).toBe("ai-coding");
    expect(merged.personalStacks[0]?.slugs).toEqual(["cursor", "claude-code"]);
  });

  it("STACK-LEGACY-05/06 replay adds the tool exactly once", () => {
    const merged = mergeGuestWorkspaceContribution(createEmptyWorkspaceState(), leftover);
    seedAccount(merged);
    const written = writePendingAuthIntent({
      toolSlug: "windsurf",
      targetStackId: "ai-coding",
      targetStackName: "AI Coding",
      returnTo: "/toools/windsurf",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    expect(replayStackCreateIntent(written.intent).status).toBe("ok");
    expect(replayStackCreateIntent(written.intent).status).toBe("ok");
    const stack = getCanonicalToolWorkspaceState().personalStacks.find(
      (item) => item.id === "ai-coding",
    );
    expect(stack?.slugs.filter((slug) => slug === "windsurf")).toHaveLength(1);
    expect(stack?.slugs).toEqual(["cursor", "claude-code", "windsurf"]);
  });

  it("STACK-LEGACY-07 same-id collision merges first then replay targets that stack", () => {
    const account = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T0 },
    ]);
    const merged = mergeGuestWorkspaceContribution(account, leftover);
    expect(merged.personalStacks).toHaveLength(1);
    seedAccount(merged);
    const written = writePendingAuthIntent({
      toolSlug: "windsurf",
      targetStackId: "ai-coding",
      targetStackName: "AI Coding",
      returnTo: "/toools/windsurf",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    expect(replayStackCreateIntent(written.intent).status).toBe("ok");
    const stacks = getCanonicalToolWorkspaceState().personalStacks.filter(
      (item) => item.name === "AI Coding",
    );
    expect(stacks).toHaveLength(1);
    expect(stacks[0]?.slugs).toEqual(["cursor", "claude-code", "windsurf"]);
  });

  it("STACK-LEGACY-08 dismiss leaves the leftover stack unchanged", async () => {
    renderGuestCard();
    await openOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Non ora" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
    expect(
      getCanonicalToolWorkspaceState().personalStacks.find((item) => item.id === "ai-coding")
        ?.slugs,
    ).toEqual(["cursor", "claude-code"]);
  });

  it("STACK-LEGACY-09 expired intent does not mutate leftover stacks", () => {
    seedAccount();
    const past = new Date(Date.now() - 60_000).toISOString();
    window.localStorage.setItem(
      PENDING_AUTH_INTENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        id: "intent-expired-stack-01",
        capability: "stack.create",
        payload: {
          toolSlug: "windsurf",
          targetStackId: "ai-coding",
          targetStackName: "AI Coding",
        },
        returnTo: "/toools/windsurf",
        createdAt: past,
        expiresAt: past,
      }),
    );
    const consumed = consumePendingAuthIntent();
    expect(consumed.status).toBe("expired");
    expect(
      getCanonicalToolWorkspaceState().personalStacks.find((item) => item.id === "ai-coding")
        ?.slugs,
    ).toEqual(["cursor", "claude-code"]);
  });

  it("STACK-LEGACY-10 authenticated add-to-existing does not open AuthSheet", async () => {
    seedAccount();
    render(
      <OverlayProvider>
        <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "windsurf", name: "Windsurf" })} />
      </OverlayProvider>,
    );
    await openOverflow();
    expect(screen.queryByText("Tieni lo stack con te")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    expect(screen.queryByText("Tieni lo stack con te")).toBeNull();
    expect(
      getCanonicalToolWorkspaceState().personalStacks.find((item) => item.id === "ai-coding")
        ?.slugs,
    ).toContain("windsurf");
  });
});
