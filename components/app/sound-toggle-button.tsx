"use client";

import { useEffect, useState } from "react";
import { Volume1, VolumeX } from "lucide-react";

import {
  SOUND_MUTED_CHANGE_EVENT,
  SOUND_STORAGE_KEY,
} from "@/lib/config/sound";
import { cn } from "@/lib/utils";

function getInitialMuted() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storedValue = window.localStorage.getItem(SOUND_STORAGE_KEY);

    if (storedValue !== null) {
      return storedValue === "true";
    }
  } catch {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SoundToggleButton({ className }: { className?: string }) {
  const [muted, setMuted] = useState(false);
  const Icon = muted ? VolumeX : Volume1;

  useEffect(() => {
    setMuted(getInitialMuted());

    function handleMutedChange(event: Event) {
      const mutedChange = event as CustomEvent<{ muted?: boolean }>;

      if (typeof mutedChange.detail?.muted === "boolean") {
        setMuted(mutedChange.detail.muted);
      }
    }

    window.addEventListener(SOUND_MUTED_CHANGE_EVENT, handleMutedChange);
    return () => window.removeEventListener(SOUND_MUTED_CHANGE_EVENT, handleMutedChange);
  }, []);

  function toggleMuted() {
    const nextMuted = !muted;

    setMuted(nextMuted);
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(nextMuted));
    } catch {
      // Keep the in-session control responsive even if storage is unavailable.
    }
    window.dispatchEvent(
      new CustomEvent(SOUND_MUTED_CHANGE_EVENT, {
        detail: { muted: nextMuted },
      }),
    );
  }

  return (
    <button
      type="button"
      aria-label={muted ? "Attiva suoni TooolVibes" : "Disattiva suoni TooolVibes"}
      aria-pressed={!muted}
      className={cn(
        "premium-button premium-button-icon premium-button-subtle sound-toggle-button inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-[#f8fafc] [&_svg]:text-[#f8fafc]",
        muted && "is-muted",
        className,
      )}
      data-sound-control="true"
      onClick={toggleMuted}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
