import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        neutral:
          "border-[rgba(243,243,247,0.12)] bg-[rgba(37,37,43,0.86)] text-[var(--tv-ink-secondary)]",
        accent:
          "border-[color-mix(in_srgb,var(--tv-accent-brand)_34%,transparent)] bg-[color-mix(in_srgb,var(--tv-accent-brand)_16%,transparent)] text-[var(--tv-ink-primary)]",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        trust:
          "border-[var(--tv-status-trust-soft-border)] bg-[var(--tv-status-trust-soft-bg)] text-[var(--tv-status-trust-soft-text)] dark:border-[var(--tv-status-trust-soft-border-dark)] dark:bg-[var(--tv-status-trust-soft-bg-dark)] dark:text-[var(--tv-status-trust-soft-text-dark)]",
        verified:
          "border-[var(--tv-status-success-soft-border)] bg-[var(--tv-status-success-soft-bg)] text-[var(--tv-status-success-soft-text)] dark:border-[var(--tv-status-success-soft-border-dark)] dark:bg-[var(--tv-status-success-soft-bg-dark)] dark:text-[var(--tv-status-success-soft-text-dark)]",
        affiliate:
          "border-[var(--tv-status-affiliate-soft-border)] bg-[var(--tv-status-affiliate-soft-bg)] text-[var(--tv-status-affiliate-soft-text)] dark:border-[var(--tv-status-affiliate-soft-border-dark)] dark:bg-[var(--tv-status-affiliate-soft-bg-dark)] dark:text-[var(--tv-status-affiliate-soft-text-dark)]",
        info:
          "border-[var(--tv-status-info-soft-border)] bg-[var(--tv-status-info-soft-bg)] text-[var(--tv-status-info-soft-text)] dark:border-[var(--tv-status-info-soft-border-dark)] dark:bg-[var(--tv-status-info-soft-bg-dark)] dark:text-[var(--tv-status-info-soft-text-dark)]",
        warning:
          "border-[var(--tv-status-warning-soft-border)] bg-[var(--tv-status-warning-soft-bg)] text-[var(--tv-status-warning-soft-text)] dark:border-[var(--tv-status-warning-soft-border-dark)] dark:bg-[var(--tv-status-warning-soft-bg-dark)] dark:text-[var(--tv-status-warning-soft-text-dark)]",
        success:
          "border-[var(--tv-status-success-soft-border)] bg-[var(--tv-status-success-soft-bg)] text-[var(--tv-status-success-soft-text)] dark:border-[var(--tv-status-success-soft-border-dark)] dark:bg-[var(--tv-status-success-soft-bg-dark)] dark:text-[var(--tv-status-success-soft-text-dark)]",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        danger:
          "border-[var(--tv-status-danger-soft-border)] bg-[var(--tv-status-danger-soft-bg)] text-[var(--tv-status-danger-soft-text)]",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  const dataAttributes = {
    "data-slot": "badge",
    "data-variant": variant ?? undefined,
  }

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        ...dataAttributes,
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
