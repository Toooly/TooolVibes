"use client";

import { useEffect, useId, useState } from "react";

import { useAccount } from "@/components/account/account-provider";
import { useAuthContinuation } from "@/components/account/auth-continuation-provider";
import { excerptPrivateNote } from "@/lib/account/private-note";
import { setWorkspaceNote } from "@/lib/account/workspace-actions";
import { usePrivateNoteEditorOpen } from "@/lib/auth/private-note-editor-state";
import { canUse } from "@/lib/capabilities";
import { DISCOVERY_SYNC_EVENT } from "@/lib/discovery/workspace-events";
import { MAX_NOTE_LENGTH } from "@/lib/discovery/workspace-constants";
import { getCanonicalToolWorkspaceState } from "@/lib/stores/tool-workspace-store";

import "./private-note-editor.css";

function readNote(slug: string) {
  return getCanonicalToolWorkspaceState().toolStates[slug]?.note ?? null;
}

export function PrivateNoteEditor({
  slug,
  origin,
  compact = false,
  guestMode = "gate",
}: {
  slug: string;
  origin: "tool" | "salvati" | "decision";
  compact?: boolean;
  guestMode?: "gate" | "hide";
}) {
  const account = useAccount();
  const continuation = useAuthContinuation();
  const fieldId = useId();
  const statusId = useId();
  const { open, setOpen } = usePrivateNoteEditorOpen(slug);
  const [note, setNote] = useState<string | null>(() => readNote(slug));
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setNote(readNote(slug));
    sync();
    window.addEventListener(DISCOVERY_SYNC_EVENT, sync);
    return () => window.removeEventListener(DISCOVERY_SYNC_EVENT, sync);
  }, [slug]);

  useEffect(() => {
    if (open) {
      setDraft(readNote(slug) ?? "");
      setStatus("idle");
      setError(null);
    }
  }, [open, slug]);

  const viewer = account.status === "authenticated" ? "authenticated" : "guest";
  const allowed = canUse("note.private", viewer);
  const preview = excerptPrivateNote(note, compact ? 72 : 120);

  const requestAuth = () => {
    continuation.requestNotePrivate({ toolSlug: slug, origin: `note.${origin}` });
  };

  const save = (next: string | null) => {
    try {
      setWorkspaceNote(slug, next);
      const stored = readNote(slug);
      setNote(stored);
      setStatus("saved");
      setError(null);
      if (!next) setOpen(false);
    } catch {
      setStatus("error");
      setError("Salvataggio non riuscito.");
    }
  };

  if (account.status === "loading") return null;

  if (!allowed) {
    if (guestMode === "hide") return null;
    return (
      <div className="tv-private-note" data-origin={origin} data-state="guest">
        <button
          type="button"
          className="tv-private-note__trigger"
          onClick={requestAuth}
        >
          Nota privata
        </button>
      </div>
    );
  }

  return (
    <div
      className="tv-private-note"
      data-origin={origin}
      data-state={open ? "editing" : note ? "existing" : "empty"}
    >
      {open ? (
        <form
          className="tv-private-note__form"
          onSubmit={(event) => {
            event.preventDefault();
            save(draft.trim() || null);
          }}
        >
          <label className="tv-private-note__label" htmlFor={fieldId}>
            Nota privata
          </label>
          <textarea
            id={fieldId}
            className="tv-private-note__textarea"
            value={draft}
            maxLength={MAX_NOTE_LENGTH}
            rows={compact ? 3 : 4}
            onChange={(event) => {
              setDraft(event.target.value);
              setStatus("idle");
            }}
          />
          {draft.length >= MAX_NOTE_LENGTH - 200 ? (
            <p className="tv-private-note__count">
              {draft.length}/{MAX_NOTE_LENGTH}
            </p>
          ) : null}
          {error ? (
            <p className="tv-private-note__error" role="alert">
              {error}
            </p>
          ) : status === "saved" ? (
            <p className="tv-private-note__status" id={statusId} role="status">
              Salvata
            </p>
          ) : null}
          <div className="tv-private-note__actions">
            <button type="submit" className="tv-private-note__save">
              Salva
            </button>
            <button
              type="button"
              className="tv-private-note__cancel"
              onClick={() => setOpen(false)}
            >
              Annulla
            </button>
            {note ? (
              <button
                type="button"
                className="tv-private-note__delete"
                onClick={() => save(null)}
              >
                Elimina
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="tv-private-note__trigger"
          onClick={() => setOpen(true)}
        >
          {note ? (
            <>
              <span className="tv-private-note__kicker">Nota privata</span>
              <span className="tv-private-note__preview">{preview}</span>
            </>
          ) : (
            "Nota privata"
          )}
        </button>
      )}
    </div>
  );
}
