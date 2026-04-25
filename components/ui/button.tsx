import Link from "next/link";

import { cn } from "@/lib/utils";

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
};

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "button-shell text-ui-strong group/button inline-flex w-full items-center justify-center gap-2 rounded-full px-4.5 py-2.9 text-center text-[0.95rem] font-semibold tracking-[-0.012em] transition-all duration-300 sm:w-auto",
        variant === "primary" && "text-white",
        variant === "secondary" && "border text-[var(--foreground)]",
        variant === "primary" && "button-primary",
        variant === "secondary" && "button-secondary",
        variant === "primary" && "sm:min-w-[11.75rem]",
        variant === "secondary" && "sm:min-w-[10.5rem]",
        className,
      )}
      {...props}
    >
      <span>{props.children}</span>
      {variant === "primary" ? (
        <span aria-hidden="true" className="button-arrow">
          →
        </span>
      ) : null}
    </Link>
  );
}
