import { NextRequest, NextResponse } from "next/server";

import {
  RADAR_RANGE_SETTINGS,
  type ProductHuntItem,
  type ProductHuntPayload,
  type ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import { createTimeoutFetch } from "@/lib/utils/timeout-fetch";

type ProductHuntOAuthResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  created_at?: number;
  error?: string;
  error_description?: string;
};

type ProductHuntGraphQlResponse = {
  data?: {
    posts?: {
      edges?: Array<{
        node?: {
          id?: string;
          name?: string;
          slug?: string;
          tagline?: string;
          votesCount?: number;
          commentsCount?: number;
          createdAt?: string;
          url?: string;
          /** Official product website — `Post.website` (PH GraphQL schema). */
          website?: string;
          thumbnail?: {
            url?: string;
          } | null;
          topics?: {
            edges?: Array<{
              node?: {
                name?: string;
              } | null;
            }> | null;
          } | null;
        };
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

const PRODUCT_HUNT_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";
const PRODUCT_HUNT_OAUTH_ENDPOINT = "https://api.producthunt.com/v2/oauth/token";
const productHuntFetch = createTimeoutFetch(10000);

const PRODUCT_HUNT_QUERY = /* GraphQL */ `
  query TooolVibesProductHuntTop(
    $postedAfter: DateTime!
    $postedBefore: DateTime!
    $first: Int!
  ) {
    posts(
      postedAfter: $postedAfter
      postedBefore: $postedBefore
      first: $first
      order: VOTES
    ) {
      edges {
        node {
          id
          name
          slug
          tagline
          votesCount
          commentsCount
          createdAt
          url
          website
          thumbnail {
            url
          }
          topics {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    }
  }
`;

const rangeSettings = RADAR_RANGE_SETTINGS;

type RadarDiagCategory =
  | "AUTH"
  | "RATE_LIMIT"
  | "QUERY"
  | "SCHEMA"
  | "NETWORK"
  | "TIMEOUT"
  | "PARSING"
  | "EMPTY"
  | "OK"
  | "OTHER";

function logRadarDiag(facts: {
  provider: string;
  status: number | string;
  resultCount: number;
  cacheState: string;
  stale: boolean;
  errorCategory: RadarDiagCategory;
  rateLimitRemaining?: string | null;
  detail?: string;
}) {
  // Safe structured log — NEVER credentials or Authorization headers.
  console.log(
    JSON.stringify({
      event: "radar-product-hunt",
      timestamp: new Date().toISOString(),
      provider: facts.provider,
      httpStatus: facts.status,
      resultCount: facts.resultCount,
      cacheState: facts.cacheState,
      stale: facts.stale,
      errorCategory: facts.errorCategory,
      rateLimitRemaining: facts.rateLimitRemaining ?? null,
      detail: facts.detail?.slice(0, 200) ?? null,
    }),
  );
}

// Cache dei soli payload live riusciti: il fallback stale ri-serva sempre
// l'ultima classifica reale con il suo `updatedAt` originale (B36 / FLOW-606).
const responseCache = new Map<
  ProductHuntRange,
  { expiresAt: number; payload: ProductHuntPayload }
>();
// Negative cache breve per non martellare l'API durante un outage.
const fallbackCache = new Map<
  ProductHuntRange,
  { expiresAt: number; payload: ProductHuntPayload }
>();
let productHuntTokenCache: { token: string; expiresAt: number } | null = null;

const FALLBACK_TTL_MS = 5 * 60 * 1000;
const RADAR_QA_FIXTURE_ENV_KEY = "TOOOLVIBES_RADAR_QA_FIXTURE";

/**
 * §6 — VISUAL-QA-ONLY density fixture.
 *
 * Purpose: design/QA of blip density, collision, category distribution, blip
 * scale, selected state and map readability. ~14 tools across 6 canonical
 * categories with deterministic varied votes / comments / launch dates.
 *
 * NEVER shipped as production data:
 *   - gated behind `NODE_ENV === "development"` AND an explicit env opt-in
 *   - labelled `source: "qa-fixture"` so the UI renders "QA FIXTURE"
 *   - Product Hunt truth rules and production normalization are untouched
 *
 * Every matched item uses a REAL catalog slug so `matchRadarItemToCatalog`
 * derives the canonical category cluster. Two unmatched items exercise the
 * documented "Altri segnali" sector and the long-name / zero-attention edges.
 */
const QA_FIXTURE_SNAPSHOT_ISO = "2026-10-08T12:00:00.000Z";
const QA_FIXTURE_SNAPSHOT_MS = Date.parse(QA_FIXTURE_SNAPSHOT_ISO);
const HOUR_MS = 3_600_000;

function qaAgeHours(launchedAtIso: string): number {
  return Math.max(0, (QA_FIXTURE_SNAPSHOT_MS - Date.parse(launchedAtIso)) / HOUR_MS);
}

function qaHoursAgo(hours: number): string {
  return new Date(QA_FIXTURE_SNAPSHOT_MS - hours * HOUR_MS).toISOString();
}

const RANGE_HOURS: Record<ProductHuntRange, number> = {
  day: 24,
  week: 168,
  month: 720,
};

/**
 * §6 — VISUAL-QA-ONLY density fixture with TEMPORAL TRUTH.
 *
 * Timestamps are anchored to a fixed snapshot time (QA_FIXTURE_SNAPSHOT_ISO)
 * so ages are deterministic and meaningful across all three ranges.
 *
 * Range contract is enforced HERE: a signal only appears when its age is
 * within the selected range window, matching production behaviour where the
 * Product Hunt API date-window filters upstream.
 *
 * Dense cluster (Sviluppo & Coding): 7 signals at 1h, 3h, 6h, 9h, 12h, 18h, 23h.
 * Other clusters provide varied valid ages across 7G and 30G.
 */
function getDevelopmentQaFixture(
  range: ProductHuntRange,
): ProductHuntPayload | null {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env[RADAR_QA_FIXTURE_ENV_KEY] !== "1"
  ) {
    return null;
  }

  const maxAgeHours = RANGE_HOURS[range];

  const allItems = [
    // ---- Dense cluster: Sviluppo & Coding (7 signals, 24H depth) ----------
    {
      id: "qa-blink",
      slug: "blink",
      name: "Blink",
      tagline: "Vibe coding con agenti sul progetto.",
      votesCount: 842,
      commentsCount: 96,
      productHuntUrl: "https://www.producthunt.com/posts/blink",
      launchedAt: qaHoursAgo(1),
      topics: ["Artificial Intelligence", "Developer Tools"],
    },
    {
      id: "qa-vibecode",
      slug: "vibecode",
      name: "Vibecode",
      tagline: "Builder app AI in vibe coding.",
      votesCount: 512,
      commentsCount: 41,
      productHuntUrl: "https://www.producthunt.com/posts/vibecode",
      launchedAt: qaHoursAgo(3),
      topics: ["Developer Tools"],
    },
    {
      id: "qa-dev-6h",
      name: "CodeCanvas",
      tagline: "IDE collaborativo per team remoti.",
      votesCount: 267,
      commentsCount: 34,
      productHuntUrl: "https://www.producthunt.com/posts/codecanvas",
      launchedAt: qaHoursAgo(6),
      topics: ["Developer Tools"],
    },
    {
      id: "qa-dev-9h",
      name: "ShipFast",
      tagline: "Deploy continuo senza config.",
      votesCount: 189,
      commentsCount: 22,
      productHuntUrl: "https://www.producthunt.com/posts/shipfast",
      launchedAt: qaHoursAgo(9),
      topics: ["Developer Tools"],
    },
    {
      id: "qa-dev-12h",
      name: "MergeBot",
      tagline: "Review PR automatica con AI.",
      votesCount: 341,
      commentsCount: 45,
      productHuntUrl: "https://www.producthunt.com/posts/mergebot",
      launchedAt: qaHoursAgo(12),
      topics: ["Developer Tools"],
    },
    {
      id: "qa-dev-18h",
      name: "TestPilot",
      tagline: "Test E2E generati da spec.",
      votesCount: 156,
      commentsCount: 18,
      productHuntUrl: "https://www.producthunt.com/posts/testpilot",
      launchedAt: qaHoursAgo(18),
      topics: ["Developer Tools"],
    },
    {
      id: "qa-dev-23h",
      name: "LogLens",
      tagline: "Osservabilità per microservizi.",
      votesCount: 98,
      commentsCount: 11,
      productHuntUrl: "https://www.producthunt.com/posts/loglens",
      launchedAt: qaHoursAgo(23),
      topics: ["Developer Tools"],
    },
    // ---- Agenti AI (mixed ages: 24H + 7G) --------------------------------
    {
      id: "qa-flowise",
      slug: "flowise",
      name: "Flowise",
      tagline: "Agenti AI su misura.",
      votesCount: 729,
      commentsCount: 88,
      productHuntUrl: "https://www.producthunt.com/posts/flowise",
      launchedAt: qaHoursAgo(4),
      topics: ["Artificial Intelligence"],
    },
    {
      id: "qa-meku",
      slug: "meku",
      name: "Meku",
      tagline: "Builder siti AI in vibe coding.",
      votesCount: 388,
      commentsCount: 25,
      productHuntUrl: "https://www.producthunt.com/posts/meku",
      launchedAt: qaHoursAgo(20),
      topics: ["Artificial Intelligence"],
    },
    {
      id: "qa-agentx",
      slug: "agentx",
      name: "AgentX",
      tagline: "Agenti operativi per i team.",
      votesCount: 204,
      commentsCount: 151,
      productHuntUrl: "https://www.producthunt.com/posts/agentx",
      launchedAt: qaHoursAgo(48),
      topics: ["Artificial Intelligence"],
    },
    {
      id: "qa-agent-4d",
      name: "PromptLayer",
      tagline: "Gestione prompt per team AI.",
      votesCount: 312,
      commentsCount: 67,
      productHuntUrl: "https://www.producthunt.com/posts/promptlayer",
      launchedAt: qaHoursAgo(96),
      topics: ["Artificial Intelligence"],
    },
    // ---- No-code (7G + 30G) -----------------------------------------------
    {
      id: "qa-weweb",
      slug: "weweb",
      name: "WeWeb",
      tagline: "Builder web app no-code.",
      votesCount: 674,
      commentsCount: 58,
      productHuntUrl: "https://www.producthunt.com/posts/weweb",
      launchedAt: qaHoursAgo(26),
      topics: ["No-Code"],
    },
    {
      id: "qa-notionapps",
      slug: "notionapps",
      name: "NotionApps",
      tagline: "App no-code sopra Notion.",
      votesCount: 233,
      commentsCount: 77,
      productHuntUrl: "https://www.producthunt.com/posts/notionapps",
      launchedAt: qaHoursAgo(144),
      topics: ["No-Code", "Productivity"],
    },
    {
      id: "qa-nocode-21d",
      name: "FormCraft",
      tagline: "Formulari intelligenti no-code.",
      votesCount: 445,
      commentsCount: 92,
      productHuntUrl: "https://www.producthunt.com/posts/formcraft",
      launchedAt: qaHoursAgo(504),
      topics: ["No-Code"],
    },
    // ---- Design & Creatività (7G + 30G) ------------------------------------
    {
      id: "qa-wegic",
      slug: "wegic",
      name: "Wegic",
      tagline: "Siti generati da un brief.",
      votesCount: 129,
      commentsCount: 12,
      productHuntUrl: "https://www.producthunt.com/posts/wegic",
      launchedAt: qaHoursAgo(10),
      topics: ["Design Tools"],
    },
    {
      id: "qa-imagine-art",
      slug: "imagine-art",
      name: "Imagine Art",
      tagline: "Suite creativa immagini AI.",
      votesCount: 451,
      commentsCount: 210,
      productHuntUrl: "https://www.producthunt.com/posts/imagine-art",
      launchedAt: qaHoursAgo(72),
      topics: ["Artificial Intelligence", "Design Tools"],
    },
    {
      id: "qa-design-14d",
      name: "PixelForge",
      tagline: "Editing immagini AI professionale.",
      votesCount: 523,
      commentsCount: 134,
      productHuntUrl: "https://www.producthunt.com/posts/pixelforge",
      launchedAt: qaHoursAgo(336),
      topics: ["Design Tools"],
    },
    // ---- Video & Immagini (24H + 30G) ---------------------------------------
    {
      id: "qa-betterpic",
      slug: "betterpic",
      name: "BetterPic",
      tagline: "Ritratti AI professionali.",
      votesCount: 596,
      commentsCount: 33,
      productHuntUrl: "https://www.producthunt.com/posts/betterpic",
      launchedAt: qaHoursAgo(8),
      topics: ["Artificial Intelligence", "Photos"],
    },
    {
      id: "qa-muse-ai",
      slug: "muse-ai",
      name: "Muse AI",
      tagline: "Hosting video AI.",
      votesCount: 318,
      commentsCount: 19,
      productHuntUrl: "https://www.producthunt.com/posts/muse-ai",
      launchedAt: qaHoursAgo(5),
      topics: ["Video"],
    },
    {
      id: "qa-vibrantsnap",
      slug: "vibrantsnap",
      name: "VibrantSnap",
      tagline: "Clip video generati da testo.",
      votesCount: 87,
      commentsCount: 64,
      productHuntUrl: "https://www.producthunt.com/posts/vibrantsnap",
      launchedAt: qaHoursAgo(29 * 24),
      topics: ["Video", "Marketing"],
    },
    // ---- "Altri segnali" edges (no catalog match) ---------------------------
    {
      id: "qa-long-name",
      name: "Ultra Long Named Decision Orchestrator Platform X",
      tagline:
        "Tagline molto lunga per stressare wrapping tipografico su mobile e tablet senza collidere con metriche o rank.",
      votesCount: 63,
      commentsCount: 222,
      productHuntUrl: "https://www.producthunt.com/posts/long-name-orchestrator",
      launchedAt: qaHoursAgo(21 * 24),
      topics: [],
    },
    {
      id: "qa-quiet-launch",
      name: "Quiet",
      tagline: "Short.",
      votesCount: 0,
      commentsCount: 0,
      productHuntUrl: "https://www.producthunt.com/posts/quiet-launch",
      launchedAt: qaHoursAgo(2),
      topics: [],
    },
    {
      id: "qa-7d-edge",
      name: "WeekOld Tool",
      tagline: "Lanciato esattamente 7 giorni fa.",
      votesCount: 77,
      commentsCount: 8,
      productHuntUrl: "https://www.producthunt.com/posts/weekold",
      launchedAt: qaHoursAgo(7 * 24),
      topics: [],
    },
    {
      id: "qa-30d-edge",
      name: "MonthOld Tool",
      tagline: "Lanciato esattamente 30 giorni fa.",
      votesCount: 55,
      commentsCount: 6,
      productHuntUrl: "https://www.producthunt.com/posts/monthold",
      launchedAt: qaHoursAgo(30 * 24),
      topics: [],
    },
  ];

  // Range contract: only signals whose age is within the selected window.
  const items = allItems.filter(
    (item) => qaAgeHours(item.launchedAt) <= maxAgeHours,
  );

  return {
    status: "ok",
    source: "qa-fixture",
    stale: false,
    range,
    updatedAt: QA_FIXTURE_SNAPSHOT_ISO,
    items,
  };
}

function parseRange(value: string | null): ProductHuntRange {
  if (value === "week" || value === "month") {
    return value;
  }

  return "day";
}

function getDateWindow(range: ProductHuntRange) {
  const postedBefore = new Date();
  const postedAfter = new Date(postedBefore);
  postedAfter.setUTCDate(postedAfter.getUTCDate() - rangeSettings[range].days);

  return {
    postedAfter: postedAfter.toISOString(),
    postedBefore: postedBefore.toISOString(),
  };
}

function buildResponse(payload: ProductHuntPayload, ttlMs: number) {
  const maxAgeSeconds = Math.max(60, Math.floor(ttlMs / 1000));
  const isSuccess = payload.status === "ok" && payload.items.length > 0;

  // Success: cache aggressively with stale-if-error so the CDN serves
  // last-known-good during upstream outages.
  // Error/empty: short s-maxage + long stale-if-error preserves LKG.
  const cacheControl = isSuccess
    ? `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds}, stale-if-error=86400`
    : `public, s-maxage=0, stale-if-error=86400`;

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": cacheControl,
    },
  });
}

