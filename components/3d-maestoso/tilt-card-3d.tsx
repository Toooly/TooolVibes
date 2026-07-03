"use client";

import { useRef, useState, type ReactNode } from "react";

interface TiltCard3DProps {
  children: ReactNode;
  className?: string;
  tiltAmount?: number;
  glowColor?: string;
  style?: React.CSSProperties;
}

export function TiltCard3D({
  children,
  className = "",
  tiltAmount = 8,
  glowColor = "rgba(124,77,255,0.25)",
  style,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (x - cx) / cx;
    const dy = (y - cy) / cy;
    setTransform(`rotateX(${-dy * tiltAmount}deg) rotateY(${dx * tiltAmount}deg)`);
    setShine({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.15 });
  };

  const handleMouseLeave = () => {
    setTransform("rotateX(0deg) rotateY(0deg)");
    setShine({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`v-perspective ${className}`}
      style={{ ...style, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="v-preserve-3d v-backface-hidden relative h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: transform, willChange: "transform" }}
      >
        {/* Shine overlay */}
        <div
          className="tilt-card-shine pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,${shine.opacity}), transparent 60%)`,
            transition: "background 0.1s ease",
          }}
        />
        {/* Glow border */}
        <div
          className="tilt-card-glow pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
          style={{
            boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
            opacity: shine.opacity > 0 ? 0.6 : 0,
          }}
        />
        {children}
      </div>
    </div>
  );
}
