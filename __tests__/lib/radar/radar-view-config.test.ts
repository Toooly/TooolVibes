import { describe, expect, it } from "vitest";

import {
  DEFAULT_RADAR_DESKTOP_VISUAL,
  RADAR_DESKTOP_VISUAL_ENV_KEY,
  RadarViewConfigError,
  resolveRadarDesktopVisual,
} from "@/lib/radar/radar-view-config";

describe("radar desktop visual config (B44 / DESK-804)", () => {
  it("ha un default sicuro e dichiarato", () => {
    expect(DEFAULT_RADAR_DESKTOP_VISUAL).toBe("table");
    expect(resolveRadarDesktopVisual(undefined)).toBe("table");
    expect(resolveRadarDesktopVisual("")).toBe("table");
    expect(resolveRadarDesktopVisual("   ")).toBe("table");
  });

  it("risolve i valori validi in modo case-insensitive e tollerante agli spazi", () => {
    expect(resolveRadarDesktopVisual("nodes")).toBe("nodes");
    expect(resolveRadarDesktopVisual("table")).toBe("table");
    expect(resolveRadarDesktopVisual("NODES")).toBe("nodes");
    expect(resolveRadarDesktopVisual(" table ")).toBe("table");
  });

  it("rifiuta valori non validi con errore rumoroso (pattern B04)", () => {
    expect(() => resolveRadarDesktopVisual("grid")).toThrow(
      RadarViewConfigError,
    );
    expect(() => resolveRadarDesktopVisual("grid")).toThrow(
      RADAR_DESKTOP_VISUAL_ENV_KEY,
    );
  });
});
