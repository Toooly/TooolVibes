"use client";

import { useEffect, useState, type ReactNode } from "react";

export function AdminEditorChrome({
  children,
  action,
  saveLabel,
  backHref,
}: {
  children: ReactNode;
  action: (formData: FormData) => void | Promise<void>;
  saveLabel: string;
  backHref?: string;
}) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || saving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, saving]);

  return (
    <form
      action={action}
      onChange={() => setDirty(true)}
      onSubmit={() => setSaving(true)}
      className="space-y-5"
    >
      {children}
      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#120d2e]/95 px-4 py-3 backdrop-blur">
        <p className="text-sm text-white/60">
          {saving ? "Salvataggio…" : dirty ? "Modifiche non salvate" : "Nessuna modifica"}
        </p>
        <div className="flex gap-2">
          {backHref ? (
            <a href={backHref} className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm text-white">
              Annulla
            </a>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
