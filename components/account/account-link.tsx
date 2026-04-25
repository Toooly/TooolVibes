"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { useAccount } from "@/components/account/account-provider";

type AccountLinkProps = {
  className?: string;
  variant?: "default" | "compact";
};

export function AccountLink({ className, variant = "default" }: AccountLinkProps) {
  const account = useAccount();

  const label =
    account.status === "authenticated"
      ? "Account"
      : account.authEnabled
        ? "Accedi"
        : "Locale";
  const compactLabel =
    account.status === "authenticated"
      ? "Account"
      : account.authEnabled
        ? "Accedi"
        : "Locale";
  const visibleLabel = variant === "compact" ? compactLabel : label;

  return (
    <Link
      href="/account"
      className={cn(
        "selection-chip text-ui-strong inline-flex items-center gap-2 rounded-full border font-semibold",
        variant === "default" && "px-3.5 py-2 text-xs",
        variant === "compact" && "px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.15em]",
        className,
      )}
      style={{
        borderColor:
          account.status === "authenticated" ? "rgba(112,82,255,0.22)" : "var(--line)",
        background:
          account.status === "authenticated"
            ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
            : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
        color: account.status === "authenticated" ? "var(--accent-strong)" : "var(--muted-strong)",
        }}
      >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: account.status === "authenticated" ? "var(--accent)" : "var(--gold)",
          boxShadow:
            account.status === "authenticated"
              ? "0 0 0 4px rgba(112,82,255,0.12)"
              : "0 0 0 4px rgba(242,179,71,0.12)",
        }}
      />
      <span className={cn("truncate", variant === "compact" ? "max-w-[6.75rem]" : "max-w-[10rem]")}>
        {visibleLabel}
      </span>
    </Link>
  );
}
