import type { ToolRecord } from "@/lib/types/tool";
import type { DirectoryTool, DirectoryToolLevel } from "@/lib/data/tooolvibes-directory";

export const levelScoreBase: Record<DirectoryToolLevel, number> = {
  featured: 91,
  beginner: 72,
  intermediate: 82,
  expert: 87,
};

export function dirScore(t: DirectoryTool) {
  return Math.min(
    98,
    levelScoreBase[t.level] +
      (t.toolOfWeek ? 4 : 0) +
      (t.featured ? 2 : 0) +
      Math.min(t.highlights.length, 3),
  );
}

export function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h % 360);
  return `hsl(${hue} 80% 55%)`;
}

export function legacyScore(t: ToolRecord): number {
  return Math.min(95, 70 + (t.is_featured ? 10 : 0) + Math.min(t.tags?.length ?? 0, 5) * 2);
}

export function getToolLogoUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const domain = new URL(value).hostname.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(value)}&sz=64`;
  }
}

export function stableScoreOffset(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return (hash % 13) - 6;
}

export type NormalisedTool = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  score: number;
  battleScore: number;
  accentFrom: string;
  accentTo: string;
  tldr: string;
  useCase: string;
  review: string;
  highlights: string[];
  readingTime: string;
  url: string;
  logoUrl: string;
  isDirectory: boolean;
  useCasesCount: number;
};

export function withBattleScores(tools: NormalisedTool[]): NormalisedTool[] {
  const ranked = tools
    .map((tool, index) => ({
      index,
      tool,
      raw: tool.score + stableScoreOffset(`${tool.slug}:${tool.category}:${index}`),
    }))
    .sort((a, b) => b.raw - a.raw || a.tool.name.localeCompare(b.tool.name));

  const battleBySlug = new Map<string, number>();
  ranked.forEach(({ tool, raw }, rank) => {
    const score = Math.max(62, Math.min(99, Math.round(raw - rank * 2.25)));
    battleBySlug.set(tool.slug, score);
  });

  return tools.map((tool) => ({
    ...tool,
    battleScore: battleBySlug.get(tool.slug) ?? tool.score,
  }));
}

export async function celebrateArenaFight() {
  const { default: confetti } = await import("canvas-confetti");

  confetti({
    colors: ["#6a3cff", "#39d2f6", "#f3bf4c", "#ffffff"],
    disableForReducedMotion: true,
    origin: { y: 0.62 },
    particleCount: 72,
    scalar: 0.82,
    spread: 66,
  });
}

export function normalise(
  directoryTools: DirectoryTool[],
  legacyTools: ToolRecord[],
  compareSlugs: string[],
): NormalisedTool[] {
  const out: NormalisedTool[] = [];
  for (const slug of compareSlugs) {
    const d = directoryTools.find((t) => t.slug === slug);
    if (d) {
      out.push({
        slug: d.slug,
        name: d.name,
        category: d.category,
        categoryLabel: d.categoryLabel,
        score: dirScore(d),
        battleScore: dirScore(d),
        accentFrom: d.accentFrom,
        accentTo: d.accentTo,
        tldr: d.tldr,
        useCase: d.idealUseCase,
        review: d.editorialReview,
        highlights: d.highlights,
        readingTime: d.readingTime,
        url: d.url,
        logoUrl: getToolLogoUrl(d.domain || d.externalUrl),
        isDirectory: true,
        useCasesCount: d.useCases.length,
      });
      continue;
    }
    const l = legacyTools.find((t) => t.slug === slug);
    if (l) {
      const c = hashColor(l.name);
      out.push({
        slug: l.slug,
        name: l.name,
        category: l.category ?? "Tool",
        categoryLabel: l.category ?? "Tool",
        score: legacyScore(l),
        battleScore: legacyScore(l),
        accentFrom: c,
        accentTo: c,
        tldr: l.short_description_it ?? l.description_it ?? "Nessun riassunto disponibile.",
        useCase: l.description_it ?? "",
        review: l.editorial_note ?? "",
        highlights: l.tags?.slice(0, 3) ?? [],
        readingTime: "2 min",
        url: l.website_url ?? "",
        logoUrl: getToolLogoUrl(l.website_url),
        isDirectory: false,
        useCasesCount: 0,
      });
    }
  }
  return out;
}
