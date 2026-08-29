"use client";

import { useId, useState, useTransition } from "react";

import { moderateExperienceAction } from "@/app/(admin)/admin/actions/experiences";
import type { ExperienceStatus } from "@/lib/community/schema";
import {
  MAX_MODERATION_REASON_LENGTH,
  MIN_MODERATION_REASON_LENGTH,
} from "@/lib/community/moderation";

type ExperienceModerationControlsProps = {
  id: string;
  status: ExperienceStatus;
  expectedUpdatedAt: string;
  returnStatus: string;
  page: string;
  disabled?: boolean;
};

export function ExperienceModerationControls({
  id,
  status,
  expectedUpdatedAt,
  returnStatus,
  page,
  disabled = false,
}: ExperienceModerationControlsProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const reasonId = useId();
  const errorId = useId();
  const busy = disabled || isPending;

  function submit(action: "publish" | "reject" | "hide" | "republish", needsReason: boolean) {
    if (needsReason) {
      const trimmed = reason.normalize("NFC").trim();
      if (
        trimmed.length < MIN_MODERATION_REASON_LENGTH ||
        trimmed.length > MAX_MODERATION_REASON_LENGTH
      ) {
        setError(
          `Inserisci un motivo tra ${MIN_MODERATION_REASON_LENGTH} e ${MAX_MODERATION_REASON_LENGTH} caratteri.`,
        );
        return;
      }
    }
    const confirmMessage =
      action === "publish"
        ? null
        : action === "reject"
          ? "Rifiutare questa esperienza? L'autore dovrà modificarla per rinviare."
          : action === "hide"
            ? "Nascondere questa esperienza pubblicata?"
            : "Ripubblicare questa esperienza?";
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const formData = new FormData();
    formData.set("id", id);
    formData.set("action", action);
    formData.set("expectedUpdatedAt", expectedUpdatedAt);
    formData.set("returnStatus", returnStatus);
    formData.set("page", page);
    if (needsReason) formData.set("reason", reason);
    setError(null);
    startTransition(() => {
      void moderateExperienceAction(formData);
    });
  }

  if (status === "rejected") {
    return (
      <p className="tv-cc-card__meta">
        Solo l&apos;autore può modificare e rinviare un&apos;esperienza rifiutata.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {status === "pending" || status === "published" ? (
        <label className="block" htmlFor={reasonId}>
          <span className="tv-cc-kicker">Motivo (obbligatorio per rifiuto o nascondi)</span>
          <textarea
            id={reasonId}
            name="reason"
            rows={3}
            value={reason}
            maxLength={MAX_MODERATION_REASON_LENGTH}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 w-full rounded-[var(--tv-radius-card)] border border-[var(--tv-border-default)] bg-[var(--tv-input-bg)] px-3 py-2 text-sm text-[var(--tv-input-text)]"
          />
        </label>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-[var(--tv-danger)]">
          {error}
        </p>
      ) : null}
      <div className="tv-cc-card__actions">
        {status === "pending" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => submit("publish", false)}
              className="tv-cc-btn tv-cc-btn--primary"
            >
              {isPending ? "Attendi..." : "Pubblica"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => submit("reject", true)}
              className="tv-cc-btn tv-cc-btn--danger"
            >
              Rifiuta
            </button>
          </>
        ) : null}
        {status === "published" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => submit("hide", true)}
            className="tv-cc-btn tv-cc-btn--danger"
          >
            Nascondi
          </button>
        ) : null}
        {status === "hidden" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => submit("republish", false)}
            className="tv-cc-btn tv-cc-btn--primary"
          >
            Ripubblica
          </button>
        ) : null}
      </div>
    </div>
  );
}
