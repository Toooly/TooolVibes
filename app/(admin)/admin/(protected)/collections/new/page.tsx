import { LocalizedText } from "@/components/i18n/localized-text";
import { createCollectionFormAction } from "@/app/(admin)/admin/actions/collections";
import { CollectionForm } from "@/components/admin/collection-form";
import { ControlCenterNotice } from "@/components/admin/control-center-header";
import { getAdminTools } from "@/lib/admin/tool-queries";
import { getAdminCollectionsRuntime } from "@/lib/admin/collection-queries";

export default async function NewCollectionPage() {
  const [runtime, tools] = await Promise.all([
    getAdminCollectionsRuntime(),
    getAdminTools(),
  ]);

  return (
    <div className="page-shell py-6">
      {!runtime.canWrite ? (
        <ControlCenterNotice tone="warn"><LocalizedText>{"Il salvataggio delle raccolte non è attivo. Il modulo resta visibile in sola lettura. "}</LocalizedText></ControlCenterNotice>
      ) : null}
      <CollectionForm
        action={createCollectionFormAction}
        submitLabel="Crea raccolta"
        disabled={!runtime.canWrite}
        backHref="/admin/collections"
        entityTitle="Nuova raccolta"
        availableTools={tools.map((tool) => ({
          slug: tool.slug,
          name: tool.name,
          category: tool.category,
          is_published: tool.is_published,
        }))}
      />
    </div>
  );
}
