export const SOUND_STORAGE_KEY = "tooolvibes:sound-muted";
export const SOUND_MUTED_CHANGE_EVENT = "tooolvibes:sound-muted-change";
export const SOUND_PLAY_EVENT = "tooolvibes:sound-play";
export const MUSIC_STORAGE_KEY = "tooolvibes:music-enabled";
export const MUSIC_CHANGE_EVENT = "tooolvibes:music-change";

export type TooolvibesSoundKind =
  | "tap"
  | "nav"
  | "brand"
  | "menu"
  | "save"
  | "compare"
  | "detail"
  | "stack"
  | "search"
  | "filter"
  | "filterApply"
  | "open"
  | "close"
  | "expand"
  | "collapse"
  | "tab"
  | "carousel"
  | "hover"
  | "drawerOpen"
  | "drawerClose"
  | "toast"
  | "success"
  | "warning"
  | "update"
  | "reveal"
  | "introOpen"
  | "introClose"
  | "route"
  | "battleStart"
  | "battleHit"
  | "battleWin"
  | "badgeUnlock"
  | "levelUp"
  | "predictionLock";

export function playTooolvibesSound(kind: TooolvibesSoundKind) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind } }));
}