/** Hard ceiling on normalized items served to the Radar. */
const RADAR_MAX_ITEMS = 24;

function normalizeItems(data: ProductHuntGraphQlResponse): ProductHuntItem[] {
  const edges = data.data?.posts?.edges ?? [];

  return edges
    .map((edge) => edge.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node?.id && node?.name))
    .map((node) => {
      const topics = Array.isArray(node.topics?.edges)
        ? node.topics!.edges!
            .map((topicEdge) => topicEdge?.node?.name?.trim())
            .filter((name): name is string => Boolean(name))
        : [];
      const item: ProductHuntItem = {
        id: node.id ?? node.name ?? crypto.randomUUID(),
        name: node.name ?? "Lancio su Product Hunt",
        tagline: node.tagline ?? "Nuovo lancio su Product Hunt",
        votesCount: node.votesCount ?? 0,
        commentsCount: node.commentsCount ?? 0,
        productHuntUrl: node.url ?? "https://www.producthunt.com/",
        thumbnailUrl: node.thumbnail?.url,
      };
      // Additive source fields: present only when the upstream actually sends
      // them. NEVER synthesized.
      if (node.createdAt && !Number.isNaN(new Date(node.createdAt).getTime())) {
        item.launchedAt = new Date(node.createdAt).toISOString();
      }
      if (node.slug) item.slug = node.slug;
      if (topics.length > 0) item.topics = topics;
      // Verified official website only. Absent when the source omits it —
      // the external CTA then falls back to the source link (never invented).
      if (typeof node.website === "string" && /^https?:\/\//i.test(node.website.trim())) {
        item.websiteUrl = node.website.trim();
      }
      return item;
    })
    .sort((left, right) => right.votesCount - left.votesCount)
    .slice(0, RADAR_MAX_ITEMS);
}

