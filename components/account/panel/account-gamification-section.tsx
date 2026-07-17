"use client";

import Link from "next/link";
import { ArrowRight, Target, Trophy } from "lucide-react";
import NumberFlow from "@number-flow/react";

import { GameMissionPanel } from "@/components/gamification/game-mission-panel";
import { GameProfileBar } from "@/components/gamification/game-profile-bar";
import { VibeTapMiniGame } from "@/components/gamification/vibe-tap-mini-game";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import { useBadges } from "@/lib/gamification/hooks/use-badges";
import { useGameProfile } from "@/lib/gamification/hooks/use-game-profile";
import {
  useGamificationReleaseSummary,
  useGamificationSurface,
} from "@/lib/gamification/release-context";
import { xpProgressInLevel } from "@/lib/gamification/level-utils";

/* ═══════════════════════════════════════════════════════════════
   AccountGamificationSection (B27) — blocco gamification.
   Pannello gioco (livello/XP/reward), missioni e progressi.
   Hook e derivazioni spostati qui dal facade senza cambiare
   ordine o semantica; senza surface rewarded non renderizza.
   ═══════════════════════════════════════════════════════════════ */

export function AccountGamificationSection({
  vibeRushBest,
  submissionsLoading,
  totalSubmissions,
}: {
  vibeRushBest: number;
  submissionsLoading: boolean;
  totalSubmissions: number;
}) {
  const { hasRewardedSurface, firstRewardedSurface } =
    useGamificationReleaseSummary();
  const missionsRelease = useGamificationSurface("missions");
  const vibeRushRelease = useGamificationSurface("vibeRush");
  const { profile: gameProfile, isLoading: isGameProfileLoading } =
    useGameProfile({ enabled: hasRewardedSurface });
  const { badges } = useBadges(firstRewardedSurface ?? "missions", {
    enabled: hasRewardedSurface,
  });
  const localXp = useGameProgressStore((state) => state.totalXp);

  const gameXp = Math.max(gameProfile?.xp ?? 0, localXp);
  const gameLevel = gameProfile?.level ?? 1;
  const gameStreak = gameProfile?.streak_days ?? 0;
  const { current: currentLevelXp, needed: neededLevelXp } = xpProgressInLevel(gameXp);
  const gameProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentLevelXp / neededLevelXp) * 100)),
  );

  if (!hasRewardedSurface) {
    return null;
  }

  return (
    <>
      <div className="account-game-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="account-status-badge">Gamification</span>
              <span className="account-status-badge">Punti reali</span>
            </div>
            <h2 className="account-title mt-4 text-[1.55rem] sm:text-[1.9rem]">
              Gioca, accumula XP, sblocca reward.
            </h2>
            <p className="account-subtitle mt-3 max-w-[42rem]">
              I minigame tornano dentro l&apos;esperienza utente: ogni run completata da loggato salva XP nel profilo e alimenta livello, missioni e badge.
            </p>
          </div>
          <GameProfileBar className="account-game-panel__profile" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="account-game-stat">
            <span>Livello</span>
            <strong>
              <NumberFlow value={gameLevel} />
            </strong>
          </div>
          <div className="account-game-stat">
            <span>XP totali</span>
            <strong>
              <NumberFlow value={gameXp} />
            </strong>
          </div>
          <div className="account-game-stat">
            <span>Reward</span>
            <strong>
              <NumberFlow value={badges.length} />
            </strong>
          </div>
        </div>

        <div className="account-game-meter mt-4" aria-label={`${gameProgressPercent}% verso il prossimo livello`}>
          <span style={{ width: `${gameProgressPercent}%` }} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {vibeRushRelease.persistentRewardsEnabled && (
            <VibeTapMiniGame className="account-game-launcher" badge="+XP" />
          )}
          <Link href="/radar" className="account-btn-secondary">
            <Target size={16} />
            Missioni Radar
          </Link>
          <Link href="/compare" className="account-link">
            Sfide confronto
            <ArrowRight size={14} />
          </Link>
        </div>

        <p className="mt-4 text-[0.82rem] leading-6" style={{ color: "var(--account-muted)" }}>
          {isGameProfileLoading
            ? "Caricamento progressione..."
            : `Serie attuale: ${gameStreak} giorni. Mancano ${Math.max(0, neededLevelXp - currentLevelXp)} XP al prossimo livello.`}
        </p>
      </div>

      {missionsRelease.persistentRewardsEnabled && (
        <GameMissionPanel
          eyebrow="Missioni giornaliere"
          title="Azioni concrete per guadagnare punti"
          description="Le missioni tengono insieme radar, raccolta tool e progressione: quando sono completate puoi riscattare XP e reward."
          scope="radar"
          variant="radar"
        />
      )}

      <div className="account-section-panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--accent-purple)]" />
          <p className="account-label">Progressi e attivita</p>
        </div>
        <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
          I punti devono raccontare cosa stai facendo davvero.
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="account-selection-card p-4">
            <p className="account-label">Best Vibe Rush</p>
            <p className="account-number mt-3">{vibeRushBest}</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Record locale rilevato sul dispositivo.
            </p>
          </div>
          <div className="account-selection-card p-4">
            <p className="account-label">Badge</p>
            <p className="account-number mt-3">{badges.length}</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Reward gia sbloccati sul profilo.
            </p>
          </div>
          <div className="account-selection-card p-4">
            <p className="account-label">Submission</p>
            <p className="account-number mt-3">
              {submissionsLoading ? "..." : totalSubmissions}
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Richieste collegate alla tua email.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
