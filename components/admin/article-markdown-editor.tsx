"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Type,
  Upload,
  Video,
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { useRef, useState } from "react";

import { MarkdownContent } from "@/components/editorial/markdown-content";

type ArticleMarkdownEditorProps = {
  name: string;
  initialValue: string;
  disabled?: boolean;
  error?: string;
};

type MediaKind = "image" | "video";

const sampleText = "Testo";

function ToolbarButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-grid h-9 w-9 place-items-center rounded-xl border  transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
    >
      {children}
    </button>
  );
}

export function ArticleMarkdownEditor({
  name,
  initialValue,
  disabled = false,
  error,
}: ArticleMarkdownEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState<MediaKind | null>(null);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  function focusTextarea() {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function replaceSelection(formatter: (selected: string) => string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      setValue((current) => `${current}\n${formatter(sampleText)}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || sampleText;
    const nextText = formatter(selected);
    const next = `${value.slice(0, start)}${nextText}${value.slice(end)}`;

    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + nextText.length);
    });
  }

  function insertBlock(block: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      setValue((current) => `${current}${current.endsWith("\n") ? "" : "\n"}${block}`);
      return;
    }

    const start = textarea.selectionStart;
    const prefix = value.slice(0, start);
    const suffix = value.slice(textarea.selectionEnd);
    const spacerBefore = prefix && !prefix.endsWith("\n") ? "\n" : "";
    const spacerAfter = suffix && !block.endsWith("\n") ? "\n" : "";
    const nextText = `${spacerBefore}${block}${spacerAfter}`;
    const next = `${prefix}${nextText}${suffix}`;

    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + nextText.length, start + nextText.length);
    });
  }

  async function uploadMedia(file: File, kind: MediaKind) {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(kind);

    try {
      const response = await fetch("/api/admin/article-media", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; message?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.message ?? "Upload non riuscito.");
      }

      if (kind === "image") {
        insertBlock(`![${file.name.replace(/\.[^.]+$/, "")}](${payload.url})\n`);
      } else {
        insertBlock(`<video controls src="${payload.url}" title="${file.name}"></video>\n`);
      }
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload non riuscito.";
      window.alert(message);
    } finally {
      setUploading(null);
      if (kind === "image" && imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      if (kind === "video" && videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      focusTextarea();
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>, kind: MediaKind) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadMedia(file, kind);
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-3 soft-divider">
        <div className="flex flex-wrap items-center gap-1.5">
          <ToolbarButton title="Titolo grande" disabled={disabled} onClick={() => replaceSelection((text) => `# ${text}`)}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Titolo sezione" disabled={disabled} onClick={() => replaceSelection((text) => `## ${text}`)}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Grassetto" disabled={disabled} onClick={() => replaceSelection((text) => `**${text}**`)}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Corsivo" disabled={disabled} onClick={() => replaceSelection((text) => `*${text}*`)}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Citazione" disabled={disabled} onClick={() => replaceSelection((text) => `> ${text}`)}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Codice" disabled={disabled} onClick={() => replaceSelection((text) => `\`${text}\``)}>
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Lista" disabled={disabled} onClick={() => insertBlock("- Punto uno\n- Punto due\n")}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Lista numerata" disabled={disabled} onClick={() => insertBlock("1. Punto uno\n2. Punto due\n")}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Link"
            disabled={disabled}
            onClick={() => {
              const href = window.prompt("URL");
              if (href) replaceSelection((text) => `[${text}](${href})`);
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Allinea sinistra" disabled={disabled} onClick={() => replaceSelection((text) => `<p style="text-align:left">${text}</p>`)}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Allinea centro" disabled={disabled} onClick={() => replaceSelection((text) => `<p style="text-align:center">${text}</p>`)}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Allinea destra" disabled={disabled} onClick={() => replaceSelection((text) => `<p style="text-align:right">${text}</p>`)}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>

          <select
            title="Grandezza testo"
            aria-label="Grandezza testo"
            disabled={disabled}
            className="h-9 rounded-xl border px-2 text-xs font-semibold outline-none"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
            defaultValue=""
            onChange={(event) => {
              const size = event.target.value;
              if (size) replaceSelection((text) => `<span style="font-size:${size}">${text}</span>`);
              event.target.value = "";
            }}
          >
            <option value="">Size</option>
            <option value="0.92rem">Small</option>
            <option value="1.1rem">Body+</option>
            <option value="1.35rem">Lead</option>
            <option value="1.8rem">Display</option>
          </select>

          <select
            title="Font"
            aria-label="Font"
            disabled={disabled}
            className="h-9 rounded-xl border px-2 text-xs font-semibold outline-none"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
            defaultValue=""
            onChange={(event) => {
              const family = event.target.value;
              if (family) replaceSelection((text) => `<span style="font-family:${family}">${text}</span>`);
              event.target.value = "";
            }}
          >
            <option value="">Font</option>
            <option value="'Inter', 'Segoe UI', sans-serif">Inter</option>
            <option value="Fraunces, Georgia, serif">Fraunces</option>
            <option value="Georgia, serif">Serif</option>
            <option value="'SFMono-Regular', Consolas, monospace">Mono</option>
          </select>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => handleFileChange(event, "image")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(event) => handleFileChange(event, "video")}
          />
          <ToolbarButton title="Carica foto o gif" disabled={disabled || Boolean(uploading)} onClick={() => imageInputRef.current?.click()}>
            {uploading === "image" ? <Upload className="h-4 w-4 animate-pulse" /> : <ImageIcon className="h-4 w-4" />}
          </ToolbarButton>
          <ToolbarButton title="Carica video" disabled={disabled || Boolean(uploading)} onClick={() => videoInputRef.current?.click()}>
            {uploading === "video" ? <Upload className="h-4 w-4 animate-pulse" /> : <Video className="h-4 w-4" />}
          </ToolbarButton>
          <ToolbarButton title="Callout" disabled={disabled} onClick={() => insertBlock(`<aside class="blog-callout">\n\n### Nota\n\nScrivi qui il blocco in evidenza.\n\n</aside>\n`)}>
            <Type className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="inline-flex rounded-full border p-1" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}>
          <button
            type="button"
            onClick={() => setMode("write")}
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: mode === "write" ? "rgba(106,60,255,0.12)" : "transparent" }}
          >
            Scrivi
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: mode === "preview" ? "rgba(106,60,255,0.12)" : "transparent" }}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>

      {mode === "write" ? (
        <div
          className={dragging ? "tv-cc-drop is-over" : undefined}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const files = [...event.dataTransfer.files];
            for (const file of files) {
              const kind = file.type.startsWith("video/") ? "video" : "image";
              void uploadMedia(file, kind);
            }
          }}
        >
          <textarea
            ref={textareaRef}
            name={name}
            value={value}
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            rows={22}
            placeholder="Scrivi, oppure trascina qui foto, gif o video."
            className="min-h-[34rem] w-full resize-y bg-transparent px-4 py-4 font-mono text-[0.92rem] leading-7 outline-none disabled:cursor-not-allowed"
            spellCheck
          />
        </div>
      ) : (
        <>
          <input type="hidden" name={name} value={value} />
          <div className="min-h-[34rem] bg-white/70 px-5 py-5 sm:px-7">
            <MarkdownContent content={value || "_Anteprima vuota_"} />
          </div>
        </>
      )}

      {uploading ? (
        <div className="border-t px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--line)", color: "var(--muted-strong)" }}>
          Upload in corso...
        </div>
      ) : null}
      {error ? <p className="border-t px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
