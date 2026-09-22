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

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Raccolte");
    expect(screen.getByText("Stack completi per risultati concreti.")).toBeTruthy();
    expect(screen.queryByText("Come funzionano le Raccolte?")).toBeNull();
    expect(screen.queryByLabelText("A colpo d'occhio")).toBeNull();
  });

  it("puts the featured collection before gated groups and keeps one card CTA", () => {
    const { container } = render(
      <AccountPreviewProvider value={guestValue()}>
        <CollectionsIndex collections={collections} />
      </AccountPreviewProvider>,
    );

    const featured = container.querySelector(".cx-index__grid--lead");
    const gate = container.querySelector(".tv-member-gate");
    expect(featured).toBeTruthy();
    expect(gate).toBeTruthy();
    expect(
      (featured?.compareDocumentPosition(gate as Node) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      container.querySelector(".cx-card-v4--featured .cx-card-v4__cta")?.textContent,
    ).toContain("Usa questa raccolta");

    expect(screen.getByText("Essenziali per design sprint").closest(".tv-member-gate__locked")).toBeTruthy();
    expect(screen.getByText("Le altre raccolte restano nel tuo spazio.")).toBeTruthy();
  });

  it("omits the index instead of inventing an empty collections state", () => {
    const { container } = render(
      <AccountPreviewProvider value={guestValue()}>
        <CollectionsIndex collections={[]} />
      </AccountPreviewProvider>,
    );
    expect(container.firstChild).toBeNull();
    expect(container.textContent).toBe("");
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
    expect(screen.getAllByText("Usa questa raccolta").length).toBeGreaterThan(0);
  });
});
