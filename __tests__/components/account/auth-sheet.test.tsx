/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/toools/blink",
}));

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { AuthContinuationProvider, useAuthContinuation } from "@/components/account/auth-continuation-provider";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { PENDING_AUTH_INTENT_STORAGE_KEY } from "@/lib/auth/pending-auth-intent";

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

function Trigger() {
  const continuation = useAuthContinuation();
  return (
    <button
      type="button"
      onClick={() =>
        continuation.requestStackCreate({
          toolSlug: "blink",
          desiredStackName: "Podcast",
          origin: "test",
        })
      }
    >
      Apri stack
    </button>
  );
}

function renderGate() {
  return render(
    <OverlayProvider>
      <AccountPreviewProvider value={guestValue()}>
        <AuthContinuationProvider>
          <Trigger />
        </AuthContinuationProvider>
      </AccountPreviewProvider>
    </OverlayProvider>,
  );
}

describe("AuthSheet", () => {
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
    sendMagicLink.mockClear();
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
    window.localStorage.clear();
  });

  it("AUTH-01 guest stack action opens the sheet", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("AUTH-02 uses benefit copy", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    expect(await screen.findByText("Crea il tuo spazio di lavoro")).toBeTruthy();
    expect(
      screen.getByText(/Gli Stack restano sincronizzati con il tuo account/),
    ).toBeTruthy();
    expect(screen.queryByText(/Registrati per continuare/)).toBeNull();
  });

  it("AUTH-03 dismiss mutates nothing", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Non ora" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
    expect(sendMagicLink).not.toHaveBeenCalled();
  });

  it("AUTH-04/05 continue stores intent then sends magic link", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continua con il tuo account" }));
    await waitFor(() => {
      expect(sendMagicLink).toHaveBeenCalledWith("user@example.com");
    });
    const raw = window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(raw).toContain("blink");
    expect(raw).toContain("Podcast");
  });

  it("AUTH-06/08 invalid email shows an error", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "nope" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continua con il tuo account" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(sendMagicLink).not.toHaveBeenCalled();
  });

  it("AUTH-07 link-sent state", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continua con il tuo account" }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByText(/Controlla la tua email/)).toBeTruthy();
  });
});
