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
};

export const defaultSocialImage: SocialImage = {
  url: `${siteConfig.url}/about/team-working.jpg`,
  width: 2560,
  height: 1706,
  alt: "Il team TooolVibes al lavoro.",
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
}: PublicPageMetadataInput): Metadata {
  const canonicalUrl = new URL(path, `${siteConfig.url}/`).toString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "it_IT",
      type,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: openGraphTitle,
      description: openGraphDescription,
      images: [image],
    },
  };
}
