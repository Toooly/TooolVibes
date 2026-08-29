"use client";

import { useCallback, useSyncExternalStore } from "react";

let openSlug: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getOpenPersonalInsightSlug() {
  return openSlug;
}

export function setOpenPersonalInsightSlug(slug: string | null) {
  if (openSlug === slug) return;
  openSlug = slug;
  emit();
}

export function openPersonalInsightLayer(slug: string) {
  setOpenPersonalInsightSlug(slug);
}

export function closePersonalInsightLayer() {
  setOpenPersonalInsightSlug(null);
}

export function subscribePersonalInsightLayer(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePersonalInsightLayerOpen(slug: string) {
  const open = useSyncExternalStore(
    subscribePersonalInsightLayer,
    () => getOpenPersonalInsightSlug() === slug,
    () => false,
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        setOpenPersonalInsightSlug(slug);
        return;
      }
      if (getOpenPersonalInsightSlug() === slug) {
        setOpenPersonalInsightSlug(null);
      }
    },
    [slug],
  );

  return { open, setOpen };
}

export function resetPersonalInsightLayerForTests() {
  openSlug = null;
  emit();
}
