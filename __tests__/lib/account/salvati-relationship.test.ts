import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import {
  SALVATI_FEW_THRESHOLD,
  composeSalvatiLibrary,
  formatStackContext,
  listSalvatiRelationships,
  matchesSalvatiFilter,
  salvatiPrimaryAction,
} from "@/lib/account/salvati-relationship";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";

describe("Salvati relationship library model", () => {
  it("maps one saved corpus without a second library", () => {
    const items = listSalvatiRelationships(workspaceTestFixtures.mature);
    expect(items.map((item) => item.slug)).toEqual(workspaceTestFixtures.mature.saved.slugs);
    expect(items).toHaveLength(workspaceTestFixtures.mature.saved.slugs.length);
  });

  it("maps relationship state from existing usage, decision, and stage", () => {
    const bySlug = new Map(
      listSalvatiRelationships(workspaceTestFixtures.mature).map((item) => [item.slug, item]),
    );
    expect(bySlug.get("cursor")?.compact.label).toBe("In uso");
    expect(bySlug.get("v0")?.compact.label).toBe("Scartato");
    expect(bySlug.get("meku")?.compact.label).toBe("Rimandato");
    expect(bySlug.get("linear")?.compact.label).toBe("Sostituito");
    expect(bySlug.get("qa-tool-12")?.compact.label).toBe("Salvato");
  });

  it("indexes stack membership without duplicating Stack as folders", () => {
    const cursor = listSalvatiRelationships(workspaceTestFixtures.multiStack).find(
      (item) => item.slug === "cursor",
    );
    expect(cursor?.stackNames).toEqual(["AI Coding", "Marketing"]);
    expect(formatStackContext(cursor?.stackNames ?? [])).toBe("AI Coding +1");
  });

  it("exposes compare membership and review-due from existing state", () => {
    const mature = listSalvatiRelationships(workspaceTestFixtures.mature);
    const cursor = mature.find((item) => item.slug === "cursor");
    const blink = mature.find((item) => item.slug === "blink");
    expect(cursor?.inCompare).toBe(true);
    expect(blink?.inCompare).toBe(true);

    const review = listSalvatiRelationships(workspaceTestFixtures.reviewDue);
    expect(review[0]?.reviewDue).toBe(true);
    expect(review[0]?.primaryAction.kind).toBe("rivedi");
  });

  it("keeps filters mutually exclusive for library questions", () => {
    const items = listSalvatiRelationships(workspaceTestFixtures.mature);
    const inUso = items.filter((item) => matchesSalvatiFilter(item, "in_uso"));
    const scelti = items.filter((item) => matchesSalvatiFilter(item, "scelti"));
    const overlap = scelti.filter((item) => inUso.some((using) => using.slug === item.slug));
    expect(inUso.map((item) => item.slug)).toEqual(["cursor"]);
    expect(overlap).toEqual([]);
    expect(items.filter((item) => matchesSalvatiFilter(item, "scartati")).map((item) => item.slug)).toEqual([
      "v0",
    ]);
  });

  it("hides relationship filters on few-item libraries", () => {
    const few = composeSalvatiLibrary(workspaceTestFixtures.fewSaved);
    const empty = composeSalvatiLibrary(createEmptyWorkspaceState());
    const mature = composeSalvatiLibrary(workspaceTestFixtures.mature);
    expect(few.items.length).toBeLessThan(SALVATI_FEW_THRESHOLD);
    expect(few.showFilters).toBe(false);
    expect(empty.showFilters).toBe(false);
    expect(mature.showFilters).toBe(true);
  });

  it("chooses one contextual primary action", () => {
    expect(
      salvatiPrimaryAction({
        reviewDue: true,
        inCompare: true,
        compareCount: 3,
        outcome: "deferred",
        usage: null,
        slug: "meku",
      }).kind,
    ).toBe("rivedi");
    expect(
      salvatiPrimaryAction({
        reviewDue: false,
        inCompare: true,
        compareCount: 3,
        outcome: "selected",
        usage: "using",
        slug: "cursor",
      }),
    ).toEqual({ kind: "continua_confronto", label: "Continua confronto", href: "/compare" });
    expect(
      salvatiPrimaryAction({
        reviewDue: false,
        inCompare: false,
        compareCount: 0,
        outcome: null,
        usage: null,
        slug: "blink",
      }).kind,
    ).toBe("valuta");
    expect(
      salvatiPrimaryAction({
        reviewDue: false,
        inCompare: false,
        compareCount: 0,
        outcome: "selected",
        usage: null,
        slug: "linear",
      }).kind,
    ).toBe("conferma_uso");
  });

  it("does not bump persistence or invent a second corpus", () => {
    const source = readFileSync(join(process.cwd(), "lib/account/salvati-relationship.ts"), "utf8");
    expect(source).not.toMatch(/schemaVersion:\s*2/);
    expect(source).not.toContain("localStorage");
    expect(workspaceTestFixtures.mature.schemaVersion).toBe(1);
  });
});
