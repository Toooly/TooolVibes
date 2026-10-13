/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/collections/collection-anti-recommendation-v4", () => ({
  CollectionAntiRecommendationV4: () => (
    <section id="cx-detail-anti">
      <h2>Quando NON sceglierei questo stack</h2>
    </section>
  ),
}));

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { CollectionDetailBodyV4 } from "@/components/collections/collection-detail-body-v4";

import { makeCollection, makeSecondaryCollection } from "./fixture";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
  HTMLElement.prototype.scrollTo = vi.fn();
});

function authValue() {
  return {
    authEnabled: true,
    status: "authenticated" as const,
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

function guestValue() {
  return { ...authValue(), status: "guest" as const };
}

function richCollection() {
  return makeCollection({
    stack_variants: [
      {
        label: "lean",
        description: "Minimo per partire",
        core_tool_slugs: ["jenni-ai"],
        gains: ["Meno strumenti"],
      },
      {
        label: "balanced",
        description: "Stack completo",
        core_tool_slugs: ["jenni-ai", "v0"],
      },
    ],
    decision_intelligence: {
      strongest: "La sequenza è corta.",
      weakest: "Poco margine se il team cresce.",
    },
    scenario: {
      title: "Una settimana da founder",
      body: "Parti dalla ricerca. Chiudi un prototipo. Pubblica una landing.",
    },
    anti_recommendation: {
      not_for: "Non è per team enterprise già strutturati.",
    },
  });
}

describe("CollectionDetailBodyV4", () => {
  it("keeps JSON-LD, stack target and a tight guest gate", () => {
    const collection = richCollection();
    render(
      <AccountPreviewProvider value={guestValue()}>
        <CollectionDetailBodyV4
          collection={collection}
          relatedCollections={[makeSecondaryCollection()]}
          allCollections={[collection, makeSecondaryCollection()]}
        />
      </AccountPreviewProvider>,
    );

    expect(document.querySelector('script[type="application/ld+json"]')).toBeTruthy();
    expect(screen.getByRole("link", { name: /Avvia questa raccolta/ }).getAttribute("href")).toBe(
      "#cx-detail-stack",
    );
    expect(screen.getByText("Lo stack completo resta nel tuo spazio.")).toBeTruthy();
    // V3 mockup parity: the stack preview stays visible; the gate locks the depth below it.
    expect(document.getElementById("cx-detail-stack")?.closest(".tv-member-gate__locked")).toBeNull();
    expect(document.getElementById("cx-detail-variants")?.closest(".tv-member-gate__locked")).toBeTruthy();
  });

  it("shows stack flow by default for members while depth stays closed", () => {
    const collection = richCollection();
    render(
      <AccountPreviewProvider value={authValue()}>
        <CollectionDetailBodyV4
          collection={collection}
          relatedCollections={[]}
          allCollections={[collection]}
        />
      </AccountPreviewProvider>,
    );

    expect(document.getElementById("cx-detail-stack")).toBeTruthy();
    expect(document.getElementById("cx-detail-stack")?.closest(".tv-member-gate__locked")).toBeNull();
    expect(document.getElementById("cx-detail-decision")?.hasAttribute("open")).toBe(false);
    expect(document.getElementById("cx-detail-scenario")?.hasAttribute("open")).toBe(false);
    expect(document.getElementById("cx-detail-variants")?.hasAttribute("open")).toBe(false);
    expect(document.getElementById("cx-detail-anti")).toBeTruthy();
  });
});
