// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { accountRuntime, routerRuntime } = vi.hoisted(() => ({
  accountRuntime: { status: "guest" as string },
  routerRuntime: { replace: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerRuntime,
}));

vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => ({
    status: accountRuntime.status,
    authEnabled: true,
    user: null,
    session: null,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: vi.fn(),
    restoreQuarantinedWorkspace: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { ShortlistRouteGate } from "@/components/tools/shortlist-route-gate";

afterEach(() => {
  cleanup();
  accountRuntime.status = "guest";
  routerRuntime.replace.mockReset();
});

describe("Wave 3 ShortlistRouteGate", () => {
  it("W3-R1: guest /shortlist keeps the guest Salvati surface", () => {
    accountRuntime.status = "guest";
    render(
      createElement(
        ShortlistRouteGate,
        null,
        createElement("p", null, "Guest Salvati"),
      ),
    );
    expect(screen.getByText("Guest Salvati")).toBeTruthy();
    expect(routerRuntime.replace).not.toHaveBeenCalled();
  });

  it("W3-R2: authenticated /shortlist redirects to canonical Salvati", () => {
    accountRuntime.status = "authenticated";
    render(
      createElement(
        ShortlistRouteGate,
        null,
        createElement("p", null, "Guest Salvati"),
      ),
    );
    expect(screen.queryByText("Guest Salvati")).toBeNull();
    expect(screen.getByText("Apertura Salvati…")).toBeTruthy();
    expect(routerRuntime.replace).toHaveBeenCalledWith("/account?view=salvati");
  });

  it("W3-R6: guest and loading states do not create a redirect loop", () => {
    accountRuntime.status = "loading";
    render(
      createElement(
        ShortlistRouteGate,
        null,
        createElement("p", null, "Guest Salvati"),
      ),
    );
    expect(screen.getByText("Guest Salvati")).toBeTruthy();
    expect(routerRuntime.replace).not.toHaveBeenCalled();
  });
});
