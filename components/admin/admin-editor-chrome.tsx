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
      className="space-y-4"
    >
      {children}
      <div className="tv-cc-savebar">
        <p className="tv-cc-panel__desc" style={{ margin: 0 }}>
          {saving ? "Salvataggio…" : dirty ? "Modifiche non salvate" : "Nessuna modifica"}
        </p>
        <div className="flex flex-wrap gap-2">
          {backHref ? (
            <a href={backHref} className="tv-cc-btn tv-cc-btn--ghost">
              Annulla
            </a>
          ) : null}
          <button type="submit" disabled={saving} className="tv-cc-btn tv-cc-btn--primary">
            {saveLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
