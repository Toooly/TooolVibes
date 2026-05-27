import type { Metadata } from "next";

import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/rubik/400.css";
import "@fontsource/rubik/500.css";
import "@fontsource/rubik/600.css";
import "@fontsource/rubik/700.css";
import "@/app/globals.css";
import { RootProviders } from "@/components/app/root-providers";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  keywords: [
    "AI tools",
    "SaaS tools",
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
    default: `${siteConfig.name} | AI tools, SaaS, no-code e vibe coding`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} | Premium AI tools discovery system`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Tool AI, no-code e vibe coding`,
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

const brandIntroPreflightStyle = `
html.brand-intro-preflight,
html.brand-intro-preflight body {
  overflow: hidden;
  background: #100a34;
}

html.brand-intro-preflight body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 119;
  pointer-events: none;
  background:
    linear-gradient(116deg, transparent 0 43%, rgba(103,227,255,0.14) 43.2% 43.55%, transparent 43.8% 100%),
    linear-gradient(64deg, transparent 0 54%, rgba(106,60,255,0.18) 54.2% 54.55%, transparent 54.85% 100%),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 6rem),
    linear-gradient(145deg, #08051d 0%, #170b4d 48%, #050313 100%);
}
`;

const brandIntroPreflightScript = `
(() => {
  try {
    const isHome = window.location.pathname === "/" || window.location.pathname === "";
    const desktop = window.matchMedia?.("(min-width: 1024px)")?.matches;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const played = window.sessionStorage?.getItem("tooolvibes:brand-intro-reactor-v1") === "true";

    if (isHome && !desktop && !reduced && !played) {
      document.documentElement.classList.add("brand-intro-preflight", "brand-intro-active");
    }
  } catch {
    const isHome = window.location.pathname === "/" || window.location.pathname === "";
    const desktop = window.matchMedia?.("(min-width: 1024px)")?.matches;

    if (isHome && !desktop) {
      document.documentElement.classList.add("brand-intro-preflight", "brand-intro-active");
    }
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <style
          id="tooolvibes-brand-intro-preflight-style"
          dangerouslySetInnerHTML={{ __html: brandIntroPreflightStyle }}
        />
        <script
          id="tooolvibes-brand-intro-preflight"
          dangerouslySetInnerHTML={{ __html: brandIntroPreflightScript }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
