"use client";

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
  return (
    <div
      className={cn(
        "brand-mark relative flex items-center justify-center rounded-xl",
        "bg-gradient-to-br from-[#6a3cff]/20 to-[#39d2f6]/10",
        "ring-1 ring-white/20 shadow-lg shadow-[#6a3cff]/10",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="TooolVibes logo"
    >
      {fallback === "3d" && threeDEnabled ? (
        <BrandLogo3D size={size} />
      ) : (
        <Image
          src="/brand/tooolvibes-logo.png"
          alt="TooolVibes"
          width={size}
          height={size}
          className="relative z-10"
          priority={priority}
        />
      )}
    </div>
  );
}
