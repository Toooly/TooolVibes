import * as React from "react"

import { cn } from "@/lib/utils"

// TooolVibes Phase 5: input.tsx now consumes --tv-input-* semantic tokens
// from styles/tokens.css (SECTION 3: COMPONENT TOKENS).
//
// Token mapping:
//   min-h-10     → min-h-[var(--tv-input-min-height)]   (2.5rem)
//   rounded-md   → rounded-[var(--tv-input-radius)]      (md, 10px)
//   px-3 py-2    → px-[var(--tv-input-padding-x)] py-[var(--tv-input-padding-y)]
// Original Tailwind utility classes preserved for visual fidelity.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "min-h-[var(--tv-input-min-height)] w-full min-w-0 rounded-[var(--tv-input-radius)] border border-input bg-transparent px-[var(--tv-input-padding-x)] py-[var(--tv-input-padding-y)] text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
