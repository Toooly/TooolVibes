import type { Metadata, Viewport } from "next";
import { Anton, Manrope } from "next/font/google";

import "@/styles/release-entry";
import { cookies } from "next/headers";
import { RootProviders } from "@/components/app/root-providers";
import { GamificationShell } from "@/components/gamification/gamification-shell";
import { releaseFeatures } from "@/lib/config/release-features";
import type { GamificationClientModes } from "@/lib/gamification/release-context";
import { siteConfig } from "@/lib/config/site";
import { gateCookieName } from "@/lib/gate/constants";
import { getPublicToolsSnapshot } from "@/lib/data/public-tools";
import { verifyGateToken } from "@/lib/gate/session";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  keywords: [
    "tool AI",
    "tool SaaS",
    "no-code",
    "vibe coding",
    "automation",
    "Product Hunt",
    "TooolVibes",
  ],
  icons: {
    icon: "/brand/tooolvibes-logo.png",
    shortcut: "/brand/tooolvibes-logo.png",
    apple: "/brand/tooolvibes-logo.png",
  },
  title: {
    default: `${siteConfig.name} | Tool AI, SaaS, no-code e vibe coding`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} | Tool AI selezionati senza rumore`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Tool AI, no-code e automazioni`,
    description: siteConfig.description,
  },
};

/* BATCH 39 (MOB-703): con `interactive-widget=resizes-content` Android Chrome
   ridimensiona il layout viewport all'apertura della tastiera virtuale, cosi'
   la catena dvh/safe-area della policy tv-kbd-* (styles/tokens.css) restringe
   overlay e sheet invece di lasciarli finire sotto la tastiera. iOS Safari
   ignora la direttiva: li' copre useKeyboardAwareScroll (lib/hooks).
   Nessuna variazione visiva a tastiera chiusa (default width/initial-scale
   invariati rispetto al viewport di default di Next). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.url}/archivio?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

import { IntroCinematic3D } from "@/components/3d-maestoso/intro-cinematic";
import { homeExperience } from "@/lib/config/home-experience";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(gateCookieName);
  const isGateOpen =
    !releaseFeatures.publicGate.enabled ||
    (gateCookie ? await verifyGateToken(gateCookie.value) : false);
  const toolSnapshot = isGateOpen ? await getPublicToolsSnapshot() : null;
  const toolCatalog = toolSnapshot?.status === "ready"
    ? toolSnapshot.views.map((tool) => ({
        slug: tool.slug,
        name: tool.name,
        categoryLabel: tool.categoryLabel,
        shortDescription: tool.shortDescription,
        featured: tool.featured,
        toolOfWeek: tool.toolOfWeek,
        tags: tool.tags,
        levelLabel: tool.levelLabel,
      }))
    : [];
  const missionsEnabled =
    releaseFeatures.gamification.surfaces.missions.persistentRewardsEnabled;
  // BATCH 37 (MOB-701): il dock floating della shell ospita mission entry e
  // Vibe Rush come launcher individualmente flaggabili (registry B04).
  const vibeRushEnabled =
    releaseFeatures.gamification.surfaces.vibeRush.persistentRewardsEnabled;
  const gamificationModes = {
    missions: releaseFeatures.gamification.surfaces.missions.mode,
    hiddenSignal: releaseFeatures.gamification.surfaces.hiddenSignal.mode,
    arena: releaseFeatures.gamification.surfaces.arena.mode,
    prediction: releaseFeatures.gamification.surfaces.prediction.mode,
    leaderboard: releaseFeatures.gamification.surfaces.leaderboard.mode,
    vibeRush: releaseFeatures.gamification.surfaces.vibeRush.mode,
  } satisfies GamificationClientModes;
  return (
    <html
      lang="it"
      className={`${manrope.variable} ${anton.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head />
      <body>
        {isGateOpen && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
        <RootProviders
          enableExperience={isGateOpen}
          enableAudio={isGateOpen && releaseFeatures.audio.enabled}
          enableGamificationEffects={
            isGateOpen && releaseFeatures.gamification.hasRewardedSurface
          }
          enableThreeD={isGateOpen && releaseFeatures.threeD.enabled}
          enableRewardRuntime={isGateOpen && releaseFeatures.rewardRuntime.enabled}
          enableRewardMilestones={
            isGateOpen &&
            releaseFeatures.gamification.rewardBackboneEnabled &&
            releaseFeatures.rewardRuntime.enabled &&
            releaseFeatures.rewardMilestones.enabled
          }
          gamificationModes={gamificationModes}
          toolCatalog={toolCatalog}
        >
          {isGateOpen && (missionsEnabled || vibeRushEnabled) && (
            <GamificationShell
              missionsEnabled={missionsEnabled}
              vibeRushEnabled={vibeRushEnabled}
            />
          )}
          {/* BATCH 40 (MOB-704): intro brand flaggabile (pattern B04,
             lib/config/home-experience.ts). Default "compact": brand flash
             breve chiudibile con qualsiasi interazione, nessuna attesa
             obbligatoria; "cinematic" ripristina la legacy; "off" smonta. */}
          {isGateOpen &&
            releaseFeatures.threeD.enabled &&
            homeExperience.introMode !== "off" && (
              <IntroCinematic3D mode={homeExperience.introMode} />
            )}
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
