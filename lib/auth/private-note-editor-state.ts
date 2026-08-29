"use client";

import { useCallback, useSyncExternalStore } from "react";

let openSlug: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getOpenPrivateNoteSlug() {
  return openSlug;
}

export function setOpenPrivateNoteSlug(slug: string | null) {
  if (openSlug === slug) return;
  openSlug = slug;
  emit();
}

export function openPrivateNoteEditor(slug: string) {
  setOpenPrivateNoteSlug(slug);
}

export function closePrivateNoteEditor() {
  setOpenPrivateNoteSlug(null);
}

export function subscribePrivateNoteEditor(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePrivateNoteEditorOpen(slug: string) {
  const open = useSyncExternalStore(
    subscribePrivateNoteEditor,
    () => getOpenPrivateNoteSlug() === slug,
    () => false,
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        setOpenPrivateNoteSlug(slug);
        return;
      }
      if (getOpenPrivateNoteSlug() === slug) {
        setOpenPrivateNoteSlug(null);
      }
    },
    [slug],
  );

  return { open, setOpen };
}
