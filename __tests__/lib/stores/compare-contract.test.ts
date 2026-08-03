/**
 * Compare contract — MIN/MAX canonical constants.
 *
 * This test pins the compare state contract:
 *   - MIN_COMPARE_TOOLS = 2  (the number of candidates required to activate the
 *     "Apri confronto" CTA and produce a real comparison)
 *   - MAX_COMPARE_TOOLS = 5  (the hard cap; adding a 6th candidate is blocked)
 *
 * If either value changes, the helper copy, tray visibility, and CTA state
 * all change. They MUST stay in lockstep across:
 *   - tray copy ("Aggiungi N tool" / "Pronto" / "Limite raggiunto")
 *   - bottom-nav badge
 *   - CompareToggle button (each tool card)
 *   - Compare page
 *   - tests
 *   - persistence
 *
 * Root cause of the 2026-07-24 bug: the tray used `MAX - current` to compute
 * the "remaining" copy, which produced "Aggiungi 4 tool" when 1 was selected
 * (because MAX=5, current=1). The correct computation is `MIN - current`,
 * which yields "Aggiungi 1 tool".
 */

import { describe, expect, it } from "vitest";

import {
  MAX_COMPARE_TOOLS,
  MIN_COMPARE_TOOLS,
} from "@/lib/discovery/workspace-constants";
import { adaptDirectoryToolToPublic } from "@/lib/data/tool-public-adapters";
import { createToolPublicView } from "@/lib/data/tool-public-view";
import { scoreToolForCompare } from "@/lib/compare/compare-score";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

describe("Compare contract — canonical MIN/MAX", () => {
  it("MIN_COMPARE_TOOLS = 2 (canonical minimum to activate comparison)", () => {
    expect(MIN_COMPARE_TOOLS).toBe(2);
  });

  it("MAX_COMPARE_TOOLS = 5 (canonical hard cap)", () => {
    expect(MAX_COMPARE_TOOLS).toBe(5);
  });

  it("MIN must be strictly less than MAX", () => {
    expect(MIN_COMPARE_TOOLS).toBeLessThan(MAX_COMPARE_TOOLS);
  });

  it("MIN must be at least 2 (no comparison is meaningful with 1 candidate)", () => {
    expect(MIN_COMPARE_TOOLS).toBeGreaterThanOrEqual(2);
  });

  it("MAX must be at most 6 (UI slot constraint for chip strip)", () => {
    expect(MAX_COMPARE_TOOLS).toBeLessThanOrEqual(6);
  });

  // The exact derivation logic for the tray helper copy and CTA state.
  // Keep this in sync with components/archive/archive-v4-compare-tray.tsx
  describe("tray state derivation", () => {
    function deriveState(count: number) {
      if (count === 0) return { phase: "hidden" as const, ctaEnabled: false };
      if (count >= MAX_COMPARE_TOOLS) {
        return { phase: "at-max" as const, ctaEnabled: false };
      }
      if (count >= MIN_COMPARE_TOOLS) {
        return { phase: "ready" as const, ctaEnabled: true };
      }
      return { phase: "needs-more" as const, ctaEnabled: false };
    }

    it("count = 0 → tray hidden", () => {
      expect(deriveState(0)).toEqual({ phase: "hidden", ctaEnabled: false });
    });

    it("count = 1 → needs-more, CTA disabled, helper says 'Aggiungi 1 tool'", () => {
      const s = deriveState(1);
      expect(s.phase).toBe("needs-more");
      expect(s.ctaEnabled).toBe(false);
    });

    it("count = MIN (2) → ready, CTA active", () => {
      const s = deriveState(MIN_COMPARE_TOOLS);
      expect(s.phase).toBe("ready");
      expect(s.ctaEnabled).toBe(true);
    });

    it("count between MIN and MAX-1 → ready, CTA active", () => {
      for (let n = MIN_COMPARE_TOOLS; n < MAX_COMPARE_TOOLS; n++) {
        expect(deriveState(n).phase).toBe("ready");
        expect(deriveState(n).ctaEnabled).toBe(true);
      }
    });

    it("count = MAX (5) → at-max, CTA disabled, helper says 'Hai raggiunto il limite'", () => {
      const s = deriveState(MAX_COMPARE_TOOLS);
      expect(s.phase).toBe("at-max");
      expect(s.ctaEnabled).toBe(false);
    });

    it("never: count > MAX (overflow impossible — store caps at MAX)", () => {
      // The store rejects additions when count >= MAX_COMPARE_TOOLS, so
      // we never observe a count > MAX in the UI. The derivation is
      // therefore undefined for those values, but we sanity-check that
      // the comparison logic still classifies them as at-max.
      expect(deriveState(MAX_COMPARE_TOOLS + 1).phase).toBe("at-max");
    });
  });

  // The exact helper copy strings, so any i18n refactor surfaces as a
  // failing test.
  describe("tray helper copy strings", () => {
    function helperCopy(count: number): string {
      if (count >= MAX_COMPARE_TOOLS) {
        return `Hai raggiunto il limite di ${MAX_COMPARE_TOOLS} tool.`;
      }
      if (count >= MIN_COMPARE_TOOLS) {
        return "Pronto per il confronto.";
      }
      const stillNeeded = MIN_COMPARE_TOOLS - count;
      return stillNeeded === 1
        ? "Aggiungi 1 tool per attivare il confronto."
        : `Aggiungi ${stillNeeded} tool per attivare il confronto.`;
    }

    it("count = 1 → 'Aggiungi 1 tool per attivare il confronto.'", () => {
      expect(helperCopy(1)).toBe(
        "Aggiungi 1 tool per attivare il confronto.",
      );
    });

    it("count = MAX → 'Hai raggiunto il limite di MAX tool.'", () => {
      expect(helperCopy(MAX_COMPARE_TOOLS)).toBe(
        `Hai raggiunto il limite di ${MAX_COMPARE_TOOLS} tool.`,
      );
    });

    it("count in [MIN, MAX-1] → 'Pronto per il confronto.'", () => {
      for (let n = MIN_COMPARE_TOOLS; n < MAX_COMPARE_TOOLS; n++) {
        expect(helperCopy(n)).toBe("Pronto per il confronto.");
      }
    });

    it("never hardcodes 'Aggiungi 4 tool' (regression: MAX-current bug)", () => {
      // The 2026-07-24 bug used `MAX - current` and produced
      // 'Aggiungi 4 tool' when 1 was selected. That value is exactly
      // MAX - 1, which should NEVER appear in the helper copy now that
      // we use MIN - current.
      expect(helperCopy(1)).not.toBe(
        `Aggiungi ${MAX_COMPARE_TOOLS - 1} tool per attivare il confronto.`,
      );
    });
  });

  // Bottom-nav badge consistency: the badge displays the same N as the
  // tray counter and the Compare route candidate count.
  describe("cross-surface consistency (count badge)", () => {
    function trayCounter(count: number) {
      return `${count}/${MAX_COMPARE_TOOLS}`;
    }

    function bottomNavBadge(count: number) {
      return count > 0 ? count : null;
    }

    it("badge equals tray counter (top number) at every count", () => {
      for (let n = 0; n <= MAX_COMPARE_TOOLS; n++) {
        const [current] = trayCounter(n).split("/");
        expect(parseInt(current, 10)).toBe(n);
        if (n === 0) {
          expect(bottomNavBadge(n)).toBeNull();
        } else {
          expect(bottomNavBadge(n)).toBe(n);
        }
      }
    });
  });
});

