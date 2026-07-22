import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionShellProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  bleed?: boolean;
};

export function SectionShell({ children, className, id, bleed = false }: SectionShellProps) {
  return (
    <section id={id} className={cn(bleed ? "relative" : "page-shell", className)}>
      {children}
    </section>
  );
}

export function DecorativeGlow({
  className,
  tone = "violet",
}: {
  className?: string;
  tone?: "violet" | "cyan" | "gold";
}) {
  const toneClass = {
    violet: "bg-[rgba(167,139,250,0.16)]",
    cyan: "bg-[rgba(94,226,255,0.14)]",
    gold: "bg-[rgba(246,199,97,0.14)]",
  }[tone];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "hero-mini-visual pointer-events-none absolute h-36 w-36 rounded-[42%] opacity-80",
        toneClass,
        className,
      )}
    />
  );
}

type EmptyStateProps = {
  icon?: ComponentType<{ className?: string }>;
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  dark?: boolean;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  dark = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--tv-radius-feature)] border p-5",
        dark
          ? "border-white/10 bg-white/8 text-white"
          : "border-[rgba(76,55,166,0.12)] bg-white/72 text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.58)]",
        className,
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={cn("size-6", dark ? "text-white/76" : "text-[var(--accent-strong)]")}
        />
      ) : null}
      {eyebrow ? (
        <p
          className={cn(
            "mt-4 text-xs font-semibold uppercase tracking-[0.18em]",
            dark ? "text-white/52" : "text-[var(--accent-strong)]",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h3 className={cn("mt-3 text-[1.35rem] leading-tight", dark ? "text-white" : "text-[var(--foreground)]")}>
        {title}
      </h3>
      <p className={cn("mt-3 text-sm leading-6", dark ? "text-white/64" : "text-[var(--muted-strong)]")}>
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
