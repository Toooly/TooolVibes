import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";
import { getPublishedEditorialPosts } from "@/lib/data/public-articles";
import { getCuratedCollections } from "@/lib/data/public-collections";
import { getPublishedTools } from "@/lib/data/public-tools";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tools, collections, posts] = await Promise.all([
    getPublishedTools(),
    getCuratedCollections(),
    getPublishedEditorialPosts(),
  ]);
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
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
  }));

  const toolPages = tools.map((tool) => ({
    url: `${siteConfig.url}/toools/${tool.slug}`,
    lastModified: new Date(tool.updated_at),
  }));

  const collectionPages = collections.map((collection) => ({
    url: `${siteConfig.url}/collections/${collection.slug}`,
    lastModified: new Date(collection.updated_at),
  }));

  const postPages = posts.map((post) => ({
    url: `${siteConfig.url}/posts/${post.slug}`,
    lastModified: new Date(post.updated_at),
  }));

  return [...staticPages, ...toolPages, ...collectionPages, ...postPages];
}
