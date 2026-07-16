import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FINGERPRINT_PATTERN = /^sha256:[a-f0-9]{64}$/;
const PRIMARY_SURFACES = ["catalog", "detailOk", "staticParams", "api", "sitemap"];
const CACHE_SURFACES = ["catalog", "detail", "staticParams", "api", "sitemap", "related"];

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value) {
  return hasText(value) && !Number.isNaN(Date.parse(value));
}

function push(issues, condition, code) {
  if (!condition) issues.push(code);
}

function stringSet(value, label, issues, { requireOne = false } = {}) {
  const values = list(value);
  const result = new Set();

  for (const item of values) {
    if (!hasText(item) || !SLUG_PATTERN.test(item)) {
      issues.push(label + ":invalid-slug");
      continue;
    }
    if (result.has(item)) issues.push(label + ":duplicate-slug");
    result.add(item);
  }

  if (requireOne && result.size === 0) issues.push(label + ":empty");
  return result;
}

function inventory(value, label, issues) {
  const records = list(value);
  const result = new Map();

  for (const rawRecord of records) {
    const record = object(rawRecord);
    if (!hasText(record.slug) || !SLUG_PATTERN.test(record.slug)) {
      issues.push(label + ":invalid-slug");
      continue;
    }
    if (!hasText(record.fingerprint) || !FINGERPRINT_PATTERN.test(record.fingerprint)) {
      issues.push(label + ":invalid-fingerprint");
      continue;
    }
    if (result.has(record.slug)) issues.push(label + ":duplicate-slug");
    result.set(record.slug, record.fingerprint);
  }

  if (result.size === 0) issues.push(label + ":empty");
  return result;
}

