"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  collectionAccessModes,
  collectionAudiences,
  collectionDifficulties,
  collectionEditorialStates,
  collectionFeaturedSlots,
  collectionSurfaces,
  collectionThemes,
  collectionTones,
  getCollectionFormValues,
  initialCollectionFormState,
  type CollectionFormState,
  type CollectionFormToolSlotValues,
  type CollectionFormValues,
} from "@/lib/admin/collection-form";
import {
  getCollectionEditorialStateMeta,
  getCollectionSurfaceMeta,
} from "@/lib/collections/editorial";
import { getCollectionAccessMeta } from "@/lib/collections/helpers";

type CollectionFormAction = (
  state: CollectionFormState,
  formData: FormData,
) => Promise<CollectionFormState>;

type CollectionFormProps = {
  action: CollectionFormAction;
  initialValues?: Partial<CollectionFormValues>;
  submitLabel: string;
  disabled?: boolean;
  availableTools: Array<{
    slug: string;
    name: string;
    category: string;
    is_published?: boolean;
  }>;
};

function SubmitButton({ label, disabled = false }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="button-shell button-primary rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
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

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article
      className="rounded-[22px] border px-4 py-4"
      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </p>
      <p className="mt-3 text-[1.8rem] leading-none">{value}</p>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
        {detail}
      </p>
    </article>
  );
}

function normalizeRenderableSlots(
  slots: CollectionFormToolSlotValues[],
  minimum = 6,
): CollectionFormToolSlotValues[] {
  const safeSlots = [...slots];
  const target = Math.max(minimum, safeSlots.length + 2);

  while (safeSlots.length < target) {
    safeSlots.push({
      tool_slug: "",
      role: "",
      note: "",
      featured: false,
      order: String(safeSlots.length + 1),
    });
  }

  return safeSlots;
}