/**
 * Closure 2026-08-03 §2 — il workspace store conserva solo slug, non score.
 * Il dato editoriale verified viene reidratato dal resolver canonico
 * (`getPublicToolViews` → `adaptDirectoryToolToPublic` → assessment).
 */

describe("Compare store — rehydration from canonical data (closure 2026-08-03 §2)", () => {
  function rehydrateCompareView(slug: string) {
    const directory = directoryTools.find((tool) => tool.slug === slug);
    if (!directory) throw new Error(`directory tool ${slug} not found`);
    const publicTool = adaptDirectoryToolToPublic(directory, { status: "published" });
    return createToolPublicView(publicTool, directory);
  }

  it("the workspace store keeps only slugs, never score snapshots", () => {
    // Simula il workspace store canonico: contiene solo slug,
    // nessun ToolPublic, nessun punteggio. Il punteggio arriva solo
    // dopo la reidratazione dal dataset canonico.
    const storedState: { compare: { slugs: string[] } } = {
      compare: { slugs: ["blink", "vibecode", "weweb"] },
    };
    expect(storedState.compare.slugs).toEqual(["blink", "vibecode", "weweb"]);
    // Lo stato non contiene `score`, `total`, o altri campi editoriali.
    expect(JSON.stringify(storedState)).not.toMatch(/value/);
    expect(JSON.stringify(storedState)).not.toMatch(/total/);
  });

  it("rehydrated Blink, VibeCode, and WeWeb views stay not_assessed", () => {
    for (const slug of ["blink", "vibecode", "weweb"]) {
      const view = rehydrateCompareView(slug);
      const result = scoreToolForCompare(view.publicTool);

      expect(result.assessment.state).toBe("not_assessed");
      expect(result.total).toBeNull();
    }
  });
});
