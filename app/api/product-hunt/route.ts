import { NextRequest, NextResponse } from "next/server";

import type {
  ProductHuntItem,
  ProductHuntPayload,
  ProductHuntRange,
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
          votes?: {
            totalCount?: number;
          } | null;
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
const productHuntFetch = createTimeoutFetch(5000);

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
          votes {
            totalCount
          }
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

const rangeSettings: Record<ProductHuntRange, { days: number; ttlMs: number; first: number }> = {
  day: { days: 1, ttlMs: 30 * 60 * 1000, first: 20 },
  week: { days: 7, ttlMs: 3 * 60 * 60 * 1000, first: 30 },
  month: { days: 30, ttlMs: 12 * 60 * 60 * 1000, first: 40 },
};

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

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds}`,
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
      votesCount: node.votesCount ?? node.votes?.totalCount ?? 0,
      commentsCount: node.commentsCount ?? 0,
      productHuntUrl: node.url ?? "https://www.producthunt.com/",
      thumbnailUrl: node.thumbnail?.url,
    }))
    .sort((left, right) => right.votesCount - left.votesCount)
    .slice(0, 5);
}

async function getProductHuntToken(now: number) {
  const directToken = process.env.PRODUCTHUNT_TOKEN?.trim();

  if (directToken) {
    return directToken;
  }

  if (productHuntTokenCache && productHuntTokenCache.expiresAt > now + 60 * 1000) {
    return productHuntTokenCache.token;
  }

  const clientId = process.env.PRODUCTHUNT_CLIENT_ID?.trim();
  const clientSecret = process.env.PRODUCTHUNT_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await productHuntFetch(PRODUCT_HUNT_OAUTH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth Product Hunt non disponibile: ${response.status}`);
  }

  const data = (await response.json()) as ProductHuntOAuthResponse;

  if (!data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "Token OAuth Product Hunt mancante");
  }

  const ttlSeconds = data.expires_in ?? 60 * 60;
  const safeTtlMs = Math.max(5 * 60 * 1000, (ttlSeconds - 60) * 1000);
  productHuntTokenCache = {
    token: data.access_token,
    expiresAt: now + safeTtlMs,
  };

  return data.access_token;
}

export async function GET(request: NextRequest) {
  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const settings = rangeSettings[range];
  const now = Date.now();
  const cached = responseCache.get(range);

  if (cached && cached.expiresAt > now) {
    return buildResponse(cached.payload, settings.ttlMs);
  }

  const fallbackCached = fallbackCache.get(range);

  if (fallbackCached && fallbackCached.expiresAt > now) {
    return buildResponse(fallbackCached.payload, FALLBACK_TTL_MS);
  }

  let token: string | null = null;

  try {
    token = await getProductHuntToken(now);
  } catch {
    token = null;
  }

  if (!token) {
    const payload: ProductHuntPayload = {
      status: "missing-token",
      source: "none",
      stale: false,
      range,
      updatedAt: new Date(now).toISOString(),
      items: [],
      message:
        "Classifica Product Hunt non configurata.",
    };

    fallbackCache.set(range, { expiresAt: now + FALLBACK_TTL_MS, payload });
    return buildResponse(payload, FALLBACK_TTL_MS);
  }

  try {
    const { postedAfter, postedBefore } = getDateWindow(range);
    const response = await productHuntFetch(PRODUCT_HUNT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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

    if (!response.ok) {
      throw new Error(`API Product Hunt non disponibile: ${response.status}`);
    }

    const data = (await response.json()) as ProductHuntGraphQlResponse;

    if (data.errors?.length) {
      throw new Error(data.errors.map((error) => error.message).join("; "));
    }

    const payload: ProductHuntPayload = {
      status: "ok",
      source: "product-hunt-live",
      stale: false,
      range,
      updatedAt: new Date(now).toISOString(),
      items: normalizeItems(data),
    };

    responseCache.set(range, { expiresAt: now + settings.ttlMs, payload });
    return buildResponse(payload, settings.ttlMs);
  } catch {
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
        };

    fallbackCache.set(range, { expiresAt: now + FALLBACK_TTL_MS, payload });
    return buildResponse(payload, FALLBACK_TTL_MS);
  }
}
