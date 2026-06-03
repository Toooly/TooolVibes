"use client";

import { useEffect, useRef, useState } from "react";
import { useMounted } from "@/lib/hooks/use-mounted";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);
  const posRef = useRef({ x: -100, y: -100 });
  const velRef = useRef({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for touch device
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const onMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    // Hover detection for interactive elements
    const onElementMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[data-cursor-hover]")
      ) {
        setIsHovering(true);
      }
    };

    const onElementMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[data-cursor-hover]")
      ) {
        setIsHovering(false);
      }
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onElementMouseOver, { passive: true });
    document.addEventListener("mouseout", onElementMouseOut, { passive: true });

    let animationId: number;
    const smoothness = 0.15;
    let currentX = -100;
    let currentY = -100;

    const animate = () => {
      const targetX = posRef.current.x;
      const targetY = posRef.current.y;

      currentX += (targetX - currentX) * smoothness;
      currentY += (targetY - currentY) * smoothness;

      velRef.current = {
        x: (targetX - currentX) * 0.1,
        y: (targetY - currentY) * 0.1,
      };

      const skewX = Math.max(-15, Math.min(15, velRef.current.x * 2));
      const skewY = Math.max(-15, Math.min(15, velRef.current.y * 2));
      const scale = 1 + Math.min(0.3, Math.abs(velRef.current.x + velRef.current.y) * 0.02);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%) scale(${scale}) skew(${skewX}deg, ${skewY}deg)`;
      }

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
      }

      // Trail effect
      trailRefs.current.forEach((trail, i) => {
        if (trail) {
          const delay = (i + 1) * 0.08;
          const trailX = currentX - velRef.current.x * (i + 1) * 3;
          const trailY = currentY - velRef.current.y * (i + 1) * 3;
          const trailScale = 1 - (i + 1) * 0.15;
          trail.style.transform = `translate(${trailX}px, ${trailY}px) translate(-50%, -50%) scale(${Math.max(0, trailScale)})`;
          trail.style.opacity = `${Math.max(0, 0.4 - i * 0.08)}`;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", onElementMouseOver);
      document.removeEventListener("mouseout", onElementMouseOut);
      cancelAnimationFrame(animationId);
    };
  }, [isVisible]);

  const mounted = useMounted();

  // Don't render on touch devices or during SSR
  if (!mounted || (typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0))) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.3s" }}
    >
      {/* Trail particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) trailRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 rounded-full"
          style={{
            width: 24 - i * 3,
            height: 24 - i * 3,
            background: `radial-gradient(circle, rgba(106,60,255,${0.3 - i * 0.04}) 0%, transparent 70%)`,
            filter: `blur(${i + 1}px)`,
            transition: "opacity 0.15s",
          }}
        />
      ))}

      {/* Main cursor ring */}
      <div
        ref={cursorRef}
        className="absolute left-0 top-0 rounded-full"
        style={{
          width: isHovering ? 64 : 40,
          height: isHovering ? 64 : 40,
          border: `2px solid ${isHovering ? "rgba(57,210,246,0.6)" : "rgba(106,60,255,0.5)"}`,
          background: isHovering
            ? "radial-gradient(circle, rgba(57,210,246,0.15) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(106,60,255,0.1) 0%, transparent 70%)",
          boxShadow: isClicking
            ? "0 0 30px rgba(106,60,255,0.6), inset 0 0 20px rgba(106,60,255,0.2)"
            : isHovering
              ? "0 0 25px rgba(57,210,246,0.4)"
              : "0 0 15px rgba(106,60,255,0.3)",
          transition: "width 0.3s ease, height 0.3s ease, border-color 0.3s, box-shadow 0.2s",
        }}
      />

      {/* Center dot */}
      <div
        ref={cursorDotRef}
        className="absolute left-0 top-0 rounded-full"
        style={{
          width: 6,
          height: 6,
          background: isClicking ? "#f3bf4c" : "#ffffff",
          boxShadow: "0 0 10px rgba(106,60,255,0.8)",
          transition: "background 0.15s",
        }}
      />
    </div>
  );
}
