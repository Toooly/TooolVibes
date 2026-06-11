/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_MISSIONS = [
  {
    scope: "radar",
    kind: "explore",
    title: "Esplora il futuro",
    description: "Scopri 3 tool che non avevi mai aperto",
    target: 3,
    xp_reward: 40,
  },
  {
    scope: "radar",
    kind: "signals",
    title: "Lascia un segnale",
    description: "Interagisci con 2 tool in ascesa",
    target: 2,
    xp_reward: 55,
  },
  {
    scope: "radar",
    kind: "predict",
    title: "Profeta del Radar",
    description: "Indovina il tool che salirà di più domani",
    target: 1,
    xp_reward: 80,
  },
  {
    scope: "arena",
    kind: "battle",
    title: "Campione dell'Arena",
    description: "Vinci 3 battaglie",
    target: 3,
    xp_reward: 60,
  },
];

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

  const today = new Date().toISOString().slice(0, 10);

  const { data: users } = await supabase.auth.admin.listUsers();
  for (const user of users.users) {
    for (const mission of DAILY_MISSIONS) {
      await supabase.from("game_missions").upsert(
        {
          user_id: user.id,
          scope: mission.scope,
          kind: mission.kind,
          title: mission.title,
          description: mission.description,
          target: mission.target,
          progress: 0,
          xp_reward: mission.xp_reward,
          status: "active",
          resets_at: today,
        },
        { onConflict: "user_id, scope, kind, resets_at" }
      );
    }
  }

  return new Response(JSON.stringify({ ok: true, date: today }), {
    headers: { "Content-Type": "application/json" },
  });
});
