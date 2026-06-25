"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { GlobalCommandPalette } from "@/components/app/global-command-palette";
import { GlobalExperienceLayer } from "@/components/app/global-experience-layer";
import { HomeBrandIntro } from "@/components/app/home-brand-intro";
import { InteractionSoundLayerV2 } from "@/components/app/interaction-sound-layer-v2";
import { MusicAmbienceLayer } from "@/components/app/music-ambience-layer";
import { RouteTransitionLoader } from "@/components/app/route-transition-loader";
import { GameEffectsLayer } from "@/components/gamification/game-effects-layer";
import { MotionObserver } from "@/components/ui/motion-observer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RootProviders({
  children,
  enableExperience = true,
}: {
  children: React.ReactNode;
  enableExperience?: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delay={180}>
        {children}
        {enableExperience && (
          <>
            <HomeBrandIntro />
            <GlobalExperienceLayer />
            <MotionObserver />
            <RouteTransitionLoader />
            <InteractionSoundLayerV2 />
            <MusicAmbienceLayer />
            <GameEffectsLayer />
            <GlobalCommandPalette />
          </>
        )}
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
