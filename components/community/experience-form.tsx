"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { CommunityTurnstile } from "@/components/community/community-turnstile";
import { DURATION_BUCKET_LABELS } from "@/lib/community/duration";
import {
  COMMUNITY_DURATION_BUCKETS,
  type CommunityExperienceOwner,
  type DurationBucket,
} from "@/lib/community/schema";

export type ExperienceFormValues = {
  displayName: string;
  useCase: string;
  body: string;
  pros: string[];
  limits: string[];
  durationBucket: DurationBucket;
  switchedMode: "none" | "catalog" | "other";
  switchedFromSlug: string;
  switchedFromLabel: string;
};

export function emptyExperienceFormValues(): ExperienceFormValues {
  return {
    displayName: "",
    useCase: "",
    body: "",
    pros: [""],
    limits: [""],
    durationBucket: "months_1_3",
    switchedMode: "none",
    switchedFromSlug: "",
    switchedFromLabel: "",
  };
}

export function valuesFromOwner(experience: CommunityExperienceOwner): ExperienceFormValues {
  return {
    displayName: experience.displayName,
    useCase: experience.useCase,
    body: experience.body,
    pros: experience.pros.length ? [...experience.pros] : [""],
    limits: experience.limits.length ? [...experience.limits] : [""],
    durationBucket: experience.durationBucket,
    switchedMode: experience.switchedFromSlug
      ? "catalog"
      : experience.switchedFromLabel
        ? "other"
        : "none",
    switchedFromSlug: experience.switchedFromSlug ?? "",
    switchedFromLabel: experience.switchedFromLabel ?? "",
  };
}

function validate(values: ExperienceFormValues, currentSlug: string) {
  const errors: Record<string, string> = {};
  if (values.displayName.trim().length < 2) errors.displayName = "Inserisci un nome pubblico (2-80).";
  if (values.useCase.trim().length < 4) errors.useCase = "Descrivi come lo usi (4-80).";
  if (values.body.trim().length < 80) errors.body = "Racconta l'esperienza con almeno 80 caratteri.";
  const pros = values.pros.map((item) => item.trim()).filter(Boolean);
  const limits = values.limits.map((item) => item.trim()).filter(Boolean);
  if (pros.length < 1 || pros.some((item) => item.length < 8)) {
    errors.pros = "Aggiungi almeno un punto (minimo 8 caratteri).";
  }
  if (limits.length < 1 || limits.some((item) => item.length < 8)) {
    errors.limits = "Aggiungi almeno un limite (minimo 8 caratteri).";
  }
  if (values.switchedMode === "catalog") {
    if (!values.switchedFromSlug || values.switchedFromSlug === currentSlug) {
      errors.switched = "Scegli un altro tool del catalogo.";
    }
  }
  if (values.switchedMode === "other" && values.switchedFromLabel.trim().length < 2) {
    errors.switched = "Scrivi il nome del tool precedente.";
  }
  return { errors, pros, limits };
}

