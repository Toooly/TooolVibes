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
import { GamificationShell } from "@/components/gamification/gamification-shell";
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

const brandIntroStorageKey = "tooolvibes:brand-intro-mobile-neon-v1";

const brandIntroPreflightStyle = `
html.brand-intro-preflight,
html.brand-intro-preflight body {
  overflow: hidden;
  background: #07070a;
}

html.brand-intro-preflight body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 119;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 35%, rgba(116,78,255,0.2), transparent 13rem),
    radial-gradient(circle at 50% 42%, rgba(73,224,255,0.12), transparent 16rem),
    linear-gradient(180deg, #0b0b0f 0%, #050507 100%);
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
      window.setTimeout(clearIntroLocks, 8000);
      return;
    }

    clearIntroLocks();
  } catch {
    const pathname = window.location.pathname || "/";
    const mobile = window.innerWidth < 768;
    if (mobile && !pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/auth")) {
      document.documentElement.classList.add("brand-intro-preflight", "brand-intro-active");
      window.setTimeout(clearIntroLocks, 8000);
      return;
    }

    clearIntroLocks();
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
        <RootProviders>
          <GamificationShell />
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
