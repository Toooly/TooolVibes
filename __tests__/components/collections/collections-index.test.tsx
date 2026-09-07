/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { CollectionsIndex } from "@/components/collections/collections-index";

import { makeCollection, makeSecondaryCollection } from "./fixture";

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

describe("CollectionsIndex", () => {
  const collections = [makeSecondaryCollection(), makeCollection()];

  it("keeps masthead live counts and hides taxonomy behind a collapsed control", () => {
    render(
      <AccountPreviewProvider value={guestValue()}>
        <CollectionsIndex collections={collections} />
      </AccountPreviewProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/percorso/i);
    expect(screen.getByLabelText("A colpo d'occhio").textContent).toContain("2 raccolte");
    expect(screen.getByLabelText("A colpo d'occhio").textContent).toContain("tool nello stack");
    expect(screen.getByLabelText("A colpo d'occhio").textContent).not.toContain("CORE");
    expect(screen.queryByText(/Verificato agosto 2026/)).toBeNull();

    const how = screen.getByText("Come funzionano le Raccolte?").closest("details");
    expect(how).toBeTruthy();
    expect(how?.hasAttribute("open")).toBe(false);
    expect(how?.textContent).toContain("Le raccolte non sono guide né confronti.");
    expect(how?.textContent).toContain("CORE / OPT / ALT");
    expect(how?.querySelector(".cx-index__compare-strip")).toBeTruthy();
  });

  it("puts the featured collection before gated groups and keeps one card CTA", () => {
    const { container } = render(
      <AccountPreviewProvider value={guestValue()}>
        <CollectionsIndex collections={collections} />
      </AccountPreviewProvider>,
    );

    const featured = container.querySelector(".cx-index__start");
    const gate = container.querySelector(".tv-member-gate");
    const how = container.querySelector(".cx-index__how");
    expect(featured).toBeTruthy();
    expect(gate).toBeTruthy();
    expect(how).toBeTruthy();
    expect(
      (how?.compareDocumentPosition(featured as Node) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (featured?.compareDocumentPosition(gate as Node) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByRole("heading", { name: "In evidenza" })).toBeTruthy();
    expect(
      container.querySelector(".cx-card-v4--featured .cx-card-v4__cta")?.textContent,
    ).toContain("Apri la raccolta");

    expect(screen.getByText("Essenziali per design sprint").closest(".tv-member-gate__locked")).toBeTruthy();
    expect(screen.getByText("Le altre raccolte restano nel tuo spazio.")).toBeTruthy();
  });

  it("does not unlock gated groups for guests and shows them to members", () => {
    const { rerender } = render(
      <AccountPreviewProvider value={guestValue()}>
        <CollectionsIndex collections={collections} />
      </AccountPreviewProvider>,
    );
    expect(screen.getByText("Essenziali per design sprint").closest(".tv-member-gate__locked")).toBeTruthy();

    rerender(
      <AccountPreviewProvider value={authValue()}>
        <CollectionsIndex collections={collections} />
      </AccountPreviewProvider>,
    );
    expect(screen.queryByText("Essenziali per design sprint")?.closest(".tv-member-gate__locked")).toBeNull();
    expect(screen.getByRole("heading", { name: /Costruisci/ })).toBeTruthy();
  });
});
