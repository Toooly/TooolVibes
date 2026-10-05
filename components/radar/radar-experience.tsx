"use client";

/**
 * Radar surface entrypoints.
 *
 * - `RadarExperience` â the FULL logged-only Radar
 *   (`components/radar/full-radar-experience.tsx`).
 * - `HomeRadarPreview` â the frozen Home preview
 *   (`components/radar/home-radar-preview.tsx`). Home is a frozen system.
 *
 * This module keeps the historical import path used by
 * `components/home/start-here.tsx` stable.
 */

export { RadarExperience } from "@/components/radar/full-radar-experience";
export { HomeRadarPreview } from "@/components/radar/home-radar-preview";
