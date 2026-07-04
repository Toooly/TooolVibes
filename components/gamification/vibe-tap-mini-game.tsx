"use client";

import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import {
  Flame,
  Gauge,
  MousePointer2,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { playTooolvibesSound } from "@/lib/config/sound";
import { recordGameInteraction, checkAndAwardBadges } from "@/lib/gamification/actions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import { useGameProfile } from "@/lib/gamification/hooks/use-game-profile";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type GameModeId = "rush" | "focus" | "fever";
type UpgradeId = "tap" | "auto" | "crit";

type VibeTarget = {
  id: number;
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  delay: number;
};

type FloatingScore = {
  id: number;
  x: number;
  y: number;
  value: number;
  label?: string;
  critical?: boolean;
};

type GameMode = {
  id: GameModeId;
  label: string;
  title: string;
  seconds: number;
  target: number;
  targetCount: number;
  scoreMultiplier: number;
  autoMultiplier: number;
  description: string;
  perk: string;
};

type UpgradeDefinition = {
  id: UpgradeId;
  label: string;
  description: string;
  baseCost: number;
  maxLevel: number;
};

type UpgradeLevels = Record<UpgradeId, number>;

type VibeTapMiniGameProps = {
  className?: string;
  badge?: string;
};

type AwardState = "idle" | "guest" | "saving" | "saved" | "error";

const GAME_MODES: GameMode[] = [
  {
    id: "rush",
    label: "Sprint",
    title: "Sprint classico",
    seconds: 20,
    target: 95,
    targetCount: 4,
    scoreMultiplier: 1,
    autoMultiplier: 1,
    description: "Partita bilanciata: tocchi, combo e potenziamenti contano tutti.",
    perk: "Moltiplicatore stabile",
  },
  {
    id: "focus",
    label: "Concentrazione",
    title: "Preparazione lunga",
    seconds: 30,
    target: 125,
    targetCount: 3,
    scoreMultiplier: 0.9,
    autoMultiplier: 1.25,
    description: "Più tempo per costruire potenziamenti e lasciare lavorare l'impulso automatico.",
    perk: "Impulso automatico potenziato",
  },
  {
    id: "fever",
    label: "Frenesia",
    title: "Scatto veloce",
    seconds: 15,
    target: 115,
    targetCount: 5,
    scoreMultiplier: 1.35,
    autoMultiplier: 0.75,
    description: "Pochi secondi, tanti colpi doppi: perfetta se vuoi spingere sul centro.",
    perk: "Tocchi più esplosivi",
  },
];

const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    id: "tap",
    label: "Tocco potenziato",
    description: "+1 vibe base per ogni tocco sul centro.",
    baseCost: 14,
    maxLevel: 5,
  },
  {
    id: "auto",
    label: "Impulso automatico",
    description: "Genera vibe ogni secondo durante la partita.",
    baseCost: 24,
    maxLevel: 4,
  },
  {
    id: "crit",
    label: "Colpi doppi",
    description: "Aumenta la probabilità di ottenere colpi doppi.",
    baseCost: 28,
    maxLevel: 4,
  },
];

const INITIAL_UPGRADES: UpgradeLevels = {
  tap: 0,
  auto: 0,
  crit: 0,
};

const DEFAULT_MODE = GAME_MODES[0];
const MAX_COMBO = 12;
const BEST_SCORE_STORAGE_KEY = "tooolvibes:vibe-rush-best";
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function createTargets(seed: number, count: number): VibeTarget[] {
  return Array.from({ length: count }).map((_, index) => {
    const angle = (seed * 41 + index * 73) % 360;
    const radius = 13 + ((seed + index * 19) % 24);
    const direction = (seed + index) % 2 === 0 ? 1 : -1;

    return {
      id: seed * 10 + index,
      x: Math.min(82, Math.max(18, 50 + Math.cos((angle * Math.PI) / 180) * radius)),
      y: Math.min(78, Math.max(22, 50 + Math.sin((angle * Math.PI) / 180) * radius)),
      size: 2.2 + ((seed + index) % 4) * 0.28,
      driftX: direction * (7 + ((seed * 5 + index * 3) % 9)),
      driftY: -direction * (5 + ((seed * 7 + index * 5) % 8)),
      delay: index * 0.1,
    };
  });
}

