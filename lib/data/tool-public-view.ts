import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { getToolExtendedContent } from "@/lib/data/tool-extended-content";
import type { ToolPublic } from "@/lib/types/tool-public";

export type ToolPublicView = {
  publicTool: ToolPublic;
  presentationKind: "canonical" | "directory";
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  level: string | null;
  levelLabel: string | null;
  segments: string[];
  filterGroups: string[];
  shortDescription: string;
  description: string;
  longDescription: string;
  whyItMatters: string | null;
  tldr: string;
  whatItDoes: string;
  idealUseCase: string | null;
  editorialReview: string | null;
  externalUrl: string;
  affiliateUrl: string | null;
  url: string;
  originalSourceUrl: string | null;
  originalArticleUrl: string | null;
  featured: boolean;
  toolOfWeek: boolean;
  tags: string[];
  ctaLabel: string | null;
  publishedAt: string | null;
  readingTime: string | null;
  domain: string;
  sourceSite: string | null;
  useCases: string[];
  highlights: string[];
  cautions: string[];
  accentFrom: string | null;
  accentTo: string | null;
  /**
   * Editorial body (Overview, Features, Use cases narrative, Strengths,
   * Limitations, Editorial verdict, FAQ) sourced from
   * docs/final-copy/tools/<slug>_FINAL_COPY.md. Null when the body is not
   * available. The renderer in tool-detail-final/tool-detail-extended-content.tsx
   * shows this only when present.
   */
  extendedContent: string | null;
  /**
   * Editorial "why this tool" reason. When present, the home spotlight uses
   * it as the per-tool "perché lo abbiamo scelto" line, instead of falling
   * back to a generic editorial explanation. Sourced from the tool's
   * editorialNote attribute in the data layer.
   */
  editorialNote?: string | null;
};

export type ToolFilterGroup = {
  key: string;
  label: string;
};

const directoryFilterGroupLabels = new Map<string, string>([
  ["all", "Tutti"],
  ["vibe-coding", "Vibe coding"],
  ["ai-app-builder", "Builder app AI"],
  ["no-code", "No-code"],
  ["headless-cms", "CMS headless"],
  ["ui-builder", "Builder UI"],
  ["ai-writing", "Scrittura AI"],
  ["ai-image", "Immagini AI"],
  ["ai-video", "Video AI"],
  ["marketing", "Marketing"],
  ["sales", "Vendite"],
  ["customer-support", "Supporto clienti"],
  ["automation", "Automazioni"],
  ["ai-agents", "Agenti AI"],
  ["payments", "Pagamenti"],
  ["website-builder", "Builder siti"],
  ["productivity", "Produttività"],
]);

function evidenceText(tool: ToolPublic, kind: ToolPublic["editorial"]["evidence"][number]["kind"]) {
  return tool.editorial.evidence.find((item) => item.kind === kind)?.text ?? null;
}

function evidenceList(
  tool: ToolPublic,
  kinds: ToolPublic["editorial"]["evidence"][number]["kind"][],
) {
  return tool.editorial.evidence
    .filter((item) => kinds.includes(item.kind))
    .map((item) => item.text);
}

function extractDomain(value: string) {
  return new URL(value).hostname.replace(/^www\./, "");
}

export function toToolFilterKey(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "tool";
}

function canonicalFilterGroups(tool: ToolPublic) {
  if (tool.attributes.segments.length > 0) {
    return [...tool.attributes.segments];
  }

  return [toToolFilterKey(tool.taxonomy.sourceCategory)];
}

function assertDirectoryPresentationMatches(
  tool: ToolPublic,
  directoryTool: DirectoryTool,
) {
  const mismatches = [
    tool.provenance.sourceKind === "directory-tool" ? null : "provenance.sourceKind",
    tool.provenance.sourceId === directoryTool.id ? null : "provenance.sourceId",
    tool.slug === directoryTool.slug ? null : "slug",
    tool.name === directoryTool.name ? null : "name",
    tool.urls.website === directoryTool.externalUrl ? null : "urls.website",
    tool.taxonomy.sourceCategory === directoryTool.category
      ? null
      : "taxonomy.sourceCategory",
    tool.content.summary === directoryTool.shortDescription ? null : "content.summary",
    tool.content.description === directoryTool.longDescription
      ? null
      : "content.description",
  ].filter((value): value is string => Boolean(value));

  if (mismatches.length > 0) {
    throw new Error(
      `Directory presentation does not match its canonical ToolPublic record: ${mismatches.join(", ")}.`,
    );
  }
}

