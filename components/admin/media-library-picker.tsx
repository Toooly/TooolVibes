"use client";

import { useMemo, useState } from "react";

import { AdminMediaDropzone } from "@/components/admin/admin-media-dropzone";
import { getMediaCatalog, type MediaAsset } from "@/lib/admin/media-catalog";
import { cn } from "@/lib/utils";

export function MediaLibraryPicker({
  fieldName,
  defaultValue = "",
  onChange,
}: {
  fieldName: string;
  defaultValue?: string;
  onChange?: (src: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  function choose(next: string) {
    setValue(next);
    onChange?.(next);
  }
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [uploaded, setUploaded] = useState<MediaAsset[]>([]);
  const catalog = useMemo(() => {
    const base = [...getMediaCatalog(), ...uploaded].filter((asset) => !asset.archived);
    const unique = new Map(base.map((asset) => [asset.id, asset]));
    return [...unique.values()];
  }, [uploaded]);
  const filtered = catalog.filter((asset) => {
    const hay = `${asset.label} ${asset.usedIn} ${asset.src}`.toLowerCase();
    const matchesQuery = !query || hay.includes(query.toLowerCase());
    const matchesKind = kind === "all" || asset.kind === kind;
    return matchesQuery && matchesKind;
  });
  const selected = catalog.find((asset) => asset.src === value || asset.srcPng === value);

  return (
    <div className="space-y-3">
      <input type="hidden" name={fieldName} value={value} />
      <AdminMediaDropzone
        onUploaded={(asset) => {
          setUploaded((current) => [asset, ...current]);
          choose(asset.src);
        }}
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca asset"
          className="tv-cc-field"
        />
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          className="tv-cc-field"
        >
          <option value="all">Tutti</option>
          <option value="partner">Partner</option>
          <option value="brand">Brand</option>
          <option value="editorial">Editoriale</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="tv-cc-notice">Nessun asset. Carica un’immagine o registra un URL.</p>
      ) : (
        <div className="grid max-h-80 gap-2 overflow-auto sm:grid-cols-2">
          {filtered.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => choose(asset.src)}
              className={cn("tv-cc-panel flex min-h-16 items-center gap-3 text-left", selected?.id === asset.id && "outline outline-1 outline-[var(--tv-border-brand)]")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.src} alt="" className="h-10 w-16 rounded-lg bg-black/30 object-contain" />
              <span>
                <strong className="block text-sm">{asset.label}</strong>
                <em className="tv-cc-card__meta not-italic">{asset.usedIn}</em>
              </span>
            </button>
          ))}
        </div>
      )}
      {selected ? (
        <div className="tv-cc-panel flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.src} alt="" className="h-16 w-24 rounded-lg bg-black/30 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-sm">{selected.label}</p>
            <p className="break-all text-xs tv-cc-card__meta">{selected.src}</p>
          </div>
          <button
            type="button"
            className="tv-cc-btn tv-cc-btn--ghost"
            onClick={() => void navigator.clipboard.writeText(selected.src)}
          >
            Copia URL
          </button>
          <button type="button" className="tv-cc-btn tv-cc-btn--ghost" onClick={() => choose("")}>
            Rimuovi
          </button>
        </div>
      ) : null}
      <label className="block">
        URL avanzato
        <input
          value={value}
          onChange={(event) => choose(event.target.value)}
          className="tv-cc-field"
          placeholder="https:// o /percorso-locale"
        />
      </label>
    </div>
  );
}

export function MediaAssetCard({ asset }: { asset: MediaAsset }) {
  return (
    <article className="tv-cc-panel">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.src} alt={asset.alt} className="mb-3 h-28 w-full rounded-2xl bg-black/30 object-contain" />
      <p className="text-xs font-bold uppercase tracking-[0.14em] tv-cc-card__meta">{asset.kind}</p>
      <h2 className="mt-1 text-lg font-semibold text-white">{asset.label}</h2>
      <p className="tv-cc-panel__desc">{asset.usedIn}</p>
      <p className="mt-3 break-all text-xs tv-cc-card__meta">{asset.src}</p>
      {asset.mimeType ? (
        <p className="mt-1 text-xs tv-cc-card__meta">
          {asset.mimeType}
          {asset.fileSize ? ` · ${Math.round(asset.fileSize / 1024)} KB` : ""}
          {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
        </p>
      ) : null}
    </article>
  );
}
