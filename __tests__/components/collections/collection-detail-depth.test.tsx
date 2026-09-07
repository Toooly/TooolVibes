/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CollectionAntiRecommendationV4 } from "@/components/collections/collection-anti-recommendation-v4";
import { CollectionDecisionNotesV4 } from "@/components/collections/collection-decision-notes-v4";
import { CollectionScenarioV4 } from "@/components/collections/collection-scenario-v4";
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
    expect(scenario?.querySelector("summary")?.textContent).toBe("Esempio reale");

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
