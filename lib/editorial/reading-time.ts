const WORDS_PER_MINUTE = 220;

/** Shared by server-rendered article routes and interactive guide cards. */
export function estimateReadingMinutes(content: string | undefined | null): number {
  if (!content) return 0;
  const text = content.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`~\-]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
