"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { GlobalCommandPalette } from "@/components/app/global-command-palette";
import { GlobalExperienceLayer } from "@/components/app/global-experience-layer";
import { InteractionSoundLayerV2 } from "@/components/app/interaction-sound-layer-v2";
import { MusicAmbienceLayer } from "@/components/app/music-ambience-layer";
import { ExperienceReleaseProvider } from "@/lib/config/release-context";
import { RouteTransitionLoader } from "@/components/app/route-transition-loader";
import { GameEffectsLayer } from "@/components/gamification/game-effects-layer";
import {
  GamificationReleaseProvider,
  type GamificationClientModes,
} from "@/lib/gamification/release-context";
import { MotionObserver } from "@/components/ui/motion-observer";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  PublicToolCatalogProvider,
  type PublicToolCatalogItem,
} from "@/lib/data/public-tool-catalog-context";

export function RootProviders({
  children,
  enableExperience = true,
  enableAudio = true,
  enableGamificationEffects = true,
  enableThreeD = false,
  gamificationModes,
  toolCatalog,
}: {
  children: React.ReactNode;
  enableExperience?: boolean;
  enableAudio?: boolean;
  enableGamificationEffects?: boolean;
  gamificationModes: GamificationClientModes;
  enableThreeD?: boolean;
  toolCatalog: PublicToolCatalogItem[];
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
    <PublicToolCatalogProvider tools={toolCatalog}>
      <ExperienceReleaseProvider
      audioEnabled={enableAudio}
      threeDEnabled={enableThreeD}
    >
      <GamificationReleaseProvider modes={gamificationModes}>
        <QueryClientProvider client={queryClient}>
          <OverlayProvider>
            <TooltipProvider delay={180}>
              {children}
              {enableExperience && (
                <>
                  <GlobalExperienceLayer />
                  <MotionObserver />
                  <RouteTransitionLoader />
                  {enableAudio && (
                    <>
                      <InteractionSoundLayerV2 />
                      <MusicAmbienceLayer />
                    </>
                  )}
                  {enableGamificationEffects && <GameEffectsLayer />}
                  <GlobalCommandPalette />
                </>
              )}
              <Toaster position="top-right" richColors closeButton />
            </TooltipProvider>
          </OverlayProvider>
        </QueryClientProvider>
      </GamificationReleaseProvider>
      </ExperienceReleaseProvider>
    </PublicToolCatalogProvider>
  );
}
