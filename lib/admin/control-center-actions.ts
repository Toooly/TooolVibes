"use server";

import { promises as fs } from "node:fs";
import path from "node:path";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/session";
import type { HomepageControls } from "@/lib/content/homepage-controls";
import type {
  CampaignOverride,
  CommercialOverrides,
  PlacementOverrideMode,
} from "@/lib/sponsors/commercial-overrides";
import type { SponsorCampaignStatus, SponsorPlacementId } from "@/lib/sponsors/sponsor-placements";
import type { MediaAsset, MediaAssetKind } from "@/lib/admin/media-catalog";
import type { ManagedCampaign, ManagedPartner } from "@/lib/sponsors/managed-commercial";

async function recordAdminActivity(action: string, entity: string, id?: string) {
  try {
    const filePath = path.join(process.cwd(), "data/admin-activity.json");
    let events: Array<{ at: string; action: string; entity: string; id?: string }> = [];
    try {
      events = ((JSON.parse(await fs.readFile(filePath, "utf8")) as { events?: typeof events }).events ?? []);
    } catch {
      events = [];
    }
    events = [{ at: new Date().toISOString(), action, entity, id }, ...events].slice(0, 40);
    await writeJson("data/admin-activity.json", { events });
  } catch {
    // activity is best-effort
  }
}

async function writeJson(rel: string, value: unknown) {
  const filePath = path.join(process.cwd(), rel);
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson<T>(rel: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), rel), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function internalHref(value: FormDataEntryValue | null): string {
  const href = String(value ?? "").trim() || "/radar";
  return href.startsWith("/") && !href.startsWith("//") ? href : "/radar";
}

export async function saveHomepageControlsAction(formData: FormData) {
  await requireAdminSession();
  const next: HomepageControls = {
    announcement: {
      enabled: formData.get("announcementEnabled") === "on",
      text: String(formData.get("announcementText") ?? "").trim(),
      href: internalHref(formData.get("announcementHref")),
      image: String(formData.get("announcementImage") ?? "").trim() || null,
    },
    featuredToolSlug: String(formData.get("featuredToolSlug") ?? "").trim() || null,
  };
  try {
    await writeJson("data/homepage-controls.json", next);
  } catch {
    redirect("/admin/composer?saved=0");
  }
  await recordAdminActivity("homepage aggiornata", "homepage");
  redirect("/admin/composer?saved=1");
}

export async function savePlacementOverrideAction(formData: FormData) {
  await requireAdminSession();
  const key = String(formData.get("placementKey") ?? "").trim();
  const mode = String(formData.get("mode") ?? "auto") as PlacementOverrideMode;
  const campaignId = String(formData.get("campaignId") ?? "").trim() || null;
  if (!key) return;
  const current = await readJson<CommercialOverrides>("data/commercial-overrides.json", {
    placements: {},
    campaigns: {},
  });
  current.placements[key] = { mode, campaignId };
  current.campaigns = current.campaigns ?? {};
  try {
    await writeJson("data/commercial-overrides.json", current);
  } catch {
    redirect("/admin/commercial/placements?saved=0");
  }
  await recordAdminActivity("placement aggiornato", "placement", key);
  redirect("/admin/commercial/placements?saved=1");
}

export async function saveCampaignOverrideAction(formData: FormData) {
  await requireAdminSession();
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  if (!campaignId) return;
  const current = await readJson<CommercialOverrides>("data/commercial-overrides.json", {
    placements: {},
    campaigns: {},
  });
  const override: CampaignOverride = {
    status: String(formData.get("status") ?? "") as SponsorCampaignStatus,
    headline: String(formData.get("headline") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || undefined,
    destinationUrl: String(formData.get("destinationUrl") ?? "").trim() || undefined,
    eyebrow: String(formData.get("eyebrow") ?? "").trim() || undefined,
    image: String(formData.get("image") ?? "").trim() || null,
    startsAt: String(formData.get("startsAt") ?? "").trim() || null,
    endsAt: String(formData.get("endsAt") ?? "").trim() || null,
    priority: Number(formData.get("priority") || 50),
    rotationWeight: Number(formData.get("rotationWeight") || 1),
  };
  current.placements = current.placements ?? {};
  current.campaigns = { ...(current.campaigns ?? {}), [campaignId]: override };
  try {
    await writeJson("data/commercial-overrides.json", current);
  } catch {
    redirect(`/admin/commercial/campaigns/${campaignId}?saved=0`);
  }
  await recordAdminActivity("campagna aggiornata", "campaign", campaignId);
  redirect(`/admin/commercial/campaigns/${campaignId}?saved=1`);
}

export async function saveMediaAssetAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  const src = String(formData.get("src") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!id || !src || !label) return;
  const current = await readJson<{ assets: MediaAsset[] }>("data/media-library.json", {
    assets: [],
  });
  const asset: MediaAsset = {
    id,
    kind: (String(formData.get("kind") ?? "editorial") as MediaAssetKind) || "editorial",
    label,
    src,
    alt: String(formData.get("alt") ?? label).trim() || label,
    usedIn: String(formData.get("usedIn") ?? "Editoriale").trim() || "Editoriale",
  };
  current.assets = [...current.assets.filter((item) => item.id !== id), asset];
  try {
    await writeJson("data/media-library.json", current);
  } catch {
    // Runtime without writable filesystem keeps first-party catalog.
  }
}


