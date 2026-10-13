"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "@/components/account/account-provider";
import { useAuthContinuation } from "@/components/account/auth-continuation-provider";
import {
  ExperienceForm,
  emptyExperienceFormValues,
  valuesFromOwner,
} from "@/components/community/experience-form";
import { canUse } from "@/lib/capabilities";
import {
  communityWriteUserMessage,
  createOwnerExperience,
  deleteOwnerExperienceRequest,
  fetchOwnerExperience,
  updateOwnerExperienceRequest,
} from "@/lib/community/client";
import { useExperienceFormOpen } from "@/lib/community/owner-form-state";
import { OWNER_STATUS_LABEL } from "@/lib/community/owner-page";
import type { CommunityExperienceOwner } from "@/lib/community/schema";

export function ExperienceOwnerPanel({
  toolSlug,
  catalogNames,
}: {
  toolSlug: string;
  catalogNames: Record<string, string>;
}) {
  const account = useAccount();
  const continuation = useAuthContinuation();
  const router = useRouter();
  const { open, setOpen } = useExperienceFormOpen(toolSlug);
  const [owner, setOwner] = useState<CommunityExperienceOwner | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const token = account.session?.access_token ?? null;
  const viewer = account.status === "authenticated" ? "authenticated" : "guest";
  const allowed = canUse("community.write", viewer);

  const reload = useCallback(async () => {
    if (!token) {
      setOwner(null);
      setLoaded(true);
      return;
    }
    const result = await fetchOwnerExperience({ token, toolSlug });
    if (!result.ok) {
      setError(communityWriteUserMessage(result.error.code));
      setLoaded(true);
      return;
    }
    setOwner(result.experience);
    setError(null);
    setLoaded(true);
  }, [token, toolSlug]);

  useEffect(() => {
    if (account.status === "loading") return;
    if (!allowed || !token) {
      setOwner(null);
      setLoaded(true);
      return;
    }
    void reload();
  }, [account.status, allowed, token, reload]);

  if (account.status === "loading") return null;

  if (!allowed) {
    return (
      <div className="td-final-experience-owner">
        <button
          type="button"
          className="td-final-experience__more"
          onClick={() => continuation.requestCommunityWrite({ toolSlug, origin: "community.tool" })}
        ><LocalizedText>{"Condividi la tua esperienza "}</LocalizedText></button>
      </div>
    );
  }

  const editing = open;
  const publishedWarning =
    owner?.status === "published"
      ? "Dopo la modifica, l’esperienza tornerà in revisione."
      : undefined;

  return (
    <div className="td-final-experience-owner">
      {notice ? <p role="status"><LocalizedText>{notice}</LocalizedText></p> : null}
      {loaded && !editing && !owner ? (
        <button type="button" className="td-final-experience__more" onClick={() => setOpen(true)}><LocalizedText>{"Condividi la tua esperienza "}</LocalizedText></button>
      ) : null}
      {loaded && owner && !editing ? (
        <div className="td-final-experience-owner__status">
          <p className="td-final-experience-owner__kicker"><LocalizedText>{"La tua esperienza"}</LocalizedText></p>
          <p>
            <strong><LocalizedText>{OWNER_STATUS_LABEL[owner.status]}</LocalizedText></strong>
          </p>
          {owner.status === "pending" ? <p><LocalizedText>{"La tua esperienza è in revisione."}</LocalizedText></p> : null}
          {owner.status === "hidden" ? (
            <p><LocalizedText>{"Questa esperienza non è al momento visibile pubblicamente."}</LocalizedText></p>
          ) : null}
          {owner.moderationReason && (owner.status === "rejected" || owner.status === "hidden") ? (
            <p><LocalizedText>{"Motivo: "}</LocalizedText><LocalizedText>{owner.moderationReason}</LocalizedText></p>
          ) : null}
          <div className="td-final-experience-form__actions">
            <button type="button" className="td-final-experience__more" onClick={() => setOpen(true)}>
              <LocalizedText>{owner.status === "rejected" || owner.status === "hidden"
                ? "Modifica e invia di nuovo"
                : "Modifica"}</LocalizedText>
            </button>
            <button
              type="button"
              className="td-final-experience-form__ghost"
              onClick={async () => {
                if (!token || !window.confirm("Eliminare questa esperienza da TooolVibes?")) return;
                setBusy(true);
                const result = await deleteOwnerExperienceRequest({ token, id: owner.id });
                setBusy(false);
                if (!result.ok) {
                  setError(communityWriteUserMessage(result.error.code));
                  return;
                }
                setOwner(null);
                setNotice(null);
                router.refresh();
              }}
              disabled={busy}
            ><LocalizedText>{"Elimina esperienza "}</LocalizedText></button>
          </div>
        </div>
      ) : null}
      {editing ? (
        <ExperienceForm
          toolSlug={toolSlug}
          catalogNames={catalogNames}
          initial={owner ? valuesFromOwner(owner) : emptyExperienceFormValues()}
          mode={owner ? "edit" : "create"}
          warning={publishedWarning}
          submitLabel={
            owner?.status === "rejected" || owner?.status === "hidden"
              ? "Invia di nuovo"
              : owner
                ? "Salva"
                : "Invia per la revisione"
          }
          busy={busy}
          error={error}
          onCancel={() => {
            setOpen(false);
            setError(null);
          }}
          onSubmit={async ({ values, pros, limits, captchaToken }) => {
            if (!token) return;
            setBusy(true);
            setError(null);
            const payload = {
              displayName: values.displayName,
              useCase: values.useCase,
              body: values.body,
              pros,
              limits,
              durationBucket: values.durationBucket,
              switchedFromSlug: values.switchedMode === "catalog" ? values.switchedFromSlug : null,
              switchedFromLabel: values.switchedMode === "other" ? values.switchedFromLabel : null,
            };
            const result = owner
              ? await updateOwnerExperienceRequest({
                  token,
                  id: owner.id,
                  expectedUpdatedAt: owner.updatedAt,
                  payload,
                })
              : await createOwnerExperience({
                  token,
                  toolSlug,
                  captchaToken,
                  payload,
                });
            setBusy(false);
            if (!result.ok) {
              if (result.error.code === "EXPERIENCE_ALREADY_EXISTS") {
                await reload();
                setOpen(false);
                return;
              }
              setError(communityWriteUserMessage(result.error.code));
              return;
            }
            setOwner(result.experience);
            setOpen(false);
            setNotice(
              result.experience.status === "pending"
                ? "Esperienza inviata. La pubblicheremo dopo la revisione."
                : null,
            );
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