async function getProductHuntToken(now: number): Promise<{ token: string | null; errorCategory: RadarDiagCategory; detail: string }> {
  const directToken = process.env.PRODUCTHUNT_TOKEN?.trim();

  if (directToken) {
    return { token: directToken, errorCategory: "OK", detail: "direct-token" };
  }

  if (productHuntTokenCache && productHuntTokenCache.expiresAt > now + 60 * 1000) {
    return { token: productHuntTokenCache.token, errorCategory: "OK", detail: "cached-oauth" };
  }

  const clientId = process.env.PRODUCTHUNT_CLIENT_ID?.trim();
  const clientSecret = process.env.PRODUCTHUNT_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return { token: null, errorCategory: "AUTH", detail: "no-credentials" };
  }

  try {
    const oauthBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    });

    const response = await productHuntFetch(PRODUCT_HUNT_OAUTH_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: oauthBody.toString(),
    });

    if (!response.ok) {
      const category = response.status === 401 ? "AUTH" : response.status === 429 ? "RATE_LIMIT" : "AUTH";
      return { token: null, errorCategory: category, detail: `oauth-http-${response.status}` };
    }

    const data = (await response.json()) as ProductHuntOAuthResponse;

    if (!data.access_token) {
      return { token: null, errorCategory: "AUTH", detail: data.error ?? data.error_description ?? "no-access-token" };
    }

    const ttlSeconds = data.expires_in ?? 60 * 60;
    const safeTtlMs = Math.max(5 * 60 * 1000, (ttlSeconds - 60) * 1000);
    productHuntTokenCache = {
      token: data.access_token,
      expiresAt: now + safeTtlMs,
    };

    return { token: data.access_token, errorCategory: "OK", detail: "oauth-success" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const category: RadarDiagCategory = msg.includes("abort") || msg.includes("timeout") ? "TIMEOUT" : "NETWORK";
    return { token: null, errorCategory: category, detail: msg.slice(0, 100) };
  }
}

