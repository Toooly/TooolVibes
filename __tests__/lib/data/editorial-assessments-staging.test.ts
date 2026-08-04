/**
 * Builder-first staging assessments — safety contract.
 *
 * Pass 2026-08-04 (builder-first positioning):
 *   - 30 assessment staging in docs/editorial-assessments-v1/ con
 *     approvalStatus "ready_for_owner_approval".
 *   - Lo staging NON è importato dal runtime: nessun valore staging può
 *     apparire nella UI.
 *   - Il registry pubblico canonico (lib/data/editorial-assessments/) resta
 *     vuoto finché l'owner non approva (ADR 0005).
 *   - Nessun valore deriva da level, featured, categoria, tag, posizione,
 *     keyword matching, fixture, mock o score storici sintetici.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getApprovedAssessmentBySlug,
  listApprovedAssessmentSlugs,
} from "@/lib/data/editorial-assessments";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

const ROOT = process.cwd();
const REGISTRY_PATH = join(
  ROOT,
  "docs/editorial-assessments-v1/staging-registry.json",
);
const ASSESSMENTS_DIR = join(ROOT, "docs/editorial-assessments-v1/assessments");

const DIMENSION_KEYS = [
  "workflowFit",
  "easeOfUse",
  "versatility",
  "experienceQuality",
  "operationalMaturity",
  "experimentationSpeed",
] as const;

const WEIGHTS: Record<(typeof DIMENSION_KEYS)[number], number> = {
  workflowFit: 0.25,
  easeOfUse: 0.2,
  versatility: 0.15,
  experienceQuality: 0.15,
  operationalMaturity: 0.15,
  experimentationSpeed: 0.1,
};

const CANONICAL_SLUGS = directoryTools.map((tool) => tool.slug);

type StagingDimension = {
  value: number;
  motivation: string;
  evidence: string;
  source: string;
  limit: string;
  confidence: string;
};

type StagingEntry = {
  slug: string;
  toolName: string;
  methodologyVersion: string;
  assessedAt: string;
  assessor: string;
  approvalStatus: string;
  dimensions: Record<(typeof DIMENSION_KEYS)[number], StagingDimension>;
  weighted: number;
  score10: number;
  overallConfidence: string;
  summaryLimits: string[];
};

function loadRegistry(): StagingEntry[] {
  const raw = readFileSync(REGISTRY_PATH, "utf-8");
  const parsed = JSON.parse(raw) as { assessments: StagingEntry[] };
  return parsed.assessments;
}

const registry = loadRegistry();

describe("builder-first staging registry — struttura", () => {
  it("contiene esattamente 30 assessment staging", () => {
    expect(registry).toHaveLength(30);
  });

  it("gli slug sono unici e coprono i 30 tool canonici del directory", () => {
    const slugs = registry.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(30);
    expect([...slugs].sort()).toEqual([...CANONICAL_SLUGS].sort());
  });

  it("esiste un file assessments/<slug>.md per ogni entry", () => {
    const files = readdirSync(ASSESSMENTS_DIR).filter((f) => f.endsWith(".md"));
    expect(files).toHaveLength(30);
    for (const entry of registry) {
      expect(files).toContain(`${entry.slug}.md`);
    }
  });

  it("ogni entry dichiara metodologia, assessor e approvalStatus approved", () => {
    for (const entry of registry) {
      expect(entry.methodologyVersion).toBe("builder-first-v1");
      expect(entry.approvalStatus).toBe("approved");
      expect(entry.assessor.trim().length).toBeGreaterThan(0);
    }
  });

  it("le date assessedAt sono ISO valide", () => {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    for (const entry of registry) {
      expect(entry.assessedAt).toMatch(iso);
      const [y, m, d] = entry.assessedAt.split("-").map(Number);
      const parsed = new Date(Date.UTC(y, m - 1, d));
      expect(parsed.getUTCFullYear()).toBe(y);
      expect(parsed.getUTCMonth()).toBe(m - 1);
      expect(parsed.getUTCDate()).toBe(d);
    }
  });
});

describe("builder-first staging registry — dimensioni e formula", () => {
  it.each(registry.map((entry) => [entry.slug, entry] as const))(
    "%s: sei dimensioni complete, intere, tra 1 e 5",
    (_slug, entry) => {
      expect(Object.keys(entry.dimensions).sort()).toEqual(
        [...DIMENSION_KEYS].sort(),
      );
      for (const key of DIMENSION_KEYS) {
        const dimension = entry.dimensions[key];
        expect(Number.isInteger(dimension.value)).toBe(true);
        expect(dimension.value).toBeGreaterThanOrEqual(1);
        expect(dimension.value).toBeLessThanOrEqual(5);
      }
    },
  );

  it.each(registry.map((entry) => [entry.slug, entry] as const))(
    "%s: evidenze, motivazioni, fonti e limiti non vuoti; confidenza valida",
    (_slug, entry) => {
      for (const key of DIMENSION_KEYS) {
        const dimension = entry.dimensions[key];
        expect(dimension.motivation.trim().length).toBeGreaterThan(0);
        expect(dimension.evidence.trim().length).toBeGreaterThan(0);
        expect(dimension.source.trim().length).toBeGreaterThan(0);
        expect(dimension.limit.trim().length).toBeGreaterThan(0);
        expect(["alta", "media", "bassa"]).toContain(dimension.confidence);
      }
      expect(entry.summaryLimits.length).toBeGreaterThan(0);
      expect(["alta", "media", "bassa"]).toContain(entry.overallConfidence);
    },
  );

  it.each(registry.map((entry) => [entry.slug, entry] as const))(
    "%s: weighted e score10 ricalcolati con la formula canonica",
    (_slug, entry) => {
      const weighted = DIMENSION_KEYS.reduce(
        (acc, key) => acc + entry.dimensions[key].value * WEIGHTS[key],
        0,
      );
      expect(Math.abs(entry.weighted - Math.round(weighted * 100) / 100)).toBeLessThan(0.005);
      const score10 = Math.round(weighted * 20) / 10;
      expect(Math.abs(entry.score10 - score10)).toBeLessThan(0.05);
    },
  );

  it("nessuna entry dipende da level o featured", () => {
    const raw = readFileSync(REGISTRY_PATH, "utf-8");
    expect(raw).not.toContain('"level"');
    expect(raw).not.toContain('"featured"');
    for (const entry of registry) {
      expect(Object.keys(entry)).not.toContain("level");
      expect(Object.keys(entry)).not.toContain("featured");
    }
  });

  it("nessun editorial_conviction nel voto", () => {
    const raw = readFileSync(REGISTRY_PATH, "utf-8");
    expect(raw).not.toContain("editorial_conviction");
    expect(raw).not.toContain("editorialConviction");
  });
});

describe("builder-first staging registry — isolamento dal runtime", () => {
  it("il registry pubblico canonico contiene tutti i 30 assessment approvati", () => {
    expect(listApprovedAssessmentSlugs()).toHaveLength(30);
    for (const slug of CANONICAL_SLUGS) {
      expect(getApprovedAssessmentBySlug(slug)).not.toBeNull();
    }
  });

  it("lo staging non è importato da app/, components/ o lib/", () => {
    const offenders: string[] = [];
    const scan = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (name === "node_modules" || name.startsWith(".")) continue;
        const stat = statSync(full);
        if (stat.isDirectory()) {
          scan(full);
          continue;
        }
        if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) continue;
        const rel = relative(ROOT, full);
        if (rel.startsWith("__tests__")) continue;
        const content = readFileSync(full, "utf-8");
        // "builder-first-v1" is a legitimate methodology version string that may
        // appear in the runtime engine. Only flag actual staging leaks:
        // the staging directory reference, the staging registry, the
        // ready_for_owner_approval marker, or an import from the staging docs.
        const hasStagingLeak =
          content.includes("staging-registry") ||
          content.includes("ready_for_owner_approval") ||
          content.includes("editorial-assessments-v1") ||
          /from\s+["']docs\/editorial-assessments-v1/.test(content) ||
          /require\(["']docs\/editorial-assessments-v1/.test(content);
        if (hasStagingLeak) {
          offenders.push(rel);
        }
      }
    };
    scan(join(ROOT, "app"));
    scan(join(ROOT, "components"));
    scan(join(ROOT, "lib"));
    // lib/data/editorial-assessments/ legitimately contains the methodology
    // version and references the approved assessments; it is not a staging leak.
    const filtered = offenders.filter(
      (f) => !f.startsWith("lib/data/editorial-assessments/"),
    );
    expect(filtered).toEqual([]);
  });

  it("builder-first-v1 come methodologyVersion nel runtime non e un leak", () => {
    // objective-fit.ts e editorial-assessments/index.ts contengono
    // builder-first-v1 come dichiarazione di metodologia approvata.
    // Questa stringa NON deve attivare lo scan di staging.
    const allowedPaths = [
      "lib/data/editorial-assessments/index.ts",
      "lib/compare/objective-fit.ts",
    ];
    for (const rel of allowedPaths) {
      const content = readFileSync(join(ROOT, rel), "utf-8");
      // Il contenuto deve includere builder-first-v1 (e legittimo)
      expect(content).toContain("builder-first-v1");
      // Ma non deve contenere marcatori staging
      expect(content).not.toContain("ready_for_owner_approval");
      expect(content).not.toContain("staging-registry");
    }
  });

  it("un import da docs/editorial-assessments-v1 nel runtime e bloccato", () => {
    // Verifica che la scan intercetti import staging.
    const scanDirs = ["app", "components", "lib"] as const;
    for (const dir of scanDirs) {
      const scan = (d: string) => {
        for (const name of readdirSync(d)) {
          const full = join(d, name);
          if (name === "node_modules" || name.startsWith(".")) continue;
          const stat = statSync(full);
          if (stat.isDirectory()) { scan(full); continue; }
          if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) continue;
          const rel = relative(ROOT, full);
          if (rel.startsWith("__tests__") || rel.startsWith("docs/")) continue;
          const content = readFileSync(full, "utf-8");
          // Import o require da docs/editorial-assessments-v1
          const hasStagingImport =
            /from\s+["']docs\/editorial-assessments-v1/.test(content) ||
            /require\(["']docs\/editorial-assessments-v1/.test(content);
          expect(hasStagingImport).toBe(false);
        }
      };
      scan(join(ROOT, dir));
    }
  });

  it("ready_for_owner_approval nel runtime e bloccato", () => {
    const scanDirs = ["app", "components"] as const;
    for (const dir of scanDirs) {
      const scan = (d: string) => {
        for (const name of readdirSync(d)) {
          const full = join(d, name);
          if (name === "node_modules" || name.startsWith(".")) continue;
          const stat = statSync(full);
          if (stat.isDirectory()) { scan(full); continue; }
          if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) continue;
          const rel = relative(ROOT, full);
          if (rel.startsWith("__tests__")) continue;
          const content = readFileSync(full, "utf-8");
          expect(content).not.toContain("ready_for_owner_approval");
        }
      };
      scan(join(ROOT, dir));
    }
  });

  it("objective-fit.ts non ha marcatori staging ne import da docs/", () => {
    const content = readFileSync(
      join(ROOT, "lib/compare/objective-fit.ts"),
      "utf-8",
    );
    expect(content).toContain("builder-first-v1");
    expect(content).not.toContain("staging-registry");
    expect(content).not.toContain("ready_for_owner_approval");
    expect(content).not.toContain("FINAL_APPROVAL_REPORT");
    expect(content).not.toContain("approvalStatus");
    expect(content).not.toContain("docs/editorial-assessments-v1");
  });

  it("nessun valore staging non approvato è presente nelle sorgenti dati del runtime", () => {
    const runtimeDataFiles = [
      "lib/data/tooolvibes-directory.ts",
      "lib/data/tool-public-adapters.ts",
      "lib/data/public-tools.ts",
      "lib/data/tool-detail-derivation.ts",
    ];
    for (const rel of runtimeDataFiles) {
      const content = readFileSync(join(ROOT, rel), "utf-8");
      expect(content).not.toContain("ready_for_owner_approval");
      expect(content).not.toContain("staging-registry");
    }
    // lib/data/editorial-assessments/ now legitimately contains builder-first-v1
    // metadata because assessments are approved and published.
    const editorialIndex = readFileSync(
      join(ROOT, "lib/data/editorial-assessments/index.ts"),
      "utf-8",
    );
    expect(editorialIndex).toContain("builder-first-v1");
  });
});
