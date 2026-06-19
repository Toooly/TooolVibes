"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { toolCategories } from "@/lib/config/tool-taxonomy";
import {
  getToolFormValues,
  initialToolFormState,
  type ToolFormState,
  type ToolFormValues,
} from "@/lib/admin/tool-form";

type ToolFormProps = {
  action: (state: ToolFormState, formData: FormData) => Promise<ToolFormState>;
  initialValues?: Partial<ToolFormValues>;
  sourceRequestId?: string;
  submitLabel: string;
  disabled?: boolean;
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
        <p className="mt-2 max-w-[40rem] text-sm leading-7" style={{ color: "var(--muted)" }}>
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

export function ToolForm({
  action,
  initialValues,
  sourceRequestId,
  submitLabel,
  disabled = false,
}: ToolFormProps) {
  const [state, formAction] = useActionState(action, initialToolFormState);
  const values = {
    ...getToolFormValues(),
    ...initialValues,
    ...state.values,
  };

  return (
    <form action={formAction} className="space-y-8">
      {sourceRequestId ? (
        <input type="hidden" name="source_request_id" value={sourceRequestId} />
      ) : null}

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
          eyebrow="Identità"
          title="Nome, categoria e informazioni essenziali"
          description="Qui definisci nome, slug, categoria e provenienza del tool. Se questi campi sono chiari, il sito pubblico resta più coerente e l'archivio è più semplice da gestire."
        >
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <label className="block xl:col-span-2">
              <FieldLabel label="Nome" />
              <input
                name="name"
                defaultValue={values.name}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.name} />
            </label>

            <label className="block">
              <FieldLabel label="Slug" />
              <input
                name="slug"
                defaultValue={values.slug}
                placeholder="lascia vuoto per generarlo dal nome"
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.slug} />
            </label>

            <label className="block">
              <FieldLabel label="Categoria" />
              <select
                name="category"
                defaultValue={values.category}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {toolCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.category} />
            </label>

            <label className="block">
              <FieldLabel label="Tag" />
              <input
                name="tags"
                defaultValue={values.tags}
                placeholder="ai, automazione, scrittura"
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.tags} />
            </label>

            <label className="block">
              <FieldLabel label="Fonte" />
              <input
                name="source"
                defaultValue={values.source}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.source} />
            </label>

            <label className="block">
              <FieldLabel label="Data scoperta" />
              <input
                name="date_discovered"
                type="date"
                defaultValue={values.date_discovered}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.date_discovered} />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Testi"
          title="Come il tool si presenta nel prodotto"
          description="Questa parte alimenta catalogo, scheda tool e contenuti editoriali. Scrivi testi chiari, già pronti per chi scopre il tool dal sito."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <FieldLabel label="Descrizione breve" />
              <textarea
                name="short_description_it"
                defaultValue={values.short_description_it}
                rows={3}
                className="w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.short_description_it} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Descrizione editoriale" />
              <textarea
                name="description_it"
                defaultValue={values.description_it}
                rows={7}
                className="w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.description_it} />
            </label>

            <label className="block">
              <FieldLabel label="URL del sito" />
              <input
                name="website_url"
                type="url"
                defaultValue={values.website_url}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.website_url} />
            </label>

            <label className="block">
              <FieldLabel label="URL articolo TooolVibes" />
              <input
                name="tooolvibes_post_url"
                type="url"
                defaultValue={values.tooolvibes_post_url}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.tooolvibes_post_url} />
            </label>

            <label className="block">
              <FieldLabel label="URL affiliato (opzionale)" />
              <input
                name="affiliate_url"
                type="url"
                defaultValue={values.affiliate_url ?? undefined}
                placeholder="Se presente, viene usato come link principale nel sito pubblico"
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.affiliate_url} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="URL immagine di copertina" />
              <input
                name="cover_image_url"
                type="url"
                defaultValue={values.cover_image_url}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.cover_image_url} />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Visibilità"
          title="Pubblicazione e posizionamento"
          description="L'ultima decisione è sempre editoriale: quando il tool è pronto, puoi pubblicarlo nel catalogo o promuoverlo nei punti più forti della selezione."
        >
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div
              className="rounded-[24px] border px-4 py-4"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
            >
              <p className="text-sm font-semibold">Nota operativa</p>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted)" }}>
                Il salvataggio avviene in modo protetto e il form mantiene i dati inseriti anche
                se manca un campo o il servizio non risponde.
              </p>
            </div>

            <div className="grid gap-4">
              <ToggleCard
                name="is_featured"
                title="Tool in evidenza"
                description="Mostralo nella selezione settimanale e nei punti più curati del prodotto."
                defaultChecked={values.is_featured}
              />
              <ToggleCard
                name="is_published"
                title="Pubblicato"
                description="Rende il tool visibile nel sito pubblico e nelle aree di scoperta."
                defaultChecked={values.is_published}
              />
            </div>
          </div>
        </FormSection>
      </fieldset>

      <div className="dark-panel rounded-[28px] px-5 py-4.5 text-white sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/58">
              Salvataggio protetto
            </p>
            <p className="mt-2 text-sm leading-7 text-white/72">
              Nessuna chiave sensibile viene esposta. Puoi lavorare qui senza perdere contesto,
              anche quando l’area entra in modalità prudente.
            </p>
          </div>
          <SubmitButton label={submitLabel} disabled={disabled} />
        </div>
      </div>
    </form>
  );
}
