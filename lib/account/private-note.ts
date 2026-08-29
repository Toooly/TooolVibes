import { MAX_NOTE_LENGTH } from "@/lib/discovery/workspace-constants";

export function excerptPrivateNote(note: string | null | undefined, max = 80) {
  const text = note?.trim() ?? "";
  if (!text) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function normalizePrivateNoteInput(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_NOTE_LENGTH) return trimmed.slice(0, MAX_NOTE_LENGTH);
  return trimmed;
}
