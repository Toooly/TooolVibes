"use client";

import { useMemo } from "react";
import NumberFlow from "@number-flow/react";
import { useMachine } from "@xstate/react";
import { motion } from "motion/react";
import {
  Activity,
  Bookmark,
  CheckCircle2,
  LockKeyhole,
  Radar,
  Search,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { setup } from "xstate";

import { isReleaseAudioEnabled } from "@/lib/config/audio-runtime";
import { useClaimMission } from "@/lib/gamification/hooks/use-claim-mission";
import { useDailyMissions } from "@/lib/gamification/hooks/use-daily-missions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import type { GameScope, MissionKind } from "@/lib/gamification/types";
import { cn } from "@/lib/utils";

const ICONS: Record<MissionKind, LucideIcon> = {
  explore: Search,
  signals: Activity,
  predict: Radar,
  battle: Swords,
  collect: Bookmark,
  underdog: Zap,
  social: Users,
};

type GameMissionPanelProps = {
  className?: string;
  description: string;
  eyebrow: string;
  scope: GameScope;
  title: string;
  variant: GameScope;
};

const rewardMachine = setup({
  types: {} as {
    events: { type: "CLAIM" };
  },
}).createMachine({
  id: "gameReward",
  initial: "idle",
  states: {
    idle: {
      on: {
        CLAIM: "burst",
      },
    },
    burst: {
      after: {
        760: "idle",
      },
    },
  },
});

let rewardSoundSrc: string | null = null;

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function getRewardSoundSrc() {
  if (rewardSoundSrc) {
    return rewardSoundSrc;
  }

  const sampleRate = 22050;
  const duration = 0.18;
  const sampleCount = Math.floor(sampleRate * duration);
  const bytes = new Uint8Array(44 + sampleCount * 2);
  const view = new DataView(bytes.buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.max(0, 1 - index / sampleCount);
    const tone = Math.sin(2 * Math.PI * 660 * time) * 0.28 * envelope;
    const overtone = Math.sin(2 * Math.PI * 990 * time) * 0.12 * envelope;
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, tone + overtone)) * 32767, true);
  }

  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  rewardSoundSrc = `data:audio/wav;base64,${btoa(binary)}`;
  return rewardSoundSrc;
}

async function fireRewardBurst(variant: GameMissionPanelProps["variant"]) {
  const [{ default: confetti }, { Howl }] = await Promise.all([
    import("canvas-confetti"),
    import("howler"),
  ]);
  const colors =
    variant === "radar"
      ? ["#f3bf4c", "#39d2f6", "#6a3cff", "#ffffff"]
      : ["#6a3cff", "#39d2f6", "#ff6b9a", "#f3bf4c"];

  confetti({
    colors,
    disableForReducedMotion: true,
    origin: { y: 0.72 },
    particleCount: 58,
    scalar: 0.85,
    spread: 62,
  });

  confetti({
    angle: 120,
    colors,
    disableForReducedMotion: true,
    origin: { x: 0.92, y: 0.58 },
    particleCount: 24,
    scalar: 0.75,
    spread: 46,
  });

  if (isReleaseAudioEnabled()) {
    new Howl({
      src: [getRewardSoundSrc()],
      volume: 0.24,
    }).play();
  }
}

