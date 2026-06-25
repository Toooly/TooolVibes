import type { Metadata } from "next";
import { Manrope, Rubik } from "next/font/google";

import "@/app/globals.css";
import "@/styles/vibes-3d-maestoso.css";
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

const brandIntroStorageKey = "tooolvibes:brand-intro-mobile-neon-v1";

const brandIntroPreflightStyle = `
html.brand-intro-preflight,
html.brand-intro-preflight body {
  overflow: visible;
}

html.brand-intro-preflight body::before {
  content: none;
}

@media (min-width: 768px) {
  html.brand-intro-preflight,
  html.brand-intro-preflight body {
    overflow: auto;
    background: inherit;
  }

  html.brand-intro-preflight body::before {
    content: none;
  }
}
`;

const brandIntroPreflightScript = `
(() => {
  const clearIntroLocks = () => {
    document.documentElement.classList.remove("brand-intro-preflight", "brand-intro-active");
  };

  try {
    const pathname = window.location.pathname || "/";
    const excluded =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/auth");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const mobile = window.matchMedia?.("(max-width: 767px)")?.matches;
    const played = window.sessionStorage?.getItem("${brandIntroStorageKey}") === "true";

    if (!excluded && !reduced && !played && mobile) {
      document.documentElement.classList.add("brand-intro-preflight", "brand-intro-active");
      window.setTimeout(clearIntroLocks, 5200);
      return;
    }

    clearIntroLocks();
  } catch {
    const pathname = window.location.pathname || "/";
    const mobile = window.innerWidth < 768;
    if (mobile && !pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/auth")) {
      document.documentElement.classList.add("brand-intro-preflight", "brand-intro-active");
      window.setTimeout(clearIntroLocks, 5200);
      return;
    }

    clearIntroLocks();
  }
})();
`;

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
    <html lang="it" className={`${manrope.variable} ${rubik.variable}`} suppressHydrationWarning>
      <head>
        {isGateOpen && (
          <>
            <style
              id="tooolvibes-brand-intro-preflight-style"
              dangerouslySetInnerHTML={{ __html: brandIntroPreflightStyle }}
            />
            <script
              id="tooolvibes-brand-intro-preflight"
              dangerouslySetInnerHTML={{ __html: brandIntroPreflightScript }}
            />
          </>
        )}
      </head>
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
