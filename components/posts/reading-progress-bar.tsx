"use client";

import { LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  calculateReadingProgress,
  readingProgressReached,
} from "@/lib/motion/reading-progress";
import { MOTION_DURATION_MS } from "@/lib/motion/tokens";

type ReadingProgressBarProps = {
  contentSelector?: string;
  className?: string;
};

export function ReadingProgressBar({
  contentSelector = "[data-reading-progress-root]",
  className = "",
}: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const preferReducedMotion = useReducedMotion();

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      const content = document.querySelector(contentSelector);
      if (!(content instanceof HTMLElement)) {
        setProgress(0);
        return;
      }
      const rect = content.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const contentOffsetTop = rect.top + scrollY;
      const next = calculateReadingProgress({
        scrollY,
        viewportHeight: window.innerHeight,
        contentOffsetTop,
        contentHeight: content.offsetHeight,
      });
      setProgress(next);
    };

    const onScroll = () => {
      if (preferReducedMotion) {
        measure();
        return;
      }
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [contentSelector, preferReducedMotion]);

  const complete = readingProgressReached(progress);
  const scale = Math.max(0, Math.min(1, progress));

  return (
    <LocalizedAttributes><div
      className={`reading-progress ${className}`.trim()}
      role="progressbar"
      aria-label="Progresso di lettura"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(scale * 100)}
      data-complete={complete ? "true" : "false"}
    >
      <span
        className="reading-progress__fill"
        style={{
          transform: `scaleX(${scale})`,
          transition: preferReducedMotion
            ? "none"
            : `transform ${MOTION_DURATION_MS.fast}ms linear`,
        }}
      />
    </div></LocalizedAttributes>
  );
}
