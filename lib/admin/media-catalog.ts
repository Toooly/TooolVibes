import extraJson from "@/data/media-library.json";

export type MediaAssetKind = "partner" | "brand" | "icon" | "editorial";

export type MediaAsset = {
  id: string;
  kind: MediaAssetKind;
  label: string;
  src: string;
  srcPng?: string;
  alt: string;
  usedIn: string;
  storagePath?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number | null;
  height?: number | null;
  createdAt?: string;
  archived?: boolean;
};

/** First-party approved assets already shipped with the product. */
export const MEDIA_CATALOG: MediaAsset[] = [
  {
    id: "taylora-plate",
    kind: "partner",
    label: "Taylora · brand plate",
    src: "/partners/taylora/taylora-brand-plate.webp",
    srcPng: "/partners/taylora/taylora-brand-plate.png",
    alt: "Taylora",
    usedIn: "Campagna partner Taylora",
  },
  {
    id: "onweb24-plate",
    kind: "partner",
    label: "OnWeb24 · brand plate",
    src: "/partners/onweb24/onweb24-brand-plate.webp",
    srcPng: "/partners/onweb24/onweb24-brand-plate.png",
    alt: "OnWeb24",
    usedIn: "Campagna partner OnWeb24",
  },
  {
    id: "zaplater-plate",
    kind: "partner",
    label: "ZapLater · brand plate",
    src: "/partners/zaplater/zaplater-brand-plate.webp",
    srcPng: "/partners/zaplater/zaplater-brand-plate.png",
    alt: "ZapLater",
    usedIn: "Campagna partner ZapLater",
  },
  {
    id: "brand-mark",
    kind: "brand",
    label: "TooolVibes icon",
    src: "/icon.svg",
    alt: "TooolVibes",
    usedIn: "Identità prodotto",
  },
];

export function getMediaAsset(id: string) {
  return MEDIA_CATALOG.find((asset) => asset.id === id) ?? null;
}


export function getMediaCatalog(): MediaAsset[] {
  const extra = (extraJson as { assets?: MediaAsset[] }).assets ?? [];
  const seen = new Set(MEDIA_CATALOG.map((asset) => asset.id));
  const extras = extra.filter((asset) => asset.id && asset.src && !seen.has(asset.id));
  return [...MEDIA_CATALOG, ...extras];
}
