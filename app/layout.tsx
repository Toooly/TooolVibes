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
    radial-gradient(circle at 50% 50%, rgba(20,184,166,0.18), transparent 18rem),
    radial-gradient(circle at 50% 50%, rgba(6,7,18,0.9), transparent 9rem),
    repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.065) 0 1px, transparent 1px 2.8rem),
    linear-gradient(145deg, #040512 0%, #08111f 54%, #02030a 100%);
}
`;

const brandIntroPreflightScript = `
(() => {
  try {
    const pathname = window.location.pathname || "/";
    const excluded =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/auth");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const played = window.sessionStorage?.getItem("tooolvibes:brand-intro-singularity-v2") === "true";

    if (!excluded && !reduced && !played) {
      document.documentElement.classList.add("brand-intro-preflight", "brand-intro-active");
    }
  } catch {
    const pathname = window.location.pathname || "/";
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/auth")) {
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
