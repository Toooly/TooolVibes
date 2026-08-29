/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/toools/blink",
}));

vi.mock("@/lib/community/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/community/client")>();
  return {
    ...actual,
    fetchOwnerExperience: vi.fn(),
  };
});

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { AuthContinuationProvider } from "@/components/account/auth-continuation-provider";
import { ExperienceOwnerPanel } from "@/components/community/experience-owner-panel";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { fetchOwnerExperience } from "@/lib/community/client";

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

afterEach(() => {
  cleanup();
  vi.mocked(fetchOwnerExperience).mockReset();
});

describe("ExperienceOwnerPanel", () => {
  it("H5-CONT-01 guest CTA opens AuthSheet", async () => {
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={guestValue()}>
          <AuthContinuationProvider>
            <ExperienceOwnerPanel toolSlug="blink" catalogNames={{}} />
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Condividi la tua esperienza" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Condividi la tua esperienza" })).toBeTruthy();
  });

  it("H5-OWNER-02 pending shows In revisione without public body", async () => {
    vi.mocked(fetchOwnerExperience).mockResolvedValue({
      ok: true,
      experience: {
        id: "e1",
        toolSlug: "blink",
        displayName: "Gian",
        useCase: "Daily coding",
        body: "PRIVATE BODY SHOULD NOT DUMP",
        pros: ["Works well enough here"],
        limits: ["Not a public dump here"],
        durationBucket: "months_1_3",
        switchedFromSlug: null,
        switchedFromLabel: null,
        publishedAt: null,
        updatedAt: "2026-08-30T00:00:00.000Z",
        status: "pending",
        createdAt: "2026-08-30T00:00:00.000Z",
        submittedAt: "2026-08-30T00:00:00.000Z",
        moderatedAt: null,
        moderationReason: null,
      },
    });
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={authValue()}>
          <AuthContinuationProvider>
            <ExperienceOwnerPanel toolSlug="blink" catalogNames={{}} />
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    expect(await screen.findByText("In revisione")).toBeTruthy();
    expect(screen.getByText("La tua esperienza è in revisione.")).toBeTruthy();
    expect(screen.queryByText("PRIVATE BODY SHOULD NOT DUMP")).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/secret@example\.com/);
  });

  it("H5-EDIT-02 published warning appears before save", async () => {
    vi.mocked(fetchOwnerExperience).mockResolvedValue({
      ok: true,
      experience: {
        id: "e1",
        toolSlug: "blink",
        displayName: "Gian",
        useCase: "Daily coding",
        body: "A long enough published body for the form.",
        pros: ["Works well enough here"],
        limits: ["Not a public dump here"],
        durationBucket: "months_1_3",
        switchedFromSlug: null,
        switchedFromLabel: null,
        publishedAt: "2026-08-30T00:00:00.000Z",
        updatedAt: "2026-08-30T00:00:00.000Z",
        status: "published",
        createdAt: "2026-08-30T00:00:00.000Z",
        submittedAt: "2026-08-30T00:00:00.000Z",
        moderatedAt: null,
        moderationReason: null,
      },
    });
    render(
      <OverlayProvider>
        <AccountPreviewProvider value={authValue()}>
          <AuthContinuationProvider>
            <ExperienceOwnerPanel toolSlug="blink" catalogNames={{}} />
          </AuthContinuationProvider>
        </AccountPreviewProvider>
      </OverlayProvider>,
    );
    expect(await screen.findByText("Pubblicata")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Modifica" }));
    expect(
      screen.getByText("Dopo la modifica, l’esperienza tornerà in revisione."),
    ).toBeTruthy();
  });
});
