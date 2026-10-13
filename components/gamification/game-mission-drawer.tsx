"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useEffect, useState } from "react";
import { Target } from "lucide-react";

import { useGameProfile } from "@/lib/gamification/hooks/use-game-profile";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DailyResetCountdown } from "@/components/gamification/daily-reset-countdown";
import { RadarGameMissions } from "@/components/gamification/radar-game-missions";
import { cn } from "@/lib/utils";

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    update(mediaQuery);
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}

type GameMissionDrawerProps = {
  className?: string;
};

export function GameMissionDrawer({ className }: GameMissionDrawerProps) {
  const [open, setOpen] = useState(false);
  const { profile } = useGameProfile();
  const isMobile = useIsMobile();

  if (!profile) {
    return null;
  }

  const header = (
    <>
      <div className="game-mission-drawer__heading">
        <div>
          <h2 className="game-mission-drawer__title"><LocalizedText>{"Missioni Radar"}</LocalizedText></h2>
          <p className="game-mission-drawer__subtitle"><LocalizedText>{"Completa le missioni giornaliere per salire di livello. "}</LocalizedText></p>
        </div>
        <DailyResetCountdown size={64} />
      </div>
    </>
  );

  const triggerClassName = cn("game-mission-fab", className);
  const triggerContent = (
    <>
      <Target size={22} aria-hidden="true" />
      <span className="sr-only"><LocalizedText>{"Apri le missioni giornaliere"}</LocalizedText></span>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger className={triggerClassName}>
          {triggerContent}
        </DrawerTrigger>
        <DrawerContent className="game-mission-drawer game-mission-drawer--mobile">
          <DrawerTitle className="sr-only"><LocalizedText>{"Missioni Radar"}</LocalizedText></DrawerTitle>
          <div className="game-mission-drawer__body">
            {header}
            <RadarGameMissions />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={triggerClassName}>
        {triggerContent}
      </SheetTrigger>
      <SheetContent side="right" className="game-mission-drawer game-mission-drawer--desktop">
        <SheetHeader className="sr-only">
          <SheetTitle><LocalizedText>{"Missioni Radar"}</LocalizedText></SheetTitle>
        </SheetHeader>
        <div className="game-mission-drawer__body">
          {header}
          <RadarGameMissions />
        </div>
      </SheetContent>
    </Sheet>
  );
}
