import { siteConfig } from "@/lib/config/site";
import { getPublishedEditorialPosts } from "@/lib/data/public-articles";
import { getCuratedCollections } from "@/lib/data/public-collections";
import { getPublicToolsSnapshot } from "@/lib/data/public-tools";
import type { ToolPublic } from "@/lib/types/tool-public";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlEntry(url: string, lastModified?: Date | null) {
  const lastModifiedMarkup =
    lastModified && !Number.isNaN(lastModified.getTime())
      ? `<lastmod>${lastModified.toISOString()}</lastmod>`
      : "";
  return `<url><loc>${escapeXml(url)}</loc>${lastModifiedMarkup}</url>`;
}

function getToolLastModified(tool: ToolPublic) {
  const value =
    tool.lifecycle.updatedAt ??
    tool.publication.publishedAt ??
    tool.lifecycle.discoveredAt;
  return value ? new Date(value) : null;
}

export async function GET() {
  const toolSnapshot = await getPublicToolsSnapshot();

  if (toolSnapshot.status === "unavailable") {
    return new Response("Tool source unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "60",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  const [collections, posts] = await Promise.all([
    getCuratedCollections(),
    getPublishedEditorialPosts(),
  ]);
  const tools = toolSnapshot.tools;
  const staticPages = [
    "",
    "/archivio",
    "/radar",
    "/chi-siamo",
    "/collections",
    "/posts",
    "/shortlist",
    "/compare",
    "/contributi",
    "/studio",
    "/affiliati",
    "/metodo",
    "/tags",
    "/shop",
    "/privacy",
    "/termini",
    "/cookie",
  ].map((path) => urlEntry(`${siteConfig.url}${path}`, null));

  const toolPages = tools.map((tool) =>
    urlEntry(`${siteConfig.url}/toools/${tool.slug}`, getToolLastModified(tool)),
  );
  const collectionPages = collections.map((collection) =>
    urlEntry(`${siteConfig.url}/collections/${collection.slug}`, new Date(collection.updated_at)),
  );
  const postPages = posts.map((post) =>
    urlEntry(`${siteConfig.url}/posts/${post.slug}`, new Date(post.updated_at)),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
    ...staticPages,
    ...toolPages,
    ...collectionPages,
    ...postPages,
  ].join("")}</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
