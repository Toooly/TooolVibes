"use client";

import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";

import type { SavedToolCardView } from "./account-panel-model";

export function AccountSavedRail({ tools }: { tools: SavedToolCardView[] }) {
  return (
    <section className="account-section-panel p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="account-label">Salvati</p>
        <Link href="/shortlist" className="account-link">
          Tutti
          <ArrowUpRight size={14} />
        </Link>
      </div>
      {tools.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Nessun tool salvato ancora.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {tools.map((tool) => (
            <li key={tool.slug}>
              <Link href={`/toools/${tool.slug}`} className="account-saved-row">
                <span className="min-w-0">
                  <strong className="block truncate">{tool.name}</strong>
                  <em className="block truncate">
                    {tool.stage === "top" ? "Priorita alta" : tool.category}
                    {tool.note ? ` · ${tool.note}` : ""}
                  </em>
                </span>
                {tool.pinned ? <Star size={16} /> : <ArrowUpRight size={16} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
