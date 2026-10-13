"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/ui/app-link";

import { useAccount } from "@/components/account/account-provider";
import { salvatiHref } from "@/components/account/workspace/workspace-model";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { cn } from "@/lib/utils";

type ShortlistLinkProps = {
  className?: string;
  variant?: "nav" | "button" | "subtle";
  active?: boolean;
  label?: string;
};

export function ShortlistLink({
  className,
  variant = "nav",
  active = false,
  label = "Salvati",
}: ShortlistLinkProps) {
  const account = useAccount();
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const count = savedSlugs.length;
  const [isFresh, setIsFresh] = useState(false);
  const previousCountRef = useRef(0);
  const mountedRef = useRef(false);
  const freshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (mountedRef.current && count !== previousCountRef.current) {
      setIsFresh(true);

      if (freshTimerRef.current) {
        window.clearTimeout(freshTimerRef.current);
      }

      freshTimerRef.current = window.setTimeout(() => setIsFresh(false), 520);
    }

    previousCountRef.current = count;
    mountedRef.current = true;

    return () => {
      if (freshTimerRef.current) {
        window.clearTimeout(freshTimerRef.current);
      }
    };
  }, [count]);

  return (
    <Link
      href={salvatiHref(account.status === "authenticated")}
      className={cn(
        "selection-chip text-ui-strong inline-flex items-center gap-2 rounded-full border transition-all duration-200",
        count > 0 && "is-live",
        isFresh && "is-fresh",
        variant === "nav" && "px-4 py-2 text-sm font-medium",
        variant === "button" && "button-shell button-secondary px-4 py-2 text-sm font-semibold",
        variant === "subtle" && "px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]",
        className,
      )}
      style={{
        borderColor: "var(--line)",
        background:
          active
            ? "var(--tv-surface-selected)"
            : count > 0
            ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
            : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
        color: active || count > 0 ? "var(--accent-strong)" : "var(--muted-strong)",
      }}
    >
      <span><LocalizedText>{label}</LocalizedText></span>
      <span
        className={cn(
          "count-badge-live inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
          count > 0 && "is-active",
          isFresh && "is-fresh",
        )}
        style={{
          background: "var(--tv-surface-elevated)",
          color: count > 0 ? "var(--accent-strong)" : "var(--muted)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.58)",
        }}
      >
        {count}
      </span>
    </Link>
  );
}
