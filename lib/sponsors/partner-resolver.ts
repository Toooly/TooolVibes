/**
 * TooolVibes — Contextual Partner Resolver
 *
 * Single canonical selection point for direct Partner Experience campaigns.
 *
 * Selection order (contract):
 *   1. active campaign (status + flight window);
 *   2. route eligibility (preferredRoutes / excludedRoutes);
 *   3. category/tag relevance (contextual surfaces only);
 *   4. self-sponsorship exclusion (a campaign never renders on its own
 *      tool/detail surface);
 *   5. contextual score;
 *   6. campaign priority;
 *   7. deterministic rotation between equivalent campaigns, biased by
 *      rotationWeight, with a per-placement offset so different surfaces
 *      do not automatically repeat the same partner.
 *
 * Determinism contract: rotational surfaces (home/archivio) share a single
 * UTC-day seed and differentiate only through the per-placement rotation
 * offset, so Home (N) and Archivio (N+1) never land on the same partner;
 * contextual surfaces seed from the placement key and the subject. Server
 * and client on the same day always resolve the same campaign — no
 * randomness, no per-user tracking, no hydration drift beyond the UTC
 * midnight boundary.
 */

import {
  getManagedCampaigns,
  getPlacementOverride,
  type CommercialOverrides,
} from "@/lib/sponsors/commercial-overrides";
import {
  type SponsorCampaign,
  type SponsorRouteKey,
} from "@/lib/sponsors/sponsor-placements";

export type PartnerResolveOptions = {
  campaigns?: readonly SponsorCampaign[];
  overrides?: CommercialOverrides;
};

export type PartnerResolutionStrategy = "rotation" | "contextual";

export type PartnerResolutionContext = {
  /** Monetization placement key requesting a campaign. */
  placementKey: string;
  /** Canonical commercial route of the placement. */
  route: SponsorRouteKey;
  /** rotation = curated surfaces (home/archivio); contextual = tag-driven. */
  strategy: PartnerResolutionStrategy;
  /** Per-placement rotation offset (home N, archivio N+1, …). */
  rotationOffset?: number;
  /** Current tool/article subject — used for self-sponsorship exclusion. */
  toolSlug?: string;
  /** Catalogue segments + free tags of the current subject. */
  tags?: readonly string[];
  /** Free text (title/summary) for weak topic matching. */
  text?: string;
  /** Clock injection for tests; defaults to now. */
  now?: Date;
};

/** Minimum relevance for contextual surfaces: one segment match (2 pts)
    or two independent weak signals. Below this, no campaign renders. */
const CONTEXTUAL_SCORE_THRESHOLD = 2;

