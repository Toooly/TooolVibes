import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowRight, Loader2 } from "lucide-react"
import Link from "@/components/ui/app-link"
import * as React from "react"

import { cn } from "@/lib/utils"

// TooolVibes Phase 5: button.tsx now consumes --tv-button-* semantic tokens
// from styles/tokens.css (SECTION 3: COMPONENT TOKENS).
// Original `premium-button-*` classes preserved for backward compatibility
// with globals.css until Phase 6 split.
//
// Token mapping:
//   min-h-10   → min-h-[var(--tv-button-min-height)]    (2.5rem)
//   min-h-11   → min-h-[var(--tv-button-min-height-touch)] (2.75rem, a11y)
//   px-4 py-2.5 → px-[var(--tv-button-padding-x-md)] py-[var(--tv-button-padding-y-md)]
//   rounded-full → rounded-[var(--tv-button-radius)]   (pill, 999px)
//   text-sm    → text-[length:var(--tv-button-font-size)]
//   font-semibold → font-[weight:var(--tv-button-font-weight)]
const buttonVariants = cva(
  "premium-button group/button inline-flex shrink-0 items-center justify-center rounded-[var(--tv-button-radius)] border border-transparent bg-clip-padding text-[length:var(--tv-button-font-size)] font-[weight:var(--tv-button-font-weight)] whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "premium-button-primary",
        primary: "premium-button-primary",
        activation: "tv-cta-primary",
        premium: "premium-button-premium",
        glow: "premium-button-glow",
        outline:
          "premium-button-outline aria-expanded:bg-white/10 aria-expanded:text-white",
        secondary: "premium-button-secondary",
        subtle: "premium-button-subtle",
        ghost: "premium-button-ghost aria-expanded:bg-white/10 aria-expanded:text-white",
        destructive:
          "premium-button-danger focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "premium-button-link",
      },
      size: {
        default:
          "min-h-[var(--tv-button-min-height)] gap-1.5 px-[var(--tv-button-padding-x-md)] py-[var(--tv-button-padding-y-md)] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "min-h-[var(--tv-control-min-height-compact)] gap-1 px-2.5 py-1 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-[var(--tv-chip-min-height)] gap-1.5 px-3.5 py-2 text-[length:var(--tv-text-button)] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        md: "min-h-[var(--tv-button-min-height-touch)] gap-1.5 px-[var(--tv-button-padding-x-md)] py-[var(--tv-button-padding-y-md)]",
        lg: "min-h-[var(--tv-control-min-height-large)] gap-2 px-5 py-3 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xl: "min-h-[var(--tv-control-min-height-large)] gap-2 px-7 py-4 text-[length:var(--tv-text-body)]",
        icon: "premium-button-icon size-11",
        "icon-xs":
          "premium-button-icon size-7 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "premium-button-icon size-11 in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "premium-button-icon size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

function Button({
  className,
  children,
  disabled,
  loading = false,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const { "aria-busy": ariaBusy, ...buttonProps } = props

  return (
    <ButtonPrimitive
      {...buttonProps}
      data-slot="button"
      data-size={size ?? undefined}
      data-loading={loading ? "" : undefined}
      aria-busy={loading ? true : ariaBusy}
      disabled={loading || disabled}
      className={cn(buttonVariants({ variant, size, className }))}
    >
      {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
      {loading ? <span className="opacity-70">{children}</span> : children}
    </ButtonPrimitive>
  )
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: "primary" | "activation" | "premium" | "secondary" | "ghost" | "outline";
};

function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "premium-button text-ui-strong group/button inline-flex w-full items-center justify-center gap-2 rounded-[var(--tv-button-radius)] px-[var(--tv-button-padding-x-md)] py-[var(--tv-button-padding-y-md)] text-center text-[0.95rem] font-[weight:var(--tv-button-font-weight)] tracking-normal sm:w-auto",
        variant === "primary" && "premium-button-primary text-white sm:min-w-[11.75rem]",
        variant === "activation" && "tv-cta-primary sm:min-w-[11.75rem]",
        variant === "premium" && "premium-button-premium text-white sm:min-w-[11.75rem]",
        variant === "secondary" && "premium-button-secondary sm:min-w-[10.5rem]",
        variant === "ghost" && "premium-button-ghost sm:min-w-[10.5rem]",
        variant === "outline" && "premium-button-outline sm:min-w-[10.5rem]",
        className,
      )}
      {...props}
    >
      <span>{props.children}</span>
      {variant === "primary" ? (
        <ArrowRight aria-hidden="true" className="button-arrow size-4" />
      ) : null}
    </Link>
  );
}

export { Button, ButtonLink, buttonVariants }
