"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  parseCatalogLevelParam,
  serializeCatalogUrl,
} from "./catalog/catalog-controller";

type DirectoryHeaderSearchProps = {
  autoFocus?: boolean;
  compact?: boolean;
  onSubmitted?: () => void;
};

export function DirectoryHeaderSearch({
  autoFocus = false,
  compact = false,
  onSubmitted,
}: DirectoryHeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [currentSearch, searchParams]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (pathname.startsWith("/archivio")) {
      // Already on the archive: keep the active group/tag/level filters and
      // replace only the query, so the submitted URL stays the canonical
      // catalog state (B31 / IA-504).
      router.push(
        serializeCatalogUrl({
          query: normalizedQuery,
          group: searchParams.get("group"),
          tag: searchParams.get("tag") ?? "",
          level: parseCatalogLevelParam(searchParams.get("level")),
        }),
      );
    } else {
      router.push(serializeCatalogUrl({ query: normalizedQuery }));
    }
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
        Cerca nel catalogo completo
      </label>
      <Search
        aria-hidden="true"
        className="header-search-icon ml-2.5 size-4 shrink-0 text-[var(--muted)] transition group-focus-within/header-search:text-[var(--accent-strong)]"
      />
      <input
        ref={inputRef}
        id={compact ? "header-search-mobile" : "header-search"}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={compact ? "Cerca nel catalogo" : "Cerca tool, tag o categoria"}
        className="min-h-9 w-full min-w-0 bg-transparent px-1 text-sm font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        aria-label="Cerca nel catalogo completo"
        enterKeyHint="search"
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
