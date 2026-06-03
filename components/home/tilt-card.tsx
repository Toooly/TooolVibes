"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltAmount?: number;
  glowColor?: string;
  onClick?: () => void;
}

export function TiltCard({
  children,
  className = "",
  tiltAmount = 10,
  glowColor = "rgba(106,60,255,0.3)",
  onClick,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg)");
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const rotateX = (y - 0.5) * -tiltAmount;
    const rotateY = (x - 0.5) * tiltAmount;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlowPosition({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ transform }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, ${glowColor}, transparent 60%)`,
        }}
      />
      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor.replace("0.3", "0.05")}`,
        }}
      />
      {children}
    </motion.div>
  );
}
