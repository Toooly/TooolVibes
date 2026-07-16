import * as React from "react"
import Image from "next/image"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "tv-avatar relative shrink-0 overflow-hidden border border-white/10 bg-[var(--tv-accent-primary)] text-white",
  {
    variants: {
      size: {
        sm: "size-6 text-xs",
        md: "size-8 text-xs",
        lg: "size-12 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

type AvatarProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof avatarVariants> & {
    alt?: string
    fallback?: string
    src?: string | null
  }

function Avatar({ alt = "", className, fallback = "TV", size, src, ...props }: AvatarProps) {
  return (
    <span data-slot="avatar" className={cn(avatarVariants({ size }), className)} {...props}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
      ) : (
        <span aria-hidden={alt ? "true" : undefined}>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  )
}

export { Avatar, avatarVariants }
