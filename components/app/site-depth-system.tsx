"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useMemo } from "react";

type SiteDepthToneKey = "home" | "archive" | "compare" | "radar" | "wishlist" | "commerce" | "default";

type SiteDepthTone = {
  key: SiteDepthToneKey;
  primary: string;
  secondary: string;
  accent: string;
  label: string;
};

const siteDepthTones: Record<SiteDepthToneKey, SiteDepthTone> = {
  home: {
    key: "home",
    primary: "#0f766e",
    secondary: "#2563eb",
    accent: "#5b5bd6",
    label: "Discovery field",
  },
  archive: {
    key: "archive",
    primary: "#0f766e",
    secondary: "#1f5f8b",
    accent: "#111827",
    label: "Catalog field",
  },
  compare: {
    key: "compare",
    primary: "#2563eb",
    secondary: "#0f766e",
    accent: "#5b5bd6",
    label: "Decision field",
  },
  radar: {
    key: "radar",
    primary: "#dc6b2f",
    secondary: "#0f766e",
    accent: "#2563eb",
    label: "Signal field",
  },
  wishlist: {
    key: "wishlist",
    primary: "#5b5bd6",
    secondary: "#0f766e",
    accent: "#2563eb",
    label: "Submission field",
  },
  commerce: {
    key: "commerce",
    primary: "#0f766e",
    secondary: "#334155",
    accent: "#2563eb",
    label: "Commerce field",
  },
  default: {
    key: "default",
    primary: "#0f766e",
    secondary: "#2563eb",
    accent: "#5b5bd6",
    label: "TooolVibes field",
  },
};

function getSiteDepthTone(pathname?: string | null): SiteDepthTone {
  if (!pathname || pathname === "/") {
    return siteDepthTones.home;
  }

  if (pathname.startsWith("/archivio") || pathname.startsWith("/collections") || pathname.startsWith("/tags")) {
    return siteDepthTones.archive;
  }

  if (pathname.startsWith("/compare") || pathname.startsWith("/shortlist")) {
    return siteDepthTones.compare;
  }

  if (pathname.startsWith("/product-hunt")) {
    return siteDepthTones.radar;
  }

  if (pathname.startsWith("/wishlist")) {
    return siteDepthTones.wishlist;
  }

  if (pathname.startsWith("/shop") || pathname.startsWith("/account")) {
    return siteDepthTones.commerce;
  }

  return siteDepthTones.default;
}

export function SiteDepthSystem() {
  const pathname = usePathname();
  const tone = useMemo(() => getSiteDepthTone(pathname), [pathname]);

  return (
    <div
      className="site-depth-system"
      data-site-depth-route={tone.key}
      aria-hidden="true"
      style={
        {
          "--site-depth-primary": tone.primary,
          "--site-depth-secondary": tone.secondary,
          "--site-depth-accent": tone.accent,
        } as CSSProperties
      }
    >
      <span className="site-depth-system__atmosphere site-depth-system__atmosphere--one" />
      <span className="site-depth-system__atmosphere site-depth-system__atmosphere--two" />

      <div className="site-depth-system__camera">
        <div className="site-depth-system__world">
          <span className="site-depth-system__plane site-depth-system__plane--back" />
          <span className="site-depth-system__plane site-depth-system__plane--mid" />
          <span className="site-depth-system__plane site-depth-system__plane--front" />

          <span className="site-depth-system__rail site-depth-system__rail--one" />
          <span className="site-depth-system__rail site-depth-system__rail--two" />
          <span className="site-depth-system__rail site-depth-system__rail--three" />

          <span className="site-depth-system__node site-depth-system__node--one">{tone.label}</span>
          <span className="site-depth-system__node site-depth-system__node--two">Shortlist</span>
          <span className="site-depth-system__node site-depth-system__node--three">Signals</span>
        </div>
      </div>
    </div>
  );
}
