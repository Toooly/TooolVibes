import { siteConfig } from "@/lib/config/site";
import { getPublishedEditorialPosts } from "@/lib/data/public-articles";
import { getCuratedCollections } from "@/lib/data/public-collections";
import { getPublishedTools } from "@/lib/data/public-tools";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlEntry(url: string, lastModified: Date) {
  return `<url><loc>${escapeXml(url)}</loc><lastmod>${lastModified.toISOString()}</lastmod></url>`;
}

export async function GET() {
  const [tools, collections, posts] = await Promise.all([
    getPublishedTools(),
    getCuratedCollections(),
    getPublishedEditorialPosts(),
  ]);

  const now = new Date();
  const staticPages = [
    "",
    "/archivio",
    "/collections",
    "/posts",
    "/shortlist",
    "/compare",
    "/tags",
    "/shop",
    "/account",
  ].map((path) => urlEntry(`${siteConfig.url}${path}`, now));

  const toolPages = tools.map((tool) => urlEntry(`${siteConfig.url}/toools/${tool.slug}`, new Date(tool.updated_at)));
  const collectionPages = collections.map((collection) =>
    urlEntry(`${siteConfig.url}/collections/${collection.slug}`, new Date(collection.updated_at)),
  );
  const postPages = posts.map((post) => urlEntry(`${siteConfig.url}/posts/${post.slug}`, new Date(post.updated_at)));

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
    ...staticPages,
    ...toolPages,
    ...collectionPages,
    ...postPages,
  ].join("")}</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
