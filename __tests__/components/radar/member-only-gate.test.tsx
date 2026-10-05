/**
 * @vitest-environment jsdom
 *
 * Logged-only Radar auth contract (spec §3, §45, §48).
 *
 * `MemberOnlyGate` must NOT render the locked surface for guests at all —
 * not even `inert` — so no guest HTML leak, no giant Radar behind the gate,
 * and no logged-only data fetch before auth is known.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MemberOnlyGate } from "@/components/account/member-only-gate";
import { AccountPreviewProvider } from "@/components/account/account-provider";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function accountValue(status: "guest" | "authenticated" | "loading") {
  return {
    authEnabled: true,
    status,
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
    workspaceReadyForIntentReplay: status === "authenticated",
  } as unknown as React.ComponentProps<typeof AccountPreviewProvider>["value"];
}

const SECRET_MARKER = "RADAR-LOGGED-ONLY-SECRET-DATA";

function renderGate(status: "guest" | "authenticated" | "loading") {
  return render(
    <AccountPreviewProvider value={accountValue(status)}>
      <MemberOnlyGate>
        <div data-testid="locked-surface">{SECRET_MARKER}</div>
      </MemberOnlyGate>
    </AccountPreviewProvider>,
  );
}

afterEach(cleanup);

describe("MemberOnlyGate (FULL Radar auth)", () => {
  it("RADAR-AUTH-GUEST-01 guest non riceve alcun DOM della superficie protetta", () => {
    const { container } = renderGate("guest");

    expect(screen.getByRole("heading", { name: /accedi per continuare/i })).toBeTruthy();
    expect(container.innerHTML).not.toContain(SECRET_MARKER);
    expect(screen.queryByTestId("locked-surface")).toBeNull();
    expect(container.querySelector(".tv-member-gate__locked")).toBeNull();
  });

  it("RADAR-AUTH-GUEST-02 nessun flash del contenuto completo prima che l'auth risolva", () => {
    const { container } = renderGate("loading");

    expect(container.innerHTML).not.toContain(SECRET_MARKER);
    expect(screen.queryByTestId("locked-surface")).toBeNull();
  });

  it("RADAR-AUTH-USER-01 utente autenticato vede il contenuto completo", () => {
    renderGate("authenticated");

    expect(screen.getByTestId("locked-surface")).toBeTruthy();
    expect(screen.getByText(SECRET_MARKER)).toBeTruthy();
  });

  it("RADAR-AUTH-COOKIE-01 nessun cookie di presentazione concede autorizzazione", () => {
    // `tv-density` and similar presentation hints are documented as non-auth.
    // The gate keys ONLY off `useAccount().status`.
    document.cookie = "tv-density=full";
    const { container } = renderGate("guest");

    expect(container.innerHTML).not.toContain(SECRET_MARKER);
    document.cookie = "tv-density=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });
});
