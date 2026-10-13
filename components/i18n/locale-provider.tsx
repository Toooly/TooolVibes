"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createTranslator, ENGLISH_DICTIONARY_URL, LANGUAGE_STORAGE_KEY, parseLanguagePreference, resolveLocale, translateMarkdown, type LanguagePreference, type Locale, type TranslationDictionary } from "@/lib/i18n/locale";

const identity = (source: string) => source;
type LocaleContextValue = {
  locale: Locale;
  preference: LanguagePreference;
  pending: boolean;
  error: boolean;
  setPreference: (preference: LanguagePreference) => void;
  t: (source: string) => string;
  markdown: (source: string) => string;
};
const LocaleContext = createContext<LocaleContextValue>({ locale: "it", preference: "auto", pending: false, error: false, setPreference: () => {}, t: identity, markdown: identity });
let englishDictionary: Promise<TranslationDictionary> | undefined;
function loadEnglish() {
  if (!englishDictionary) {
    englishDictionary = fetch(ENGLISH_DICTIONARY_URL, { cache: "force-cache" }).then(async (response) => {
      if (!response.ok) throw new Error("Language unavailable");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data) || !Object.values(data).every((value) => typeof value === "string")) throw new Error("Invalid language content");
      return data as TranslationDictionary;
    }).catch((error: unknown) => { englishDictionary = undefined; throw error; });
  }
  return englishDictionary;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("it");
  const [preference, setStoredPreference] = useState<LanguagePreference>("auto");
  const [dictionary, setDictionary] = useState<TranslationDictionary>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const applyPreference = useCallback(async (next: LanguagePreference) => {
    const id = ++requestId.current;
    setStoredPreference(next);
    setError(false);
    const desired = resolveLocale(next, navigator.languages?.length ? navigator.languages : [navigator.language]);
    if (desired === "it") { setLocale("it"); setPending(false); return; }
    setPending(true);
    try {
      const data = await loadEnglish();
      if (id !== requestId.current) return;
      setDictionary(data);
      setLocale("en");
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }, []);

  const setPreference = useCallback((next: LanguagePreference) => {
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* Language remains usable when browser storage is blocked. */ }
    void applyPreference(next);
  }, [applyPreference]);

  const cancelPending = useCallback(() => { ++requestId.current; }, []);

  useEffect(() => {
    let initial: LanguagePreference = "auto";
    try { initial = parseLanguagePreference(localStorage.getItem(LANGUAGE_STORAGE_KEY)); } catch { /* Device language is the fallback. */ }
    void applyPreference(initial);
    const onStorage = (event: StorageEvent) => { if (event.key === LANGUAGE_STORAGE_KEY) void applyPreference(parseLanguagePreference(event.newValue)); };
    const onLanguage = () => {
      let saved: LanguagePreference = "auto";
      try { saved = parseLanguagePreference(localStorage.getItem(LANGUAGE_STORAGE_KEY)); } catch { /* Automatic language remains available. */ }
      if (saved === "auto") void applyPreference(saved);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("languagechange", onLanguage);
    return () => { cancelPending(); window.removeEventListener("storage", onStorage); window.removeEventListener("languagechange", onLanguage); };
  }, [applyPreference, cancelPending]);

  const t = useMemo(() => locale === "en" && dictionary ? createTranslator(dictionary) : identity, [locale, dictionary]);
  const originalMetadata = useRef<{ title: string; descriptions: Array<{ element: HTMLMetaElement; content: string }> } | null>(null);
  useEffect(() => {
    document.documentElement.lang = locale;
    originalMetadata.current ??= { title: document.title, descriptions: Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[name="twitter:title"], meta[name="twitter:description"]')).map((element) => ({ element, content: element.content })) };
    const original = originalMetadata.current;
    const translatedTitle = t(original.title);
    document.title = translatedTitle === original.title ? original.title.split(" | ").map(t).join(" | ") : translatedTitle;
    original.descriptions.forEach(({ element, content }) => { element.content = t(content); });
    const openGraphLocale = document.querySelector<HTMLMetaElement>('meta[property="og:locale"]');
    if (openGraphLocale) openGraphLocale.content = locale === "en" ? "en_US" : "it_IT";
  }, [locale, t]);
  const value = useMemo(() => ({ locale, preference, pending, error, setPreference, t, markdown: (source: string) => translateMarkdown(source, t) }), [locale, preference, pending, error, setPreference, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext); }