function getUpgradeCost(definition: UpgradeDefinition, level: number) {
  return Math.round(definition.baseCost * Math.pow(level + 1, 1.42));
}

function getRank(score: number, target: number) {
  const ratio = target > 0 ? score / target : 0;
  if (ratio >= 1.45) return "S+";
  if (ratio >= 1.15) return "S";
  if (ratio >= 0.92) return "A";
  if (ratio >= 0.68) return "B";
  return "C";
}

async function celebrateMiniGame(score: number, rank: string) {
  const { default: confetti } = await import("canvas-confetti");

  confetti({
    colors: rank.startsWith("S")
      ? ["#f3bf4c", "#39d2f6", "#ffffff", "#ff5eb8"]
      : ["#6a3cff", "#39d2f6", "#f3bf4c", "#ffffff"],
    disableForReducedMotion: true,
    origin: { y: 0.58 },
    particleCount: Math.min(130, 42 + Math.round(score * 0.72)),
    scalar: rank.startsWith("S") ? 0.9 : 0.78,
    spread: rank.startsWith("S") ? 70 : 54,
  });
}

function CircularTimer({ seconds, total }: { seconds: number; total: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, seconds / total);
  const dash = circumference * progress;
  const urgent = seconds <= 4;

  return (
    <div className="vibe-mini-game__timer" data-urgent={urgent} aria-hidden="true">
      <svg viewBox="0 0 44 44">
        <circle className="vibe-mini-game__timer-track" cx="22" cy="22" r={radius} />
        <circle
          className="vibe-mini-game__timer-fill"
          cx="22"
          cy="22"
          r={radius}
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={0}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <NumberFlow value={seconds} />
    </div>
  );
}

