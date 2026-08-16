import { notFound } from "next/navigation";

import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ManagedPartnerForm } from "@/components/admin/managed-partner-form";
import { SectionHeader } from "@/components/ui/section-header";
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
    <div className="space-y-6">
      <CommercialSubnav current="/admin/commercial/partners" />
      <SectionHeader invert eyebrow="Commercial" title={partner.name} description="Modifica identità e asset del partner." />
      <ManagedPartnerForm partner={partner} />
    </div>
  );
}
