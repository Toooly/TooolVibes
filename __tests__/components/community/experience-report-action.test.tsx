/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/toools/blink",
}));

const mocks = vi.hoisted(() => ({
  own: null as string | null,
  report: {
    ok: true as boolean,
    error: { code: "SERVER_ERROR", message: "x" },
  },
}));

vi.mock("@/lib/community/own-experience-cache", () => ({
  loadOwnExperience: async () => ({ id: mocks.own }),
}));

vi.mock("@/lib/community/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/community/client")>();
  return {
    ...actual,
    reportExperience: async () =>
      mocks.report.ok
        ? { ok: true, id: "rep-1", status: "open" }
        : { ok: false, error: mocks.report.error },
  };
});

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { ExperienceReportAction } from "@/components/community/experience-report-action";
import { OverlayProvider } from "@/components/ui/overlay-provider";

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
    sendMagicLink: async () => ({ ok: true, message: "ok" }),
    restoreQuarantinedWorkspace: async () => ({ ok: true, message: "ok" }),
    signOut: async () => {},
    workspaceReadyForIntentReplay: false,
  };
}

function authValue() {
  return {
    authEnabled: true,
    status: "authenticated" as const,
    user: {
      id: "u1",
      email: "secret@example.com",
      aud: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: "2026-01-01T00:00:00.000Z",
    },
    session: { access_token: "tok" } as never,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: async () => ({ ok: true, message: "ok" }),
    restoreQuarantinedWorkspace: async () => ({ ok: true, message: "ok" }),
    signOut: async () => {},
    workspaceReadyForIntentReplay: true,
  };
}

function renderAction(accountValue: ReturnType<typeof authValue> | ReturnType<typeof guestValue>) {
  return render(
    <OverlayProvider>
      <AccountPreviewProvider value={accountValue}>
        <ExperienceReportAction experienceId="exp-2" toolSlug="blink" />
      </AccountPreviewProvider>
    </OverlayProvider>,
  );
}

describe("H6 report UI", () => {
  afterEach(() => {
    cleanup();
    mocks.own = null;
    mocks.report = { ok: true, error: { code: "SERVER_ERROR", message: "x" } };
  });

  it("H6-UI-01 guest sees no Segnala", async () => {
    const { container } = renderAction(guestValue());
    await waitFor(() => {
      expect(container.querySelector("button")).toBeNull();
    });
    expect(screen.queryByText("Segnala")).toBeNull();
  });

  it("H6-UI-02 auth sees Segnala", async () => {
    renderAction(authValue());
    expect(await screen.findByRole("button", { name: "Segnala" })).toBeTruthy();
  });

  it("H6-UI-03 own experience hides Segnala", async () => {
    mocks.own = "exp-2";
    const { container } = renderAction(authValue());
    await waitFor(() => {
      expect(container.querySelector("button")).toBeNull();
    });
  });

  it("H6-UI-04/05/06 dialog submits a reason", async () => {
    renderAction(authValue());
    fireEvent.click(await screen.findByRole("button", { name: "Segnala" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Segnala questa esperienza")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Spam"));
    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione" }));
    await waitFor(() => {
      expect(screen.getByText("Segnalazione inviata.")).toBeTruthy();
    });
  });

  it("H6-UI-07 duplicate shows friendly copy and blocks retry", async () => {
    mocks.report = {
      ok: false,
      error: { code: "EXPERIENCE_ALREADY_REPORTED", message: "x" },
    };
    renderAction(authValue());
    fireEvent.click(await screen.findByRole("button", { name: "Segnala" }));
    fireEvent.click(await screen.findByLabelText("Spam"));
    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione" }));
    await waitFor(() => {
      expect(screen.getByText(/già segnalata/i)).toBeTruthy();
    });
    expect(screen.queryByRole("button", { name: "Segnala" })).toBeNull();
  });

  it("H6-UI-08 rate limit copy", async () => {
    mocks.report = {
      ok: false,
      error: { code: "RATE_LIMITED", message: "x" },
    };
    renderAction(authValue());
    fireEvent.click(await screen.findByRole("button", { name: "Segnala" }));
    fireEvent.click(await screen.findByLabelText("Contenuto offensivo"));
    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione" }));
    await waitFor(() => {
      expect(screen.getByText(/Troppe segnalazioni/i)).toBeTruthy();
    });
  });

  it("H6-UI-09 generic error keeps the dialog open with details preserved", async () => {
    mocks.report = {
      ok: false,
      error: { code: "SERVER_ERROR", message: "x" },
    };
    renderAction(authValue());
    fireEvent.click(await screen.findByRole("button", { name: "Segnala" }));
    fireEvent.click(await screen.findByLabelText("Spam"));
    fireEvent.change(screen.getByLabelText(/Dettagli/), {
      target: { value: "Pubblicità continua" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione" }));
    await waitFor(() => {
      expect(screen.getByText("Non siamo riusciti a inviare la segnalazione.")).toBeTruthy();
    });
    expect((screen.getByLabelText(/Dettagli/) as HTMLTextAreaElement).value).toBe(
      "Pubblicità continua",
    );
  });

  it("H6-PRIV-02 no email or uid surfaces in the UI", async () => {
    renderAction(authValue());
    fireEvent.click(await screen.findByRole("button", { name: "Segnala" }));
    await screen.findByRole("dialog");
    expect(document.body.textContent).not.toMatch(/secret@example\.com|u1/);
  });
});