export async function saveManagedPartnerAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!id) return;
  const partner: ManagedPartner = {
    id,
    name: String(formData.get("name") ?? "").trim() || id,
    status: (String(formData.get("status") ?? "draft") as ManagedPartner["status"]) || "draft",
    website: String(formData.get("website") ?? "").trim() || undefined,
    logo: String(formData.get("logo") ?? "").trim() || undefined,
    brandPlate: String(formData.get("brandPlate") ?? "").trim() || undefined,
    defaultCta: String(formData.get("defaultCta") ?? "").trim() || undefined,
    destinationUrl: String(formData.get("destinationUrl") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
    startsAt: String(formData.get("startsAt") ?? "").trim() || undefined,
    endsAt: String(formData.get("endsAt") ?? "").trim() || undefined,
    segments: String(formData.get("segments") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
  };
  const filePath = path.join(process.cwd(), "data/managed-partners.json");
  let partners: ManagedPartner[] = [];
  try {
    partners = ((JSON.parse(await fs.readFile(filePath, "utf8")) as { partners?: ManagedPartner[] }).partners ?? []);
  } catch {
    partners = [];
  }
  const next = [...partners.filter((item) => item.id !== id), partner];
  try {
    await writeJson("data/managed-partners.json", { partners: next });
  } catch {
    redirect(`/admin/commercial/partners/${id}?saved=0`);
  }
  await recordAdminActivity("partner salvato", "partner", id);
  redirect(`/admin/commercial/partners/${id}?saved=1`);
}

export async function saveManagedCampaignAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  if (!id || !partnerId) return;
  const placements = String(formData.getAll("placements").join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean) as SponsorPlacementId[];
  const campaign: ManagedCampaign = {
    id,
    partnerId,
    name: String(formData.get("name") ?? "").trim() || id,
    status: String(formData.get("status") ?? "draft") as ManagedCampaign["status"],
    eyebrow: String(formData.get("eyebrow") ?? "").trim() || undefined,
    headline: String(formData.get("headline") ?? "").trim() || String(formData.get("name") ?? id),
    description: String(formData.get("description") ?? "").trim() || "",
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || "Scopri",
    destinationUrl: String(formData.get("destinationUrl") ?? "").trim() || "/",
    image: String(formData.get("image") ?? "").trim() || null,
    placements,
    startsAt: String(formData.get("startsAt") ?? "").trim() || undefined,
    endsAt: String(formData.get("endsAt") ?? "").trim() || undefined,
    priority: Number(formData.get("priority") || 40),
    rotationWeight: Number(formData.get("rotationWeight") || 1),
    categoryTags: String(formData.get("categoryTags") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
  };
  const filePath = path.join(process.cwd(), "data/managed-campaigns.json");
  let campaigns: ManagedCampaign[] = [];
  try {
    campaigns = ((JSON.parse(await fs.readFile(filePath, "utf8")) as { campaigns?: ManagedCampaign[] }).campaigns ?? []);
  } catch {
    campaigns = [];
  }
  try {
    await writeJson("data/managed-campaigns.json", {
      campaigns: [...campaigns.filter((item) => item.id !== id), campaign],
    });
  } catch {
    redirect("/admin/commercial/campaigns?saved=0");
  }
  await recordAdminActivity("campagna salvata", "campaign", id);
  redirect("/admin/commercial/campaigns?saved=1");
}
