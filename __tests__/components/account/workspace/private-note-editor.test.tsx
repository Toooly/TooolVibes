/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/toools/blink",
}));

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { AuthContinuationProvider } from "@/components/account/auth-continuation-provider";
import { PrivateNoteEditor } from "@/components/account/workspace/private-note-editor";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { PENDING_AUTH_INTENT_STORAGE_KEY } from "@/lib/auth/pending-auth-intent";
import { closePrivateNoteEditor } from "@/lib/auth/private-note-editor-state";
import { setWorkspaceNote } from "@/lib/account/workspace-actions";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

const sendMagicLink = vi.fn().mockResolvedValue({ ok: true, message: "ok" });

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
    sendMagicLink,
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

function renderEditor(account: ReturnType<typeof guestValue> | ReturnType<typeof authValue>, slug = "blink") {
  return render(
    <OverlayProvider>
      <AccountPreviewProvider value={account}>
        <AuthContinuationProvider>
          <PrivateNoteEditor slug={slug} origin="tool" />
        </AuthContinuationProvider>
      </AccountPreviewProvider>
    </OverlayProvider>,
  );
}

describe("PrivateNoteEditor", () => {
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
    closePrivateNoteEditor();
    window.localStorage.clear();
    sendMagicLink.mockClear();
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
    closePrivateNoteEditor();
    cleanup();
    window.localStorage.clear();
  });

  it("NOTE-AUTH-01 guest Tool Page sees note affordance", () => {
    renderEditor(guestValue());
    expect(screen.getByRole("button", { name: "Nota privata" })).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("NOTE-AUTH-02 guest invocation opens AuthSheet", async () => {
    renderEditor(guestValue());
    fireEvent.click(screen.getByRole("button", { name: "Nota privata" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Ricordalo nel tempo")).toBeTruthy();
  });

  it("NOTE-AUTH-03 no private editor before auth", () => {
    renderEditor(guestValue());
    expect(screen.queryByLabelText("Nota privata")).toBeNull();
  });

  it("NOTE-AUTH-04 auth viewer opens editor directly", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
    renderEditor(authValue());
    fireEvent.click(screen.getByRole("button", { name: "Nota privata" }));
    expect(screen.getByLabelText("Nota privata")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("NOTE-AUTH-06 dismiss AuthSheet causes no mutation", async () => {
    renderEditor(guestValue());
    fireEvent.click(screen.getByRole("button", { name: "Nota privata" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Non ora" }));
    expect(getCanonicalToolWorkspaceState().toolStates.blink).toBeUndefined();
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
  });

  it("NOTE-TOOL-01 auth no-note state", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
    renderEditor(authValue());
    expect(screen.getByRole("button", { name: "Nota privata" })).toBeTruthy();
  });

  it("NOTE-TOOL-02 existing note state", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
    setWorkspaceNote("blink", "Scelto per il daily coding.");
    renderEditor(authValue());
    expect(screen.getByText("Nota privata")).toBeTruthy();
    expect(screen.getByText("Scelto per il daily coding.")).toBeTruthy();
  });

  it("NOTE-TOOL-03/04 edit and save", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
    renderEditor(authValue());
    fireEvent.click(screen.getByRole("button", { name: "Nota privata" }));
    fireEvent.change(screen.getByLabelText("Nota privata"), {
      target: { value: "Da provare sul client" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    expect(getCanonicalToolWorkspaceState().toolStates.blink?.note).toBe(
      "Da provare sul client",
    );
    expect(screen.getByRole("status").textContent).toBe("Salvata");
  });

  it("NOTE-TOOL-05 delete", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
    setWorkspaceNote("blink", "da togliere");
    renderEditor(authValue());
    fireEvent.click(screen.getByRole("button", { name: /Nota privata/ }));
    fireEvent.click(screen.getByRole("button", { name: "Elimina" }));
    expect(getCanonicalToolWorkspaceState().toolStates.blink?.note).toBeNull();
  });
});
