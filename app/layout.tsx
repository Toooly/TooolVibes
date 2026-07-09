import type { Metadata } from "next";
import { Fraunces, Inter, Manrope, Rubik } from "next/font/google";

import "@/app/globals.css";
import "@/styles/vibes-3d-maestoso.css";
import "@/styles/figma-final-polish.css";
import { cookies } from "next/headers";
import { RootProviders } from "@/components/app/root-providers";
import { GamificationShell } from "@/components/gamification/gamification-shell";
import { siteConfig } from "@/lib/config/site";
import { gateCookieName } from "@/lib/gate/constants";
import { verifyGateToken } from "@/lib/gate/session";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(gateCookieName);
  const isGateOpen = gateCookie ? await verifyGateToken(gateCookie.value) : false;
  return (
    <html lang="it" className={`${manrope.variable} ${rubik.variable} ${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head />
      <body>
        {isGateOpen && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
        <RootProviders enableExperience={isGateOpen}>
          {isGateOpen && <GamificationShell />}
          {isGateOpen && <IntroCinematic3D />}
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
