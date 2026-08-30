import { parseOwnerExperience } from "@/lib/community/owner-page";
import type {
  CommunityExperienceOwner,
  CommunityReportReason,
  DurationBucket,
} from "@/lib/community/schema";

export type CommunityWriteError = {
  code: string;
  message: string;
};

type ExperiencePayload = {
  displayName: string;
  useCase: string;
  body: string;
  pros: string[];
  limits: string[];
  durationBucket: DurationBucket;
  switchedFromSlug?: string | null;
  switchedFromLabel?: string | null;
};

async function readError(response: Response): Promise<CommunityWriteError> {
  try {
    const json = (await response.json()) as { error?: { code?: string; message?: string } };
    return {
      code: json.error?.code ?? "SERVER_ERROR",
      message: json.error?.message ?? "Operazione non riuscita.",
    };
  } catch {
    return { code: "SERVER_ERROR", message: "Operazione non riuscita." };
  }
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchOwnerExperience(input: {
  token: string;
  toolSlug: string;
}): Promise<
  | { ok: true; experience: CommunityExperienceOwner | null }
  | { ok: false; error: CommunityWriteError }
> {
  const url = `/api/community/experiences/mine?tool=${encodeURIComponent(input.toolSlug)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${input.token}` },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) return { ok: false, error: await readError(response) };
  const json = (await response.json()) as { experience?: unknown };
  if (json.experience == null) return { ok: true, experience: null };
  const parsed = parseOwnerExperience(json.experience);
  if (!parsed) return { ok: false, error: { code: "SERVER_ERROR", message: "Risposta non valida." } };
  return { ok: true, experience: parsed };
}

export async function createOwnerExperience(input: {
  token: string;
  toolSlug: string;
  captchaToken: string;
  payload: ExperiencePayload;
}): Promise<
  | { ok: true; experience: CommunityExperienceOwner }
  | { ok: false; error: CommunityWriteError }
> {
  const body: Record<string, unknown> = {
    toolSlug: input.toolSlug,
    captchaToken: input.captchaToken,
    displayName: input.payload.displayName,
    useCase: input.payload.useCase,
    body: input.payload.body,
    pros: input.payload.pros,
    limits: input.payload.limits,
    durationBucket: input.payload.durationBucket,
  };
  if (input.payload.switchedFromSlug) body.switchedFromSlug = input.payload.switchedFromSlug;
  if (input.payload.switchedFromLabel) body.switchedFromLabel = input.payload.switchedFromLabel;
  const response = await fetch("/api/community/experiences", {
    method: "POST",
    headers: authHeaders(input.token),
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!response.ok) return { ok: false, error: await readError(response) };
  const json = (await response.json()) as { experience?: unknown };
  const parsed = parseOwnerExperience(json.experience);
  if (!parsed) return { ok: false, error: { code: "SERVER_ERROR", message: "Risposta non valida." } };
  return { ok: true, experience: parsed };
}

export async function updateOwnerExperienceRequest(input: {
  token: string;
  id: string;
  expectedUpdatedAt: string;
  payload: ExperiencePayload;
}): Promise<
  | { ok: true; experience: CommunityExperienceOwner }
  | { ok: false; error: CommunityWriteError }
> {
  const body: Record<string, unknown> = {
    expectedUpdatedAt: input.expectedUpdatedAt,
    displayName: input.payload.displayName,
    useCase: input.payload.useCase,
    body: input.payload.body,
    pros: input.payload.pros,
    limits: input.payload.limits,
    durationBucket: input.payload.durationBucket,
    switchedFromSlug: input.payload.switchedFromSlug ?? null,
    switchedFromLabel: input.payload.switchedFromLabel ?? null,
  };
  const response = await fetch(`/api/community/experiences/${input.id}`, {
    method: "PATCH",
    headers: authHeaders(input.token),
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!response.ok) return { ok: false, error: await readError(response) };
  const json = (await response.json()) as { experience?: unknown };
  const parsed = parseOwnerExperience(json.experience);
  if (!parsed) return { ok: false, error: { code: "SERVER_ERROR", message: "Risposta non valida." } };
  return { ok: true, experience: parsed };
}

export async function deleteOwnerExperienceRequest(input: {
  token: string;
  id: string;
}): Promise<{ ok: true } | { ok: false; error: CommunityWriteError }> {
  const response = await fetch(`/api/community/experiences/${input.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${input.token}` },
    credentials: "same-origin",
  });
  if (!response.ok) return { ok: false, error: await readError(response) };
  return { ok: true };
}

export function communityWriteUserMessage(code: string) {
  if (code === "RATE_LIMITED") return "Troppe richieste. Riprova tra poco.";
  if (code === "TURNSTILE_REQUIRED" || code === "TURNSTILE_FAILED") {
    return "Completa la verifica per inviare.";
  }
  if (code === "TURNSTILE_UNAVAILABLE") return "Verifica non disponibile. Riprova.";
  if (code === "EXPERIENCE_ALREADY_EXISTS") {
    return "Hai già un'esperienza per questo tool.";
  }
  if (code === "EXPERIENCE_VERSION_CONFLICT") {
    return "Questa esperienza è cambiata in un'altra sessione. Ricarica i dati prima di salvare.";
  }
  if (code === "INVALID_INPUT") return "Controlla i campi e riprova.";
  if (code === "AUTH_REQUIRED") return "Accedi per continuare.";
  return "Operazione non riuscita. Riprova.";
}

export async function reportExperience(input: {
  token: string;
  experienceId: string;
  reason: CommunityReportReason;
  details?: string | null;
}): Promise<
  | { ok: true; id: string; status: string }
  | { ok: false; error: CommunityWriteError }
> {
  const body: Record<string, unknown> = { reason: input.reason };
  if (input.details) body.details = input.details;
  const response = await fetch(
    `/api/community/experiences/${input.experienceId}/report`,
    {
      method: "POST",
      headers: authHeaders(input.token),
      credentials: "same-origin",
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) return { ok: false, error: await readError(response) };
  const json = (await response.json()) as { id?: string; status?: string };
  return {
    ok: true,
    id: typeof json.id === "string" ? json.id : "",
    status: typeof json.status === "string" ? json.status : "open",
  };
}

export function communityReportUserMessage(code: string) {
  if (code === "EXPERIENCE_ALREADY_REPORTED") return "L\u2019hai gi\u00e0 segnalata.";
  if (code === "CANNOT_REPORT_OWN_EXPERIENCE") {
    return "Non puoi segnalare la tua stessa esperienza.";
  }
  if (code === "RATE_LIMITED") {
    return "Troppe segnalazioni in poco tempo. Riprova pi\u00f9 tardi.";
  }
  if (code === "EXPERIENCE_NOT_FOUND") {
    return "Questa esperienza non \u00e8 pi\u00f9 disponibile.";
  }
  return "Non siamo riusciti a inviare la segnalazione.";
}
