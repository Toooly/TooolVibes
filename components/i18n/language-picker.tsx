"use client";

import { Languages, ChevronDown } from "lucide-react";
import { parseLanguagePreference } from "@/lib/i18n/locale";
import { useLocale } from "./locale-provider";
import styles from "./language-picker.module.css";

export function LanguagePicker() {
  const { locale, preference, pending, error, setPreference } = useLocale();
  const english = locale === "en";
  const label = english ? "Choose language" : "Scegli lingua";
  return (
    <div className={styles.picker} aria-busy={pending}>
      <Languages size={15} aria-hidden="true" />
      <span aria-hidden="true">{pending ? "…" : locale.toUpperCase()}</span>
      <ChevronDown size={11} aria-hidden="true" />
      <select aria-label={label} title={label} value={preference} onChange={(event) => setPreference(parseLanguagePreference(event.target.value))}>
        <option value="auto">{english ? "Device language" : "Lingua del dispositivo"}</option>
        <option value="it">Italiano</option>
        <option value="en">English</option>
      </select>
      {error ? <button type="button" className={styles.retry} onClick={() => setPreference(preference)}>{english ? "Retry English" : "Riprova inglese"}</button> : null}
      <span className={styles.status} role="status">{error ? (english ? "English is temporarily unavailable. Choose English to retry." : "Inglese temporaneamente non disponibile. Seleziona English per riprovare.") : pending ? (english ? "Loading English…" : "Caricamento inglese…") : ""}</span>
    </div>
  );
}
