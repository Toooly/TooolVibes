"use client";

import { useCallback, useSyncExternalStore } from "react";

let openSlug: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getOpenExperienceFormSlug() {
  return openSlug;
}

export function setOpenExperienceFormSlug(slug: string | null) {
  if (openSlug === slug) return;
  openSlug = slug;
  emit();
}

export function openExperienceForm(slug: string) {
  setOpenExperienceFormSlug(slug);
}

export function closeExperienceForm() {
  setOpenExperienceFormSlug(null);
}

export function subscribeExperienceForm(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useExperienceFormOpen(slug: string) {
  const open = useSyncExternalStore(
    subscribeExperienceForm,
    () => getOpenExperienceFormSlug() === slug,
    () => false,
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        setOpenExperienceFormSlug(slug);
        return;
      }
      if (getOpenExperienceFormSlug() === slug) {
        setOpenExperienceFormSlug(null);
      }
    },
    [slug],
  );

  return { open, setOpen };
}

export function resetExperienceFormForTests() {
  openSlug = null;
  emit();
}
