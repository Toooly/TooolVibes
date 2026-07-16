"use client";

import { useState } from "react";
import type { OrbitalShapeType } from "./types";

interface OrbitalShapeProps {
  type: OrbitalShapeType;
  color: string;
  size: number;
  isActive: boolean;
  isHovered: boolean;
  iconUrl?: string;
  initials?: string;
}

function ShapeHexagon({ color, size, isActive }: { color: string; size: number; isActive: boolean }) {
  const s = size;
  const stroke = isActive ? color : `${color}60`;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`hexGrad-${color.replace(/#/g, "")}`} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path
        d="M24 2L43.1 13v22L24 46 4.9 35V13L24 2z"
        fill={`url(#hexGrad-${color.replace(/#/g, "")})`}
        stroke={stroke}
        strokeWidth={isActive ? 2 : 1.2}
        style={{ filter: isActive ? `drop-shadow(0 0 6px ${color}60)` : undefined }}
      />
    </svg>
  );
}

function ShapeCrystal({ color, size, isActive }: { color: string; size: number; isActive: boolean }) {
  const stroke = isActive ? color : `${color}55`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`crystGrad-${color.replace(/#/g, "")}`} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path
        d="M24 2L42 16 24 46 6 16 24 2z"
        fill={`url(#crystGrad-${color.replace(/#/g, "")})`}
        stroke={stroke}
        strokeWidth={isActive ? 2 : 1.2}
        style={{ filter: isActive ? `drop-shadow(0 0 6px ${color}50)` : undefined }}
      />
      <path d="M24 2L24 46" stroke={stroke} strokeWidth={0.8} opacity={0.4} />
      <path d="M6 16L42 16" stroke={stroke} strokeWidth={0.8} opacity={0.3} />
    </svg>
  );
}

function ShapeShard({ color, size, isActive }: { color: string; size: number; isActive: boolean }) {
  const stroke = isActive ? color : `${color}50`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`shardGrad-${color.replace(/#/g, "")}`} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor={color} stopOpacity="0.38" />
          <stop offset="60%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d="M14 4L38 12 44 34 26 44 6 30 10 10 14 4z"
        fill={`url(#shardGrad-${color.replace(/#/g, "")})`}
        stroke={stroke}
        strokeWidth={isActive ? 2 : 1.2}
        strokeLinejoin="round"
        style={{ filter: isActive ? `drop-shadow(0 0 6px ${color}50)` : undefined }}
      />
      <path d="M14 4L26 44M38 12L6 30M44 34L10 10" stroke={stroke} strokeWidth={0.6} opacity={0.25} />
    </svg>
  );
}

function ShapeGem({ color, size, isActive }: { color: string; size: number; isActive: boolean }) {
  const stroke = isActive ? color : `${color}55`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`gemGrad-${color.replace(/#/g, "")}`} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor={color} stopOpacity="0.42" />
          <stop offset="100%" stopColor={color} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path
        d="M24 2L34 10 42 20 34 36 24 44 14 36 6 20 14 10 24 2z"
        fill={`url(#gemGrad-${color.replace(/#/g, "")})`}
        stroke={stroke}
        strokeWidth={isActive ? 2 : 1.2}
        strokeLinejoin="round"
        style={{ filter: isActive ? `drop-shadow(0 0 6px ${color}55)` : undefined }}
      />
      <path d="M24 2L24 44M6 20L42 20M14 10L34 36M34 10L14 36" stroke={stroke} strokeWidth={0.6} opacity={0.22} />
    </svg>
  );
}

function ShapeBlob({ color, size, isActive }: { color: string; size: number; isActive: boolean }) {
  const stroke = isActive ? color : `${color}50`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`blobGrad-${color.replace(/#/g, "")}`} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path
        d="M24 3c8 0 14 4 17 11s2 15-3 21-13 9-21 6-10-10-8-19 8-16 15-19z"
        fill={`url(#blobGrad-${color.replace(/#/g, "")})`}
        stroke={stroke}
        strokeWidth={isActive ? 2 : 1.2}
        style={{ filter: isActive ? `drop-shadow(0 0 6px ${color}50)` : undefined }}
      />
    </svg>
  );
}

function CenterContent({
  iconUrl,
  initials,
  size,
}: {
  iconUrl?: string;
  initials?: string;
  size: number;
}) {
  const [imgError, setImgError] = useState(false);
  const iconSize = Math.max(12, Math.floor(size * 0.42));

  if (iconUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
      <img
        src={iconUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        style={{
          width: iconSize,
          height: iconSize,
          objectFit: "contain",
          borderRadius: 3,
        }}
      />
    );
  }

  if (initials) {
    return (
      <span
        className="select-none font-bold tracking-wider text-white"
        style={{
          fontSize: Math.max(9, Math.floor(size * 0.28)),
          textShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      >
        {initials.slice(0, 1)}
      </span>
    );
  }

  return (
    <span
      className="block rounded-full bg-white/70"
      style={{
        width: Math.max(4, Math.floor(size * 0.16)),
        height: Math.max(4, Math.floor(size * 0.16)),
      }}
    />
  );
}

const SHAPE_MAP: Record<
  OrbitalShapeType,
  React.FC<{ color: string; size: number; isActive: boolean }>
> = {
  hexagon: ShapeHexagon,
  crystal: ShapeCrystal,
  shard: ShapeShard,
  gem: ShapeGem,
  blob: ShapeBlob,
};

export function OrbitalShape({ type, color, size, isActive, isHovered, iconUrl, initials }: OrbitalShapeProps) {
  const Shape = SHAPE_MAP[type] ?? ShapeGem;
  const glowOpacity = isActive ? 0.45 : isHovered ? 0.25 : 0;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${color}${Math.round(glowOpacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          transform: "scale(1.6)",
          opacity: glowOpacity > 0 ? 1 : 0,
        }}
      />

      {/* Ring pulse (subtle invitation to click) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          border: `1.5px solid ${color}`,
          transform: "scale(1.35)",
          opacity: isHovered ? 0.35 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Shape */}
      <div className="relative z-10 flex items-center justify-center">
        <Shape color={color} size={size} isActive={isActive} />
      </div>

      {/* Center content overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <CenterContent iconUrl={iconUrl} initials={initials} size={size} />
      </div>
    </div>
  );
}
