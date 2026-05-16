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
    title: `${siteConfig.name} | Premium AI tools discovery platform`,
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
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12), transparent 12rem),
    radial-gradient(circle at 48% 52%, rgba(106,60,255,0.34), transparent 36%),
    radial-gradient(circle at 18% 18%, rgba(94,226,255,0.22), transparent 32%),
    radial-gradient(circle at 82% 76%, rgba(246,199,97,0.18), transparent 30%),
    linear-gradient(150deg, #100a34 0%, #27137a 48%, #08051d 100%);
}
`;

const brandIntroPreflightScript = `
(() => {
  try {
    const isHome = window.location.pathname === "/" || window.location.pathname === "";
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const played = window.sessionStorage?.getItem("tooolvibes:brand-intro-v5") === "true";

    if (isHome && !reduced && !played) {
      document.documentElement.classList.add("brand-intro-preflight", "brand-intro-active");
    }
  } catch {
    if (window.location.pathname === "/" || window.location.pathname === "") {
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
    <html lang="it">
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
