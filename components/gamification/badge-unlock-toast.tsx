"use client";

import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import {
  Bookmark,
  Flame,
  Radar,
  Sparkles,
  Swords,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { playGameSound } from "@/lib/gamification/sound-engine";
import type { Badge } from "@/lib/gamification/types";

const ICONS: Record<string, LucideIcon> = {
  Radar,
  Swords,
  Trophy,
  Sparkles,
  Bookmark,
  Flame,
};

type BadgeUnlockToastProps = {
  badge: Badge;
  toastId: string | number;
};

// Gaming toast for newly unlocked badges, including XP motion toward the persistent HUD.
export function BadgeUnlockToast({ badge, toastId }: BadgeUnlockToastProps) {
  const Icon = ICONS[badge.icon] ?? Sparkles;

  return (
    <motion.div
      className="badge-unlock-toast"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      role="article"
      aria-label={`Badge sbloccato: ${badge.name}`}
    >
      <motion.span
        className="badge-unlock-toast__icon"
        animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
      >
        <Icon aria-hidden="true" size={24} />
      </motion.span>

      <span className="badge-unlock-toast__copy">
        <small>Badge sbloccato</small>
        <strong>{badge.name}</strong>
        <span>{badge.description}</span>
      </span>

      <motion.span
        className="badge-unlock-toast__xp"
        initial={{ x: 0, y: 0, opacity: 0 }}
        animate={{ x: [0, 18, 42], y: [8, -8, -22], opacity: [0, 1, 0] }}
        transition={{ delay: 0.45, duration: 1.05, ease: "easeOut" }}
      >
        +<NumberFlow value={badge.xp_bonus} /> XP
      </motion.span>

      <button
        type="button"
        className="badge-unlock-toast__close"
        aria-label="Chiudi notifica badge"
        onClick={() => toast.dismiss(toastId)}
      >
        <X aria-hidden="true" size={14} />
      </button>
    </motion.div>
  );
}

export function showBadgeUnlockToast(badge: Badge) {
  playGameSound("badgeUnlock");
  toast.custom(
    (toastId) => <BadgeUnlockToast badge={badge} toastId={toastId} />,
    {
      duration: 5200,
      position: "top-center",
      className: "badge-unlock-toast-shell",
    },
  );
}
