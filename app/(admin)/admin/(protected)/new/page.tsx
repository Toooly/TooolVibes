import Link from "next/link";

import { createArticleFormAction } from "@/app/(admin)/admin/actions/articles";
import { ArticleForm } from "@/components/admin/article-form";
import { SectionHeading } from "@/components/sections/section-heading";
import { getAdminArticlesRuntime } from "@/lib/admin/article-queries";

export default async function NewArticlePage() {
  const runtime = await getAdminArticlesRuntime();
  const canWrite = runtime.canWrite;
  const runtimeHighlights = [
    { label: "Admin read", value: runtime.adminReadSource },
    { label: "Articoli", value: String(runtime.articles.length) },
    { label: "Write target", value: runtime.writeTarget ?? "locked" },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="brand-panel rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeading
            eyebrow="Nuovo articolo"
            title="Crea una nuova bozza blog"
            description="Scrivi in Markdown, inserisci media nel corpo articolo e decidi se salvarlo come bozza o pubblicarlo subito."
          />
          <Link
            href="/admin"
            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)]"
          >
            Torna a Gestione blog
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {runtimeHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border px-4 py-4"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)" }}
            >
              <p className="editorial-label">{item.label}</p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {!canWrite ? (
          <div
            className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(255,251,235,0.96)" }}
          >
            {runtime.writeMessage}
          </div>
        ) : null}

        <div className="mt-8">
          <ArticleForm
            action={createArticleFormAction}
            submitLabel="Crea articolo"
            disabled={!canWrite}
          />
        </div>
      </div>
    </div>
  );
}
