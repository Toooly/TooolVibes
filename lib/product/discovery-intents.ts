function catalogHref({
  group,
  query,
}: {
  group?: string;
  query?: string;
}): string {
  const params = new URLSearchParams();
  if (group && group !== "all") params.set("group", group);
  const trimmed = query?.trim() ?? "";
  if (trimmed) params.set("q", trimmed);
  const serialized = params.toString();
  return serialized ? `/archivio?${serialized}` : "/archivio";
}

export type DiscoveryIntent = {
  id: string;
  label: string;
  shortLabel: string;
  group?: string;
  query?: string;
  href: string;
};

export const DISCOVERY_INTENTS: readonly DiscoveryIntent[] = [
  {
    id: "mvp",
    label: "Creare un MVP",
    shortLabel: "MVP",
    group: "vibe-coding",
    href: catalogHref({ group: "vibe-coding" }),
  },
  {
    id: "site",
    label: "Creare un sito",
    shortLabel: "Sito",
    group: "website-builder",
    href: catalogHref({ group: "website-builder" }),
  },
  {
    id: "automate",
    label: "Automatizzare un workflow",
    shortLabel: "Automazioni",
    group: "automation",
    href: catalogHref({ group: "automation" }),
  },
  {
    id: "video",
    label: "Creare video",
    shortLabel: "Video",
    group: "ai-video",
    href: catalogHref({ group: "ai-video" }),
  },
  {
    id: "image",
    label: "Generare immagini",
    shortLabel: "Immagini",
    group: "ai-image",
    href: catalogHref({ group: "ai-image" }),
  },
  {
    id: "sell",
    label: "Vendere online",
    shortLabel: "Vendite",
    group: "payments",
    href: catalogHref({ group: "payments" }),
  },
];

export function catalogHrefForIntentQuery(query: string): string {
  return catalogHref({ query });
}
