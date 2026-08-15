import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ManagedPartnerForm } from "@/components/admin/managed-partner-form";
import { SectionHeader } from "@/components/ui/section-header";

export default function AdminNewPartnerPage() {
  return (
    <div className="space-y-6">
      <CommercialSubnav current="/admin/commercial/partners" />
      <SectionHeader
        eyebrow="Commercial"
        title="Nuovo partner"
        description="Identità, logo e brand plate si gestiscono qui. Nessuna modifica al codice per pubblicare un partner."
      />
      <ManagedPartnerForm />
    </div>
  );
}
