"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function useEditorDirty(errorStatus?: string) {
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (errorStatus === "error") setDirty(true);
  }, [errorStatus]);
  return { dirty, markDirty: () => setDirty(true), clearDirty: () => setDirty(false) };
}

export function UnsavedChangesGuard({ dirty }: { dirty: boolean }) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (!dirty) return;
      const target = (event.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      if (target.target === "_blank" || target.hasAttribute("download")) return;
      const next = target.getAttribute("href");
      if (!next || next.startsWith("#") || next.startsWith("javascript:")) return;
      event.preventDefault();
      event.stopPropagation();
      setHref(next);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  if (!href) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#120d2e] p-5 text-white">
        <h2 id="unsaved-title" className="text-lg font-semibold">Uscire senza salvare?</h2>
        <p className="mt-2 text-sm text-white/65">Le modifiche non salvate andranno perse.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 rounded-full border border-white/15 px-4 text-sm" onClick={() => setHref(null)}>
            Resta
          </button>
          <a href={href} className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#160d3d]">
            Esci senza salvare
          </a>
        </div>
      </div>
    </div>
  );
}

export function EditorHeader({
  backHref,
  eyebrow,
  title,
  status,
  updatedAt,
}: {
  backHref: string;
  eyebrow: string;
  title: string;
  status?: string;
  updatedAt?: string | null;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <a href={backHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-cyan-200">
          ← Indietro
        </a>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
        {updatedAt ? <p className="mt-1 text-xs text-white/45">Aggiornato {updatedAt}</p> : null}
      </div>
      {status ? (
        <p className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
          {status}
        </p>
      ) : null}
    </header>
  );
}

export function EditorStickyBar({
  dirty,
  label,
  disabled,
  error,
}: {
  dirty: boolean;
  label: string;
  disabled?: boolean;
  error?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#120d2e]/95 px-4 py-3 text-white backdrop-blur">
      <p className="text-sm text-white/65" role="status">
        {pending ? "Salvataggio…" : error ? error : dirty ? "Modifiche non salvate" : "Nessuna modifica"}
      </p>
      <button
        type="submit"
        disabled={disabled || pending}
        className="min-h-11 rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-5 text-sm font-semibold text-white disabled:opacity-55"
      >
        {pending ? "Salvataggio…" : label}
      </button>
    </div>
  );
}

export function DecisionNoteDialog({
  open,
  title,
  initialValue,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  initialValue: string;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const headingId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      window.setTimeout(() => fieldRef.current?.focus(), 20);
    }
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/55 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <form
        className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#120d2e] p-5 text-white sm:rounded-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(value.trim());
          onClose();
        }}
      >
        <h2 id={headingId} className="text-lg font-semibold">{title}</h2>
        <label className="mt-4 block text-sm text-white/70">
          Perché lo stai considerando
          <textarea
            ref={fieldRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={5}
            className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-base text-white"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 rounded-full border border-white/15 px-4 text-sm" onClick={onClose}>
            Annulla
          </button>
          <button type="submit" className="min-h-11 rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-4 text-sm font-semibold">
            Salva nota
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditorShell({
  dirty,
  onDirty,
  children,
}: {
  dirty: boolean;
  onDirty: () => void;
  children: ReactNode;
}) {
  return (
    <div onChange={onDirty}>
      <UnsavedChangesGuard dirty={dirty} />
      {children}
    </div>
  );
}
