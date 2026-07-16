import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import {
  completeToolPublicFixture,
  partialToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  buildPublicToolCutoverInventory,
  fingerprintToolPublicReleaseSemantics,
} from "@/scripts/release/build-public-tool-cutover-inventory.mjs";

import { verifyPublicToolCutoverEvidence } from "@/scripts/release/verify-public-tool-cutover.mjs";

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(relativePath), "utf8")) as unknown;
}

describe("public tool cutover inventory builder", () => {
  it("builds stable source inventories while excluding source-specific lifecycle and provenance", () => {
    const baseline = fingerprintToolPublicReleaseSemantics(
      completeToolPublicFixture,
    );
    const sourceMetadataOnly = {
      ...completeToolPublicFixture,
      lifecycle: {
        ...completeToolPublicFixture.lifecycle,
        updatedAt: "2026-07-16T12:00:00.000Z",
      },
      provenance: {
        ...completeToolPublicFixture.provenance,
        sourceId: "different-source-id",
      },
    };
    const publicCopyChanged = {
      ...completeToolPublicFixture,
      name: "Atlas Workflow",
    };

    expect(fingerprintToolPublicReleaseSemantics(sourceMetadataOnly)).toBe(
      baseline,
    );
    expect(fingerprintToolPublicReleaseSemantics(publicCopyChanged)).not.toBe(
      baseline,
    );
    expect(
      buildPublicToolCutoverInventory([
        completeToolPublicFixture,
        partialToolPublicFixture,
      ]),
    ).toEqual({
      fingerprintVersion: "tool-public-release-semantics-v1",
      published: [{ slug: "atlas-ai", fingerprint: baseline }],
      draftSlugs: ["partial-tool"],
    });
  });
});

describe("public tool cutover evidence verifier", () => {
  it("accepts a complete synthetic staging rehearsal", () => {
    const result = verifyPublicToolCutoverEvidence(
      readJson("__tests__/fixtures/public-tool-cutover-certified.json"),
    );

    expect(result).toEqual({
      ok: true,
      status: "certified",
      summary: {
        directoryPublishedCount: 2,
        candidatePublishedCount: 2,
        candidateDraftCount: 1,
        canonicalMismatchCount: 0,
        relatedEdgeCount: 2,
        collectionCount: 1,
        postCount: 1,
      },
      blockers: [],
    });
  });

  it("keeps the repository template blocked until real staging evidence exists", () => {
    const result = verifyPublicToolCutoverEvidence(
      readJson("docs/runbooks/public-tool-cutover-evidence.template.json"),
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "manifest:not-certified",
        "sources:directory:empty",
        "sources:candidate:empty",
        "editorial:legacy-adapter-active",
        "cache:publish:not-rehearsed",
        "rollback:not-rehearsed",
      ]),
    );
  });

  it("rejects a draft leak, a duplicate surface slug and an unreviewed canonical mismatch", () => {
    const manifest = readJson(
      "__tests__/fixtures/public-tool-cutover-certified.json",
    ) as {
      sources: {
        candidatePublished: Array<{ fingerprint: string }>;
      };
      surfaces: {
        api: string[];
      };
    };
    manifest.sources.candidatePublished[0].fingerprint =
      "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
    manifest.surfaces.api.push("draft-sentinel", "atlas-ai");

    const result = verifyPublicToolCutoverEvidence(manifest);

    expect(result.ok).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "sources:mismatch-unreviewed",
        "surfaces:api:duplicate-slug",
        "surfaces:api:draft-leak",
        "surfaces:api:set-mismatch",
      ]),
    );
  });
});
