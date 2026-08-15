export type ControlMapRow = {
  control: string;
  dataSource: string;
  saveAction: string;
  consumer: string;
  preview: string;
  status: "live" | "read-only" | "removed";
};

export const CONTROL_CENTER_MAP: ControlMapRow[] = [
  {
    control: "Tool record",
    dataSource: "Supabase tools / admin tool form",
    saveAction: "tool form server action",
    consumer: "/archivio, /toools/[slug], Home catalog",
    preview: "/admin/tools/[id]/edit",
    status: "live",
  },
  {
    control: "Tool cover",
    dataSource: "tool.cover_image_url + media catalog",
    saveAction: "tool form + MediaLibraryPicker",
    consumer: "scheda tool / catalog card",
    preview: "tool editor",
    status: "live",
  },
  {
    control: "Guide record",
    dataSource: "Supabase articles / article form",
    saveAction: "article form server action",
    consumer: "/posts/[slug], /guide",
    preview: "/admin/articles/[id]/edit",
    status: "live",
  },
  {
    control: "Guide cover",
    dataSource: "article.cover_image_url + media catalog",
    saveAction: "article form + MediaLibraryPicker",
    consumer: "guide hero",
    preview: "guide editor",
    status: "live",
  },
  {
    control: "Collection record",
    dataSource: "Supabase collections / collection form",
    saveAction: "collection form server action",
    consumer: "/collections/[slug]",
    preview: "/admin/collections/[id]",
    status: "live",
  },
  {
    control: "Collection cover",
    dataSource: "collection.cover_image_url + media catalog",
    saveAction: "collection form + MediaLibraryPicker",
    consumer: "collection hero",
    preview: "collection editor",
    status: "live",
  },
  {
    control: "Homepage announcement",
    dataSource: "data/homepage-controls.json",
    saveAction: "saveHomepageControlsAction",
    consumer: "DefinitiveHome announcement",
    preview: "/admin/composer",
    status: "live",
  },
  {
    control: "Homepage featured tool",
    dataSource: "data/homepage-controls.json",
    saveAction: "saveHomepageControlsAction",
    consumer: "DefinitiveHome weeklyTool / IvoryEditorial",
    preview: "/admin/composer",
    status: "live",
  },
  {
    control: "Homepage featured guide",
    dataSource: "removed",
    saveAction: "none",
    consumer: "none — Home has no guide slot",
    preview: "none",
    status: "removed",
  },
  {
    control: "Homepage featured collection",
    dataSource: "removed",
    saveAction: "none",
    consumer: "none — Home has no collection slot",
    preview: "none",
    status: "removed",
  },
  {
    control: "Media library",
    dataSource: "editorial-media bucket + public/media/library + data/media-library.json",
    saveAction: "POST /api/admin/media",
    consumer: "all editor pickers + homepage announcement + partner/campaign creative",
    preview: "/admin/media",
    status: "live",
  },
  {
    control: "Partners",
    dataSource: "data/managed-partners.json + registry",
    saveAction: "saveManagedPartnerAction",
    consumer: "getJsonManagedCampaigns → resolver / Partner Aurora",
    preview: "/admin/commercial/partners",
    status: "live",
  },
  {
    control: "Campaign operational fields",
    dataSource: "data/commercial-overrides.json campaigns",
    saveAction: "saveCampaignOverrideAction",
    consumer: "getManagedCampaigns → resolver",
    preview: "/admin/commercial/campaigns + /preview",
    status: "live",
  },
  {
    control: "Placements AUTO/PIN/OFF",
    dataSource: "data/commercial-overrides.json placements",
    saveAction: "savePlacementOverrideAction",
    consumer: "resolvePartnerCampaign",
    preview: "/admin/commercial/placements + /preview",
    status: "live",
  },
  {
    control: "Affiliate links",
    dataSource: "Supabase affiliate_links",
    saveAction: "affiliate link form",
    consumer: "tool CTA / disclosure",
    preview: "/admin/affiliate-links",
    status: "live",
  },
];

export function liveControlsWithoutConsumer() {
  return CONTROL_CENTER_MAP.filter((row) => row.status === "live" && row.consumer.startsWith("none"));
}
