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

function NoteTrigger() {
  const continuation = useAuthContinuation();
  return (
    <button
      type="button"
      onClick={() =>
        continuation.requestNotePrivate({
          toolSlug: "blink",
          origin: "note.tool",
        })
      }
    >
      Apri nota
    </button>
  );
}

function SearchTrigger() {
  const continuation = useAuthContinuation();
  return (
    <button
      type="button"
      onClick={() =>
        continuation.requestSearchPersonal({
          query: "usage:using",
          origin: "command-palette",
          returnTo: "/archivio",
        })
      }
    >
      Apri ricerca
    </button>
  );
}

function renderSearchGate() {
  return render(
    <OverlayProvider>
      <AccountPreviewProvider value={guestValue()}>
        <AuthContinuationProvider>
          <SearchTrigger />
        </AuthContinuationProvider>
      </AccountPreviewProvider>
    </OverlayProvider>,
  );
}

function renderNoteGate() {
  return render(
    <OverlayProvider>
      <AccountPreviewProvider value={guestValue()}>
        <AuthContinuationProvider>
          <NoteTrigger />
        </AuthContinuationProvider>
      </AccountPreviewProvider>
    </OverlayProvider>,
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

  it("AUTH-09 Escape dismisses without writing intent", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
  });

  it("AUTH-10 dialog is labelled and described", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    const labelId = dialog.getAttribute("aria-labelledby") ?? "";
    expect(document.getElementById(labelId)?.textContent).toMatch(/Crea il tuo spazio di lavoro/);
  });

  it("AUTH-11 stored intent never contains the email", async () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continua con il tuo account" }));
    await waitFor(() => {
      expect(sendMagicLink).toHaveBeenCalled();
    });
    const raw = window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY) ?? "";
    expect(raw).not.toContain("user@example.com");
    expect(raw).not.toContain("email");
  });

  it("AUTH-12 loading status does not open the sheet", () => {
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={{ ...guestValue(), status: "loading" }}>
          <AuthContinuationProvider>
            <Trigger />
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Apri stack" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("AUTH-NOTE-01 guest note.private opens Ricordalo nel tempo", async () => {
    renderNoteGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri nota" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Ricordalo nel tempo")).toBeTruthy();
    expect(screen.getByText(/Le note restano collegate al tool/)).toBeTruthy();
  });
});


describe("AuthSheet — search.personal", () => {
  it("SEARCH-AUTH-03 uses Cerca nel tuo spazio copy", async () => {
    renderSearchGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri ricerca" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Cerca nel tuo spazio")).toBeTruthy();
    expect(
      screen.getByText("Cerca tra salvati, Stack, decisioni e note personali."),
    ).toBeTruthy();
  });

  it("SEARCH-AUTH-04 dismiss does not write intent", async () => {
    renderSearchGate();
    fireEvent.click(screen.getByRole("button", { name: "Apri ricerca" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Non ora" }));
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
  });
});
