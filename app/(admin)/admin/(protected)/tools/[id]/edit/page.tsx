import { LocalizedText } from "@/components/i18n/localized-text";
import { notFound } from "next/navigation";

import { updateToolFormAction } from "@/app/(admin)/admin/actions/tools";
import { ControlCenterNotice } from "@/components/admin/control-center-header";
import { ToolForm } from "@/components/admin/tool-form";
import { getToolFormValues } from "@/lib/admin/tool-form";
import { getAdminToolById, getAdminToolsRuntime } from "@/lib/admin/tool-queries";

type EditToolPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditToolPage({ params }: EditToolPageProps) {
  const { id } = await params;
  const [tool, runtime] = await Promise.all([
    getAdminToolById(id),
    getAdminToolsRuntime(),
  ]);

  if (!tool) {
    notFound();
  }

  const canWrite = runtime.canWrite;
  const boundAction = updateToolFormAction.bind(null, tool.id);

  return (
    <div className="page-shell py-6">
      {!canWrite ? <ControlCenterNotice tone="warn"><LocalizedText>{runtime.writeMessage}</LocalizedText></ControlCenterNotice> : null}
      <ToolForm
        entityTitle={tool.name}
        entityStatus={tool.is_published ? "Pubblicato" : "Bozza"}
        updatedAt={tool.updated_at}
        backHref="/admin/tools"
        action={boundAction}
        initialValues={getToolFormValues(tool)}
        submitLabel="Salva tool"
        disabled={!canWrite}
      />
    </div>
  );
}
