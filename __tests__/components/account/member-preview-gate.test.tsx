/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { MemberPreviewGate } from "@/components/account/member-preview-gate";

afterEach(() => {
  cleanup();
});

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
    signOut: async () => undefined,
    workspaceReadyForIntentReplay: false,
  };
}

function authValue() {
  return {
    ...guestValue(),
    status: "authenticated" as const,
  };
}

describe("MemberPreviewGate", () => {
  it("shows register CTA for guests and hides the rest", () => {
    render(
      <AccountPreviewProvider value={guestValue()}>
        <MemberPreviewGate>
          <p>Stack operativo completo</p>
        </MemberPreviewGate>
      </AccountPreviewProvider>,
    );
    expect(screen.getByRole("heading", { name: "Continua nel tuo spazio" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Accedi" }).getAttribute("href")).toBe(
      "/account",
    );
    expect(screen.getByText("Stack operativo completo").closest(".tv-member-gate__locked")).toBeTruthy();
  });

  it("shows children for authenticated members", () => {
    render(
      <AccountPreviewProvider value={authValue()}>
        <MemberPreviewGate>
          <p>Stack operativo completo</p>
        </MemberPreviewGate>
      </AccountPreviewProvider>,
    );
    expect(screen.queryByRole("heading", { name: "Continua nel tuo spazio" })).toBeNull();
    expect(screen.getByText("Stack operativo completo")).toBeTruthy();
    expect(screen.queryByText("Stack operativo completo")?.closest(".tv-member-gate__locked")).toBeNull();
  });
});
