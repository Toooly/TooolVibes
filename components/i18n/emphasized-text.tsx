"use client";

import { useLocale } from "./locale-provider";

/** Translate the complete sentence before locating its visual emphasis. */
export function EmphasizedText({ text, emphasis }: { text: string; emphasis?: string }) {
  const { t } = useLocale();
  const translated = t(text);
  const highlighted = emphasis ? t(emphasis) : "";
  const start = highlighted ? translated.toLowerCase().indexOf(highlighted.toLowerCase()) : -1;
  if (start < 0) return <>{translated}</>;
  return <>{translated.slice(0, start)}<strong>{translated.slice(start, start + highlighted.length)}</strong>{translated.slice(start + highlighted.length)}</>;
}
