export type SecurityHeader = Readonly<{
  key: string;
  value: string;
}>;

export type SecurityHeaderEnvironment = Readonly<{
  nodeEnv?: string;
  supabaseUrl?: string;
}>;

export type HstsRequestEnvironment = Readonly<{
  nodeEnv?: string;
  requestUrl: string;
  enableHsts?: string;
}>;

const CSP_REPORT_ENDPOINT = "/api/security/csp-report";
const HSTS_VALUE = "max-age=31536000; includeSubDomains";

function normalizeHttpsOrigin(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

export function getStrictTransportSecurityValue({
  nodeEnv,
  requestUrl,
  enableHsts,
}: HstsRequestEnvironment) {
  if (nodeEnv !== "production" || enableHsts === "false") {
    return null;
  }

  try {
    const url = new URL(requestUrl);
    if (url.protocol !== "https:" || isLocalHostname(url.hostname)) {
      return null;
    }
  } catch {
    return null;
  }

  return HSTS_VALUE;
}

function buildContentSecurityPolicy(environment: SecurityHeaderEnvironment) {
  const supabaseOrigin = normalizeHttpsOrigin(environment.supabaseUrl);
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
  ];
  const imageSources = [
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
    "https://*.supabase.co",
    "https://ph-files.imgix.net",
    "https://api.qrserver.com",
    "https://www.google.com",
  ];

  if (supabaseOrigin && !connectSources.includes(supabaseOrigin)) {
    connectSources.push(supabaseOrigin);
  }
  if (supabaseOrigin && !imageSources.includes(supabaseOrigin)) {
    imageSources.push(supabaseOrigin);
  }

  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (environment.nodeEnv !== "production") {
    // Next.js development tooling uses eval for source maps and Fast Refresh.
    scriptSources.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src ${imageSources.join(" ")}`,
    `connect-src ${connectSources.join(" ")}`,
    "media-src 'self' blob: https://*.supabase.co",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "manifest-src 'self'",
    `report-uri ${CSP_REPORT_ENDPOINT}`,
    "report-to csp-endpoint",
  ].join("; ");
}

export function buildBrowserSecurityHeaders(
  environment: SecurityHeaderEnvironment,
): SecurityHeader[] {
  return [
    {
      key: "Content-Security-Policy-Report-Only",
      value: buildContentSecurityPolicy(environment),
    },
    {
      key: "Content-Security-Policy",
      value: "frame-ancestors 'none'",
    },
    {
      key: "Reporting-Endpoints",
      value: `csp-endpoint="${CSP_REPORT_ENDPOINT}"`,
    },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), publickey-credentials-get=(), usb=()",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin-allow-popups",
    },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ];
}

export const securityHeaderRoutePattern = "/:path*";
