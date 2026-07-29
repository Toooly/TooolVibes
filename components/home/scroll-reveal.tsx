"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "motion/react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { MOTION_DURATION_S, MOTION_EASING } from "@/lib/motion/tokens";
import { mapDurationForMotion, mapRevealForMotion, mapStaggerForMotion } from "@/lib/motion/reduced-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  once?: boolean;
}

const directionOffsets = {
  up: { y: 16, x: 0 },
  down: { y: -16, x: 0 },
  left: { x: 16, y: 0 },
  right: { x: -16, y: 0 },
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = MOTION_DURATION_S.deliberate,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-80px" });
  const preferReducedMotion = useReducedMotion();
  const offset = directionOffsets[direction];
  const hidden = mapRevealForMotion(
    { opacity: 0, x: offset.x, y: offset.y },
    preferReducedMotion,
  );

  const variants: Variants = {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: mapDurationForMotion(duration, preferReducedMotion),
        delay: preferReducedMotion ? 0 : delay,
        ease: [...MOTION_EASING.decelerate] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = MOTION_DURATION_S.staggerStep,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });
  const preferReducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: mapStaggerForMotion(staggerDelay, preferReducedMotion),
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const preferReducedMotion = useReducedMotion();
  const hidden = mapRevealForMotion({ opacity: 0, y: 12 }, preferReducedMotion);

  return (
    <motion.div
      className={className}
      variants={{
        hidden,
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: mapDurationForMotion(
              MOTION_DURATION_S.standard,
              preferReducedMotion,
            ),
            ease: [...MOTION_EASING.decelerate] as [number, number, number, number],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
