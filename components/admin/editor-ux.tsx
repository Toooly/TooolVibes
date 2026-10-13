"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
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
      <div className="tv-cc-dialog">
        <h2 id="unsaved-title" className="tv-cc-panel__title"><LocalizedText>{"Uscire senza salvare?"}</LocalizedText></h2>
        <p className="tv-cc-panel__desc"><LocalizedText>{"Le modifiche non salvate andranno perse."}</LocalizedText></p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="tv-cc-btn tv-cc-btn--ghost" onClick={() => setHref(null)}><LocalizedText>{"Resta "}</LocalizedText></button>
          <a href={href} className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Esci senza salvare "}</LocalizedText></a>
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
    <header className="tv-cc-header">
      <div>
        <a href={backHref} className="tv-cc-btn tv-cc-btn--ghost"><LocalizedText>{"Indietro "}</LocalizedText></a>
        <p className="tv-cc-kicker" style={{ marginTop: "0.75rem" }}><LocalizedText>{eyebrow}</LocalizedText></p>
        <h1 className="tv-cc-title"><LocalizedText>{title}</LocalizedText></h1>
        {updatedAt ? <p className="tv-cc-desc"><LocalizedText>{"Aggiornato "}</LocalizedText><LocalizedText>{updatedAt}</LocalizedText></p> : null}
      </div>
      {status ? <span className="tv-cc-metric"><LocalizedText>{status}</LocalizedText></span> : null}
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
    <div className="tv-cc-savebar">
      <p className="tv-cc-panel__desc" role="status" style={{ margin: 0 }}>
        <LocalizedText>{pending ? "Salvataggio…" : error ? error : dirty ? "Modifiche non salvate" : "Nessuna modifica"}</LocalizedText>
      </p>
      <button type="submit" disabled={disabled || pending} className="tv-cc-btn tv-cc-btn--primary">
        <LocalizedText>{pending ? "Salvataggio…" : label}</LocalizedText>
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
        className="tv-cc-dialog w-full max-w-lg rounded-t-3xl sm:rounded-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(value.trim());
          onClose();
        }}
      >
        <h2 id={headingId} className="tv-cc-panel__title"><LocalizedText>{title}</LocalizedText></h2>
        <label className="mt-4 block">
          <span className="tv-cc-label"><LocalizedText>{"Perché lo stai considerando"}</LocalizedText></span>
          <textarea
            ref={fieldRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={5}
            className="tv-cc-field min-h-32"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="tv-cc-btn tv-cc-btn--ghost" onClick={onClose}><LocalizedText>{"Annulla "}</LocalizedText></button>
          <button type="submit" className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Salva nota "}</LocalizedText></button>
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