export function createToolPublicView(
  tool: ToolPublic,
  directoryTool?: DirectoryTool,
): ToolPublicView {
  if (directoryTool) {
    assertDirectoryPresentationMatches(tool, directoryTool);
  }

  const review = evidenceText(tool, "review");
  const rationale = evidenceText(tool, "rationale");
  const highlights = evidenceList(tool, ["highlight", "strength"]);
  const cautions = evidenceList(tool, ["caution"]);
  const canonicalLevel = tool.attributes.level;
  const level = canonicalLevel?.key ?? (tool.flags.featured ? "featured" : null);
  const levelLabel =
    canonicalLevel?.label ?? (tool.flags.featured ? "In evidenza" : null);

  const dirRec = directoryTool as Record<string, unknown> | undefined;
  const logoUrl = (dirRec?.logoUrl as string) ?? null;
  const pricingStatus = (dirRec?.pricingStatus as string) ?? null;
  const pricingPlans = (dirRec?.pricingPlans as Array<{ name: string; price: string; period: string }>) ?? [];
  const pricingSourceUrl = (dirRec?.pricingSourceUrl as string) ?? null;
  const pricingLastVerifiedAt = (dirRec?.pricingLastVerifiedAt as string) ?? null;

  return {
    publicTool: { ...tool, logoUrl, pricingStatus, pricingPlans, pricingSourceUrl, pricingLastVerifiedAt } as typeof tool,
    presentationKind: directoryTool ? "directory" : "canonical",
    id: tool.provenance.sourceId,
    slug: tool.slug,
    name: tool.name,
    category: tool.taxonomy.sourceCategory,
    categoryLabel: tool.taxonomy.sourceCategoryLabel,
    level: directoryTool?.level ?? level,
    levelLabel: directoryTool?.levelLabel ?? levelLabel,
    segments: [...tool.attributes.segments],
    filterGroups: directoryTool
      ? [...directoryTool.segments]
      : canonicalFilterGroups(tool),
    shortDescription: tool.content.summary,
    description: tool.content.description,
    longDescription: tool.content.description,
    whyItMatters: rationale,
    tldr: tool.content.summary,
    whatItDoes: tool.content.description,
    idealUseCase: tool.content.bestFor,
    editorialReview: review,
    externalUrl: tool.urls.website,
    affiliateUrl: tool.urls.affiliate,
    url: tool.urls.affiliate ?? tool.urls.website,
    originalSourceUrl: tool.urls.editorial,
    originalArticleUrl: tool.urls.editorial,
    featured: tool.flags.featured,
    toolOfWeek: directoryTool?.toolOfWeek === true,
    tags: [...tool.taxonomy.tags],
    ctaLabel: directoryTool?.ctaLabel ?? null,
    publishedAt: tool.publication.publishedAt,
    readingTime: directoryTool?.readingTime ?? null,
    domain: extractDomain(tool.urls.website),
    sourceSite: tool.provenance.sourceLabel,
    useCases: [...tool.content.useCases],
    highlights,
    cautions,
    accentFrom: directoryTool?.accentFrom ?? null,
    accentTo: directoryTool?.accentTo ?? null,
    extendedContent: getToolExtendedContent(tool.slug),
    editorialNote: tool.attributes.editorialNote ?? null,
  };
}

export function getToolFilterGroups(tools: ToolPublicView[]): ToolFilterGroup[] {
  const groups = new Map<string, string>();

  for (const tool of tools) {
    for (const key of tool.filterGroups) {
      groups.set(
        key,
        directoryFilterGroupLabels.get(key) ??
          (tool.filterGroups.length === 1
            ? tool.categoryLabel
            : key.replaceAll("-", " ")),
      );
    }
  }

  const directoryGroups = [...directoryFilterGroupLabels.entries()]
    .filter(([key]) => key !== "all" && groups.has(key))
    .map(([key, label]) => ({ key, label }));
  const derivedGroups = [...groups.entries()]
    .filter(([key]) => !directoryFilterGroupLabels.has(key))
    .map(([key, label]) => ({ key, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "it"));

  return [
    { key: "all", label: directoryFilterGroupLabels.get("all") ?? "Tutti" },
    ...directoryGroups,
    ...derivedGroups,
  ];
}

export function getRelatedToolViews(
  current: ToolPublicView,
  tools: ToolPublicView[],
  limit = 3,
) {
  return tools
    .filter((item) => item.slug !== current.slug)
    .map((item, sourceIndex) => {
      const sharedGroups = item.filterGroups.filter((group) =>
        current.filterGroups.includes(group),
      ).length;
      const sharedTags = item.tags.filter((tag) => current.tags.includes(tag)).length;
      const sameCategory =
        item.publicTool.taxonomy.sourceCategory ===
        current.publicTool.taxonomy.sourceCategory
          ? 1
          : 0;
      const sameLevel =
        item.level && current.level && item.level === current.level ? 1 : 0;

      return {
        tool: item,
        sourceIndex,
        score:
          sharedGroups * 3 +
          sharedTags * 2 +
          sameCategory * 2 +
          sameLevel +
          Number(item.featured),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score || left.sourceIndex - right.sourceIndex,
    )
    .slice(0, limit)
    .map((entry) => entry.tool);
}
