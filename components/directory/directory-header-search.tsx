"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";

type DirectoryHeaderSearchProps = {
  compact?: boolean;
  onSubmitted?: () => void;
};

export function DirectoryHeaderSearch({
  compact = false,
  onSubmitted,
}: DirectoryHeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const normalizedQuery = query.trim();

    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    }

    router.push(
      normalizedQuery
        ? `/archivio?${params.toString()}`
        : pathname.startsWith("/archivio")
          ? "/archivio"
          : "/archivio",
    );
    onSubmitted?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "group/header-search flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.66)] transition duration-200 focus-within:-translate-y-0.5 focus-within:border-[rgba(106,60,255,0.32)] focus-within:bg-white/90 focus-within:shadow-[0_0_0_5px_rgba(106,60,255,0.12),0_14px_34px_rgba(47,33,126,0.1),inset_0_1px_0_rgba(255,255,255,0.82)]",
        compact && "w-full",
      )}
      role="search"
    >
      <label className="sr-only" htmlFor={compact ? "header-search-mobile" : "header-search"}>
        Cerca nel catalogo
      </label>
      <Search
        aria-hidden="true"
        className="header-search-icon ml-2.5 size-4 shrink-0 text-[var(--muted)] transition group-focus-within/header-search:text-[var(--accent-strong)]"
      />
      <input
        id={compact ? "header-search-mobile" : "header-search"}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cerca tool, tag o categoria"
        className="min-h-9 w-full min-w-0 bg-transparent px-1 text-sm font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        aria-label="Cerca nel catalogo"
      />
      <button
        type="submit"
        className={cn(
          "premium-button premium-button-primary inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-white",
          compact && "px-3",
        )}
      >
        <span className={compact ? "sr-only sm:not-sr-only" : undefined}>Cerca</span>
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </button>
    </form>
  );
}
