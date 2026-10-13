"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useId, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { layoutMarkerTransition } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";

/** One native control model for tabs and mutually exclusive choices. */
export function SegmentedControl<T extends string>({
  options, value, onValueChange, label, id, tabs = false, className, optionClassName,
}: {
  options: readonly { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  id: string;
  tabs?: boolean;
  className?: string;
  optionClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const markerId = useId();
  const preferReducedMotion = useReducedMotion();
  return (
    <LocalizedAttributes><div ref={ref} className={cn("tv-sys-segmented", className)} role={tabs ? "tablist" : "group"} aria-label={label}>
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role={tabs ? "tab" : undefined}
          id={tabs ? `${id}-tab-${option.value}` : undefined}
          aria-controls={tabs ? `${id}-panel-${option.value}` : undefined}
          aria-selected={tabs ? value === option.value : undefined}
          aria-pressed={tabs ? undefined : value === option.value}
          tabIndex={tabs && value !== option.value ? -1 : 0}
          className={cn("tv-sys-segmented__option", optionClassName)}
          data-active={value === option.value ? "true" : undefined}
          onClick={() => onValueChange(option.value)}
          onKeyDown={(event) => {
            const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            if (!offset && event.key !== "Home" && event.key !== "End") return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + offset + options.length) % options.length;
            ref.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
            onValueChange(options[next].value);
          }}
        >
          {value === option.value ? (
            <motion.span
              aria-hidden="true"
              className="tv-sys-segmented__marker"
              layoutId={`${markerId}-selection`}
              initial={false}
              transition={layoutMarkerTransition({ preferReducedMotion })}
            />
          ) : null}
          <span className="tv-sys-segmented__label">
            {option.icon ? <span className="tv-sys-segmented__icon" aria-hidden="true"><LocalizedText>{option.icon}</LocalizedText></span> : null}
            <LocalizedText>{option.label}</LocalizedText>
          </span>
        </button>
      ))}
    </div></LocalizedAttributes>
  );
}
