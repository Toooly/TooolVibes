/**
 * Tool extended editorial content.
 *
 * Authored Italian editorial copy for the 30 catalog tools, with matching
 * English translations in the locale dictionary. The JSON file below is the
 * canonical body source for the tool detail renderer.
 *
 * The body is rendered as Markdown in tool-detail-final/tool-detail-extended-content.tsx
 * and is only displayed when the tool page has a non-empty extended copy.
 */

import extendedContentData from "./tool-extended-content.json";

const extendedContentMap = extendedContentData as Record<string, string>;

export function getToolExtendedContent(slug: string): string | null {
  const value = extendedContentMap[slug];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value;
}

export function getToolExtendedContentMap(): Record<string, string> {
  return { ...extendedContentMap };
}
