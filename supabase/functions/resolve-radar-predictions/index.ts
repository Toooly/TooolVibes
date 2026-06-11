// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRODUCT_HUNT_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";
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
          votesCount
          commentsCount
        }
      }
    }
  }
`;

type ProductHuntItem = {
  id: string;
  name: string;
  votesCount: number;
  commentsCount: number;
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function fetchProductHuntDayItems(): Promise<ProductHuntItem[] | null> {
  const token = Deno.env.get("PRODUCTHUNT_TOKEN");
  if (!token) {
    return null;
  }

  try {
    const postedBefore = new Date().toISOString();
    const postedAfter = new Date(Date.now() - 864e5).toISOString();

    const response = await fetch(PRODUCT_HUNT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: PRODUCT_HUNT_QUERY,
        variables: { postedAfter, postedBefore, first: 20 },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const edges = json?.data?.posts?.edges ?? [];

    return edges
      .map((edge: { node?: ProductHuntItem }) => edge.node)
      .filter((node?: ProductHuntItem): node is ProductHuntItem => Boolean(node?.id))
      .map((node: ProductHuntItem) => ({
        id: node.id,
        name: node.name,
        votesCount: node.votesCount ?? 0,
        commentsCount: node.commentsCount ?? 0,
      }));
  } catch (error) {
    console.error("Failed to fetch Product Hunt day items:", error);
    return null;
  }
}

function computeDeterministicScore(toolSlug: string, contextDate: string): number {
  // TODO: This fallback is a placeholder until real ranking deltas are available.
  // Replace with a comparison against a stored baseline (e.g. yesterday's votes/comments)
  // once historical Radar data is persisted.
  return hashString(`${toolSlug}:${contextDate}`) % 10000;
}

function computeScore(
  toolSlug: string,
  contextDate: string,
  items: ProductHuntItem[] | null,
): number {
  if (items) {
    const item = items.find(
      (candidate) =>
        candidate.id === toolSlug || normalizeSlug(candidate.name) === toolSlug,
    );

    if (item) {
      // Current engagement signal: votes + weighted comments.
      // This acts as a proxy for "relative improvement" while we lack a stored baseline.
      return item.votesCount + item.commentsCount * 2;
    }
  }

  return computeDeterministicScore(toolSlug, contextDate);
}

function resolveStatus(
  score: number,
  allScores: number[],
): { status: "won" | "close" | "lost"; xp: number; actualRankChange: number } {
  const sorted = [...allScores].sort((a, b) => b - a);
  const rank = sorted.indexOf(score) + 1;
  const topHalfThreshold = Math.max(1, Math.ceil(sorted.length / 2));

  let status: "won" | "close" | "lost";
  let xp: number;

  if (rank === 1) {
    status = "won";
    xp = 80;
  } else if (rank <= topHalfThreshold) {
    status = "close";
    xp = 20;
  } else {
    status = "lost";
    xp = 0;
  }

  const percentile = sorted.length > 1 ? (sorted.length - rank) / (sorted.length - 1) : 1;
  const actualRankChange = Math.round(percentile * 10);

  return { status, xp, actualRankChange };
}

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  const secret = Deno.env.get("CRON_SECRET");

  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  const { data: predictions, error: fetchError } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("context_date", yesterday)
    .eq("status", "pending");

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const dayItems = await fetchProductHuntDayItems();
  const candidates = predictions ?? [];
  const scores = candidates.map((prediction) =>
    computeScore(prediction.tool_slug, prediction.context_date, dayItems)
  );

  let resolved = 0;
  let errors = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const prediction = candidates[index];
    const score = scores[index];
    const { status, xp, actualRankChange } = resolveStatus(score, scores);

    const { error: updateError } = await supabase
      .from("radar_predictions")
      .update({
        resolved_at: new Date().toISOString(),
        actual_rank_change: actualRankChange,
        xp_awarded: xp,
        status,
      })
      .eq("id", prediction.id);

    if (updateError) {
      console.error(`Failed to update prediction ${prediction.id}:`, updateError);
      errors += 1;
      continue;
    }

    if (xp > 0) {
      const { error: rpcError } = await supabase.rpc("record_game_interaction", {
        p_user_id: prediction.user_id,
        p_xp_delta: xp,
      });

      if (rpcError) {
        console.error(`Failed to award XP for prediction ${prediction.id}:`, rpcError);
        errors += 1;
        continue;
      }
    }

    resolved += 1;
  }

  return new Response(
    JSON.stringify({ resolved, errors, date: yesterday }),
    { headers: { "Content-Type": "application/json" } },
  );
});
