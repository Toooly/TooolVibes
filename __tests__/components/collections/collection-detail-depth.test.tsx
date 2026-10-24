/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CollectionAntiRecommendationV4 } from "@/components/collections/collection-anti-recommendation-v4";
import { CollectionDecisionNotesV4 } from "@/components/collections/collection-decision-notes-v4";
import { CollectionScenarioV4 } from "@/components/collections/collection-scenario-v4";
import { CollectionStackFlowV4 } from "@/components/collections/collection-stack-flow-v4";
import { CollectionVariantPathsV4 } from "@/components/collections/collection-variant-paths-v4";

import { makeCollection, makeSecondaryCollection } from "./fixture";

afterEach(() => {
  cleanup();
});

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
      look_instead_at: ["design-sprint-essentials"],
    },
  });
}

describe("collection detail depth", () => {
  it("keeps mobile stage explanations outside the desktop-only exposition", () => {
    const collection = makeCollection();
    collection.included_tools[0].why_chosen = "Unisce le fonti in un unico progetto.";
    collection.included_tools[0].input = "Le fonti da verificare";
    collection.included_tools[0].output = "Una ricerca pronta da usare";
    const { container } = render(<CollectionStackFlowV4 collection={collection} />);
    const stage = container.querySelector(".cx-stack-flow-v4__stage");
    const disclosure = stage?.querySelector("details");

    expect(disclosure?.parentElement).toBe(stage);
    expect(disclosure?.closest(".cx-stack-flow-v4__row")).toBeNull();
    expect(disclosure?.querySelector(".cx-stack-flow-v4__mobile-context")?.textContent).toContain("Una ricerca pronta da usare");
    expect(disclosure?.hasAttribute("open")).toBe(false);
  });

  it("keeps the desktop tool destination reachable by keyboard and assistive technology", () => {
    const { container } = render(<CollectionStackFlowV4 collection={makeCollection()} />);
    const desktopLink = container.querySelector<HTMLAnchorElement>(".cx-stack-flow-v4__tool--full");

    expect(desktopLink?.getAttribute("href")).toBe("/toools/jenni-ai");
    expect(desktopLink?.hasAttribute("aria-hidden")).toBe(false);
    expect(desktopLink?.tabIndex).toBe(0);
  });

  it("keeps decision notes, scenario and variants collapsed by default", () => {
    const collection = richCollection();
    const { container: d } = render(<CollectionDecisionNotesV4 collection={collection} />);
    const decision = d.querySelector("#cx-detail-decision");
    expect(decision?.tagName.toLowerCase()).toBe("details");
    expect(decision?.hasAttribute("open")).toBe(false);
    expect(decision?.querySelector("summary")?.textContent).toBe("Note di decisione");

    const { container: s } = render(<CollectionScenarioV4 collection={collection} />);
    const scenario = s.querySelector("#cx-detail-scenario");
    expect(scenario?.tagName.toLowerCase()).toBe("details");
    expect(scenario?.hasAttribute("open")).toBe(false);
    expect(scenario?.querySelector("summary")?.textContent).toBe("Esempio d’uso");

    const { container: v } = render(<CollectionVariantPathsV4 collection={collection} />);
    const variants = v.querySelector("#cx-detail-variants");
    expect(variants?.tagName.toLowerCase()).toBe("details");
    expect(variants?.hasAttribute("open")).toBe(false);
    expect(variants?.querySelector("summary")?.textContent).toBe("Varianti e percorsi");
  });

  it("keeps anti-recommendation visible and compact", async () => {
    const collection = richCollection();
    const related = makeSecondaryCollection();
    render(await CollectionAntiRecommendationV4({ collection, allCollections: [collection, related] }));
    const section = document.getElementById("cx-detail-anti");
    expect(section?.tagName.toLowerCase()).toBe("section");
    expect(section?.querySelector("details")).toBeNull();
    expect(screen.getByText("Non è per team enterprise già strutturati.")).toBeTruthy();
    expect(screen.queryByText(/Alcune raccolte non sono la risposta/)).toBeNull();
  });
});
