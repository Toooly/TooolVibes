"use client";

import { LocalizedAttributes } from "@/components/i18n/localized-text";
import dynamic from "next/dynamic";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { useExperienceRelease } from "@/lib/config/release-context";

const BrandLogo3D = dynamic(
  () => import("@/components/3d/brand-logo-3d").then((mod) => mod.BrandLogo3D),
  {
    ssr: false,
    loading: () => null,
  },
);

interface BrandLogoProps {
  className?: string;
  size?: number;
  fallback?: "3d" | "png";
  priority?: boolean;
}

export function BrandLogo({
  className,
  size = 36,
  fallback = "3d",
  priority = false,
}: BrandLogoProps) {
  const { threeDEnabled } = useExperienceRelease();
  const is3D = fallback === "3d" && threeDEnabled;

  return (
    <LocalizedAttributes><div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
      role={is3D ? "img" : undefined}
      aria-label={is3D ? "TooolVibes" : undefined}
    >
      {is3D ? (
        <BrandLogo3D size={size} />
      ) : (
        <LocalizedAttributes><Image
          src="/brand/tooolvibes-logo.png"
          alt="TooolVibes"
          width={size}
          height={size}
          className="h-full w-full object-contain"
          priority={priority}
        /></LocalizedAttributes>
      )}
    </div></LocalizedAttributes>
  );
}
