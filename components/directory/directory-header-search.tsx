"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
    <form onSubmit={handleSubmit} className="flex items-center gap-2" role="search">
      <label className="sr-only" htmlFor={compact ? "header-search-mobile" : "header-search"}>
        Cerca nei Toools
      </label>
      <input
        id={compact ? "header-search-mobile" : "header-search"}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cerca tool, tag o categoria"
        className="w-full rounded-full border border-[rgba(92,72,170,0.14)] bg-white/86 px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors duration-200 placeholder:text-[var(--muted)] focus:border-[rgba(108,76,255,0.3)]"
        aria-label="Cerca nei Toools"
      />
      <button
        type="submit"
        className="rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(95,66,255,0.16)] transition-transform duration-200 hover:-translate-y-0.5"
      >
        Cerca
      </button>
    </form>
  );
}
