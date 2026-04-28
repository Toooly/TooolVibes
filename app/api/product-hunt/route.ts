import { NextRequest, NextResponse } from "next/server";

type ProductHuntRange = "day" | "week" | "month";

type ProductHuntItem = {
  id: string;
  name: string;
  tagline: string;
  votesCount: number;
  commentsCount: number;
  productHuntUrl: string;
  thumbnailUrl?: string;
};

type ProductHuntPayload = {
  status: "ok" | "missing-token" | "error";
  range: ProductHuntRange;
  updatedAt: string;
  items: ProductHuntItem[];
  message?: string;
};

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

const rangeSettings: Record<ProductHuntRange, { days: number; ttlMs: number; first: number }> = {
  day: { days: 1, ttlMs: 30 * 60 * 1000, first: 40 },
  week: { days: 7, ttlMs: 3 * 60 * 60 * 1000, first: 60 },
  month: { days: 30, ttlMs: 12 * 60 * 60 * 1000, first: 80 },
};

const responseCache = new Map<
  ProductHuntRange,
  { expiresAt: number; payload: ProductHuntPayload }
>();
let productHuntTokenCache: { token: string; expiresAt: number } | null = null;

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
      name: node.name ?? "Product Hunt launch",
      tagline: node.tagline ?? "Nuovo lancio su Product Hunt",
      votesCount: node.votesCount ?? 0,
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

  const response = await fetch(PRODUCT_HUNT_OAUTH_ENDPOINT, {
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
    throw new Error(`Product Hunt OAuth returned ${response.status}`);
  }

  const data = (await response.json()) as ProductHuntOAuthResponse;

  if (!data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "Product Hunt OAuth token missing");
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

  let token: string | null = null;

  try {
    token = await getProductHuntToken(now);
  } catch {
    token = null;
  }

  if (!token) {
    const payload: ProductHuntPayload = {
      status: "missing-token",
      range,
      updatedAt: new Date().toISOString(),
      items: [],
      message:
        "Product Hunt ranking non configurato. Aggiungi PRODUCTHUNT_TOKEN oppure PRODUCTHUNT_CLIENT_ID e PRODUCTHUNT_CLIENT_SECRET.",
    };

    responseCache.set(range, { expiresAt: now + 5 * 60 * 1000, payload });
    return buildResponse(payload, 5 * 60 * 1000);
  }

  try {
    const { postedAfter, postedBefore } = getDateWindow(range);
    const response = await fetch(PRODUCT_HUNT_ENDPOINT, {
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
      throw new Error(`Product Hunt API returned ${response.status}`);
    }

    const data = (await response.json()) as ProductHuntGraphQlResponse;

    if (data.errors?.length) {
      throw new Error(data.errors.map((error) => error.message).join("; "));
    }

    const payload: ProductHuntPayload = {
      status: "ok",
      range,
      updatedAt: new Date().toISOString(),
      items: normalizeItems(data),
    };

    responseCache.set(range, { expiresAt: now + settings.ttlMs, payload });
    return buildResponse(payload, settings.ttlMs);
  } catch {
    const payload: ProductHuntPayload = {
      status: "error",
      range,
      updatedAt: new Date().toISOString(),
      items: [],
      message: "Product Hunt ranking temporaneamente non disponibile.",
    };

    responseCache.set(range, { expiresAt: now + 5 * 60 * 1000, payload });
    return buildResponse(payload, 5 * 60 * 1000);
  }
}
