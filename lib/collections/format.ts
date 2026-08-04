import type {
  AdvancedSpecialIssueBlock,
  CuratedCollection,
  CuratedCollectionRecord,
} from "@/lib/types/collection";

export function hasAdvancedSpecialIssue(
  collection: CuratedCollection | CuratedCollectionRecord,
) {
  return (
    collection.surface === "special-issue" &&
    collection.advanced_issue?.format === "advanced-special-issue" &&
    collection.advanced_issue.blocks.length > 0
  );
}

export function getCollectionFormatMeta(
  collection: CuratedCollection | CuratedCollectionRecord,
) {
  if (hasAdvancedSpecialIssue(collection)) {
    return {
      label: "Speciale avanzato",
      subtleLabel: "Speciale",
      description:
        "Una raccolta più strutturata, con guide, confronti e passaggi operativi.",
    };
  }

  if (collection.surface === "special-issue" && collection.access === "premium") {
    return {
      label: "Raccolta riservata",
      subtleLabel: "Riservata",
      description:
        "Una raccolta premium più ricca di un percorso standard, consultabile dentro TooolVibes.",
    };
  }

  if (collection.access === "premium-preview") {
    return {
      label: "Anteprima premium",
      subtleLabel: "Anteprima",
      description:
        "Una raccolta con una parte pubblica utile e un approfondimento premium già chiaro.",
    };
  }

  return {
    label: "Raccolta",
    subtleLabel: "Raccolta",
    description:
      "Una raccolta lineare, pensata come percorso breve per scegliere meglio.",
  };
}

export function getVisibleAdvancedIssueBlocks(
  blocks: AdvancedSpecialIssueBlock[],
  hasFullAccess: boolean,
) {
  if (hasFullAccess) {
    return blocks;
  }

  const previewBlocks = blocks.filter((block) => block.type !== "premium-closing").slice(0, 4);
  const closingBlock = blocks.find((block) => block.type === "premium-closing");

  return closingBlock ? [...previewBlocks, closingBlock] : previewBlocks;
}

export function countHiddenAdvancedIssueBlocks(
  blocks: AdvancedSpecialIssueBlock[],
  visibleBlocks: AdvancedSpecialIssueBlock[],
) {
  return Math.max(blocks.length - visibleBlocks.length, 0);
}
