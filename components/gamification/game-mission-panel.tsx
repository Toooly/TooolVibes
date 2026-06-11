"use client";

import { useMemo, useState } from "react";
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

import { useDailyMissions } from "@/lib/gamification/hooks/use-daily-missions";
import { useClaimMission } from "@/lib/gamification/hooks/use-claim-mission";
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

export function GameMissionPanel({
  className,
  description,
  eyebrow,
  scope,
  title,
  variant,
}: GameMissionPanelProps) {
  const [bursting, setBursting] = useState(false);
  const { missions, isLoading } = useDailyMissions(scope);
  const claimMissionMutation = useClaimMission();

  const profile = useGameProgressStore((state) => state.profile);
  const localXp = useGameProgressStore((state) => state.totalXp);
  const displayXp = profile?.xp ?? localXp;

  const totals = useMemo(() => {
    const rewardXp = missions.reduce((sum, mission) => sum + mission.xp_reward, 0);
    const completed = missions.filter((mission) => mission.progress >= mission.target).length;
    const progress = missions.reduce((sum, mission) => {
      const safeTarget = Math.max(1, mission.target);
      return sum + Math.min(1, mission.progress / safeTarget);
    }, 0);

    return {
      completed,
      missionCount: missions.length,
      progressPercent: Math.round((progress / Math.max(1, missions.length)) * 100),
      rewardXp,
      allCompleted: missions.length > 0 && missions.every((m) => m.progress >= m.target),
      allClaimed: missions.length > 0 && missions.every((m) => m.status === "claimed"),
    };
  }, [missions]);

  async function claimAll() {
    if (!totals.allCompleted || totals.allClaimed || claimMissionMutation.isPending) return;

    setBursting(true);
    setTimeout(() => setBursting(false), 760);

    const pending = missions.filter(
      (m) => m.progress >= m.target && m.status !== "claimed"
    );

    for (const mission of pending) {
      await claimMissionMutation.mutateAsync(mission.id);
    }
  }

  function claimOne(missionId: string) {
    if (claimMissionMutation.isPending) return;
    setBursting(true);
    setTimeout(() => setBursting(false), 760);
    claimMissionMutation.mutate(missionId);
  }

  return (
    <motion.section
      className={cn("game-mission-panel", `game-mission-panel--${variant}`, className)}
      data-state={bursting ? "burst" : "idle"}
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
          <strong>{displayXp}</strong>
        </span>
      </div>

      <div className="game-mission-panel__intro">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="game-mission-panel__progress" aria-label={`${totals.progressPercent}% completato`}>
          <span>{totals.progressPercent}%</span>
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
              <strong>Caricamento missioni...</strong>
            </span>
          </article>
        ) : (
          missions.map((mission) => {
            const Icon = ICONS[mission.kind] ?? Sparkles;
            const missionPercent = Math.round(
              (Math.min(mission.progress, mission.target) / Math.max(1, mission.target)) * 100,
            );
            const complete = missionPercent >= 100;
            const claimed = mission.status === "claimed";
            const canClaim = complete && !claimed && !claimMissionMutation.isPending;

            return (
              <article
                key={mission.id}
                className={cn("game-mission", canClaim && "game-mission--claimable")}
              >
                <span className="game-mission__icon" data-complete={complete}>
                  {complete || claimed ? <CheckCircle2 aria-hidden="true" /> : <Icon aria-hidden="true" />}
                </span>
                <span className="game-mission__copy">
                  <strong>{mission.title}</strong>
                  <small>{mission.description}</small>
                </span>
                <span className="game-mission__score">
                  <span>{Math.min(mission.progress, mission.target)}</span>
                  <small>/{mission.target}</small>
                </span>
                {canClaim ? (
                  <button
                    type="button"
                    className="game-mission__claim-one"
                    onClick={() => claimOne(mission.id)}
                    aria-label="Riscatta missione"
                  >
                    <Sparkles aria-hidden="true" />
                  </button>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      <div className="game-mission-panel__footer">
        <span className="game-mission-panel__reward">
          <Trophy aria-hidden="true" />
          <span>Ricompensa</span>
          <strong>+{totals.rewardXp} XP</strong>
        </span>
        <button
          type="button"
          className="game-mission-panel__claim"
          disabled={!totals.allCompleted || totals.allClaimed || claimMissionMutation.isPending}
          onClick={claimAll}
        >
          {totals.allClaimed ? (
            <>
              <CheckCircle2 aria-hidden="true" />
              Riscattata
            </>
          ) : totals.allCompleted ? (
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
