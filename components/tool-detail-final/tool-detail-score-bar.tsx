"use client";

import { useOnceInView } from "@/lib/motion/use-once-in-view";

export function ToolDetailScoreBar({ ratio }: { ratio: number }) {
  const { ref, hasBeenVisible, preferReducedMotion } = useOnceInView<HTMLDivElement>({
    threshold: 0.4,
  });
  const safe = Math.max(0, Math.min(1, ratio));
  const revealed = hasBeenVisible || preferReducedMotion;

  return (
    <div
      className="td-final-score__bar"
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe * 100)}
      aria-label="Barra punteggio editoriale"
    >
      <span
        className="td-final-score__bar-fill"
        data-animate={revealed ? "done" : "pending"}
        style={{
          transform: revealed ? `scaleX(${safe})` : "scaleX(0)",
          width: "100%",
        }}
      />
    </div>
  );
}
