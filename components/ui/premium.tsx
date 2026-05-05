import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone =
  | "primary"
  | "premium"
  | "secondary"
  | "ghost"
  | "outline"
  | "subtle"
  | "glow"
  | "dark"
  | "danger"
  | "link";
type Size = "sm" | "md" | "lg" | "xl" | "icon";

const buttonTone: Record<Tone, string> = {
  primary: "premium-button-primary",
  premium: "premium-button-premium",
  secondary: "premium-button-secondary",
  ghost: "premium-button-ghost",
  outline: "premium-button-outline",
  subtle: "premium-button-subtle",
  glow: "premium-button-glow",
  dark: "premium-button-dark",
  danger: "premium-button-danger",
  link: "premium-button-link",
};

const buttonSize: Record<Size, string> = {
  sm: "min-h-10 px-4 py-2 text-[0.82rem]",
  md: "min-h-12 px-5 py-3 text-sm",
  lg: "min-h-[3.35rem] px-6 py-3.5 text-[0.95rem]",
  xl: "min-h-[3.85rem] px-7 py-4 text-[1rem]",
  icon: "min-h-11 min-w-11 px-0 py-0 text-sm",
};

export function PremiumLink({
  href,
  children,
  tone = "primary",
  size = "md",
  className,
  external,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">) {
  const classes = cn(
    "premium-button inline-flex items-center justify-center gap-2 rounded-full font-semibold",
    size === "icon" && "premium-button-icon",
    buttonTone[tone],
    buttonSize[size],
    className,
  );

  if (external || href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...props}
      >
        <span>{children}</span>
        <ArrowRight aria-hidden="true" className="premium-arrow premium-button-icon-shift size-4" />
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      <span>{children}</span>
      {tone === "primary" || tone === "dark" ? (
        <ArrowRight aria-hidden="true" className="premium-arrow premium-button-icon-shift size-4" />
      ) : null}
    </Link>
  );
}

export function PremiumButton({
  children,
  tone = "primary",
  size = "md",
  className,
  ...props
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "premium-button inline-flex items-center justify-center gap-2 rounded-full font-semibold",
        size === "icon" && "premium-button-icon",
        buttonTone[tone],
        buttonSize[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PremiumBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "dark";
  className?: string;
}) {
  return (
    <span className={cn("premium-badge", `premium-badge-${tone}`, className)}>
      {children}
    </span>
  );
}

export function PremiumPanel({
  as: Component = "div",
  children,
  tone = "light",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "aside";
  children: React.ReactNode;
  tone?: "light" | "tint" | "dark" | "subtle" | "airy" | "blue" | "violet" | "warm";
}) {
  return (
    <Component
      className={cn("premium-panel", `premium-panel-${tone}`, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
