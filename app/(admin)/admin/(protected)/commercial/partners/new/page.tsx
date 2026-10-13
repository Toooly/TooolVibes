import { LocalizedAttributes } from "@/components/i18n/localized-text";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { ManagedPartnerForm } from "@/components/admin/managed-partner-form";

export default function AdminNewPartnerPage() {
  return (
    <div className="space-y-5">
      <CommercialSubnav current="/admin/commercial/partners" />
      <LocalizedAttributes><ControlCenterHeader
        kicker="Commercial"
        title="Nuovo partner"
        description="Identità, logo e brand plate."
        backHref="/admin/commercial/partners"
        backLabel="Torna ai partner"
      /></LocalizedAttributes>
      <ManagedPartnerForm />
    </div>
  );
}
