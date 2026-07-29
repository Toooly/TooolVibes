"use client";

import { useEffect, useState } from "react";
import { Music, Music2 } from "lucide-react";

import {
  MUSIC_CHANGE_EVENT,
  MUSIC_STORAGE_KEY,
} from "@/lib/config/sound";
import { cn } from "@/lib/utils";

function getInitialMusicEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(MUSIC_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function MusicToggleButton({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const Icon = enabled ? Music2 : Music;

  useEffect(() => {
    setEnabled(getInitialMusicEnabled());

    function handleMusicChange(event: Event) {
      const musicChange = event as CustomEvent<{ enabled?: boolean }>;

      if (typeof musicChange.detail?.enabled === "boolean") {
        setEnabled(musicChange.detail.enabled);
      }
    }

    window.addEventListener(MUSIC_CHANGE_EVENT, handleMusicChange);
    return () => window.removeEventListener(MUSIC_CHANGE_EVENT, handleMusicChange);
  }, []);

  function toggleMusic() {
    const nextEnabled = !enabled;

    setEnabled(nextEnabled);
    try {
      window.localStorage.setItem(MUSIC_STORAGE_KEY, String(nextEnabled));
    } catch {
      // Keep the in-session control responsive even if storage is unavailable.
    }
    window.dispatchEvent(
      new CustomEvent(MUSIC_CHANGE_EVENT, {
        detail: { enabled: nextEnabled },
      }),
    );
  }

  return (
    <button
      type="button"
      aria-label={enabled ? "Disattiva musica TooolVibes" : "Attiva musica TooolVibes"}
      aria-pressed={enabled}
      className={cn(
        "music-toggle-button",
        enabled && "is-playing",
        className,
      )}
      data-sound-control="true"
      onClick={toggleMusic}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
