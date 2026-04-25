"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
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
  label = "Shortlist",
}: ShortlistLinkProps) {
  const discovery = useDiscoverySnapshot();
  const count = discovery.shortlist.length;
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
      href="/shortlist"
      className={cn(
        "selection-chip text-ui-strong inline-flex items-center gap-2 rounded-full border transition-all duration-200",
        count > 0 && "is-live",
        isFresh && "is-fresh",
        variant === "nav" && "px-4 py-2 text-sm font-medium",
        variant === "button" && "button-shell button-secondary px-4 py-2 text-sm font-semibold",
        variant === "subtle" && "px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em]",
        className,
      )}
      style={{
        borderColor: "var(--line)",
        background:
          active
            ? "linear-gradient(180deg, rgba(247,242,255,0.98), rgba(237,230,255,0.92))"
            : count > 0
            ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
            : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
        color: active || count > 0 ? "var(--accent-strong)" : "var(--muted-strong)",
      }}
    >
      <span>{label}</span>
      <span
        className={cn(
          "count-badge-live inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-2 py-0.5 text-[0.66rem] font-semibold",
          count > 0 && "is-active",
          isFresh && "is-fresh",
        )}
        style={{
          background: "rgba(255,255,255,0.8)",
          color: count > 0 ? "var(--accent-strong)" : "var(--muted)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.58)",
        }}
      >
        {count}
      </span>
    </Link>
  );
}
