"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { ArticleMarkdownEditor } from "@/components/admin/article-markdown-editor";
import {
  articleKinds,
  articleStatuses,
  getArticleFormValues,
  initialArticleFormState,
  type ArticleFormState,
  type ArticleFormValues,
} from "@/lib/admin/article-form";

type ArticleFormProps = {
  action: (state: ArticleFormState, formData: FormData) => Promise<ArticleFormState>;
  initialValues?: Partial<ArticleFormValues>;
  submitLabel: string;
  disabled?: boolean;
};

const kindLabels: Record<(typeof articleKinds)[number], string> = {
  editorial: "Blog",
  guide: "Guida",
  "tool-writeup": "Scheda tool",
};

const statusLabels: Record<(typeof articleStatuses)[number], string> = {
  draft: "Bozza",
  published: "Pubblicato",
};

function SubmitButton({ label, disabled = false }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      style={{ background: "linear-gradient(135deg, var(--accent-strong), var(--accent))" }}
    >
      {pending ? "Salvataggio..." : label}
    </button>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-700">{error}</p>;
}

function FieldLabel({ label }: { label: string }) {
  return <span className="mb-2 block text-sm font-semibold">{label}</span>;
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[28px] border p-5 sm:p-6"
      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.72)" }}
    >
      <div className="border-b pb-4 soft-divider">
        <p className="editorial-label">{eyebrow}</p>
        <h2 className="text-display-card mt-2 text-[1.32rem] sm:text-[1.46rem]">{title}</h2>
        <p className="mt-2 max-w-[44rem] text-sm leading-7" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ToggleCard({
  name,
  title,
  description,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      className="flex items-center justify-between gap-4 rounded-[24px] border px-4 py-4"
      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
    >
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      </div>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-5 w-5" />
    </label>
  );
}

export function ArticleForm({
  action,
  initialValues,
  submitLabel,
  disabled = false,
}: ArticleFormProps) {
  const [state, formAction] = useActionState(action, initialArticleFormState);
  const values = {
    ...getArticleFormValues(),
    ...initialValues,
    ...state.values,
  };

  return (
    <form action={formAction} className="space-y-8">
      {state.status === "error" && state.message ? (
        <div
          className="rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(185,28,28,0.25)", background: "rgba(254,242,242,0.95)" }}
        >
          {state.message}
        </div>
      ) : null}

      <fieldset disabled={disabled} className="space-y-6 disabled:opacity-60">
        <FormSection
          eyebrow="Gestione blog"
          title="Titolo, slug e promessa editoriale"
          description="Questi campi alimentano lista blog, SEO, anteprime e pagina pubblica."
        >
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <label className="block xl:col-span-2">
              <FieldLabel label="Titolo articolo" />
              <input
                name="title"
                defaultValue={values.title}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.title} />
            </label>

            <label className="block">
              <FieldLabel label="Slug" />
              <input
                name="slug"
                defaultValue={values.slug}
                placeholder="lascia vuoto per generarlo dal titolo"
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.slug} />
            </label>

            <label className="block lg:col-span-2 xl:col-span-3">
              <FieldLabel label="Sottotitolo" />
              <textarea
                name="dek"
                defaultValue={values.dek}
                rows={3}
                className="w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.dek} />
            </label>

            <label className="block lg:col-span-2 xl:col-span-3">
              <FieldLabel label="Riassunto SEO / card" />
              <textarea
                name="summary"
                defaultValue={values.summary}
                rows={3}
                className="w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.summary} />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Editor"
          title="Corpo articolo in Markdown con media"
          description="Qui puoi scrivere il testo lungo, caricare foto, gif e video, usare tabelle, callout, HTML controllato, dimensioni e allineamenti."
        >
          <ArticleMarkdownEditor
            name="content_markdown"
            initialValue={values.content_markdown}
            disabled={disabled}
            error={state.fieldErrors?.content_markdown}
          />
        </FormSection>

        <FormSection
          eyebrow="Media e informazioni"
          title="Copertina, autore, tag e stato"
          description="L'immagine di copertina resta separata dal corpo articolo; i media interni vengono invece inseriti direttamente nel testo."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <FieldLabel label="URL immagine di copertina" />
              <input
                name="cover_image_url"
                type="url"
                defaultValue={values.cover_image_url}
                placeholder="https://..."
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.cover_image_url} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Testo alternativo immagine" />
              <input
                name="cover_image_alt"
                defaultValue={values.cover_image_alt}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.cover_image_alt} />
            </label>

            <label className="block">
              <FieldLabel label="Autore" />
              <input
                name="author_name"
                defaultValue={values.author_name}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.author_name} />
            </label>

            <label className="block">
              <FieldLabel label="Tag" />
              <input
                name="tags"
                defaultValue={values.tags}
                placeholder="ai, seo, automazione"
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.tags} />
            </label>

            <label className="block">
              <FieldLabel label="Tipologia" />
              <select
                name="kind"
                defaultValue={values.kind}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {articleKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kindLabels[kind]}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.kind} />
            </label>

            <label className="block">
              <FieldLabel label="Stato" />
              <select
                name="status"
                defaultValue={values.status}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {articleStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.status} />
            </label>

            <label className="block">
              <FieldLabel label="Data pubblicazione" />
              <input
                name="published_at"
                type="date"
                defaultValue={values.published_at}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.published_at} />
            </label>

            <ToggleCard
              name="is_featured"
              title="In primo piano"
              description="Porta l'articolo nei blocchi in evidenza del blog pubblico."
              defaultChecked={values.is_featured}
            />
          </div>
        </FormSection>
      </fieldset>

      <div className="dark-panel rounded-[28px] px-5 py-4.5 text-white sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/58">
              Salvataggio articolo
            </p>
            <p className="mt-2 text-sm leading-7 text-white/72">
              Testo, media interni e stato vengono salvati in modo protetto; l&apos;articolo resta
              modificabile come bozza.
            </p>
          </div>
          <SubmitButton label={submitLabel} disabled={disabled} />
        </div>
      </div>
    </form>
  );
}
