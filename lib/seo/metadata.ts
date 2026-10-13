import type { Metadata } from "next";

import { siteConfig } from "@/lib/config/site";

type SocialImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: SocialImage;
  openGraphTitle?: string;
  openGraphDescription?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

export const defaultSocialImage: SocialImage = {
  url: `${siteConfig.url}/brand/tooolvibes-social-v1.png`,
  width: 1200,
  height: 630,
  alt: "TooolVibes — Scegli il tool giusto. Ricorda perché. Find your tools. Build your next move.",
};

export const organizationLogoUrl = `${siteConfig.url}/brand/tooolvibes-logo.png`;

export function createPublicPageMetadata({
  title,
  description,
  path,
  image = defaultSocialImage,
  openGraphTitle = `${title} | ${siteConfig.name}`,
  openGraphDescription = description,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
}: PublicPageMetadataInput): Metadata {
  const canonicalUrl = new URL(path, `${siteConfig.url}/`).toString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    authors: authors?.map((name) => ({ name })),
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "it_IT",
      type,
      images: [image],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: openGraphTitle,
      description: openGraphDescription,
      images: [image],
    },
  };
}
