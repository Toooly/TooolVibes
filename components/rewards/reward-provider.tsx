"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useMachine } from "@xstate/react";
import { usePathname } from "next/navigation";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { rewardPresentationMachine } from "@/lib/rewards/machine";
import {
  type RewardPreferences,
  DEFAULT_REWARD_PREFERENCES,
  readRewardPreferences,
  writeRewardPreferences,
} from "@/lib/rewards/preferences";
import type { RewardEnvelope } from "@/lib/rewards/contracts";
import type { RewardPresentationMode } from "@/lib/rewards/machine";

type RewardRuntimeContextValue = {
  runtimeEnabled: boolean;
  preferences: RewardPreferences;
  active: RewardEnvelope | null;
  activePresentation: RewardPresentationMode;
  queueLength: number;
  preferReducedMotion: boolean;
  machineState: string;
  /** Accepts only full envelope objects (future server-verified). */
  enqueueVerifiedEnvelope: (envelope: unknown) => void;
  dismissActive: () => void;
  completeActive: () => void;
  notifyAuthLost: () => void;
  updatePreferences: (patch: Partial<Omit<RewardPreferences, "version">>) => void;
};

const RewardRuntimeContext = createContext<RewardRuntimeContextValue | null>(
  null,
);

const dormantValue: RewardRuntimeContextValue = {
  runtimeEnabled: false,
  preferences: DEFAULT_REWARD_PREFERENCES,
  active: null,
  activePresentation: "full",
  queueLength: 0,
  preferReducedMotion: false,
  machineState: "idle",
  enqueueVerifiedEnvelope: () => {},
  dismissActive: () => {},
  completeActive: () => {},
  notifyAuthLost: () => {},
  updatePreferences: () => {},
};

export function RewardRuntimeProvider({
  children,
  runtimeEnabled = false,
  milestonesEnabled = false,
}: {
  children: ReactNode;
  runtimeEnabled?: boolean;
  milestonesEnabled?: boolean;
}) {
  const [state, send] = useMachine(rewardPresentationMachine);
  const pathname = usePathname();
  const preferReducedMotion = useReducedMotion();
  const prevPath = useRef(pathname);
  const prefsHydrated = useRef(false);

  useEffect(() => {
    send({ type: "RUNTIME_ENABLED", enabled: runtimeEnabled });
  }, [runtimeEnabled, send]);

  useEffect(() => {
    send({ type: "MILESTONES_ENABLED", enabled: milestonesEnabled });
  }, [milestonesEnabled, send]);

  useEffect(() => {
    if (!prefsHydrated.current) {
      prefsHydrated.current = true;
      send({ type: "PREFERENCES_CHANGED", preferences: readRewardPreferences() });
    }
  }, [send]);

  useEffect(() => {
    send({
      type: "REDUCED_MOTION_CHANGED",
      preferReducedMotion,
    });
  }, [preferReducedMotion, send]);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      send({ type: "ROUTE_CHANGED" });
    }
  }, [pathname, send]);

  const enqueueVerifiedEnvelope = useCallback(
    (envelope: unknown) => {
      if (!runtimeEnabled) return;
      send({ type: "ENQUEUE", envelope });
    },
    [runtimeEnabled, send],
  );

  const dismissActive = useCallback(() => {
    send({ type: "DISMISS" });
  }, [send]);

  const completeActive = useCallback(() => {
    send({ type: "PRESENTATION_COMPLETE" });
  }, [send]);

  const notifyAuthLost = useCallback(() => {
    send({ type: "AUTH_LOST" });
  }, [send]);

  const updatePreferences = useCallback(
    (patch: Partial<Omit<RewardPreferences, "version">>) => {
      const current = state.context.preferences ?? DEFAULT_REWARD_PREFERENCES;
      const next = writeRewardPreferences({
        ...current,
        ...patch,
        version: 1,
      });
      send({ type: "PREFERENCES_CHANGED", preferences: next });
    },
    [send, state.context.preferences],
  );

  const value = useMemo<RewardRuntimeContextValue>(
    () => ({
      runtimeEnabled,
      preferences: state.context.preferences,
      active: state.context.active,
      activePresentation: state.context.activePresentation,
      queueLength: state.context.queue.items.length,
      preferReducedMotion: state.context.preferReducedMotion,
      machineState: String(state.value),
      enqueueVerifiedEnvelope,
      dismissActive,
      completeActive,
      notifyAuthLost,
      updatePreferences,
    }),
    [
      runtimeEnabled,
      state.context.preferences,
      state.context.active,
      state.context.activePresentation,
      state.context.queue.items.length,
      state.context.preferReducedMotion,
      state.value,
      enqueueVerifiedEnvelope,
      dismissActive,
      completeActive,
      notifyAuthLost,
      updatePreferences,
    ],
  );

  return (
    <RewardRuntimeContext.Provider value={value}>
      {children}
    </RewardRuntimeContext.Provider>
  );
}

export function useRewardRuntime(): RewardRuntimeContextValue {
  return useContext(RewardRuntimeContext) ?? dormantValue;
}
