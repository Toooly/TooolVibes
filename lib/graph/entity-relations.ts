import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

// ─── Relationship types ───
export type ToolRelation = { slug: string; name: string; relation: string; score?: number };
export type GuideRelation = { slug: string; name: string; relation: string; score?: number };
export type StackRelation = { slug: string; name: string; toolCount: number };

// ─── Tool → Guides ───
// Derive from guide content that references tool slugs
export function getGuidesForTool(toolSlug: string, guideData: Array<{ slug: string; title: string; content: string }>): ToolRelation[] {
  return guideData
    .filter((g) => g.content.includes(toolSlug) || g.content.includes(toolSlug.replace(/-/g, " ")))
    .map((g) => ({ slug: g.slug, name: g.title, relation: "mentions" }))
    .slice(0, 3);
}

// ─── Guide → Tools ───
export function getToolsForGuide(guideContent: string, tools: DirectoryTool[]): ToolRelation[] {
  return tools
    .filter((t) => guideContent.includes(t.slug) || guideContent.includes(t.name))
    .map((t) => ({ slug: t.slug, name: t.name, relation: "mentions" }))
    .slice(0, 5);
}

// ─── Tool → Categories ───
export function getCategoriesForTool(tool: DirectoryTool): string[] {
  return [tool.category, ...(tool.segments ?? [])].filter(Boolean);
}

// ─── Category → Tools ───
export function getToolsForCategory(category: string, tools: DirectoryTool[]): ToolRelation[] {
  return tools
    .filter((t) => t.category === category || (t.segments as string[]).includes(category))
    .map((t) => ({ slug: t.slug, name: t.name, relation: "category" }));
}

// ─── Category → Guides ───
export function getGuidesForCategory(category: string, guideData: Array<{ slug: string; title: string; content: string }>): GuideRelation[] {
  return guideData
    .filter((g) => g.content.toLowerCase().includes(category.toLowerCase()))
    .map((g): GuideRelation => ({ slug: g.slug, name: g.title, relation: "category" }))
    .slice(0, 3);
}

// ─── Tool → Stacks (from workspace) ───
export function getStacksForTool(toolSlug: string, stacks: Array<{ slug: string; name: string; toolSlugs: string[] }>): StackRelation[] {
  return stacks
    .filter((s) => s.toolSlugs.includes(toolSlug))
    .map((s) => ({ slug: s.slug, name: s.name, relation: "contains", toolCount: s.toolSlugs.length }));
}

// ─── Stack → Tools ───
export function getToolsForStack(stack: { toolSlugs: string[] }, tools: DirectoryTool[]): ToolRelation[] {
  return stack.toolSlugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean)
    .map((t) => ({ slug: t!.slug, name: t!.name, relation: "contains" }));
}

// ─── Related Tools (deterministic) ───
export function getRelatedTools(current: DirectoryTool, allTools: DirectoryTool[], limit = 3): ToolRelation[] {
  const scored = allTools
    .filter((t) => t.slug !== current.slug)
    .map((t) => {
      let score = 0;
      if (t.category === current.category) score += 3;
      const sharedSegments = (t.segments as string[]).filter((s) => (current.segments as string[]).includes(s));
      score += sharedSegments.length * 2;
      const sharedTags = (t.tags as string[]).filter((tag) => (current.tags as string[]).includes(tag));
      score += sharedTags.length;
      return { slug: t.slug, name: t.name, relation: "related", score };
    })
    .filter((t) => (t.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return scored.slice(0, limit);
}

// ─── Related Guides (deterministic) ───
export function getRelatedGuides(toolSlug: string, guideData: Array<{ slug: string; title: string; content: string }>, limit = 2): GuideRelation[] {
  return guideData
    .map((g) => {
      let score = 0;
      if (g.content.includes(toolSlug)) score += 3;
      const words = toolSlug.split("-").filter((w) => w.length > 2);
      for (const w of words) {
        if (g.content.includes(w)) score += 1;
      }
      return { slug: g.slug, name: g.title, relation: "related", score } as GuideRelation;
    })
    .filter((g) => (g.score ?? 0) >= 3)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
}

// ─── Category → Stacks ───
export function getStacksForCategory(
  category: string,
  stacks: Array<{ slug: string; name: string; toolSlugs: string[]; category?: string; theme?: string }>,
  tools: DirectoryTool[],
): StackRelation[] {
  return stacks
    .filter((s) => {
      // 1. explicit category metadata
      if ((s.category && s.category.toLowerCase() === category.toLowerCase()) || (s.theme && s.theme.toLowerCase() === category.toLowerCase())) return true;
      // 2. dominant category among stack tools (>= 60%)
      const stackTools = tools.filter((t) => s.toolSlugs.includes(t.slug));
      if (stackTools.length === 0) return false;
      const matchCount = stackTools.filter((t) => t.category === category).length;
      return matchCount / stackTools.length >= 0.6;
    })
    .map((s) => ({ slug: s.slug, name: s.name, relation: "category", toolCount: s.toolSlugs.length }));
}

// ─── Stack → Category ───
export function getCategoriesForStack(
  stack: { toolSlugs: string[]; category?: string; theme?: string },
  tools: DirectoryTool[],
): string[] {
  // 1. explicit category metadata
  if (stack.category) return [stack.category];
  // 2. strong shared category among stack tools
  const stackTools = tools.filter((t) => stack.toolSlugs.includes(t.slug));
  if (stackTools.length === 0) return [];
  const counts = new Map<string, number>();
  for (const t of stackTools) {
    counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  }
  const dominant = [...counts.entries()]
    .filter(([, count]) => count / stackTools.length >= 0.6)
    .map(([cat]) => cat);
  return dominant;
}

// ─── Stack → Guides ───
export function getGuidesForStack(
  stack: { toolSlugs: string[]; category?: string; theme?: string },
  guideData: Array<{ slug: string; title: string; content: string }>,
  tools: DirectoryTool[],
): GuideRelation[] {
  return guideData
    .map((g) => {
      let score = 0;
      // 1. Guide references multiple tools in stack
      const toolMatches = stack.toolSlugs.filter((slug) => g.content.includes(slug));
      if (toolMatches.length >= 2) score += 5;
      else if (toolMatches.length === 1) score += 2;
      // 2. Guide matches stack category
      const categories = getCategoriesForStack(stack, tools);
      for (const cat of categories) {
        if (g.content.toLowerCase().includes(cat.toLowerCase())) score += 2;
      }
      return { slug: g.slug, name: g.title, relation: "related", score };
    })
    .filter((g) => (g.score ?? 0) >= 3)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);
}
