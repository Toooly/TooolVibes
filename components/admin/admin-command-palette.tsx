"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { navigateSite } from "@/lib/shell/document-navigation";

type Hit = { id: string; label: string; href: string };
type Groups = Record<string, Hit[]>;

export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<Groups>({});
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((payload) => {
          setGroups(payload as Groups);
          setActiveIndex(0);
        })
        .catch(() => undefined);
    }, 120);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const flat = Object.entries(groups).flatMap(([group, hits]) => hits.map((hit) => ({ ...hit, group })));
  const active = flat[activeIndex] ?? null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter" && active) {
        event.preventDefault();
        setOpen(false);
        navigateSite(active.href, router);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, active, flat.length, router]);

  if (!open) {
    return (
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-3 text-sm text-white/70"
        onClick={() => setOpen(true)}
      >
        Cerca
      </button>
    );
  }



  return (
    <div className="fixed inset-0 z-[80] bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Cerca nel Control Center">
      <div className="mx-auto mt-[12vh] max-w-xl rounded-3xl border border-white/10 bg-[#120d2e] p-4 shadow-2xl">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca tool, guide, raccolte, partner, campagne"
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white"
        />
        <div className="mt-4 max-h-80 space-y-3 overflow-auto">
          {Object.entries(groups).map(([group, hits]) =>
            hits.length ? (
              <div key={group}>
                <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">{group}</p>
                <ul>
                  {hits.map((hit) => (
                    <li key={`${group}-${hit.id}`}>
                      <button
                        type="button"
                        className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-white ${active?.id === hit.id && active?.href === hit.href ? "bg-white/12" : "hover:bg-white/8"}`}
                        onClick={() => {
                          setOpen(false);
                          navigateSite(hit.href, router);
                        }}
                      >
                        {hit.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