export function VibeTapMiniGame({ className, badge }: VibeTapMiniGameProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const { profile } = useGameProfile();
  const setProfile = useGameProgressStore((state) => state.setProfile);
  const setPendingLevelUp = useGameProgressStore((state) => state.setPendingLevelUp);
  const addBadge = useGameProgressStore((state) => state.addBadge);
  const setPendingBadge = useGameProgressStore((state) => state.setPendingBadge);
  const [open, setOpen] = useState(false);
  const [modeId, setModeId] = useState<GameModeId>(DEFAULT_MODE.id);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_MODE.seconds);
  const [score, setScore] = useState(0);
  const [bank, setBank] = useState(0);
  const [combo, setCombo] = useState(1);
  const [streak, setStreak] = useState(0);
  const [wave, setWave] = useState(1);
  const [finished, setFinished] = useState(false);
  const [floaters, setFloaters] = useState<FloatingScore[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [upgrades, setUpgrades] = useState<UpgradeLevels>(INITIAL_UPGRADES);
  const [upgradeCount, setUpgradeCount] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [awardState, setAwardState] = useState<AwardState>("idle");
  const [awardedXp, setAwardedXp] = useState(0);
  const prevComboRef = useRef(1);
  const scoreRef = useRef(score);
  const bankRef = useRef(bank);
  const comboRef = useRef(combo);
  const floaterIdRef = useRef(0);
  const comboResetRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const startLockedRef = useRef(false);

  const selectedMode = useMemo(
    () => GAME_MODES.find((mode) => mode.id === modeId) ?? DEFAULT_MODE,
    [modeId],
  );

  const targets = useMemo(
    () => createTargets(wave, selectedMode.targetCount),
    [wave, selectedMode.targetCount],
  );

  const tapPower = 1 + upgrades.tap;
  const autoPower = Math.round(upgrades.auto * selectedMode.autoMultiplier);
  const critChance = Math.min(42, 8 + upgrades.crit * 7 + (modeId === "fever" ? 6 : 0));
  const charge = Math.min(100, Math.round((score / selectedMode.target) * 100));
  const rank = getRank(score, selectedMode.target);
  const xp = Math.round(score * (modeId === "fever" ? 1.8 : 1.5) + upgradeCount * 6);
  const missionTargetScore = Math.min(score, selectedMode.target);
  const missionCombo = Math.min(combo, 8);
  const missionUpgrades = Math.min(upgradeCount, 3);

  const badgeMutation = useMutation({
    mutationFn: checkAndAwardBadges,
    onSuccess: (awarded) => {
      if (awarded.length === 0) return;
      awarded.forEach((userBadge) => addBadge(userBadge));
      setPendingBadge(awarded[0].badge);
      void queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    },
  });

  const awardMutation = useMutation({
    mutationFn: recordGameInteraction,
    onMutate: (xpDelta) => {
      setAwardState("saving");
      setAwardedXp(xpDelta);
    },
    onSuccess: (nextProfile, xpDelta) => {
      const previousLevel = profile?.level ?? 1;
      setProfile(nextProfile);
      if (nextProfile.level > previousLevel) {
        setPendingLevelUp(nextProfile.level);
      }
      setAwardState("saved");
      void queryClient.invalidateQueries({ queryKey: ["game-profile"] });
      void badgeMutation.mutateAsync().catch(() => undefined);
      toast.success("XP salvati nel profilo", {
        description: `+${xpDelta} XP. Livello ${nextProfile.level}.`,
      });
    },
    onError: () => {
      setAwardState("error");
      toast.error("XP non salvati", {
        description: "La partita resta visibile qui. Riprova quando la sessione e stabile.",
      });
    },
  });

  const awardRunToProfile = useCallback((finalScore: number, finalXp: number) => {
    if (finalScore <= 0 || finalXp <= 0) {
      setAwardState("idle");
      setAwardedXp(0);
      return;
    }

    if (!profile) {
      setAwardState("guest");
      setAwardedXp(finalXp);
      return;
    }

    awardMutation.mutate(finalXp);
  }, [awardMutation, profile]);

  const closeGame = useCallback(() => {
    setOpen(false);
    setRunning(false);
    setFinished(false);
    setScore(0);
    setBank(0);
    setCombo(1);
    setStreak(0);
    setTimeLeft(selectedMode.seconds);
    setFloaters([]);
    setSignupEmail("");
    setUpgrades(INITIAL_UPGRADES);
    setUpgradeCount(0);
    setAwardState("idle");
    setAwardedXp(0);
    startLockedRef.current = false;
    if (comboResetRef.current) {
      window.clearTimeout(comboResetRef.current);
      comboResetRef.current = null;
    }
  }, [selectedMode.seconds]);

  const finishRun = useCallback(() => {
    setRunning(false);
    setCombo(1);
    setStreak(0);
    setFinished(true);
    if (comboResetRef.current) {
      window.clearTimeout(comboResetRef.current);
      comboResetRef.current = null;
    }

    const finalScore = scoreRef.current;
    const finalRank = getRank(finalScore, selectedMode.target);
    const finalXp = Math.round(
      finalScore * (modeId === "fever" ? 1.8 : 1.5) + upgradeCount * 6,
    );

    if (finalScore > bestScore) {
      setBestScore(finalScore);
      window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(finalScore));
    }

    void celebrateMiniGame(finalScore, finalRank);
    toast.success(finalRank.startsWith("S") ? "Vibe Rush dominato" : "Vibe Rush completato", {
      description: `Grado ${finalRank} - ${finalScore} vibe in ${selectedMode.seconds} secondi.`,
    });
    awardRunToProfile(finalScore, finalXp);
  }, [
    awardRunToProfile,
    bestScore,
    modeId,
    selectedMode.seconds,
    selectedMode.target,
    upgradeCount,
  ]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    bankRef.current = bank;
  }, [bank]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    const stored = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    if (stored) {
      setBestScore(Number(stored) || 0);
    }
  }, []);

  useEffect(() => {
    if (!running && !finished) {
      setTimeLeft(selectedMode.seconds);
    }
  }, [finished, running, selectedMode.seconds]);

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || autoPower <= 0) return undefined;

    const timer = window.setInterval(() => {
      const gain = Math.max(1, autoPower);
      setScore((current) => current + gain);
      setBank((current) => current + gain);
      spawnFloater(18 + Math.random() * 64, 28 + Math.random() * 44, gain, "automatico");
    }, 1000);

    return () => window.clearInterval(timer);
  }, [autoPower, running]);

  useEffect(() => {
    if (!running || timeLeft > 0) return;

    finishRun();
  }, [finishRun, running, timeLeft]);

  useEffect(() => {
    if (combo > prevComboRef.current && (combo === 4 || combo === 8 || combo === 12)) {
      setAnnouncement(`Combo x${combo}`);
      playTooolvibesSound("battleHit");
    }
    prevComboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    if (finished) {
      setAnnouncement(`Partita finita. Grado ${rank}. ${score} vibe raccolti. Più ${xp} XP.`);
    }
  }, [finished, rank, score, xp]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const first = focusables[0];
    if (first) {
      window.setTimeout(() => first.focus(), 0);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGame();
        return;
      }

      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) return;

      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeGame, open]);

  useEffect(() => {
    if (!open && wasOpenRef.current) {
      launcherRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  function spawnFloater(x: number, y: number, value: number, label?: string, critical?: boolean) {
    const id = ++floaterIdRef.current;
    setFloaters((current) => [...current, { id, x, y, value, label, critical }]);
    window.setTimeout(() => {
      setFloaters((current) => current.filter((f) => f.id !== id));
    }, 720);
  }

  function resetComboLater() {
    if (comboResetRef.current) {
      window.clearTimeout(comboResetRef.current);
    }
    comboResetRef.current = window.setTimeout(() => {
      setCombo(1);
      setStreak(0);
    }, upgrades.crit >= 3 ? 1500 : 1050);
  }

  function startGame() {
    if (running || startLockedRef.current) return;
    startLockedRef.current = true;
    setScore(0);
    setBank(0);
    setCombo(1);
    setStreak(0);
    setFinished(false);
    setWave((current) => current + 1);
    setTimeLeft(selectedMode.seconds);
    setRunning(true);
    setFloaters([]);
    setUpgrades(INITIAL_UPGRADES);
    setUpgradeCount(0);
    setAwardState("idle");
    setAwardedXp(0);
    setAnnouncement(`${selectedMode.label} iniziata. Tocca il centro.`);
    playTooolvibesSound("battleStart");
    window.setTimeout(() => {
      startLockedRef.current = false;
    }, 220);
  }

  function awardTap(x: number, y: number, bonus = 0) {
    if (!running) return;

    const nextCombo = Math.min(MAX_COMBO, comboRef.current + 1);
    const comboBonus = Math.floor(comboRef.current / 3);
    const critical = Math.random() * 100 < critChance;
    const rawGain = (tapPower + comboBonus + bonus) * selectedMode.scoreMultiplier;
    const gain = Math.max(1, Math.round(rawGain * (critical ? 2 : 1)));

    setScore((current) => current + gain);
    setBank((current) => current + gain);
    setCombo(nextCombo);
    setStreak((current) => current + 1);
    spawnFloater(x, y, gain, critical ? "doppio" : undefined, critical);
    resetComboLater();
    playTooolvibesSound(critical ? "battleWin" : "tap");
  }

  function handleCorePointer(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const stage = event.currentTarget.closest<HTMLElement>(".vibe-mini-game__stage");
    const stageRect = stage?.getBoundingClientRect();
    const x = stageRect ? ((rect.left + rect.width / 2 - stageRect.left) / stageRect.width) * 100 : 50;
    const y = stageRect ? ((rect.top + rect.height / 2 - stageRect.top) / stageRect.height) * 100 : 50;
    awardTap(x, y);
  }

  function handleCoreKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      awardTap(50, 50);
    }
  }

  function hitTarget(targetX: number, targetY: number) {
    awardTap(targetX, targetY, 4);
    setWave((current) => current + 1);
  }

  function buyUpgrade(definition: UpgradeDefinition) {
    if (!running) return;

    const currentLevel = upgrades[definition.id];
    if (currentLevel >= definition.maxLevel) return;

    const cost = getUpgradeCost(definition, currentLevel);
    if (bankRef.current < cost) {
      setAnnouncement(`Servono ${cost} vibe per ${definition.label}.`);
      playTooolvibesSound("warning");
      return;
    }

    setBank((current) => current - cost);
    setUpgrades((current) => ({
      ...current,
      [definition.id]: current[definition.id] + 1,
    }));
    setUpgradeCount((current) => current + 1);
    setAnnouncement(`${definition.label} livello ${currentLevel + 1}.`);
    playTooolvibesSound("levelUp");
  }

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = signupEmail.trim().toLowerCase();
    if (!email) return;

    const params = new URLSearchParams({
      source: "vibe-rush",
      email,
      vibes: String(score),
      xp: String(xp),
    });

    closeGame();
    router.push(`/account?${params.toString()}#account-upgrade`);
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={cn("vibe-mini-launcher", className)}
        aria-label="Apri il minigioco Vibe Rush"
        onClick={() => setOpen(true)}
        data-sonic-action="tap"
      >
        <span className="vibe-mini-launcher__core" aria-hidden="true">
          <Play size={15} />
          {badge ? (
            <span className="vibe-mini-launcher__core-badge" aria-hidden="true">
              {badge}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
        </span>
        <span className="vibe-mini-launcher__label">Vibe Rush</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="vibe-mini-game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Minigioco Vibe Rush"
          >
            <button
              type="button"
              className="vibe-mini-game__backdrop"
              aria-label="Chiudi minigioco"
              onClick={closeGame}
            />
            <motion.div
              ref={panelRef}
              className="vibe-mini-game__panel"
              initial={{ y: 18, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 12, scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
            >
              <div className="vibe-mini-game__top">
                <div>
                  <p className="vibe-mini-game__eyebrow">Minigioco a tocchi</p>
                  <h2>Vibe Rush</h2>
                </div>
                <button type="button" aria-label="Chiudi Vibe Rush" onClick={closeGame}>
                  <X size={18} />
                </button>
              </div>

              <span className="sr-only" aria-live="polite" aria-atomic="true">
                {announcement}
              </span>

              <div className="vibe-mini-game__modes" aria-label="Modalità Vibe Rush">
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={mode.id === modeId ? "is-active" : undefined}
                    disabled={running}
                    onClick={() => setModeId(mode.id)}
                  >
                    <span>{mode.label}</span>
                    <small>{mode.seconds}s</small>
                  </button>
                ))}
              </div>

              <div className="vibe-mini-game__mode-card">
                <div>
                  <strong>{selectedMode.title}</strong>
                  <span>{selectedMode.description}</span>
                </div>
                <em>{selectedMode.perk}</em>
              </div>

              <div className="vibe-mini-game__stats">
                <span>
                  Punti <strong><NumberFlow value={score} /></strong>
                </span>
                <span>
                  Riserva <strong><NumberFlow value={bank} /></strong>
                </span>
                <span data-combo={combo}>
                  Combo <strong>x
                    <span className="vibe-mini-game__combo">
                      <NumberFlow value={combo} />
                      <motion.span
                        key={combo}
                        className="vibe-mini-game__combo-pulse"
                        aria-hidden="true"
                        initial={{ scale: 1, opacity: reducedMotion ? 0 : 0.5 }}
                        animate={{
                          scale: reducedMotion ? 1 : [1, 1.35, 1],
                          opacity: reducedMotion ? 0 : [0.5, 0, 0.5],
                        }}
                        transition={{ duration: 0.25 }}
                      />
                    </span>
                  </strong>
                </span>
                <span>
                  Tempo <CircularTimer seconds={timeLeft} total={selectedMode.seconds} />
                </span>
              </div>

              <div className="vibe-mini-game__body">
                <div className="vibe-mini-game__stage" data-running={running} data-finished={finished}>
                  <div className="vibe-mini-game__arena-hud">
                    <span>
                      <MousePointer2 size={13} />
                      +{tapPower}/tocco
                    </span>
                    <span>
                      <Gauge size={13} />
                      {autoPower}/s
                    </span>
                    <span>
                      <Flame size={13} />
                      {critChance}% doppio
                    </span>
                  </div>

                  <span
                    className="vibe-mini-game__charge"
                    style={{ "--charge-scale": `${charge / 100}` } as CSSProperties}
                  />

                  {running ? targets.map((target) => (
                    <motion.button
                      key={target.id}
                      type="button"
                      className="vibe-mini-game__target"
                      style={
                        {
                          left: `${target.x}%`,
                          top: `${target.y}%`,
                          width: `${target.size}rem`,
                        } as CSSProperties
                      }
                      initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
                      animate={
                        reducedMotion
                          ? {}
                          : {
                              scale: [0.82, 1.24, 0.74, 1.08, 0.92],
                              opacity: [0.84, 1, 0.88, 1, 0.9],
                              x: [0, target.driftX, target.driftX * -0.42, 0],
                              y: [0, target.driftY, target.driftY * -0.58, 0],
                            }
                      }
                      transition={{
                        duration: 1.45 + target.delay,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                        delay: target.delay,
                      }}
                      whileTap={reducedMotion ? undefined : { scale: 0.76 }}
                      onClick={() => hitTarget(target.x, target.y)}
                      aria-label={`Bonus Vibe Rush ${target.id}`}
                    >
                      <Sparkles size={15} />
                    </motion.button>
                  )) : null}

                  <button
                    type="button"
                    className="vibe-mini-game__core-tap"
                    data-running={running}
                    disabled={!running}
                    onPointerDown={handleCorePointer}
                    onKeyDown={handleCoreKey}
                    aria-label="Tocca il centro Vibe Rush"
                  >
                    <span className="vibe-mini-game__core-rings" aria-hidden="true" />
                    <span className="vibe-mini-game__core-orb">
                      <Zap size={24} />
                    </span>
                    <strong>Tocca il centro</strong>
                    <small>{streak > 0 ? `Serie da ${streak}` : "Carica vibe"}</small>
                  </button>

                  <AnimatePresence>
                    {floaters.map((f) => (
                      <motion.span
                        key={f.id}
                        className="vibe-mini-game__floater"
                        data-critical={f.critical}
                        initial={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        animate={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -34, scale: 1.15 }}
                        exit={{ opacity: 0 }}
                        transition={
                          reducedMotion
                            ? { duration: 0.3 }
                            : { duration: 0.62, ease: "easeOut" }
                        }
                        style={{ left: `${f.x}%`, top: `${f.y}%` } as CSSProperties}
                      >
                        {f.label ? `${f.label} ` : null}+{f.value}
                      </motion.span>
                    ))}
                  </AnimatePresence>

                  {!running && !finished ? (
                    <button
                      type="button"
                      className="vibe-mini-game__start"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        startGame();
                      }}
                      onClick={startGame}
                    >
                      <Rocket size={16} />
                      Avvia {selectedMode.label}
                    </button>
                  ) : null}

                  {finished ? (
                    <div className="vibe-mini-game__result">
                      <span className="vibe-mini-game__result-title">
                        {rank.startsWith("S") ? "Partita leggendaria" : "Partita completata"}
                      </span>
                      <span className="vibe-mini-game__result-rank">
                        Grado {rank}
                      </span>
                      <span className="vibe-mini-game__result-score">
                        <NumberFlow value={score} /> vibe raccolti
                      </span>
                      <span className="vibe-mini-game__result-xp">+{xp} XP - Record {Math.max(bestScore, score)}</span>
                      <span className="vibe-mini-game__result-save" data-state={awardState}>
                        {awardState === "saving"
                          ? "Salvataggio XP in corso..."
                          : awardState === "saved"
                            ? `XP salvati nel profilo: +${awardedXp || xp}`
                            : awardState === "error"
                              ? "XP non salvati. Riprova dalla tua area utente."
                              : awardState === "guest"
                                ? "Accedi per salvare XP, progressione e reward."
                                : "Completa la partita per salvare gli XP."}
                      </span>
                      <div className="vibe-mini-game__result-actions">
                        <button
                          type="button"
                          className="vibe-mini-game__start"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            startGame();
                          }}
                          onClick={startGame}
                        >
                          <Zap size={16} />
                          Gioca ancora
                        </button>
                        <button type="button" className="vibe-mini-game__hint-btn" onClick={closeGame}>
                          Chiudi
                        </button>
                      </div>
                      {!profile ? (
                        <form className="vibe-mini-game__signup" onSubmit={handleSignup}>
                          <p>Salva progressi, XP e risultato nel tuo profilo TooolVibes.</p>
                          <div>
                            <input
                              type="email"
                              value={signupEmail}
                              onChange={(event) => setSignupEmail(event.target.value)}
                              placeholder="la tua email"
                              autoComplete="email"
                            />
                            <button type="submit" disabled={!signupEmail.trim()}>
                              Registrati
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <aside className="vibe-mini-game__side">
                  <section className="vibe-mini-game__upgrades" aria-label="Potenziamenti Vibe Rush">
                    <div className="vibe-mini-game__side-title">
                      <Rocket size={14} />
                      <span>Potenziamenti</span>
                    </div>
                    {UPGRADE_DEFINITIONS.map((definition) => {
                      const level = upgrades[definition.id];
                      const cost = getUpgradeCost(definition, level);
                      const maxed = level >= definition.maxLevel;
                      return (
                        <button
                          key={definition.id}
                          type="button"
                          disabled={!running || maxed || bank < cost}
                          onClick={() => buyUpgrade(definition)}
                          className="vibe-mini-game__upgrade"
                        >
                          <span>
                            <strong>{definition.label}</strong>
                            <small>{definition.description}</small>
                          </span>
                          <em>{maxed ? "Massimo" : `${cost}`}</em>
                        </button>
                      );
                    })}
                  </section>

                  <section className="vibe-mini-game__missions" aria-label="Missioni partita">
                    <div className="vibe-mini-game__side-title">
                      <Target size={14} />
                      <span>Missioni</span>
                    </div>
                    <div className="vibe-mini-game__mission">
                      <span>Obiettivo modalità</span>
                      <strong><NumberFlow value={missionTargetScore} />/{selectedMode.target}</strong>
                      <i style={{ "--mission-progress": `${missionTargetScore / selectedMode.target}` } as CSSProperties} />
                    </div>
                    <div className="vibe-mini-game__mission">
                      <span>Combo x8</span>
                      <strong><NumberFlow value={missionCombo} />/8</strong>
                      <i style={{ "--mission-progress": `${missionCombo / 8}` } as CSSProperties} />
                    </div>
                    <div className="vibe-mini-game__mission">
                      <span>3 potenziamenti</span>
                      <strong><NumberFlow value={missionUpgrades} />/3</strong>
                      <i style={{ "--mission-progress": `${missionUpgrades / 3}` } as CSSProperties} />
                    </div>
                  </section>

                  <section className="vibe-mini-game__facts" aria-label="Dati della partita">
                    <div className="vibe-mini-game__side-title">
                      <ShieldCheck size={14} />
                      <span>Dati partita</span>
                    </div>
                    <span><Timer size={13} /> {selectedMode.seconds}s a disposizione</span>
                    <span><Trophy size={13} /> Record {bestScore}</span>
                    <span><Flame size={13} /> Grado attuale {rank}</span>
                  </section>
                </aside>
              </div>

              {!running && !finished ? (
                <p className="vibe-mini-game__hint">
                  Scegli una modalità, tocca il centro, compra potenziamenti e completa le missioni.
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