export function CollectionForm({
  action,
  initialValues,
  submitLabel,
  disabled = false,
  availableTools,
}: CollectionFormProps) {
  const [state, formAction] = useActionState(action, initialCollectionFormState);
  const values = {
    ...getCollectionFormValues(),
    ...initialValues,
    ...state.values,
  };
  const slots = normalizeRenderableSlots(values.included_tools ?? []);
  const toolsBySlug = new Map(availableTools.map((tool) => [tool.slug, tool] as const));
  const filledSlots = slots.filter((slot) => slot.tool_slug.trim().length > 0);
  const anchorCount = filledSlots.filter((slot) => slot.featured).length;
  const publishedFilledSlots = filledSlots.filter(
    (slot) => toolsBySlug.get(slot.tool_slug)?.is_published !== false,
  ).length;
  const draftFilledSlots = Math.max(filledSlots.length - publishedFilledSlots, 0);
  const accessMeta = getCollectionAccessMeta(values.access);
  const surfaceMeta = getCollectionSurfaceMeta(values.surface);
  const editorialStateMeta = getCollectionEditorialStateMeta(values.editorial_state);

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

      <input type="hidden" name="slot_count" value={slots.length} />

      <fieldset disabled={disabled} className="space-y-8 disabled:opacity-60">
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="brand-panel rounded-[28px] p-5">
            <p className="editorial-label">Postura della raccolta</p>
            <h2 className="text-display-card mt-2 text-[1.42rem] sm:text-[1.56rem]">
              Taglio, accesso e densità della selezione nello stesso colpo d&apos;occhio
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
              Questa sintesi ti aiuta a capire subito se la raccolta è leggera, densa, pubblica
              o ancora in costruzione prima di entrare nei dettagli del modulo.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                Accesso: {accessMeta.label}
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                Stato: {editorialStateMeta.label}
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                Formato: {surfaceMeta.label}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Tool selezionati"
                value={String(filledSlots.length)}
                detail={`${availableTools.length} tool disponibili nell'area interna.`}
              />
              <StatCard
                label="Tool guida"
                value={String(anchorCount)}
                detail={
                  anchorCount === 1
                    ? "Un solo tool guida, come previsto."
                    : "Conviene lasciare un solo tool guida."
                }
              />
              <StatCard
                label="Bozze nella sequenza"
                value={String(draftFilledSlots)}
                detail={`${publishedFilledSlots} tool già pubblicati nella selezione corrente.`}
              />
            </div>
          </article>

          <article className="dark-panel rounded-[28px] p-5 text-white">
            <p className="editorial-label !text-white/60">Guida editoriale</p>
            <h2 className="text-display-card mt-2 text-[1.42rem] text-white sm:text-[1.56rem]">
              Una raccolta forte deve restare leggibile anche quando la rivedi più tardi
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Usa la tesi per spiegare la logica della selezione, non per ripetere i campi di base.
              Nei tool inclusi, ogni ruolo dovrebbe raccontare il perché del tool nel percorso.
            </p>
            <div className="mt-4 grid gap-3">
              <div
                className="rounded-[20px] border px-4 py-3 text-sm"
                style={{
                  borderColor: "rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                Ordine editoriale corrente: <strong>{values.editorial_order || "999"}</strong>.
                {values.featured_slot
                  ? ` Spazio in evidenza impostato su ${values.featured_slot}.`
                  : " Nessuno spazio in evidenza attivo."}
              </div>
              <div
                className="rounded-[20px] border px-4 py-3 text-sm"
                style={{
                  borderColor: "rgba(68,220,255,0.18)",
                  background: "rgba(68,220,255,0.12)",
                }}
              >
                Accesso impostato su <strong>{accessMeta.label}</strong>: {accessMeta.description}
              </div>
            </div>
          </article>
        </div>

        <FormSection
          eyebrow="Identità"
          title="Base curatoriale e copertina"
          description="Titolo, slug e copertina devono reggere sia nella pagina raccolta sia nei punti di promozione pubblica. Qui conviene essere netti e riconoscibili."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block">
              <FieldLabel label="Titolo" />
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

            <label className="block lg:col-span-2">
              <FieldLabel label="Descrizione" />
              <textarea
                name="description"
                defaultValue={values.description}
                rows={3}
                className="w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.description} />
            </label>

            <label className="block">
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

            <label className="block">
              <FieldLabel label="Etichetta di copertina" />
              <input
                name="cover_kicker"
                defaultValue={values.cover_kicker}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.cover_kicker} />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Narrazione"
          title="Tesi, punti chiave e teaser premium"
          description="Questo blocco definisce perché la raccolta esiste, quali segnali mette in evidenza e quanto dell'approfondimento premium vuoi lasciare intravedere."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <FieldLabel label="Tesi editoriale" />
              <textarea
                name="rationale"
                defaultValue={values.rationale}
                rows={5}
                className="w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                required
              />
              <FieldError error={state.fieldErrors?.rationale} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Punti chiave" />
              <textarea
                name="highlights"
                defaultValue={values.highlights}
                rows={4}
                placeholder="Un highlight per riga"
                className="w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.highlights} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Premium teaser opzionale" />
              <textarea
                name="premium_teaser"
                defaultValue={values.premium_teaser}
                rows={3}
                className="w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.premium_teaser} />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Postura"
          title="Tema, accesso e stato editoriale"
          description="Qui decidi dove vive la raccolta nel prodotto, per chi è pensata e se è pronta per stare nella parte pubblica o restare in lavorazione."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <label className="block">
              <FieldLabel label="Tema" />
              <select
                name="theme"
                defaultValue={values.theme}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {collectionThemes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.theme} />
            </label>

            <label className="block">
              <FieldLabel label="Audience" />
              <select
                name="audience"
                defaultValue={values.audience}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {collectionAudiences.map((audience) => (
                  <option key={audience} value={audience}>
                    {audience}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.audience} />
            </label>

            <label className="block">
              <FieldLabel label="Difficoltà" />
              <select
                name="difficulty"
                defaultValue={values.difficulty}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {collectionDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.difficulty} />
            </label>

            <label className="block">
              <FieldLabel label="Tono" />
              <select
                name="tone"
                defaultValue={values.tone}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {collectionTones.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.tone} />
            </label>

            <label className="block">
              <FieldLabel label="Accesso" />
              <select
                name="access"
                defaultValue={values.access}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {collectionAccessModes.map((access) => (
                  <option key={access} value={access}>
                    {getCollectionAccessMeta(access).label}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.access} />
            </label>

            <label className="block">
              <FieldLabel label="Formato" />
              <select
                name="surface"
                defaultValue={values.surface}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {collectionSurfaces.map((surface) => (
                  <option key={surface} value={surface}>
                    {getCollectionSurfaceMeta(surface).label}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.surface} />
            </label>

            <label className="block">
              <FieldLabel label="Stato editoriale" />
              <select
                name="editorial_state"
                defaultValue={values.editorial_state}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {collectionEditorialStates.map((editorialState) => (
                  <option key={editorialState} value={editorialState}>
                    {getCollectionEditorialStateMeta(editorialState).label}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.editorial_state} />
            </label>

            <label className="block">
              <FieldLabel label="Spazio in evidenza" />
              <select
                name="featured_slot"
                defaultValue={values.featured_slot}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              >
                {collectionFeaturedSlots.map((slot) => (
                  <option key={slot || "none"} value={slot}>
                    {slot || "nessuno"}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.featured_slot} />
            </label>

            <label className="block">
              <FieldLabel label="Ordine" />
              <input
                name="editorial_order"
                type="number"
                defaultValue={values.editorial_order}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.editorial_order} />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Timing"
          title="Programmazione e date pubbliche"
          description="Non servono sempre tutte, ma quando una raccolta esce o viene archiviata conviene lasciare un ritmo leggibile nell'archivio editoriale."
        >
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <FieldLabel label="Programmato per" />
              <input
                name="scheduled_for"
                type="datetime-local"
                defaultValue={values.scheduled_for}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
              <FieldError error={state.fieldErrors?.scheduled_for} />
            </label>

            <label className="block">
              <FieldLabel label="Prima pubblicazione" />
              <input
                name="first_published_at"
                type="datetime-local"
                defaultValue={values.first_published_at}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
            </label>

            <label className="block">
              <FieldLabel label="Pubblicata il" />
              <input
                name="published_at"
                type="datetime-local"
                defaultValue={values.published_at}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
            </label>

            <label className="block">
              <FieldLabel label="Archiviata il" />
              <input
                name="archived_at"
                type="datetime-local"
                defaultValue={values.archived_at}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
              />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Sequenza tool"
          title="Sequenza, ruolo e tool guida"
          description="Questo è il cuore della raccolta. Ogni spazio deve dire chiaramente perché il tool entra nel percorso, non solo in che categoria vive."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {availableTools.length} tool disponibili
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {filledSlots.length} spazi compilati
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {publishedFilledSlots} pubblicati
              </span>
            </div>
            <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
              Un solo tool guida rende la lettura più chiara anche nelle card e nei teaser.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {slots.map((slot, index) => {
              const selectedTool = slot.tool_slug ? toolsBySlug.get(slot.tool_slug) ?? null : null;

              return (
                <div
                  key={`slot-row-${index}`}
                  className="rounded-[24px] border p-4"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 soft-divider">
                    <div>
                      <p className="editorial-label">Slot {String(index + 1).padStart(2, "0")}</p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--muted-strong)" }}>
                        {selectedTool ? selectedTool.name : "Nessun tool selezionato"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTool ? (
                        <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                          {selectedTool.category}
                        </span>
                      ) : null}
                      {selectedTool ? (
                        <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                          {selectedTool.is_published === false ? "bozza" : "pubblicato"}
                        </span>
                      ) : null}
                      {slot.featured ? (
                        <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                          tool guida
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.95fr_1.05fr_8rem_auto]">
                    <label className="block">
                      <FieldLabel label={`Tool ${String(index + 1).padStart(2, "0")}`} />
                      <select
                        name={`tool_slug_${index}`}
                        defaultValue={slot.tool_slug}
                        className="w-full rounded-2xl border px-4 py-3 outline-none"
                        style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.92)" }}
                      >
                        <option value="">Seleziona un tool</option>
                        {availableTools.map((tool) => (
                          <option key={tool.slug} value={tool.slug}>
                            {tool.name} · {tool.category}
                            {tool.is_published === false ? " · bozza" : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <FieldLabel label="Ruolo" />
                      <input
                        name={`tool_role_${index}`}
                        defaultValue={slot.role}
                        className="w-full rounded-2xl border px-4 py-3 outline-none"
                        style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.92)" }}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel label="Nota" />
                      <input
                        name={`tool_note_${index}`}
                        defaultValue={slot.note}
                        className="w-full rounded-2xl border px-4 py-3 outline-none"
                        style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.92)" }}
                      />
                    </label>

                    <label className="block xl:max-w-[8rem]">
                      <FieldLabel label="Ordine" />
                      <input
                        name={`tool_order_${index}`}
                        type="number"
                        defaultValue={slot.order}
                        className="w-full rounded-2xl border px-4 py-3 outline-none"
                        style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.92)" }}
                      />
                    </label>

                    <label
                      className="flex items-center justify-between rounded-[20px] border px-4 py-3 xl:mt-7"
                      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.92)" }}
                    >
                      <span className="text-sm font-semibold">Tool guida</span>
                      <input
                        name={`tool_featured_${index}`}
                        type="checkbox"
                        defaultChecked={slot.featured}
                        className="h-4 w-4"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          <FieldError error={state.fieldErrors?.included_tools} />
        </FormSection>
      </fieldset>

      <div className="brand-panel flex flex-col gap-4 rounded-[28px] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[42rem] text-sm leading-7" style={{ color: "var(--muted)" }}>
          I salvataggi passano da controlli protetti, separati dalla lettura pubblica.
          Se l’archivio non è davvero attivo, il modulo resta leggibile ma non forza salvataggi ambigui.
        </p>
        <SubmitButton label={submitLabel} disabled={disabled} />
      </div>
    </form>
  );
}
