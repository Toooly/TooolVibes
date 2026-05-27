"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { GlobalCommandPalette } from "@/components/app/global-command-palette";
import { GlobalExperienceLayer } from "@/components/app/global-experience-layer";
import { InteractionSoundLayer } from "@/components/app/interaction-sound-layer";
import { RouteTransitionLoader } from "@/components/app/route-transition-loader";
import { MotionObserver } from "@/components/ui/motion-observer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RootProviders({ children }: { children: React.ReactNode }) {
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
        <GlobalExperienceLayer />
        <MotionObserver />
        <RouteTransitionLoader />
        <InteractionSoundLayer />
        <GlobalCommandPalette />
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
