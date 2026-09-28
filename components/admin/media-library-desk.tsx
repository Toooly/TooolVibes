"use client";

import { useState } from "react";

import { AdminMediaDropzone } from "@/components/admin/admin-media-dropzone";
import { MediaAssetCard } from "@/components/admin/media-library-picker";
import type { MediaAsset } from "@/lib/admin/media-catalog";

export function MediaLibraryDesk({
  initialAssets,
  usage,
}: {
  initialAssets: MediaAsset[];
  usage: Record<string, string[]>;
}) {
  const [assets, setAssets] = useState(initialAssets.filter((asset) => !asset.archived));
  const [notice, setNotice] = useState<string | null>(null);

  async function archive(id: string) {
    setNotice(null);
    const response = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setNotice(payload.message || "Archivio non riuscito.");
      return;
    }
    setAssets((current) => current.filter((asset) => asset.id !== id));
  }

  return (
    <div className="space-y-5">
      <section className="tv-cc-panel">
        <p className="tv-cc-panel__desc">
          Trascina i file. Vengono salvati nel bucket editorial-media, con copia locale se lo storage non risponde.
        </p>
        <div className="mt-3">
          <AdminMediaDropzone
            onUploaded={(asset) => setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)])}
          />
        </div>
      </section>
      {notice ? <p className="tv-cc-notice">{notice}</p> : null}
      {assets.length === 0 ? (
        <p className="tv-cc-notice">Nessun asset in catalogo.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.id}>
              <MediaAssetCard asset={asset} />
              <p className="tv-cc-card__meta mt-2">
                Usato in: {(usage[asset.src] ?? []).join(", ") || "nessun riferimento Control Center"}
              </p>
              {asset.id.startsWith("upload-") ? (
                <button type="button" className="tv-cc-btn tv-cc-btn--danger mt-2" onClick={() => void archive(asset.id)}>
                  Archivia
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