function isCampaignEligible(
  campaign: SponsorCampaign,
  route: SponsorRouteKey,
  now: Date,
): boolean {
  if (campaign.status !== "active") return false;
  if (campaign.startsAt) {
    const start = Date.parse(campaign.startsAt);
    if (!Number.isNaN(start) && now.getTime() < start) return false;
  }
  if (campaign.endsAt) {
    const end = Date.parse(campaign.endsAt);
    if (!Number.isNaN(end) && now.getTime() > end) return false;
  }
  if (campaign.excludedRoutes?.includes(route)) return false;
  if (
    campaign.preferredRoutes &&
    campaign.preferredRoutes.length > 0 &&
    !campaign.preferredRoutes.includes(route)
  ) {
    return false;
  }
  return true;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Relevance score: catalogue segment matches weigh 2, free-tag matches 1,
 * title/summary substring matches 1. A campaign with no declared context
 * signals scores 0 on contextual surfaces (never forced).
 */
export function scoreCampaignRelevance(
  campaign: SponsorCampaign,
  ctx: Pick<PartnerResolutionContext, "tags" | "text">,
): number {
  const subjectTags = new Set((ctx.tags ?? []).map(normalize));
  const subjectText = normalize(ctx.text ?? "");

  let score = 0;
  for (const segment of campaign.categoryTags ?? []) {
    if (subjectTags.has(normalize(segment))) score += 2;
  }
  for (const tag of campaign.contextTags ?? []) {
    const needle = normalize(tag);
    if (!needle) continue;
    if (subjectTags.has(needle)) score += 1;
    else if (subjectText && subjectText.includes(needle)) score += 1;
  }
  return score;
}

/** FNV-1a 32-bit — stable across server and client. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function utcDaySeed(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Deterministic weighted pick. Equivalent campaigns (same priority) rotate
 * by day + placement offset; rotationWeight biases the share. The offset
 * shifts the pick so Home and Archivio do not automatically repeat the
 * same partner on the same day.
 */
function pickDeterministic(
  campaigns: readonly SponsorCampaign[],
  seedKey: string,
  rotationOffset: number,
  now: Date,
): SponsorCampaign {
  const maxPriority = Math.max(...campaigns.map((c) => c.priority ?? 0));
  const tier = campaigns.filter((c) => (c.priority ?? 0) === maxPriority);

  const weights = tier.map((c) => Math.max(0, c.rotationWeight ?? 1));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const hash = fnv1a(`${seedKey}|${utcDaySeed(now)}`);
  if (totalWeight <= 0) {
    return tier[hash % tier.length] as SponsorCampaign;
  }

  let cursor = hash % totalWeight;
  let index = 0;
  for (let i = 0; i < tier.length; i += 1) {
    const w = weights[i] as number;
    if (cursor < w) {
      index = i;
      break;
    }
    cursor -= w;
  }
  return tier[(index + rotationOffset) % tier.length] as SponsorCampaign;
}

/**
 * Resolve the campaign for a placement, or null when no eligible/relevant
 * campaign exists (the caller then renders the Open Slot or nothing).
 */
function resolvePartnerCampaignAuto(
  ctx: PartnerResolutionContext,
  campaigns: readonly SponsorCampaign[],
): SponsorCampaign | null {
  const now = ctx.now ?? new Date();

  let candidates = campaigns.filter((campaign) =>
    isCampaignEligible(campaign, ctx.route, now),
  );

  /* Self-sponsorship exclusion. */
  if (ctx.toolSlug) {
    candidates = candidates.filter(
      (campaign) => campaign.toolSlug !== ctx.toolSlug,
    );
  }

  if (candidates.length === 0) return null;

  if (ctx.strategy === "contextual") {
    const scored = candidates
      .map((campaign) => ({
        campaign,
        score: scoreCampaignRelevance(campaign, ctx),
      }))
      .filter((entry) => entry.score >= CONTEXTUAL_SCORE_THRESHOLD);

    if (scored.length === 0) return null;

    const best = Math.max(...scored.map((entry) => entry.score));
    const top = scored
      .filter((entry) => entry.score === best)
      .map((entry) => entry.campaign);

    return pickDeterministic(
      top,
      `ctx|${ctx.placementKey}|${ctx.toolSlug ?? ctx.text ?? ""}`,
      ctx.rotationOffset ?? 0,
      now,
    );
  }

  /* Shared day seed across rotational surfaces so rotationOffset creates
     true anti-collision (home N, archive N+1) instead of independent hashes
     that can still land on the same partner. */
  return pickDeterministic(
    candidates,
    "rot|shared",
    ctx.rotationOffset ?? 0,
    now,
  );
}

/**
 * Deterministic UTM decoration for paid partner destinations. Sponsor
 * URLs that already carry utm_* parameters are returned untouched — we
 * never overwrite partner-provided tracking.
 */
export function buildPartnerDestinationUrl(
  campaign: SponsorCampaign,
  placementKey: string,
): string {
  const raw = campaign.destinationUrl.trim();
  if (raw.includes("utm_")) return raw;

  try {
    const url = new URL(raw);
    url.searchParams.set("utm_source", "tooolvibes");
    url.searchParams.set("utm_medium", "partner");
    url.searchParams.set(
      "utm_campaign",
      campaign.utmCampaign ?? campaign.sponsorId,
    );
    url.searchParams.set("utm_content", placementKey);
    return url.toString();
  } catch {
    return raw;
  }
}


export function resolvePartnerCampaign(
  ctx: PartnerResolutionContext,
  options: PartnerResolveOptions = {},
): SponsorCampaign | null {
  const now = ctx.now ?? new Date();
  const campaigns = options.campaigns ?? getManagedCampaigns(options.overrides);
  const override = getPlacementOverride(ctx.placementKey, options.overrides);

  if (override.mode === "off") {
    return null;
  }

  if (override.mode === "pin" && override.campaignId) {
    const pinned = campaigns.find(
      (campaign) => campaign.id === override.campaignId,
    );
    if (
      pinned &&
      isCampaignEligible(pinned, ctx.route, now) &&
      pinned.toolSlug !== ctx.toolSlug
    ) {
      return pinned;
    }
  }

  return resolvePartnerCampaignAuto(ctx, campaigns);
}
