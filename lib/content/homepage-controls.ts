import homepageControlsJson from "@/data/homepage-controls.json";

export type HomepageControls = {
  announcement: {
    enabled: boolean;
    text: string;
    href: string;
    image?: string | null;
  };
  featuredToolSlug: string | null;
};

export const DEFAULT_HOMEPAGE_CONTROLS: HomepageControls = {
  announcement: { enabled: false, text: "", href: "/radar", image: null },
  featuredToolSlug: null,
};

function safeInternalHref(value: string | undefined): string {
  const href = value?.trim() || "/radar";
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return "/radar";
}

export function getHomepageControls(): HomepageControls {
  const raw = homepageControlsJson as Partial<HomepageControls>;
  return {
    announcement: {
      enabled: Boolean(raw.announcement?.enabled && raw.announcement?.text?.trim()),
      text: raw.announcement?.text?.trim() ?? "",
      href: safeInternalHref(raw.announcement?.href),
      image: raw.announcement?.image?.trim() || null,
    },
    featuredToolSlug: raw.featuredToolSlug?.trim() || null,
  };
}
