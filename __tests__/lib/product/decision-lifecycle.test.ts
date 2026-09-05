import { describe, expect, it } from "vitest";

import {
  DECISION_LIFECYCLE,
  DECISION_MEANING,
  SHORTLIST_MEANING,
  formatDecisionLifecycle,
} from "@/lib/product/decision-lifecycle";
import { DISCOVERY_INTENTS } from "@/lib/product/discovery-intents";
import { isSkillLevelKey } from "@/lib/product/skill-level";

describe("decision lifecycle canon", () => {
  it("keeps a single five-stage sequence", () => {
    expect(DECISION_LIFECYCLE).toEqual([
      "scopri",
      "valuta",
      "confronta",
      "decidi",
      "ricorda",
    ]);
    expect(formatDecisionLifecycle()).toBe(
      "Scopri → Valuta → Confronta → Decidi → Ricorda",
    );
    expect(SHORTLIST_MEANING).toMatch(/non è decidere/i);
    expect(DECISION_MEANING).toMatch(/motivo/);
  });

  it("does not treat featured as a skill level", () => {
    expect(isSkillLevelKey("featured")).toBe(false);
    expect(isSkillLevelKey("beginner")).toBe(true);
  });

  it("maps intents onto real catalog filters", () => {
    expect(DISCOVERY_INTENTS.length).toBeGreaterThanOrEqual(5);
    for (const intent of DISCOVERY_INTENTS) {
      expect(intent.href.startsWith("/archivio")).toBe(true);
    }
  });
});
