"use client";

import { usePathname } from "next/navigation";

import { GameMissionDrawer } from "@/components/gamification/game-mission-drawer";
import { VibeTapMiniGame } from "@/components/gamification/vibe-tap-mini-game";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

/**
 * BATCH 37 (MOB-701) — Shell floating dock.
 *
 * Un solo slot floating governato dalla shell: mission entry e Vibe Rush
 * vivono nello stesso contenitore fixed con un'unica geometria safe-area
 * (token `--tv-shell-*`, styles/tokens.css) sopra la bottom nav. Prima i due
 * launcher si auto-posizionavano nello stesso angolo (`.game-mission-fab`
 * senza safe-area + `.site-vibe-rush-fab` inline nell'header) e potevano
 * coprire il quinto item della nav o sovrapporsi tra loro.
 *
 * Reversibilità: ogni launcher resta flaggabile individualmente via registry
 * B04 (`TOOOLVIBES_GAME_MISSIONS_MODE` / `TOOOLVIBES_GAME_VIBE_RUSH_MODE`);
 * il dock non renderizza nulla se nessuna surface è abilitata.
 * Vibe Rush non è globale al launch: il launcher appare solo quando la
 * surface vibeRush è REWARDED (gate invariato, deciso in app/layout.tsx).
 */
const EXCLUDED_ROUTE_PREFIXES = ["/admin", "/auth", "/api", "/_next"];

export function GamificationShell({
  missionsEnabled,
  vibeRushEnabled = false,
}: {
  missionsEnabled: boolean;
  vibeRushEnabled?: boolean;
}) {
  const pathname = usePathname();
  const isOverlayOpen = useMobileUIStore((s) => s.isOverlayOpen);

  const isExcludedRoute = EXCLUDED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isExcludedRoute || (!missionsEnabled && !vibeRushEnabled)) {
    return null;
  }

  return (
    <div
      className="shell-floating-dock"
      data-testid="shell-floating-dock"
      data-overlay-open={isOverlayOpen ? "true" : "false"}
      role="group"
      aria-label="Azioni rapide di gioco"
    >
      {vibeRushEnabled ? (
        <VibeTapMiniGame className="shell-floating-dock__vibe-rush" />
      ) : null}
      {missionsEnabled ? <GameMissionDrawer /> : null}
    </div>
  );
}
