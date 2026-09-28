"use client";

import { useRef, useState } from "react";

import { mediaFileRejection } from "@/lib/admin/media-mime";
import type { MediaAsset } from "@/lib/admin/media-catalog";
import { cn } from "@/lib/utils";

type UploadJob = {
  id: string;
  name: string;
  progress: number;
  error?: string;
};

async function postMedia(file: File, onProgress: (value: number) => void) {
  const body = new FormData();
  body.append("file", file);
  body.append("label", file.name.replace(/\.[^.]+$/, ""));
  body.append("alt", file.name.replace(/\.[^.]+$/, ""));
  body.append("usedIn", "Media library");

  return new Promise<MediaAsset>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let parsed: MediaAsset & { message?: string };
      try {
        parsed = JSON.parse(xhr.responseText) as MediaAsset & { message?: string };
      } catch {
        reject(new Error("Risposta upload non valida."));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(parsed);
      else reject(new Error(parsed.message || "Upload non riuscito."));
    };
    xhr.onerror = () => reject(new Error("Rete non disponibile."));
    xhr.send(body);
  });
}

export function AdminMediaDropzone({
  onUploaded,
  multiple = true,
}: {
  onUploaded: (asset: MediaAsset) => void;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  const [jobs, setJobs] = useState<UploadJob[]>([]);

  async function takeFiles(list: FileList | File[]) {
    const files = [...list];
    if (!files.length) return;
    for (const file of files) {
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      const rejection = mediaFileRejection(file);
      if (rejection) {
        setJobs((current) => [
          ...current.filter((job) => job.id !== id),
          { id, name: file.name, progress: 0, error: rejection },
        ]);
        continue;
      }
      setJobs((current) => [
        ...current.filter((job) => job.id !== id),
        { id, name: file.name, progress: 0 },
      ]);
      try {
        const asset = await postMedia(file, (progress) => {
          setJobs((current) => current.map((job) => (job.id === id ? { ...job, progress } : job)));
        });
        onUploaded(asset);
        setJobs((current) => current.map((job) => (job.id === id ? { ...job, progress: 100 } : job)));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload non riuscito.";
        setJobs((current) => current.map((job) => (job.id === id ? { ...job, error: message } : job)));
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div
        className={cn("tv-cc-drop", over && "is-over")}
        onDragEnter={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void takeFiles(event.dataTransfer.files);
        }}
      >
        <p className="text-sm font-semibold">Trascina qui le immagini</p>
        <p className="tv-cc-card__meta">JPEG, PNG, WebP o GIF. Massimo 8 MB. Puoi anche selezionarle.</p>
        <button type="button" className="tv-cc-btn tv-cc-btn--primary" onClick={() => inputRef.current?.click()}>
          Scegli file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void takeFiles(event.target.files);
          }}
        />
      </div>
      {jobs.length ? (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li key={job.id} className="tv-cc-panel">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{job.name}</span>
                <span className="tv-cc-card__meta">{job.error ? "errore" : `${job.progress}%`}</span>
              </div>
              <div className="tv-cc-drop__meter" aria-hidden="true">
                <span style={{ width: `${job.error ? 100 : job.progress}%` }} />
              </div>
              {job.error ? <p className="mt-2 text-sm text-amber-200">{job.error}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
