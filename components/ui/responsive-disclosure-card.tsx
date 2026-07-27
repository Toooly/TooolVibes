"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type ResponsiveDisclosureCardProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
};

export function ResponsiveDisclosureCard({
  icon,
  title,
  children,
  className,
}: ResponsiveDisclosureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const titleId = useId();
  const panelId = useId();

  return (
    <article
      className={cn(
        "rounded-[20px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)] p-3 md:rounded-[var(--tv-radius-feature)] md:p-5",
        className,
      )}
    >
      <div className="flex min-h-11 items-center gap-3 md:min-h-0 md:flex-col md:items-start">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] text-[var(--tv-accent-brand-aa)] md:size-12 md:rounded-[18px]">
          {icon}
        </span>
        <h2
          id={titleId}
          className="min-w-0 text-[1rem] leading-tight text-[var(--tv-ink-primary)] md:mt-2 md:text-[1.36rem] md:leading-[1.08]"
        >
          {title}
        </h2>
        <button
          type="button"
          className="ml-auto grid size-11 shrink-0 place-items-center rounded-[var(--tv-radius-control)] text-[var(--tv-ink-secondary)] transition-colors hover:bg-[var(--tv-surface-elevated)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-accent-brand-aa)] md:hidden"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-labelledby={titleId}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              expanded ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        id={panelId}
        className={cn("md:block", expanded ? "block" : "hidden")}
      >
        {children}
      </div>
    </article>
  );
}

ResponsiveDisclosureCard.displayName = "ResponsiveDisclosureCard";
