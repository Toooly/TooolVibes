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
      label: "Special issue avanzata",
      subtleLabel: "Issue avanzata",
      description:
        "Una surface narrativa pi? strutturata, con moduli editoriali, compare insight e workflow moments.",
    };
  }

  if (collection.surface === "special-issue" && collection.access === "premium") {
    return {
      label: "Member issue",
      subtleLabel: "Member issue",
      description:
        "Una special issue premium pi? densa di una collection standard, ancora leggibile dentro il prodotto.",
    };
  }

  if (collection.access === "premium-preview") {
    return {
      label: "Anteprima premium",
      subtleLabel: "Anteprima",
      description:
        "Una superficie con una parte pubblica utile e un livello premium pi? profondo gi? impostato con chiarezza.",
    };
  }

  return {
    label: "Collection",
    subtleLabel: "Collection",
    description:
      "Una collection pi? lineare, pensata come percorso curatoriale breve dentro la shell prodotto.",
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
