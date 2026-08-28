"use client";

import Link from "next/link";
import { useMemo } from "react";

import { HOME_RADAR_CAP } from "@/lib/account/workspace-pipeline";
import {
  formatRadarSignal,
  resolveRadarUiModel,
} from "@/lib/radar/radar-ui-model";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";

export function HomeRadarPulse() {
  const { payload, isLoading } = useProductHuntRadar("day");
  const model = useMemo(() => resolveRadarUiModel(payload, "day"), [payload]);
  const items = model.items.slice(0, HOME_RADAR_CAP);

  if (items.length === 0) return null;

  return (
    <section
      className="tv-home__radar"
      aria-labelledby="tv-home-radar-title"
      aria-busy={isLoading || undefined}
    >
      <h2 id="tv-home-radar-title" className="tv-home-title">
        Dal Radar
      </h2>
      <ul className="tv-home-list">
        {items.map((item) => {
          const context = (item.tagline ?? "").trim() || formatRadarSignal(item);
          return (
            <li key={item.id}>
              <Link className="tv-home-row" href="/radar">
                <span className="tv-home-row__text">{item.name}</span>
                <span className="tv-home-row__meta">{context}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="tv-home-actions">
        <Link className="tv-home-textbtn" href="/radar">
          Apri Radar
        </Link>
      </div>
    </section>
  );
}
