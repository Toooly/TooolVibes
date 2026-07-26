import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ToolDetailVisualLab } from "@/components/tool-detail-visual-lab/tool-detail-visual-lab";
import {
  getRelatedToolViewsBySlug,
  getToolViewBySlug,
} from "@/lib/data/public-tools";

import "@/styles/tool-detail-visual-lab.css";

export const metadata: Metadata = {
  title: "Tool Detail Visual Lab",
  description: "Isolated visual exploration for Tool Detail. Development only.",
  robots: {
    index: false,
    follow: false,
  },
};

function isVisualLabEnabled() {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.TOOOLVIBES_VISUAL_LAB === "1";
}

function hasAffiliateSignal(href: string | null | undefined) {
  if (!href) return false;
  try {
    const url = new URL(href);
    return ["aff", "affiliate", "ref", "referral", "via"].some((key) =>
      url.searchParams.has(key),
    );
  } catch {
    return false;
  }
}

/**
 * Development-only Tool Detail visual lab.
 * Production returns notFound() unless TOOOLVIBES_VISUAL_LAB=1.
 * Not linked from global navigation.
 */
export default async function ToolDetailVisualLabPage() {
  if (!isVisualLabEnabled()) {
    notFound();
  }

  const tool = await getToolViewBySlug("blink");
  if (!tool) {
    notFound();
  }

  const related = await getRelatedToolViewsBySlug(tool.slug, 3);
  const isAffiliateLink = Boolean(tool.affiliateUrl) || hasAffiliateSignal(tool.url);

  return (
    <ToolDetailVisualLab
      tool={tool}
      related={related}
      isAffiliateLink={isAffiliateLink}
    />
  );
}