export async function GET(request: NextRequest) {
  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const settings = rangeSettings[range];
  const now = Date.now();
  const developmentFixture = getDevelopmentQaFixture(range);

  if (developmentFixture) {
    return buildResponse(developmentFixture, settings.ttlMs);
  }

  const cached = responseCache.get(range);

  if (cached && cached.expiresAt > now) {
    return buildResponse(cached.payload, settings.ttlMs);
  }

  const fallbackCached = fallbackCache.get(range);

  if (fallbackCached && fallbackCached.expiresAt > now) {
    return buildResponse(fallbackCached.payload, FALLBACK_TTL_MS);
  }

  const tokenResult = await getProductHuntToken(now);
  const { token, errorCategory: tokenCategory, detail: tokenDetail } = tokenResult;

  if (!token) {
    logRadarDiag({
      provider: "product-hunt",
      status: "no-token",
      resultCount: 0,
      cacheState: cached ? "has-lkg" : "no-lkg",
      stale: false,
      errorCategory: tokenCategory,
      detail: tokenDetail,
    });

    // Serve last-known-good if available instead of collapsing to zero.
    if (cached) {
      const stalePayload: ProductHuntPayload = {
        ...cached.payload,
        source: "product-hunt-stale",
        stale: true,
        message: "Aggiornamento live non riuscito: mostro l'ultima classifica Product Hunt sincronizzata.",
      };
      return buildResponse(stalePayload, FALLBACK_TTL_MS);
    }

    const payload: ProductHuntPayload = {
      status: "missing-token",
      source: "none",
      stale: false,
      range,
      updatedAt: new Date(now).toISOString(),
      items: [],
      message: "Classifica Product Hunt non configurata.",
    };

    return buildResponse(payload, FALLBACK_TTL_MS);
  }

  try {
    const { postedAfter, postedBefore } = getDateWindow(range);
    const response = await productHuntFetch(PRODUCT_HUNT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: PRODUCT_HUNT_QUERY,
        variables: {
          postedAfter,
          postedBefore,
          first: settings.first,
        },
      }),
    });

    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");

    if (!response.ok) {
      const category: RadarDiagCategory =
        response.status === 401 ? "AUTH" :
        response.status === 403 ? "AUTH" :
        response.status === 429 ? "RATE_LIMIT" :
        "NETWORK";
      logRadarDiag({
        provider: "product-hunt",
        status: response.status,
        resultCount: 0,
        cacheState: cached ? "has-lkg" : "no-lkg",
        stale: false,
        errorCategory: category,
        rateLimitRemaining,
        detail: `graphql-http-${response.status}`,
      });
      throw new Error(`API Product Hunt non disponibile: ${response.status}`);
    }

    const data = (await response.json()) as ProductHuntGraphQlResponse;

    if (data.errors?.length) {
      const errMsg = data.errors.map((error) => error.message).join("; ");
      logRadarDiag({
        provider: "product-hunt",
        status: 200,
        resultCount: 0,
        cacheState: cached ? "has-lkg" : "no-lkg",
        stale: false,
        errorCategory: "QUERY",
        rateLimitRemaining,
        detail: errMsg.slice(0, 200),
      });
      throw new Error(errMsg);
    }

    const items = normalizeItems(data);

    // Phase 7: don't overwrite LKG with empty result unless demonstrably legitimate.
    if (items.length === 0 && cached && cached.payload.items.length > 0) {
      logRadarDiag({
        provider: "product-hunt",
        status: 200,
        resultCount: 0,
        cacheState: "has-lkg-preserved",
        stale: true,
        errorCategory: "EMPTY",
        rateLimitRemaining,
        detail: "empty-response-preserved-lkg",
      });
      const stalePayload: ProductHuntPayload = {
        ...cached.payload,
        source: "product-hunt-stale",
        stale: true,
        message: "Aggiornamento live non riuscito: mostro l'ultima classifica Product Hunt sincronizzata.",
      };
      return buildResponse(stalePayload, FALLBACK_TTL_MS);
    }

    const payload: ProductHuntPayload = {
      status: "ok",
      source: "product-hunt-live",
      stale: false,
      range,
      updatedAt: new Date(now).toISOString(),
      items,
    };

    logRadarDiag({
      provider: "product-hunt",
      status: 200,
      resultCount: items.length,
      cacheState: "fresh",
      stale: false,
      errorCategory: items.length > 0 ? "OK" : "EMPTY",
      rateLimitRemaining,
    });

    responseCache.set(range, { expiresAt: now + settings.ttlMs, payload });
    return buildResponse(payload, settings.ttlMs);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const category: RadarDiagCategory =
      errMsg.includes("abort") || errMsg.includes("timeout") ? "TIMEOUT" :
      errMsg.includes("non disponibile") ? "NETWORK" :
      "OTHER";

    logRadarDiag({
      provider: "product-hunt",
      status: "exception",
      resultCount: 0,
      cacheState: cached ? "has-lkg" : "no-lkg",
      stale: false,
      errorCategory: category,
      detail: errMsg.slice(0, 200),
    });

    // Fallback esplicito: se esiste un'ultima classifica reale la ri-serviamo
    // dichiarando provenienza (`source`) e staleness (`stale`) senza riscrivere
    // il timestamp di origine; altrimenti nessun dato inventato.
    const payload: ProductHuntPayload = cached
      ? {
          ...cached.payload,
          source: "product-hunt-stale",
          stale: true,
          message:
            "Aggiornamento live non riuscito: mostro l'ultima classifica Product Hunt sincronizzata.",
        }
      : {
          status: "error",
          source: "none",
          stale: false,
          range,
          updatedAt: new Date(now).toISOString(),
          items: [],
          message: "Classifica Product Hunt temporaneamente non disponibile.",
          diag: category,
          diagDetail: errMsg.slice(0, 120),
        };

    // Only cache last-known-GOOD responses in fallbackCache.
    // Error/missing-token payloads must NOT be cached — otherwise the
    // endpoint gets stuck serving stale errors for FALLBACK_TTL_MS.
    if (payload.status === "ok" && payload.items.length > 0) {
      fallbackCache.set(range, { expiresAt: now + FALLBACK_TTL_MS, payload });
    }
    return buildResponse(payload, FALLBACK_TTL_MS);
  }
}
