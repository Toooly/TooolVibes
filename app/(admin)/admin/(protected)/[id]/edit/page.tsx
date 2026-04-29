import Link from "next/link";
import { notFound } from "next/navigation";

import { updateToolFormAction } from "@/app/(admin)/admin/actions";
import { ToolForm } from "@/components/admin/tool-form";
import { SectionHeading } from "@/components/sections/section-heading";
import { getToolFormValues } from "@/lib/admin/tool-form";
import { getAdminToolById, getAdminToolsRuntime } from "@/lib/admin/tool-queries";

type EditToolPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditToolPage({ params }: EditToolPageProps) {
  const { id } = await params;
  const [tool, runtime] = await Promise.all([getAdminToolById(id), getAdminToolsRuntime()]);

  if (!tool) {
    notFound();
  }

  const canWrite = runtime.canWrite;
  const boundAction = updateToolFormAction.bind(null, tool.id);
  const runtimeHighlights = [
    { label: "Admin read", value: runtime.adminReadSource },
    { label: "Public feed", value: runtime.publicSnapshot.source },
    { label: "Write target", value: runtime.writeTarget ?? "locked" },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="brand-panel rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeading
            eyebrow="Modifica tool"
            title={tool.name}
            description="Aggiorna metadati, copy editoriale e stati pubblici con un runtime pi? onesto: se il pannello non ? davvero live, lo dichiara e blocca le mutazioni."
          />
          <Link
            href="/admin"
            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)]"
          >
            Torna alla dashboard
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
          <ToolForm
            action={boundAction}
            initialValues={getToolFormValues(tool)}
            submitLabel="Salva modifiche"
            disabled={!canWrite}
          />
        </div>
      </div>
    </div>
  );
}
