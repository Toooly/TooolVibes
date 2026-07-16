import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PUBLIC_TOOL_RELEASE_FINGERPRINT_VERSION =
  "tool-public-release-semantics-v1";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function stableSerialize(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableSerialize).join(",") + "]";
  }

  return (
    "{" +
    Object.keys(value)
      .sort()
      .map((key) => JSON.stringify(key) + ":" + stableSerialize(value[key]))
      .join(",") +
    "}"
  );
}

function publicReleaseSemantics(tool) {
  return {
    schemaVersion: tool.schemaVersion,
    slug: tool.slug,
    name: tool.name,
    publication: { status: tool.publication?.status },
    urls: tool.urls,
    taxonomy: tool.taxonomy,
    content: tool.content,
    editorial: tool.editorial,
    score: tool.score,
    attributes: tool.attributes,
    media: tool.media,
    flags: tool.flags,
  };
}

export function fingerprintToolPublicReleaseSemantics(tool) {
  if (!tool || typeof tool !== "object") {
    throw new Error("ToolPublic record must be an object.");
  }
  if (!SLUG_PATTERN.test(tool.slug ?? "")) {
    throw new Error("ToolPublic record has an invalid slug.");
  }
  if (!tool.publication || !["draft", "published"].includes(tool.publication.status)) {
    throw new Error("ToolPublic record has an invalid publication status.");
  }

  return (
    "sha256:" +
    crypto
      .createHash("sha256")
      .update(stableSerialize(publicReleaseSemantics(tool)))
      .digest("hex")
  );
}

export function buildPublicToolCutoverInventory(input) {
  const tools = Array.isArray(input) ? input : input?.tools;
  if (!Array.isArray(tools)) {
    throw new Error("Expected a ToolPublic array or a snapshot with a tools array.");
  }

  const seen = new Set();
  const published = [];
  const draftSlugs = [];

  for (const tool of tools) {
    if (!tool || typeof tool !== "object" || !SLUG_PATTERN.test(tool.slug ?? "")) {
      throw new Error("ToolPublic inventory contains an invalid slug.");
    }
    if (seen.has(tool.slug)) {
      throw new Error("ToolPublic inventory contains a duplicate slug.");
    }
    seen.add(tool.slug);

    if (tool.publication?.status === "published") {
      published.push({
        slug: tool.slug,
        fingerprint: fingerprintToolPublicReleaseSemantics(tool),
      });
    } else if (tool.publication?.status === "draft") {
      draftSlugs.push(tool.slug);
    } else {
      throw new Error("ToolPublic inventory contains an invalid publication status.");
    }
  }

  published.sort((left, right) => left.slug.localeCompare(right.slug));
  draftSlugs.sort((left, right) => left.localeCompare(right));

  return {
    fingerprintVersion: PUBLIC_TOOL_RELEASE_FINGERPRINT_VERSION,
    published,
    draftSlugs,
  };
}

function runCli() {
  const sourcePath = process.argv[2];
  if (!sourcePath) {
    process.stderr.write(
      "Usage: node scripts/release/build-public-tool-cutover-inventory.mjs <tool-public.json>\n",
    );
    process.exitCode = 2;
    return;
  }

  try {
    const input = JSON.parse(fs.readFileSync(path.resolve(sourcePath), "utf8"));
    const inventory = buildPublicToolCutoverInventory(input);
    process.stdout.write(JSON.stringify(inventory, null, 2) + "\n");
  } catch (error) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        error: "tool-public-cutover-inventory-failed",
        detail: error instanceof Error ? error.message : "unknown error",
      }) + "\n",
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  runCli();
}
