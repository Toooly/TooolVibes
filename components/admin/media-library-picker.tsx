"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
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
        <LocalizedAttributes><input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca asset"
          className="tv-cc-field"
        /></LocalizedAttributes>
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          className="tv-cc-field"
        >
          <option value="all"><LocalizedText>{"Tutti"}</LocalizedText></option>
          <option value="partner"><LocalizedText>{"Partner"}</LocalizedText></option>
          <option value="brand"><LocalizedText>{"Brand"}</LocalizedText></option>
          <option value="editorial"><LocalizedText>{"Editoriale"}</LocalizedText></option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="tv-cc-notice"><LocalizedText>{"Nessun asset. Carica un’immagine o registra un URL."}</LocalizedText></p>
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
              <LocalizedAttributes><img src={asset.src} alt="" className="h-10 w-16 rounded-lg bg-black/30 object-contain" /></LocalizedAttributes>
              <span>
                <strong className="block text-sm"><LocalizedText>{asset.label}</LocalizedText></strong>
                <em className="tv-cc-card__meta not-italic"><LocalizedText>{asset.usedIn}</LocalizedText></em>
              </span>
            </button>
          ))}
        </div>
      )}
      {selected ? (
        <div className="tv-cc-panel flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <LocalizedAttributes><img src={selected.src} alt="" className="h-16 w-24 rounded-lg bg-black/30 object-contain" /></LocalizedAttributes>
          <div className="min-w-0 flex-1">
            <p className="text-sm"><LocalizedText>{selected.label}</LocalizedText></p>
            <p className="break-all text-xs tv-cc-card__meta"><LocalizedText>{selected.src}</LocalizedText></p>
          </div>
          <button
            type="button"
            className="tv-cc-btn tv-cc-btn--ghost"
            onClick={() => void navigator.clipboard.writeText(selected.src)}
          ><LocalizedText>{"Copia URL "}</LocalizedText></button>
          <button type="button" className="tv-cc-btn tv-cc-btn--ghost" onClick={() => choose("")}><LocalizedText>{"Rimuovi "}</LocalizedText></button>
        </div>
      ) : null}
      <label className="block"><LocalizedText>{"URL avanzato "}</LocalizedText><LocalizedAttributes><input
          value={value}
          onChange={(event) => choose(event.target.value)}
          className="tv-cc-field"
          placeholder="https:// o /percorso-locale"
        /></LocalizedAttributes>
      </label>
    </div>
  );
}

export function MediaAssetCard({ asset }: { asset: MediaAsset }) {
  return (
    <article className="tv-cc-panel">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <LocalizedAttributes><img src={asset.src} alt={asset.alt} className="mb-3 h-28 w-full rounded-2xl bg-black/30 object-contain" /></LocalizedAttributes>
      <p className="text-xs font-bold uppercase tracking-[0.14em] tv-cc-card__meta"><LocalizedText>{asset.kind}</LocalizedText></p>
      <h2 className="mt-1 text-lg font-semibold text-white"><LocalizedText>{asset.label}</LocalizedText></h2>
      <p className="tv-cc-panel__desc"><LocalizedText>{asset.usedIn}</LocalizedText></p>
      <p className="mt-3 break-all text-xs tv-cc-card__meta"><LocalizedText>{asset.src}</LocalizedText></p>
      {asset.mimeType ? (
        <p className="mt-1 text-xs tv-cc-card__meta">
          <LocalizedText>{asset.mimeType}</LocalizedText>
          <LocalizedText>{asset.fileSize ? ` · ${Math.round(asset.fileSize / 1024)} KB` : ""}</LocalizedText>
          <LocalizedText>{asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}</LocalizedText>
        </p>
      ) : null}
    </article>
  );
}
