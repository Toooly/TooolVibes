export type SignalEventEmitResult =
  | {
      ok: true;
      status: "accepted" | "duplicate" | "skipped";
      granted?: boolean;
      spAwarded?: number;
      envelope?: unknown;
    }
  | { ok: false; error: string; status?: number };

export type SignalMissionView = {
  id: string;
  title: string;
  description: string;
  status: "locked" | "active" | "completed";
  progress: number;
  target: number;
  category: "onboarding" | "exploration" | "depth";
};

export type SignalLevelV1 = {
  level: number;
  title: string;
  sp: number;
  spForCurrent: number;
  spForNext: number | null;
  progressPercent: number;
};

export type SignalProgressSnapshot = {
  authenticated: true;
  sp: number;
  level: SignalLevelV1;
  missions: SignalMissionView[];
  recentEventTypes: string[];
  rulesVersion: string;
  levelModelVersion: string;
};

export type SignalRewardPreferencesDto = {
  version: 1;
  reduceRewardAnimations: boolean;
  muteRewardSounds: boolean;
  suppressAutomaticAchievements: boolean;
  quietMode: boolean;
};
