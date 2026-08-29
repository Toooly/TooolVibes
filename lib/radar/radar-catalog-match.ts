import { toToolFilterKey } from "@/lib/data/tool-public-view";

export type RadarCatalogTool = {
  slug: string;
  name: string;
};

export type RadarCatalogMatch =
  | { status: "matched"; slug: string; via: "slug" | "name+slug" }
  | { status: "unmatched" }
  | { status: "ambiguous" };

function foldName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function productHuntPathSlug(url: string): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("producthunt.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const posts = parts.indexOf("posts");
    const slug = posts >= 0 ? parts[posts + 1] : null;
    if (!slug) return null;
    const normalized = slug.toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function matchRadarItemToCatalog(
  item: { name: string; productHuntUrl: string },
  catalog: readonly RadarCatalogTool[],
): RadarCatalogMatch {
  const slugsBySlug = new Map<string, Set<string>>();
  const slugsByName = new Map<string, Set<string>>();
  for (const tool of catalog) {
    if (!tool.slug) continue;
    const slugSet = slugsBySlug.get(tool.slug) ?? new Set<string>();
    slugSet.add(tool.slug);
    slugsBySlug.set(tool.slug, slugSet);
    const folded = foldName(tool.name);
    if (!folded) continue;
    const nameSet = slugsByName.get(folded) ?? new Set<string>();
    nameSet.add(tool.slug);
    slugsByName.set(folded, nameSet);
  }

  const uniqueSlug = (key: string | null) => {
    if (!key) return null;
    const hits = slugsBySlug.get(key);
    if (!hits) return null;
    if (hits.size !== 1) return "ambiguous";
    return [...hits][0]!;
  };
  const uniqueName = (key: string) => {
    const hits = slugsByName.get(key);
    if (!hits) return null;
    if (hits.size !== 1) return "ambiguous";
    return [...hits][0]!;
  };

  const pathSlug = productHuntPathSlug(item.productHuntUrl);
  const slugHit = uniqueSlug(pathSlug);
  const nameHit = uniqueName(foldName(item.name));
  const nameSlugHit = uniqueSlug(toToolFilterKey(item.name));

  if (slugHit === "ambiguous" || nameHit === "ambiguous" || nameSlugHit === "ambiguous") {
    return { status: "ambiguous" };
  }
  if (pathSlug) {
    if (slugHit && nameHit && slugHit !== nameHit) {
      return { status: "ambiguous" };
    }
    if (slugHit) {
      return { status: "matched", slug: slugHit, via: "slug" };
    }
    return { status: "unmatched" };
  }
  if (nameHit && nameSlugHit === nameHit) {
    return { status: "matched", slug: nameHit, via: "name+slug" };
  }
  return { status: "unmatched" };
}
