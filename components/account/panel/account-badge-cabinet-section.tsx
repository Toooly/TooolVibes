"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Bookmark,
  Compass,
  Layers,
  Map,
  PenTool,
  Radar,
  Scale,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import type {
  SignalHubAchievementProgress,
  SignalHubBadge,
  SignalProgressHub,
} from "@/lib/signal-progression/hub-contracts";
import { useSignalAchievementFlags } from "@/lib/signal-progression/release-context";

const BADGE_ICONS: Record<string, LucideIcon> = {
  Bookmark,
  UserCheck,
  Scale,
  Compass,
  Layers,
  Radar,
  PenTool,
  BadgeCheck,
  Map,
};

const RARITY_LABELS: Record<SignalHubBadge["rarity"], string> = {
  common: "Comune",
  uncommon: "Particolare",
  rare: "Raro",
};

type TrajectoryItem = {
  code: string;
  title: string;
  current: number;
  target: number;
  hint: string;
};

function buildTrajectory(
  earned: ReadonlySet<string>,
  progress: SignalHubAchievementProgress | null,
): TrajectoryItem[] {
  if (!progress) return [];
  const candidates: TrajectoryItem[] = [
    {
      code: "stack_builder",
      title: "Stack iniziale",
      current: Math.min(progress.savedCount, 5),
      target: 5,
      hint: "strumenti distinti nella tua selezione",
    },
    {
      code: "strategist",
      title: "Decisione ferma",
      current: Math.min(progress.comparisonCount, 5),
      target: 5,
      hint: "confronti completati",
    },
    {
      code: "radar_return",
      title: "Ritorno al segnale",
      current: Math.min(progress.radarDays, 3),
      target: 3,
      hint: "giorni distinti sul Radar",
    },
    {
      code: "curator_mark",
      title: "Segno del builder",
      current: Math.min(progress.collectionJourneysCompleted, 1),
      target: 1,
      hint: "percorso completato",
    },
  ];
  const open = candidates.filter((item) => !earned.has(item.code));
  const started = open.filter((item) => item.current > 0);
  const picked = (started.length > 0 ? started : open).slice(0, 2);
  return picked;
}

function formatEarnedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AccountBadgeCabinetSection({
  hub,
  loading,
}: {
  hub: SignalProgressHub | null;
  loading: boolean;
}) {
  const { badgeCabinetEnabled } = useSignalAchievementFlags();
  if (!badgeCabinetEnabled) return null;

  const badges = hub?.badges ?? [];
  const earnedCodes = new Set(badges.map((badge) => badge.code));
  const trajectory = buildTrajectory(earnedCodes, hub?.achievementProgress ?? null);
  const history = (hub?.recentGrants ?? []).slice(0, 5);

  return (
    <section
      className="mt-6 border-t pt-5"
      style={{ borderColor: "var(--line)" }}
      aria-label="Cabinet dei segni"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="account-label">Cabinet dei segni</p>
        {badges.length > 0 ? (
          <span
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--muted)" }}
          >
            {badges.length} {badges.length === 1 ? "segno" : "segni"}
          </span>
        ) : null}
      </div>

      {loading && !hub ? (
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Caricamento cabinet...
        </p>
      ) : badges.length === 0 ? (
        <div className="mt-4 rounded-[18px] border px-4 py-4" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}>
          <p className="text-sm leading-6" style={{ color: "var(--account-ink)" }}>
            Il cabinet raccoglie i segni del tuo percorso: la prima shortlist,
            la prima decisione, i percorsi completati. Ogni segno arriva
            solo da azioni utili verificate dal server — mai da click ripetuti.
          </p>
          <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
            Prossimo passo utile:{" "}
            <Link href="/archivio" className="section-quiet-link">
              salva il primo strumento nella tua shortlist
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3" aria-label="Segni guadagnati">
          {badges.map((badge) => {
            const Icon = BADGE_ICONS[badge.iconId] ?? Bookmark;
            const earnedDate = formatEarnedDate(badge.earnedAt);
            return (
              <li
                key={badge.code}
                className="flex items-start gap-3 rounded-[18px] border px-4 py-3"
                style={{
                  borderColor:
                    badge.visualIntensity === "elevated"
                      ? "color-mix(in srgb, var(--tv-accent-gold) 45%, transparent)"
                      : "var(--line)",
                  background:
                    badge.visualIntensity === "quiet"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "var(--tv-surface-inverted-raised)",
                    color: "var(--tv-ink-inverted-primary)",
                  }}
                  aria-hidden
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--account-ink)]">
                      {badge.title}
                    </span>
                    <span
                      className="text-xs font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--muted)" }}
                    >
                      {RARITY_LABELS[badge.rarity]}
                    </span>
                  </span>
                  <span
                    className="mt-1 block text-sm leading-6"
                    style={{ color: "var(--muted)" }}
                  >
                    {badge.description}
                  </span>
                  {earnedDate ? (
                    <span
                      className="mt-1 block text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      Guadagnato il {earnedDate}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {trajectory.length > 0 ? (
        <div className="mt-5">
          <p className="account-label">Traiettoria attuale</p>
          <ul className="mt-2 grid gap-2" aria-label="Prossimi traguardi">
            {trajectory.map((item) => (
              <li
                key={item.code}
                className="flex items-center justify-between gap-3 rounded-[16px] border px-4 py-2.5"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
              >
                <span className="text-sm text-[var(--account-ink)]">
                  <span className="font-semibold">{item.title}</span>
                  <span style={{ color: "var(--muted)" }}> — {item.hint}</span>
                </span>
                <span
                  className="shrink-0 text-xs font-semibold tabular-nums"
                  style={{ color: "var(--muted)" }}
                  aria-label={`${item.current} di ${item.target}`}
                >
                  {item.current}/{item.target}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="mt-5">
          <p className="account-label">Storia recente</p>
          <ul className="mt-2 grid gap-1.5" aria-label="Ricompense recenti">
            {history.map((grant) => (
              <li
                key={grant.grantId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate" style={{ color: "var(--muted)" }}>
                  {grant.title}
                </span>
                {grant.displayDelta > 0 ? (
                  <span
                    className="shrink-0 text-xs font-semibold tabular-nums"
                    style={{ color: "var(--account-ink)" }}
                  >
                    +{grant.displayDelta} SP
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
