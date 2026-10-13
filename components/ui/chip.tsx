import { Toggle } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Chip — canonical interactive filter/toggle primitive (B23 / DS-305).
 *
 * Built on the Base UI Toggle so the selected state is exposed to assistive
 * technology through `aria-pressed` and the control keeps native `<button>`
 * keyboard activation (Enter / Space). Static labels belong to `Badge`;
 * actions and navigation belong to `Button`.
 *
 * Contract: variants `default | accent | outline`, sizes `sm | default | lg`,
 * states `hover | focus-visible | pressed (selected) | disabled`. The pressed
 * state is driven by the `selected` / `defaultSelected` / `onSelectedChange`
 * props and mirrored by the `data-pressed` attribute for styling.
 */
const chipVariants = cva(
  "group/chip inline-flex min-h-11 w-fit shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-transparent font-medium whitespace-nowrap outline-none select-none transition-[color,background-color,border-color] duration-[var(--tv-duration-fast)] motion-reduce:transition-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-default disabled:opacity-50 md:min-h-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] text-[var(--tv-ink-secondary)] hover:border-[var(--tv-border-interactive)] hover:text-[var(--tv-ink-primary)] data-[pressed]:border-[color-mix(in_srgb,var(--tv-accent-brand)_34%,transparent)] data-[pressed]:bg-[color-mix(in_srgb,var(--tv-accent-brand)_16%,transparent)] data-[pressed]:text-[var(--tv-ink-primary)]",
        accent:
          "border-[color-mix(in_srgb,var(--tv-accent-brand)_34%,transparent)] bg-[color-mix(in_srgb,var(--tv-accent-brand)_16%,transparent)] text-[var(--tv-ink-primary)] hover:bg-[color-mix(in_srgb,var(--tv-accent-brand)_24%,transparent)] data-[pressed]:border-transparent data-[pressed]:bg-[var(--tv-accent-aa)] data-[pressed]:text-white",
        outline:
          "border-[var(--tv-border-interactive)] bg-transparent text-[var(--tv-ink-secondary)] hover:bg-[var(--tv-surface-elevated)] hover:text-[var(--tv-ink-primary)] data-[pressed]:border-[var(--tv-accent-primary)] data-[pressed]:text-[var(--tv-ink-primary)]",
      },
      size: {
        default: "h-8 px-3 text-xs",
        sm: "h-6 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        lg: "h-9 gap-2 px-3.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ChipProps = Omit<
  Toggle.Props,
  "pressed" | "defaultPressed" | "onPressedChange" | "value"
> &
  VariantProps<typeof chipVariants> & {
    /** Controlled selected state (maps to the toggle pressed state). */
    selected?: boolean
    /** Uncontrolled initial selected state. */
    defaultSelected?: boolean
    /** Called with the next selected state after every toggle. */
    onSelectedChange?: (selected: boolean) => void
  }

function Chip({
  className,
  variant = "default",
  size = "default",
  selected,
  defaultSelected,
  onSelectedChange,
  ...props
}: ChipProps) {
  return (
    <Toggle
      {...props}
      data-slot="chip"
      data-variant={variant ?? undefined}
      data-size={size ?? undefined}
      pressed={selected}
      defaultPressed={defaultSelected}
      onPressedChange={
        onSelectedChange ? (pressed) => onSelectedChange(pressed) : undefined
      }
      className={cn(chipVariants({ variant, size, className }))}
    />
  )
}

export { Chip, chipVariants }
export type { ChipProps }
