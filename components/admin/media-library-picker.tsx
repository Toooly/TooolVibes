"use client";

import { useMemo, useState } from "react";

import { getMediaCatalog, type MediaAsset } from "@/lib/admin/media-catalog";

export function MediaLibraryPicker({
  fieldName,
  defaultValue = "",
}: {
  fieldName: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    body.append("label", file.name);
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const payload = (await response.json()) as MediaAsset & { message?: string };
      if (!response.ok) throw new Error(payload.message || "Upload non riuscito.");
      setUploaded((current) => [payload, ...current]);
      setValue(payload.src);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={fieldName} value={value} />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca asset"
          className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-white"
        />
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-white"
        >
          <option value="all">Tutti</option>
          <option value="partner">Partner</option>
          <option value="brand">Brand</option>
          <option value="editorial">Editoriale</option>
        </select>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-4 text-sm font-semibold text-white">
          {busy ? "Caricamento…" : "Carica"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={busy}
            onChange={(event) => void onUpload(event.target.files?.[0])}
          />
        </label>
      </div>
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/10 p-4 text-sm text-white/60">Nessun asset. Carica un’immagine o registra un URL.</p>
      ) : (
        <div className="grid max-h-80 gap-2 overflow-auto sm:grid-cols-2">
          {filtered.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => setValue(asset.src)}
              className="flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-2 text-left"
              style={{
                borderColor: selected?.id === asset.id ? "rgba(57,210,246,0.45)" : "rgba(255,255,255,0.12)",
                background: selected?.id === asset.id ? "rgba(57,210,246,0.1)" : "rgba(255,255,255,0.04)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.src} alt="" className="h-10 w-16 rounded-lg bg-black/30 object-contain" />
              <span>
                <strong className="block text-sm text-white">{asset.label}</strong>
                <em className="text-xs not-italic text-white/50">{asset.usedIn}</em>
              </span>
            </button>
          ))}
        </div>
      )}
      {selected ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.src} alt="" className="h-16 w-24 rounded-lg bg-black/30 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">{selected.label}</p>
            <p className="break-all text-xs text-white/45">{selected.src}</p>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-full border border-white/15 px-3 text-sm text-white"
            onClick={() => void navigator.clipboard.writeText(selected.src)}
          >
            Copia URL
          </button>
          <button type="button" className="min-h-11 rounded-full border border-white/15 px-3 text-sm text-white" onClick={() => setValue("")}>
            Rimuovi
          </button>
        </div>
      ) : null}
      <label className="block text-sm text-white/70">
        URL avanzato
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white"
          placeholder="https:// o /percorso-locale"
        />
      </label>
    </div>
  );
}

export function MediaAssetCard({ asset }: { asset: MediaAsset }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.src} alt={asset.alt} className="mb-3 h-28 w-full rounded-2xl bg-black/30 object-contain" />
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">{asset.kind}</p>
      <h2 className="mt-1 text-lg font-semibold text-white">{asset.label}</h2>
      <p className="mt-1 text-sm text-white/60">{asset.usedIn}</p>
      <p className="mt-3 break-all text-xs text-white/45">{asset.src}</p>
      {asset.mimeType ? (
        <p className="mt-1 text-xs text-white/40">
          {asset.mimeType}
          {asset.fileSize ? ` · ${Math.round(asset.fileSize / 1024)} KB` : ""}
          {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
        </p>
      ) : null}
    </article>
  );
}