export function ExperienceForm({
  toolSlug,
  catalogNames,
  initial,
  mode,
  warning,
  submitLabel,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  toolSlug: string;
  catalogNames: Record<string, string>;
  initial: ExperienceFormValues;
  mode: "create" | "edit";
  warning?: string;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: {
    values: ExperienceFormValues;
    pros: string[];
    limits: string[];
    captchaToken: string;
  }) => void;
}) {
  const formId = useId();
  const [values, setValues] = useState(initial);
  const [captchaToken, setCaptchaToken] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [values, initial]);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const catalogOptions = Object.entries(catalogNames).filter(([slug]) => slug !== toolSlug);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const checked = validate(values, toolSlug);
    setFieldErrors(checked.errors);
    if (Object.keys(checked.errors).length > 0) return;
    onSubmit({
      values,
      pros: checked.pros,
      limits: checked.limits,
      captchaToken: captchaToken || "dev",
    });
  };

  const updateList = (key: "pros" | "limits", index: number, value: string) => {
    setValues((current) => {
      const next = [...current[key]];
      next[index] = value;
      return { ...current, [key]: next };
    });
  };

  return (
    <form className="td-final-experience-form" onSubmit={handleSubmit} noValidate>
      {warning ? <p className="td-final-experience-form__warning"><LocalizedText>{warning}</LocalizedText></p> : null}
      {error ? (
        <p className="td-final-experience-form__error" role="alert">
          <LocalizedText>{error}</LocalizedText>
        </p>
      ) : null}
      <label className="td-final-experience-form__label" htmlFor={`${formId}-name`}><LocalizedText>{"Nome pubblico "}</LocalizedText><span className="td-final-experience-form__hint"><LocalizedText>{"Questo nome sarà visibile accanto alla tua esperienza. "}</LocalizedText></span>
        <input
          id={`${formId}-name`}
          className="td-final-experience-form__input"
          value={values.displayName}
          maxLength={80}
          autoComplete="nickname"
          onChange={(event) => setValues((current) => ({ ...current, displayName: event.target.value }))}
          aria-invalid={fieldErrors.displayName ? true : undefined}
        />
      </label>
      {fieldErrors.displayName ? <p className="td-final-experience-form__error"><LocalizedText>{fieldErrors.displayName}</LocalizedText></p> : null}
      <label className="td-final-experience-form__label" htmlFor={`${formId}-use`}><LocalizedText>{"Come lo usi? "}</LocalizedText><input
          id={`${formId}-use`}
          className="td-final-experience-form__input"
          value={values.useCase}
          maxLength={80}
          onChange={(event) => setValues((current) => ({ ...current, useCase: event.target.value }))}
          aria-invalid={fieldErrors.useCase ? true : undefined}
        />
      </label>
      {fieldErrors.useCase ? <p className="td-final-experience-form__error"><LocalizedText>{fieldErrors.useCase}</LocalizedText></p> : null}
      <label className="td-final-experience-form__label" htmlFor={`${formId}-body`}><LocalizedText>{"La tua esperienza "}</LocalizedText><textarea
          id={`${formId}-body`}
          className="td-final-experience-form__textarea"
          value={values.body}
          maxLength={2000}
          rows={8}
          onChange={(event) => setValues((current) => ({ ...current, body: event.target.value }))}
          aria-invalid={fieldErrors.body ? true : undefined}
        />
        <span className="td-final-experience-form__count">{values.body.trim().length}/2000</span>
      </label>
      {fieldErrors.body ? <p className="td-final-experience-form__error"><LocalizedText>{fieldErrors.body}</LocalizedText></p> : null}
      <fieldset className="td-final-experience-form__fieldset">
        <legend><LocalizedText>{"Cosa funziona bene?"}</LocalizedText></legend>
        {values.pros.map((item, index) => (
          <div key={`pro-${index}`} className="td-final-experience-form__row">
            <input
              className="td-final-experience-form__input"
              value={item}
              maxLength={180}
              onChange={(event) => updateList("pros", index, event.target.value)}
            />
            {values.pros.length > 1 ? (
              <button type="button" className="td-final-experience-form__ghost" onClick={() => setValues((current) => ({ ...current, pros: current.pros.filter((_, i) => i !== index) }))}><LocalizedText>{"Rimuovi "}</LocalizedText></button>
            ) : null}
          </div>
        ))}
        {values.pros.length < 5 ? (
          <button type="button" className="td-final-experience-form__ghost" onClick={() => setValues((current) => ({ ...current, pros: [...current.pros, ""] }))}><LocalizedText>{"Aggiungi "}</LocalizedText></button>
        ) : null}
        {fieldErrors.pros ? <p className="td-final-experience-form__error"><LocalizedText>{fieldErrors.pros}</LocalizedText></p> : null}
      </fieldset>
      <fieldset className="td-final-experience-form__fieldset">
        <legend><LocalizedText>{"Quali limiti hai trovato?"}</LocalizedText></legend>
        {values.limits.map((item, index) => (
          <div key={`limit-${index}`} className="td-final-experience-form__row">
            <input
              className="td-final-experience-form__input"
              value={item}
              maxLength={180}
              onChange={(event) => updateList("limits", index, event.target.value)}
            />
            {values.limits.length > 1 ? (
              <button type="button" className="td-final-experience-form__ghost" onClick={() => setValues((current) => ({ ...current, limits: current.limits.filter((_, i) => i !== index) }))}><LocalizedText>{"Rimuovi "}</LocalizedText></button>
            ) : null}
          </div>
        ))}
        {values.limits.length < 5 ? (
          <button type="button" className="td-final-experience-form__ghost" onClick={() => setValues((current) => ({ ...current, limits: [...current.limits, ""] }))}><LocalizedText>{"Aggiungi "}</LocalizedText></button>
        ) : null}
        {fieldErrors.limits ? <p className="td-final-experience-form__error"><LocalizedText>{fieldErrors.limits}</LocalizedText></p> : null}
      </fieldset>
      <fieldset className="td-final-experience-form__fieldset">
        <legend><LocalizedText>{"Da quanto lo usi?"}</LocalizedText></legend>
        <div className="td-final-experience-form__chips">
          {COMMUNITY_DURATION_BUCKETS.map((bucket) => (
            <label key={bucket} className="td-final-experience-form__chip">
              <input
                type="radio"
                name={`${formId}-duration`}
                checked={values.durationBucket === bucket}
                onChange={() => setValues((current) => ({ ...current, durationBucket: bucket }))}
              />
              <LocalizedText>{DURATION_BUCKET_LABELS[bucket]}</LocalizedText>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="td-final-experience-form__fieldset">
        <legend><LocalizedText>{"Usavi qualcos'altro prima?"}</LocalizedText></legend>
        <label className="td-final-experience-form__chip">
          <input type="radio" name={`${formId}-switched`} checked={values.switchedMode === "none"} onChange={() => setValues((current) => ({ ...current, switchedMode: "none", switchedFromSlug: "", switchedFromLabel: "" }))} /><LocalizedText>{"No "}</LocalizedText></label>
        <label className="td-final-experience-form__chip">
          <input type="radio" name={`${formId}-switched`} checked={values.switchedMode === "catalog"} onChange={() => setValues((current) => ({ ...current, switchedMode: "catalog", switchedFromLabel: "" }))} /><LocalizedText>{"Tool TooolVibes "}</LocalizedText></label>
        <label className="td-final-experience-form__chip">
          <input type="radio" name={`${formId}-switched`} checked={values.switchedMode === "other"} onChange={() => setValues((current) => ({ ...current, switchedMode: "other", switchedFromSlug: "" }))} /><LocalizedText>{"Altro tool "}</LocalizedText></label>
        {values.switchedMode === "catalog" ? (
          <select
            className="td-final-experience-form__input"
            value={values.switchedFromSlug}
            onChange={(event) => setValues((current) => ({ ...current, switchedFromSlug: event.target.value }))}
          >
            <option value=""><LocalizedText>{"Scegli un tool"}</LocalizedText></option>
            {catalogOptions.map(([slug, name]) => (
              <option key={slug} value={slug}>
                <LocalizedText>{name}</LocalizedText>
              </option>
            ))}
          </select>
        ) : null}
        {values.switchedMode === "other" ? (
          <input
            className="td-final-experience-form__input"
            value={values.switchedFromLabel}
            maxLength={80}
            onChange={(event) => setValues((current) => ({ ...current, switchedFromLabel: event.target.value }))}
          />
        ) : null}
        {fieldErrors.switched ? <p className="td-final-experience-form__error"><LocalizedText>{fieldErrors.switched}</LocalizedText></p> : null}
      </fieldset>
      {mode === "create" ? <CommunityTurnstile onToken={setCaptchaToken} /> : null}
      <div className="td-final-experience-form__actions">
        <button type="submit" className="td-final-experience__more" disabled={busy}>
          <LocalizedText>{busy ? "Invio…" : submitLabel}</LocalizedText>
        </button>
        <button
          type="button"
          className="td-final-experience-form__ghost"
          onClick={() => {
            if (dirty && !window.confirm("Scartare le modifiche?")) return;
            onCancel();
          }}
        ><LocalizedText>{"Annulla "}</LocalizedText></button>
      </div>
    </form>
  );
}
