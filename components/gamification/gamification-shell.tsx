"use client";

import { usePathname } from "next/navigation";

import { GameMissionDrawer } from "@/components/gamification/game-mission-drawer";

export function GamificationShell() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return null;
  }

  return (
    <>
      <GameMissionDrawer />
    </>
  );
}
