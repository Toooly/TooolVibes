import Link from "next/link";

import { cn } from "@/lib/utils";

type Tone = "primary" | "secondary" | "ghost" | "dark" | "danger";
type Size = "sm" | "md" | "lg";

const buttonTone: Record<Tone, string> = {
  primary: "premium-button-primary",
  secondary: "premium-button-secondary",
  ghost: "premium-button-ghost",
  dark: "premium-button-dark",
  danger: "premium-button-danger",
};

const buttonSize: Record<Size, string> = {
  sm: "min-h-10 px-4 py-2 text-[0.82rem]",
  md: "min-h-12 px-5 py-3 text-sm",
  lg: "min-h-[3.35rem] px-6 py-3.5 text-[0.95rem]",
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
        <span aria-hidden="true" className="premium-arrow">
          -&gt;
        </span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      <span>{children}</span>
      {tone === "primary" || tone === "dark" ? (
        <span aria-hidden="true" className="premium-arrow">
          -&gt;
        </span>
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
        buttonTone[tone],
        buttonSize[size],
        className,
      )}
      {...props}
    >
      <span>{children}</span>
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
  tone?: "light" | "tint" | "dark" | "subtle";
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
