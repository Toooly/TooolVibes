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
  experimental: {
    // Preserve the destination when client navigation fails across releases.
    appNavFailHandling: true,
  },
  env: {
    TOOOLVIBES_RELEASE_SHA: process.env.TOOOLVIBES_RELEASE_SHA ?? "development",
    TOOOLVIBES_RELEASE_NAME:
      process.env.TOOOLVIBES_RELEASE_NAME ?? "TooolVibes V1.0 MVP GM Release",
    TOOOLVIBES_BUILD_TIMESTAMP:
      process.env.TOOOLVIBES_BUILD_TIMESTAMP ?? "development",
  },
  async redirects() {
    return [
      {
        source: "/toools",
        destination: "/archivio",
        permanent: true,
      },
    ];
  },
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

if (process.env.NODE_ENV === "development" && process.env.TOOOLVIBES_SKIP_OPENNEXT !== "1") {
  void initOpenNextCloudflareForDev();
}

export default nextConfig;
