import { NextResponse } from "next/server";

import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import { canReadSignalProgressionUi } from "@/lib/signal-progression/flags";
import {
  MAX_SIGNAL_BODY_BYTES,
  readBearerToken,
  readJsonBodyLimited,
} from "@/lib/signal-progression/http";
import { resolveAuthenticatedUserId } from "@/lib/signal-progression/service";
import { z } from "@/lib/validation/zod";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

const prefsSchema = z
  .object({
    reduceRewardAnimations: z.boolean(),
    muteRewardSounds: z.boolean(),
    quietMode: z.boolean(),
    suppressAutomaticAchievements: z.boolean(),
  })
  .strict();

export async function GET(request: Request) {
  const config = createReleaseFeatureConfig();
  if (!canReadSignalProgressionUi(config)) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data } = await admin
      .from("signal_reward_preferences")
      .select(
        "reduce_reward_animations, mute_reward_sounds, quiet_mode, suppress_automatic_achievements",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) {
      return NextResponse.json({ preferences: null });
    }
    return NextResponse.json({
      preferences: {
        reduceRewardAnimations: data.reduce_reward_animations,
        muteRewardSounds: data.mute_reward_sounds,
        quietMode: data.quiet_mode,
        suppressAutomaticAchievements: data.suppress_automatic_achievements,
      },
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const config = createReleaseFeatureConfig();
  if (!canReadSignalProgressionUi(config)) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const bodyResult = await readJsonBodyLimited(request, MAX_SIGNAL_BODY_BYTES);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const parsed = prefsSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { url, anonKey } = getSupabasePublicEnv();
    if (!url || !anonKey) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await userClient.rpc(
      "upsert_signal_reward_preferences",
      {
        p_reduce_reward_animations: parsed.data.reduceRewardAnimations,
        p_mute_reward_sounds: parsed.data.muteRewardSounds,
        p_quiet_mode: parsed.data.quietMode,
        p_suppress_automatic_achievements:
          parsed.data.suppressAutomaticAchievements,
      },
    );
    if (error) {
      return NextResponse.json({ error: "prefs_failed" }, { status: 503 });
    }
    return NextResponse.json({ preferences: data });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
