/**
 * Config reversibile della visual desktop del Radar (B44 / DESK-804).
 *
 * La composizione desktop monta UNA sola visual (nodes oppure table, mai
 * entrambe): la scelta primaria arriva da questa config, il toggle lazy in
 * pagina permette all'utente di passare all'altra senza doppio mount e
 * senza perdere il range selezionato.
 *
 * Pattern B04: risoluzione server-side (la pagina Radar è un server
 * component e passa il valore come prop), valori non validi falliscono in
 * modo rumoroso al boot invece di silently fallback. I client component
 * importano solo il tipo `RadarDesktopVisual`, mai il valore risolto.
 */

export const RADAR_DESKTOP_VISUALS = ["nodes", "table"] as const;

export type RadarDesktopVisual = (typeof RADAR_DESKTOP_VISUALS)[number];

export const RADAR_DESKTOP_VISUAL_ENV_KEY = "TOOOLVIBES_RADAR_DESKTOP_VISUAL";

/** Primary view desktop: densità prima (DESK-804), nodes resta selezionabile. */
export const DEFAULT_RADAR_DESKTOP_VISUAL: RadarDesktopVisual = "table";

export class RadarViewConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RadarViewConfigError";
  }
}

export function resolveRadarDesktopVisual(
  value: string | undefined,
): RadarDesktopVisual {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_RADAR_DESKTOP_VISUAL;
  }

  const normalized = value.trim().toLowerCase();

  if ((RADAR_DESKTOP_VISUALS as readonly string[]).includes(normalized)) {
    return normalized as RadarDesktopVisual;
  }

  throw new RadarViewConfigError(
    `${RADAR_DESKTOP_VISUAL_ENV_KEY} must be one of ${RADAR_DESKTOP_VISUALS.join("/")}.`,
  );
}

/** Risolto una sola volta lato server (env non seriale verso il client). */
export const radarDesktopVisual = resolveRadarDesktopVisual(
  process.env.TOOOLVIBES_RADAR_DESKTOP_VISUAL,
);
