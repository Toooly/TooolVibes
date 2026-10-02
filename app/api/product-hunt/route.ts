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
          tagline?: string;
          votesCount?: number;
          commentsCount?: number;
          url?: string;
          thumbnail?: {
            url?: string;
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
          tagline
          votesCount
          commentsCount
          url
          thumbnail {
            url
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

function getDevelopmentQaFixture(
  range: ProductHuntRange,
): ProductHuntPayload | null {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env[RADAR_QA_FIXTURE_ENV_KEY] !== "1"
  ) {
    return null;
  }

  return {
    status: "ok",
    source: "qa-fixture",
    stale: false,
    range,
    updatedAt: "2026-01-15T10:00:00.000Z",
    items: [
      {
        id: "fixture-canvas",
        name: "Fixture Canvas",
        tagline: "Segnale deterministico per il QA visuale locale.",
        votesCount: 420,
        commentsCount: 32,
        productHuntUrl: "https://www.producthunt.com/posts/fixture-canvas",
        thumbnailUrl: "https://ph-files.imgix.net/sample.png",
      },
      {
        id: "stable-signal",
        name: "Stable Signal",
        tagline: "Dato ripetibile per verificare il layout responsive.",
        votesCount: 318,
        commentsCount: 21,
        productHuntUrl: "https://www.producthunt.com/posts/stable-signal",
      },
      {
        id: "release-lens",
        name: "Release Lens",
        tagline: "Terzo elemento fisso della classifica di test.",
        votesCount: 207,
        commentsCount: 14,
        productHuntUrl: "https://www.producthunt.com/posts/release-lens",
      },
      {
        id: "long-name-orchestrator",
        name: "Ultra Long Named Decision Orchestrator Platform X",
        tagline:
          "Tagline molto lunga per stressare wrapping tipografico su mobile e tablet senza collidere con metriche o rank.",
        votesCount: 88,
        commentsCount: 120,
        productHuntUrl: "https://www.producthunt.com/posts/long-name-orchestrator",
      },
      {
        id: "quiet-launch",
        name: "Quiet",
        tagline: "Short.",
        votesCount: 0,
        commentsCount: 0,
        productHuntUrl: "https://www.producthunt.com/posts/quiet-launch",
      },
      {
        id: "talky-beta",
        name: "Talky Beta",
        tagline: "Alto rapporto discussione/voto nel set corrente.",
        votesCount: 12,
        commentsCount: 96,
        productHuntUrl: "https://www.producthunt.com/posts/talky-beta",
      },
      {
        id: "no-thumb-signal",
        name: "NoThumb Signal",
        tagline: "Senza thumbnail per verificare fallback glyph.",
        votesCount: 55,
        commentsCount: 3,
        productHuntUrl: "https://www.producthunt.com/posts/no-thumb-signal",
      },
    ],
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

function normalizeItems(data: ProductHuntGraphQlResponse): ProductHuntItem[] {
  const edges = data.data?.posts?.edges ?? [];

  return edges
    .map((edge) => edge.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node?.id && node?.name))
    .map((node) => ({
      id: node.id ?? node.name ?? crypto.randomUUID(),
      name: node.name ?? "Lancio su Product Hunt",
      tagline: node.tagline ?? "Nuovo lancio su Product Hunt",
      votesCount: node.votesCount ?? 0,
      commentsCount: node.commentsCount ?? 0,
      productHuntUrl: node.url ?? "https://www.producthunt.com/",
      thumbnailUrl: node.thumbnail?.url,
    }))
    .sort((left, right) => right.votesCount - left.votesCount)
    .slice(0, 5);
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