export function GameMissionPanel({
  className,
  description,
  eyebrow,
  scope,
  title,
  variant,
}: GameMissionPanelProps) {
  const [rewardState, sendReward] = useMachine(rewardMachine);
  const { missions, isLoading } = useDailyMissions(scope);
  const claimMissionMutation = useClaimMission();

  const profile = useGameProgressStore((state) => state.profile);
  const localXp = useGameProgressStore((state) => state.totalXp);
  const displayXp = profile?.xp ?? localXp;

  const totals = useMemo(() => {
    const completed = missions.filter((mission) => mission.progress >= mission.target).length;
    const progress = missions.reduce((sum, mission) => {
      const safeTarget = Math.max(1, mission.target);
      return sum + Math.min(1, mission.progress / safeTarget);
    }, 0);
    const rewardXp = missions
      .filter((mission) => mission.status !== "claimed")
      .reduce((sum, mission) => sum + mission.xp_reward, 0);

    return {
      completed,
      missionCount: missions.length,
      progressPercent: Math.round((progress / Math.max(1, missions.length)) * 100),
      rewardXp,
      allCompleted: missions.length > 0 && missions.every((m) => m.progress >= m.target),
      allClaimed: missions.length > 0 && missions.every((m) => m.status === "claimed"),
    };
  }, [missions]);

  const isClaimed = totals.allClaimed;
  const canClaim =
    !isLoading && !claimMissionMutation.isPending && totals.allCompleted && !isClaimed;

  async function handleClaim() {
    if (!canClaim) {
      return;
    }

    const pending = missions.filter(
      (mission) => mission.status === "completed" && mission.progress >= mission.target,
    );

    let awardedXp = 0;

    try {
      for (const mission of pending) {
        await claimMissionMutation.mutateAsync(mission.id);
        awardedXp += mission.xp_reward;
      }
    } catch (error) {
      toast.error("Impossibile riscattare", {
        description: error instanceof Error ? error.message : "Riprova più tardi.",
      });
      return;
    }

    const xpToAward = awardedXp > 0 ? awardedXp : totals.rewardXp;
    const totalXp = (profile?.xp ?? localXp) + xpToAward;

    sendReward({ type: "CLAIM" });
    void fireRewardBurst(variant);
    toast.success("Ricompensa sbloccata", {
      description: `+${xpToAward} XP. Totale: ${totalXp} XP.`,
    });
  }

  return (
    <motion.section
      className={cn("game-mission-panel", `game-mission-panel--${variant}`, className)}
      data-state={rewardState.matches("burst") ? "burst" : "idle"}
      initial={{ opacity: 0, y: 18, scale: 0.99 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="game-mission-panel__topline">
        <span className="game-mission-panel__eyebrow">
          <Sparkles aria-hidden="true" />
          {eyebrow}
        </span>
        <span className="game-mission-panel__xp" aria-label={`${displayXp} XP totali`}>
          XP
          <strong>
            <NumberFlow value={displayXp} />
          </strong>
        </span>
      </div>

      <div className="game-mission-panel__intro">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="game-mission-panel__progress" aria-label={`${totals.progressPercent}% completato`}>
          <NumberFlow value={totals.progressPercent} suffix="%" />
          <span>
            {totals.completed}/{totals.missionCount}
          </span>
        </div>
      </div>

      <div className="game-mission-panel__meter" aria-hidden="true">
        <span style={{ width: `${totals.progressPercent}%` }} />
      </div>

      <div className="game-mission-panel__missions">
        {isLoading ? (
          <article className="game-mission">
            <span className="game-mission__copy">
              <strong>Caricamento missioni…</strong>
            </span>
          </article>
        ) : (
          missions.map((mission) => {
            const Icon = ICONS[mission.kind] ?? Trophy;
            const complete = mission.progress >= mission.target;
            const claimed = mission.status === "claimed";

            return (
              <article key={mission.id} className="game-mission">
                <span className="game-mission__icon" data-complete={complete || claimed}>
                  {complete || claimed ? <CheckCircle2 aria-hidden="true" /> : <Icon aria-hidden="true" />}
                </span>
                <span className="game-mission__copy">
                  <strong>{mission.title}</strong>
                  <small>{mission.description}</small>
                </span>
                <span className="game-mission__score">
                  <NumberFlow value={Math.min(mission.progress, mission.target)} />
                  <small>/{mission.target}</small>
                </span>
              </article>
            );
          })
        )}
      </div>

      <div className="game-mission-panel__footer">
        <span className="game-mission-panel__reward">
          <Trophy aria-hidden="true" />
          <span>Ricompensa</span>
          <strong>
            <NumberFlow value={totals.rewardXp} prefix="+" /> XP
          </strong>
        </span>
        <button
          type="button"
          className="game-mission-panel__claim"
          disabled={!canClaim}
          onClick={handleClaim}
        >
          {isClaimed ? (
            <>
              <CheckCircle2 aria-hidden="true" />
              Riscattata
            </>
          ) : canClaim ? (
            <>
              <Sparkles aria-hidden="true" />
              Riscatta
            </>
          ) : (
            <>
              <LockKeyhole aria-hidden="true" />
              Bloccata
            </>
          )}
        </button>
      </div>
    </motion.section>
  );
}
