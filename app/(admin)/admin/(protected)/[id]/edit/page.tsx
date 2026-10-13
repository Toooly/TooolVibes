import { LocalizedText } from "@/components/i18n/localized-text";
import { notFound } from "next/navigation";

import { updateArticleFormAction } from "@/app/(admin)/admin/actions/articles";
import { ArticleForm } from "@/components/admin/article-form";
import { ControlCenterNotice } from "@/components/admin/control-center-header";
import { getArticleFormValues } from "@/lib/admin/article-form";
import { getAdminArticleById, getAdminArticlesRuntime } from "@/lib/admin/article-queries";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

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

  return (
    <div className="page-shell py-6">
      {!canWrite ? <ControlCenterNotice tone="warn"><LocalizedText>{runtime.writeMessage}</LocalizedText></ControlCenterNotice> : null}
      <ArticleForm
        entityTitle={article.title}
        entityStatus={article.status}
        backHref="/admin/articles"
        action={boundAction}
        initialValues={getArticleFormValues(article)}
        submitLabel="Salva articolo"
        disabled={!canWrite}
      />
    </div>
  );
}
