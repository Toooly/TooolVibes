import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: number;
};

export function BrandLogo({
  className,
  priority = false,
  size = 48,
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "brand-mark group relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[22px]",
        className,
      )}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 50% 26%, rgba(99,50,255,0.18), rgba(18,10,59,0.02) 68%)",
      }}
    >
      <span className="brand-mark__ring pointer-events-none absolute inset-[6%] rounded-[20px] border border-white/18 shadow-[0_18px_44px_rgba(52,32,160,0.14)]" />
      <span className="brand-mark__aura pointer-events-none absolute inset-[10%] rounded-[18px] bg-[radial-gradient(circle,rgba(68,220,255,0.18),transparent_64%)] blur-xl" />
      <span className="brand-mark__shine pointer-events-none absolute inset-[22%] rounded-[16px] bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.28),transparent_58%)] blur-lg" />
      <span className="brand-mark__glass pointer-events-none absolute inset-0 rounded-[22px] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))]" />
      <Image
        src="/brand/tooolvibes-logo.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        priority={priority}
        className="relative h-[88%] w-[88%] object-contain drop-shadow-[0_18px_30px_rgba(41,23,144,0.26)] transition-transform duration-300 ease-out group-hover:scale-[1.02]"
      />
    </span>
  );
}