function setEquals(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function requireSameSet(actual, expected, label, issues) {
  if (!setEquals(actual, expected)) issues.push(label + ":set-mismatch");
}

function validateEditorialItems(value, label, published, issues) {
  const items = list(value);
  if (items.length === 0) issues.push(label + ":empty");

  for (const rawItem of items) {
    const item = object(rawItem);
    if (!hasText(item.slug) || !SLUG_PATTERN.test(item.slug)) {
      issues.push(label + ":invalid-content-slug");
    }
    const expected = stringSet(item.expectedToolSlugs, label + ":expected", issues);
    const resolved = stringSet(item.resolvedToolSlugs, label + ":resolved", issues);
    requireSameSet(resolved, expected, label + ":resolution", issues);
    for (const slug of expected) {
      if (!published.has(slug)) issues.push(label + ":noncanonical-tool-link");
    }
  }
}

export function verifyPublicToolCutoverEvidence(input) {
  const document = object(input);
  const issues = [];

  push(issues, document.schemaVersion === 1, "manifest:schema-version");
  push(issues, document.status === "certified", "manifest:not-certified");
  push(issues, document.environment === "staging", "manifest:not-staging");
  push(issues, hasText(document.owner), "manifest:owner-missing");
  push(issues, isIsoDate(document.capturedAt), "manifest:captured-at-invalid");
  push(issues, isIsoDate(document.rollbackWindowEndsAt), "manifest:rollback-window-invalid");
  if (isIsoDate(document.capturedAt) && isIsoDate(document.rollbackWindowEndsAt)) {
    push(
      issues,
      Date.parse(document.rollbackWindowEndsAt) > Date.parse(document.capturedAt),
      "manifest:rollback-window-not-after-capture",
    );
  }

  const sources = object(document.sources);
  push(issues, sources.productionSource === "directory", "sources:production-source-changed");
  push(issues, sources.candidateSource === "supabase", "sources:candidate-not-supabase");
  push(
    issues,
    sources.fingerprintVersion === "tool-public-release-semantics-v1",
    "sources:fingerprint-version",
  );

  const directory = inventory(sources.directoryPublished, "sources:directory", issues);
  const candidate = inventory(sources.candidatePublished, "sources:candidate", issues);
  const directorySlugs = new Set(directory.keys());
  const candidateSlugs = new Set(candidate.keys());
  requireSameSet(candidateSlugs, directorySlugs, "sources:published-slugs", issues);

  const drafts = stringSet(sources.candidateDraftSlugs, "sources:drafts", issues, {
    requireOne: true,
  });
  for (const slug of drafts) {
    if (candidateSlugs.has(slug)) issues.push("sources:draft-published-overlap");
  }

  const reviews = new Map();
  for (const rawReview of list(sources.reviewedCanonicalMismatches)) {
    const review = object(rawReview);
    if (!hasText(review.slug) || !SLUG_PATTERN.test(review.slug)) {
      issues.push("sources:review-invalid-slug");
      continue;
    }
    if (reviews.has(review.slug)) issues.push("sources:review-duplicate");
    reviews.set(review.slug, review);
  }

  let mismatchCount = 0;
  for (const slug of directorySlugs) {
    if (!candidate.has(slug)) continue;
    const directoryFingerprint = directory.get(slug);
    const candidateFingerprint = candidate.get(slug);
    const mismatches = directoryFingerprint !== candidateFingerprint;
    const review = reviews.get(slug);

    if (mismatches) {
      mismatchCount += 1;
      push(issues, Boolean(review), "sources:mismatch-unreviewed");
      if (review) {
        push(
          issues,
          review.directoryFingerprint === directoryFingerprint &&
            review.candidateFingerprint === candidateFingerprint,
          "sources:review-fingerprint-mismatch",
        );
        push(issues, hasText(review.owner), "sources:review-owner-missing");
        push(issues, hasText(review.reason), "sources:review-reason-missing");
      }
    } else if (review) {
      issues.push("sources:review-without-mismatch");
    }
  }

  const surfaces = object(document.surfaces);
  for (const surface of PRIMARY_SURFACES) {
    const slugs = stringSet(surfaces[surface], "surfaces:" + surface, issues);
    requireSameSet(slugs, candidateSlugs, "surfaces:" + surface, issues);
    for (const draft of drafts) {
      if (slugs.has(draft)) issues.push("surfaces:" + surface + ":draft-leak");
    }
  }

  const detailNotFound = stringSet(
    surfaces.detailNotFound,
    "surfaces:detail-not-found",
    issues,
  );
  requireSameSet(detailNotFound, drafts, "surfaces:detail-not-found", issues);
  for (const slug of candidateSlugs) {
    if (detailNotFound.has(slug)) issues.push("surfaces:detail-not-found:published-leak");
  }

  const relatedEdges = list(surfaces.relatedEdges);
  if (relatedEdges.length === 0) issues.push("surfaces:related:empty");
  for (const rawEdge of relatedEdges) {
    const edge = object(rawEdge);
    if (!candidateSlugs.has(edge.from) || !candidateSlugs.has(edge.to)) {
      issues.push("surfaces:related:noncanonical-edge");
    }
    if (edge.from === edge.to) issues.push("surfaces:related:self-edge");
  }

  const editorial = object(document.editorial);
  push(issues, editorial.legacyAdapterRemoved === true, "editorial:legacy-adapter-active");
  push(issues, editorial.legacyWarningRemoved === true, "editorial:legacy-warning-active");
  push(
    issues,
    list(editorial.brokenToolLinks).length === 0,
    "editorial:broken-tool-links",
  );
  validateEditorialItems(editorial.collections, "editorial:collections", candidateSlugs, issues);
  validateEditorialItems(editorial.posts, "editorial:posts", candidateSlugs, issues);

  const cache = object(document.cacheInvalidation);
  for (const action of ["publish", "update", "unpublish"]) {
    const evidence = object(cache[action]);
    push(issues, evidence.rehearsed === true, "cache:" + action + ":not-rehearsed");
    push(
      issues,
      hasText(evidence.slug) && SLUG_PATTERN.test(evidence.slug),
      "cache:" + action + ":invalid-slug",
    );
    push(issues, hasText(evidence.evidenceRef), "cache:" + action + ":evidence-missing");
    const covered = new Set(list(evidence.surfaces).filter(hasText));
    requireSameSet(covered, new Set(CACHE_SURFACES), "cache:" + action + ":surfaces", issues);
  }

  const rollback = object(document.rollback);
  push(issues, rollback.rehearsed === true, "rollback:not-rehearsed");
  push(issues, hasText(rollback.evidenceRef), "rollback:evidence-missing");

  const evidenceRefs = list(document.evidenceRefs).filter(hasText);
  push(issues, evidenceRefs.length > 0, "manifest:evidence-refs-empty");
  push(
    issues,
    new Set(evidenceRefs).size === evidenceRefs.length,
    "manifest:evidence-refs-duplicate",
  );

  return {
    ok: issues.length === 0,
    status: issues.length === 0 ? "certified" : "blocked",
    summary: {
      directoryPublishedCount: directory.size,
      candidatePublishedCount: candidate.size,
      candidateDraftCount: drafts.size,
      canonicalMismatchCount: mismatchCount,
      relatedEdgeCount: relatedEdges.length,
      collectionCount: list(editorial.collections).length,
      postCount: list(editorial.posts).length,
    },
    blockers: [...new Set(issues)].sort(),
  };
}

function runCli() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    process.stderr.write("Usage: node scripts/release/verify-public-tool-cutover.mjs <evidence.json>\n");
    process.exitCode = 2;
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(manifestPath), "utf8"));
    const result = verifyPublicToolCutoverEvidence(manifest);
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        status: "blocked",
        blockers: ["manifest:unreadable"],
        detail: error instanceof Error ? error.message : "unknown error",
      }) + "\n",
    );
    process.exitCode = 2;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  runCli();
}
