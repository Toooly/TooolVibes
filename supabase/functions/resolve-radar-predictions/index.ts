// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  const { data: predictions, error } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("context_date", yesterday)
    .eq("status", "pending");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let resolved = 0;

  for (const prediction of predictions ?? []) {
    // Stub: replace with real rank-delta computation from directory data.
    const actualRankChange = Math.floor(Math.random() * 10) - 3;
    let status;
    let xp = 0;

    if (actualRankChange >= 5) {
      status = "won";
      xp = 80;
    } else if (actualRankChange >= 0) {
      status = "close";
      xp = 20;
    } else {
      status = "lost";
      xp = 0;
    }

    try {
      await supabase
        .from("radar_predictions")
        .update({
          resolved_at: new Date().toISOString(),
          actual_rank_change: actualRankChange,
          xp_awarded: xp,
          status,
        })
        .eq("id", prediction.id);

      if (xp > 0) {
        await supabase.rpc("record_game_interaction", {
          p_user_id: prediction.user_id,
          p_xp_delta: xp,
        });
      }

      resolved += 1;
    } catch (err) {
      console.error(`Failed to resolve prediction ${prediction.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ resolved, date: yesterday }), {
    headers: { "Content-Type": "application/json" },
  });
});
