/**
 * Tool extended editorial content.
 *
 * Generated from docs/final-copy/tools/*_FINAL_COPY.md on 2026-08-02.
 * Contains the editorial body (Overview, Features, Use cases, Strengths, Limitations,
 * Editorial verdict, FAQ) for each of the 30 published tools.
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
