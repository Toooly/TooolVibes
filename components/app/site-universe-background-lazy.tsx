"use client";

import dynamic from "next/dynamic";

export const SiteUniverseBackgroundLazy = dynamic(
  () =>
    import("@/components/app/site-universe-background").then((mod) => ({
      default: mod.SiteUniverseBackground,
    })),
  { ssr: false },
);
