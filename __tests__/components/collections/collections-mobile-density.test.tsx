/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { CollectionDetailHeroV4 } from "@/components/collections/collection-detail-hero-v4";
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

describe("collections mobile density — index", () => {
  it("splits the lede so mobile can keep one sentence and hide meta counts", () => {
    const { container } = render(
      <AccountPreviewProvider value={guestValue()}>
        <CollectionsIndex collections={[makeSecondaryCollection(), makeCollection()]} />
      </AccountPreviewProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/percorso/i);
    expect(container.querySelector(".cx-index__lede-lead")?.textContent).toMatch(/stack operativi/i);
    expect(container.querySelector(".cx-index__lede-extra")?.textContent).toMatch(/Non un elenco/i);
    expect(screen.getByLabelText("A colpo d'occhio")).toBeTruthy();

    const how = screen.getByText("Come funzionano le Raccolte?").closest("details");
    expect(how?.hasAttribute("open")).toBe(false);
  });

  it("keeps featured collection CTA out of activation yellow", () => {
    const { container } = render(
      <AccountPreviewProvider value={guestValue()}>
        <CollectionsIndex collections={[makeSecondaryCollection(), makeCollection()]} />
      </AccountPreviewProvider>,
    );

    const cta = container.querySelector(".cx-card-v4--featured .cx-card-v4__cta");
    expect(cta?.textContent).toContain("Apri la raccolta");
    expect(cta?.className).not.toMatch(/activation|yellow/i);
  });
});

describe("collections mobile density — detail", () => {
  it("keeps outcome, target, four metrics and a non-yellow stack CTA", () => {
    const collection = makeCollection();
    const { container } = render(<CollectionDetailHeroV4 collection={collection} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(collection.title);
    expect(screen.getByText("Dall'idea al primo prodotto vendibile")).toBeTruthy();
    expect(screen.getByText("Per founder indipendenti e builder snelli")).toBeTruthy();
    expect(container.querySelectorAll(".cx-detail-hero-v4__decision-item")).toHaveLength(4);

    const primary = screen.getByRole("link", { name: /Apri lo stack/ });
    expect(primary.className).toContain("cx-detail-hero-v4__cta--primary");
    expect(primary.className).not.toMatch(/activation|yellow/i);
    expect(container.querySelector(".cx-detail-hero-v4__stack")).toBeTruthy();
  });
});
