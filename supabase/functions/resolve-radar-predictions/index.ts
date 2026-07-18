/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getUtcContextDate,
  resolveRadarPredictions,
} from "../_shared/radar-prediction-resolver.ts";

// B36 / FLOW-606 — integrità del resolver:
// - nessun hash placeholder: gli score derivano solo dal feed reale Product Hunt
//   (logica pura condivisa in `supabase/functions/_shared/radar-prediction-resolver.ts`);
// - feed non disponibile/vuoto → nessuna risoluzione: i pronostici restano
//   `pending` e la risposta dichiara il motivo (retry al prossimo schedule);
// - XP solo se la superficie prediction è REWARDED via flag B04
//   (`TOOOLVIBES_GAME_PREDICTION_MODE=REWARDED`), altrimenti xp_awarded = 0;
// - data contesto sempre UTC, indipendente dal timezone dell'host.

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

async function fetchProductHuntDayItems() {
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
      .map((edge) => edge.node)
      .filter((node) => Boolean(node?.id))
      .map((node) => ({
        id: node.id,
        name: node.name ?? "",
        votesCount: node.votesCount ?? 0,
        commentsCount: node.commentsCount ?? 0,
      }));
  } catch (error) {
    console.error("Failed to fetch Product Hunt day items:", error);
    return null;
  }
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

  const rewardsEnabled =
    Deno.env.get("TOOOLVIBES_GAME_PREDICTION_MODE") === "REWARDED";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Finestra di risoluzione deterministica: i pronostici del giorno UTC precedente.
  const contextDate = getUtcContextDate(new Date(), -1);

  const { data: predictions, error: fetchError } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("context_date", contextDate)
    .eq("status", "pending");

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const candidates = predictions ?? [];
  const dayItems = await fetchProductHuntDayItems();
  const resolutions = resolveRadarPredictions(
    candidates.map((prediction) => ({
      toolSlug: prediction.tool_slug,
      contextDate: prediction.context_date,
    })),
    dayItems,
    { rewardsEnabled },
  );

  if (resolutions.length === 0 && candidates.length > 0) {
    // Fallback esplicito: nessun dato inventato, nessun XP. I pronostici
    // restano `pending` e verranno riprocessati al prossimo schedule.
    return new Response(
      JSON.stringify({
        resolved: 0,
        skipped: candidates.length,
        reason: dayItems === null
          ? "product-hunt-feed-unavailable"
          : "product-hunt-feed-empty",
        rewardsEnabled,
        date: contextDate,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  let resolved = 0;
  let errors = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const prediction = candidates[index];
    const resolution = resolutions[index];

    const { error: updateError } = await supabase
      .from("radar_predictions")
      .update({
        resolved_at: new Date().toISOString(),
        actual_rank_change: resolution.actualRankChange,
        xp_awarded: resolution.xpAwarded,
        status: resolution.status,
      })
      .eq("id", prediction.id);

    if (updateError) {
      console.error(`Failed to update prediction ${prediction.id}:`, updateError);
      errors += 1;
      continue;
    }

    if (rewardsEnabled && resolution.xpAwarded > 0) {
      const { error: rpcError } = await supabase.rpc("record_game_interaction", {
        p_user_id: prediction.user_id,
        p_xp_delta: resolution.xpAwarded,
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
    JSON.stringify({
      resolved,
      errors,
      source: "product-hunt-live",
      rewardsEnabled,
      date: contextDate,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
