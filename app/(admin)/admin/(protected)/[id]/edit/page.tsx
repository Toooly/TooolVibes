import Link from "next/link";
import { notFound } from "next/navigation";

import { updateArticleFormAction } from "@/app/(admin)/admin/actions/articles";
import { ArticleForm } from "@/components/admin/article-form";
import { SectionHeader } from "@/components/ui/section-header";
import { getArticleFormValues } from "@/lib/admin/article-form";
import { getAdminArticleById, getAdminArticlesRuntime } from "@/lib/admin/article-queries";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

function getReadSourceLabel(source: string) {
  switch (source) {
    case "supabase":
      return "Archivio principale";
    case "storage":
      return "Archivio alternativo";
    case "mixed":
      return "Archivio misto";
    case "seed":
      return "Articoli da importare";
    case "empty":
      return "Nessun articolo";
    default:
      return source;
  }
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const [article, runtime] = await Promise.all([
    getAdminArticleById(id),
    getAdminArticlesRuntime(),
  ]);

  if (!article) {
    notFound();
  }

  const canWrite = runtime.canWrite;
  const boundAction = updateArticleFormAction.bind(null, article.id);
  const runtimeHighlights = [
    { label: "Lettura", value: getReadSourceLabel(runtime.adminReadSource) },
    { label: "Stato", value: article.status === "published" ? "Pubblicato" : "Bozza" },
    { label: "Salvataggio", value: canWrite ? "Attivo" : "Sola lettura" },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="brand-panel rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader invert
            eyebrow="Modifica articolo"
            title={article.title}
            description="Aggiorna contenuto, media, formattazione e stato editoriale senza uscire dal flusso blog."
          />
          <Link
            href="/admin"
            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[#f4f1ff]"
          >
            Torna a Gestione blog
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {runtimeHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border px-4 py-4"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
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
            style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(243,191,76,0.12)" }}
          >
            {runtime.writeMessage}
          </div>
        ) : null}

        <div className="mt-8">
          <ArticleForm
            action={boundAction}
            initialValues={getArticleFormValues(article)}
            submitLabel="Salva articolo"
            disabled={!canWrite}
          />
        </div>
      </div>
    </div>
  );
}
