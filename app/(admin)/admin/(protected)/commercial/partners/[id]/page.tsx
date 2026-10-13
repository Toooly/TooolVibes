import { LocalizedAttributes } from "@/components/i18n/localized-text";
import { notFound } from "next/navigation";

import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { ManagedPartnerForm } from "@/components/admin/managed-partner-form";
import { getManagedPartner } from "@/lib/sponsors/managed-commercial";

export default async function AdminEditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = getManagedPartner(id);
  if (!partner) notFound();
  return (
    <div className="space-y-5">
      <CommercialSubnav current="/admin/commercial/partners" />
      <LocalizedAttributes><ControlCenterHeader
        kicker="Commercial"
        title={partner.name}
        description="Modifica identità e asset del partner."
        backHref="/admin/commercial/partners"
        backLabel="Torna ai partner"
      /></LocalizedAttributes>
      <ManagedPartnerForm partner={partner} />
    </div>
  );
}
