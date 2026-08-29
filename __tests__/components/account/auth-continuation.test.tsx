/**
 * @vitest-environment jsdom
 */
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/account",
}));

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { AuthContinuationProvider } from "@/components/account/auth-continuation-provider";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import {
  PENDING_AUTH_INTENT_STORAGE_KEY,
  writePendingAuthIntent,
} from "@/lib/auth/pending-auth-intent";
import { getOpenPrivateNoteSlug } from "@/lib/auth/private-note-editor-state";
import { getOpenPersonalInsightSlug, resetPersonalInsightLayerForTests } from "@/lib/auth/personal-insight-layer-state";
import { peekDeepCompareOpen, resetDeepCompareOpenForTests } from "@/lib/compare/deep-compare-resume";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

function accountValue(ready: boolean) {
  return {
    authEnabled: true,
    status: "authenticated" as const,
    user: {
      id: "u1",
      email: "user@example.com",
      aud: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: "2026-01-01T00:00:00.000Z",
    },
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
    workspaceReadyForIntentReplay: ready,
  };
}

describe("auth continuation replay order", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDeepCompareOpenForTests();
    resetPersonalInsightLayerForTests();
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
  });

  afterEach(() => {
    cleanup();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    window.localStorage.clear();
  });

  it("does not replay before workspaceReadyForIntentReplay", async () => {
    writePendingAuthIntent({
      toolSlug: "blink",
      desiredStackName: "Podcast",
      returnTo: "/toools/blink",
    });
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={accountValue(false)}>
          <AuthContinuationProvider>
            <p>ready-false</p>
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeTruthy();
    });
    expect(getCanonicalToolWorkspaceState().personalStacks).toEqual([]);
  });

  it("replays once after workspace is ready", async () => {
    writePendingAuthIntent({
      toolSlug: "blink",
      desiredStackName: "Podcast",
      returnTo: "/toools/blink",
    });
    const { rerender } = render(
      <OverlayProvider>
        <AccountPreviewProvider value={accountValue(false)}>
          <AuthContinuationProvider>
            <p>hold</p>
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    expect(getCanonicalToolWorkspaceState().personalStacks).toEqual([]);
    rerender(
      <OverlayProvider>
        <AccountPreviewProvider value={accountValue(true)}>
          <AuthContinuationProvider>
            <p>go</p>
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(
        getCanonicalToolWorkspaceState().personalStacks.some(
          (stack) => stack.name === "Podcast",
        ),
      ).toBe(true);
    });
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
    const firstCount = getCanonicalToolWorkspaceState().personalStacks.length;
    rerender(
      <OverlayProvider>
        <AccountPreviewProvider value={accountValue(true)}>
          <AuthContinuationProvider>
            <p>again</p>
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(getCanonicalToolWorkspaceState().personalStacks).toHaveLength(firstCount);
    });
  });

  it("restores intent when owner is still guest", async () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    writePendingAuthIntent({
      toolSlug: "blink",
      desiredStackName: "Podcast",
      returnTo: "/toools/blink",
    });
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={accountValue(true)}>
          <AuthContinuationProvider>
            <p>guest-owner</p>
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeTruthy();
    });
    expect(getCanonicalToolWorkspaceState().personalStacks).toEqual([]);
  });

  it("NOTE-CONT-03 note.private replay opens editor without writing note", async () => {
    writePendingAuthIntent({
      capability: "note.private",
      toolSlug: "blink",
      returnTo: "/account",
      origin: "note.tool",
    });
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={accountValue(true)}>
          <AuthContinuationProvider>
            <p>note-ready</p>
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(getOpenPrivateNoteSlug()).toBe("blink");
    });
    expect(getCanonicalToolWorkspaceState().toolStates.blink).toBeUndefined();
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
  });

  it("DEEP-CONT-03 compare.deep replay opens layer without mutating compare", async () => {
    writePendingAuthIntent({
      capability: "compare.deep",
      returnTo: "/compare",
      origin: "compare.deep",
    });
    const before = getCanonicalToolWorkspaceState().compare.slugs.slice();
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={accountValue(true)}>
          <AuthContinuationProvider>
            <p>compare-ready</p>
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(peekDeepCompareOpen()).toBe(true);
    });
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(before);
  });

  it("INSIGHT-CONT-03 insight.personal replay opens layer without writing", async () => {
    writePendingAuthIntent({
      capability: "insight.personal",
      toolSlug: "blink",
      returnTo: "/account",
      origin: "insight.tool",
    });
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={accountValue(true)}>
          <AuthContinuationProvider>
            <p>insight-ready</p>
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(getOpenPersonalInsightSlug()).toBe("blink");
    });
    expect(getCanonicalToolWorkspaceState().toolStates.blink).toBeUndefined();
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
  });
});
