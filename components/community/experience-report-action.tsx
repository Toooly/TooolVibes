"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useEffect, useId, useState, type FormEvent } from "react";

import { useAccount } from "@/components/account/account-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { communityReportUserMessage, reportExperience } from "@/lib/community/client";
import { loadOwnExperience } from "@/lib/community/own-experience-cache";
import {
  COMMUNITY_REPORT_REASONS,
  REPORT_REASON_LABELS,
  type CommunityReportReason,
} from "@/lib/community/schema";

type ReportPhase = "idle" | "submitting" | "reported";

export function ExperienceReportAction({
  experienceId,
  toolSlug,
}: {
  experienceId: string;
  toolSlug: string;
}) {
  const account = useAccount();
  const formId = useId();
  const errorId = useId();
  const [open, setOpen] = useState(false);
  const [ownId, setOwnId] = useState<string | null>(null);
  const [ownChecked, setOwnChecked] = useState(false);
  const [reason, setReason] = useState<CommunityReportReason | "">("");
  const [details, setDetails] = useState("");
  const [phase, setPhase] = useState<ReportPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const token = account.session?.access_token ?? null;
  const authenticated = account.status === "authenticated";

  useEffect(() => {
    if (!authenticated || !token) {
      setOwnId(null);
      setOwnChecked(true);
      return;
    }
    let active = true;
    loadOwnExperience(token, toolSlug)
      .then((experience) => {
        if (!active) return;
        setOwnId(experience?.id ?? null);
        setOwnChecked(true);
      })
      .catch(() => {
        if (active) setOwnChecked(true);
      });
    return () => {
      active = false;
    };
  }, [authenticated, token, toolSlug]);

  if (!authenticated) return null;
  if (!ownChecked) return null;
  if (ownId === experienceId) return null;

  const busy = phase === "submitting";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !reason || busy) return;
    const normalizedDetails = details.trim();
    if (reason === "other" && normalizedDetails.length < 1) {
      setError("Aggiungi qualche dettaglio su cosa non va.");
      return;
    }
    setPhase("submitting");
    setError(null);
    const result = await reportExperience({
      token,
      experienceId,
      reason,
      details: normalizedDetails || null,
    });
    if (!result.ok) {
      setPhase("idle");
      const message = communityReportUserMessage(result.error.code);
      setError(message);
      if (result.error.code === "EXPERIENCE_ALREADY_REPORTED") {
        setBlocked(true);
      }
      return;
    }
    setPhase("reported");
    setOpen(false);
  };

  if (blocked || phase === "reported") {
    return (
      <p className="td-final-experience__report-status" role="status">
        <LocalizedText>{blocked ? "L\u2019hai gi\u00e0 segnalata." : "Segnalazione inviata."}</LocalizedText>
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        className="td-final-experience__report"
        onClick={() => setOpen(true)}
      ><LocalizedText>{"Segnala "}</LocalizedText></button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="td-final-report-dialog" showCloseButton={false}>
          <DialogTitle className="td-final-report-dialog__title"><LocalizedText>{"Segnala questa esperienza "}</LocalizedText></DialogTitle>
          <DialogDescription className="td-final-report-dialog__description"><LocalizedText>{"Aiutaci a controllare contenuti che potrebbero non rispettare le regole di TooolVibes. "}</LocalizedText></DialogDescription>
          <form className="td-final-report-dialog__form" onSubmit={submit} noValidate>
            <fieldset className="td-final-report-dialog__fieldset">
              <legend><LocalizedText>{"Motivo"}</LocalizedText></legend>
              {COMMUNITY_REPORT_REASONS.map((value) => (
                <label key={value} className="td-final-report-dialog__option">
                  <input
                    type="radio"
                    name={`${formId}-reason`}
                    value={value}
                    checked={reason === value}
                    onChange={() => {
                      setReason(value);
                      setError(null);
                    }}
                    required
                  />
                  {REPORT_REASON_LABELS[value]}
                </label>
              ))}
            </fieldset>
            <label className="td-final-report-dialog__label" htmlFor={`${formId}-details`}><LocalizedText>{"Dettagli "}</LocalizedText><textarea
                id={`${formId}-details`}
                className="td-final-report-dialog__textarea"
                value={details}
                maxLength={500}
                rows={3}
                placeholder={
                  reason === "other"
                    ? "Spiega brevemente il problema"
                    : "Facoltativo"
                }
                onChange={(event) => setDetails(event.target.value)}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
              />
            </label>
            {error ? (
              <p className="td-final-report-dialog__error" id={errorId} role="alert">
                <LocalizedText>{error}</LocalizedText>
              </p>
            ) : null}
            <div className="td-final-report-dialog__actions">
              <button
                type="submit"
                className="td-final-experience__more"
                disabled={busy || !reason}
              >
                <LocalizedText>{busy ? "Invio\u2026" : "Invia segnalazione"}</LocalizedText>
              </button>
              <button
                type="button"
                className="td-final-report-dialog__cancel"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
              ><LocalizedText>{"Annulla "}</LocalizedText></button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
