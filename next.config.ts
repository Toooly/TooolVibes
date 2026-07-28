import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import {
  buildBrowserSecurityHeaders,
  securityHeaderRoutePattern,
} from "./lib/security/browser-headers";

const nextConfig: NextConfig = {
  // OpenNext requires the traced standalone tree. Keep this explicit because
  // Bun does not reliably propagate OpenNext's private build env to `next build`.
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [
      {
        source: securityHeaderRoutePattern,
        headers: buildBrowserSecurityHeaders({
          nodeEnv: process.env.NODE_ENV,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        }),
      },
    ];
  },
  // Phase 0.5: pre-existing lint debt (react/no-unescaped-entities across TSX
  // files) is tracked in audits/ui-cleanup-phase-0-baseline.md and does NOT block the
  // production build. Remove this block once the lint debt is cleared in a later phase.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ph-files.imgix.net",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
};

if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev();
}

export default nextConfig;
