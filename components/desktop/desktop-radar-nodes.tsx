"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type ProductHuntItem = {
  id: string;
  name: string;
  tagline: string;
  votesCount: number;
  commentsCount: number;
  productHuntUrl: string;
  thumbnailUrl?: string;
};

type ProductHuntPayload = {
  status: "ok" | "missing-token" | "error";
  items: ProductHuntItem[];
};

const desktopFallbackItems: ProductHuntItem[] = [
  {
    id: "desktop-radar-fallback-1",
    name: "Blink",
    tagline: "AI app builder in evidenza.",
    votesCount: 164,
    commentsCount: 24,
    productHuntUrl: "/toools/blink",
  },
  {
    id: "desktop-radar-fallback-2",
    name: "VibeCode",
    tagline: "Vibe coding da tenere nel radar.",
    votesCount: 128,
    commentsCount: 18,
    productHuntUrl: "/toools/vibecode",
  },
  {
    id: "desktop-radar-fallback-3",
    name: "WeWeb",
    tagline: "Builder no-code per interfacce web.",
    votesCount: 112,
    commentsCount: 15,
    productHuntUrl: "/toools/weweb",
  },
  {
    id: "desktop-radar-fallback-4",
    name: "Cosmic JS",
    tagline: "Headless CMS orbitale.",
    votesCount: 92,
    commentsCount: 11,
    productHuntUrl: "/toools/cosmic-js",
  },
  {
    id: "desktop-radar-fallback-5",
    name: "Dopami",
    tagline: "Segnale emergente da monitorare.",
    votesCount: 76,
    commentsCount: 9,
    productHuntUrl: "/radar",
  },
];

const nodeLayout = [
  { x: 50, y: 52, delay: -0.1, size: 0.66 },
  { x: 59, y: 45, delay: -1.08, size: 0.62 },
  { x: 61, y: 58, delay: -2.02, size: 0.6 },
  { x: 41, y: 59, delay: -3.05, size: 0.58 },
  { x: 40, y: 46, delay: -4.18, size: 0.56 },
];

export function DesktopRadarNodes() {
  const [items, setItems] = useState<ProductHuntItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/product-hunt?range=day")
      .then(async (response) => {
        if (!response.ok) throw new Error("Classifica Product Hunt non disponibile");
        return (await response.json()) as ProductHuntPayload;
      })
      .then((payload) => {
        if (!mounted) return;
        setItems(payload.status === "ok" && payload.items.length ? payload.items : desktopFallbackItems);
      })
      .catch(() => {
        if (mounted) setItems(desktopFallbackItems);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const nodes = useMemo(() => {
    const pool = (items.length ? items : desktopFallbackItems).slice(0, 5);
    const maxVotes = Math.max(...pool.map((item) => item.votesCount || 1), 1);

    return pool.map((item, index) => {
      const layout = nodeLayout[index] ?? nodeLayout[0];
      const heat = Math.max(0.7, Math.min(1.18, (item.votesCount || 1) / maxVotes + 0.42));
      return {
        ...item,
        layout,
        heat,
        index,
      };
    });
  }, [items]);

  return (
    <div
      className={`desktop-radar-nodes${loaded ? " is-loaded" : ""}`}
      aria-label="Top 5 tool nel radar live"
    >
      {nodes.map((node) => {
        const iconStyle = node.thumbnailUrl
          ? ({ "--node-img": `url("${node.thumbnailUrl}")` } as CSSProperties)
          : undefined;
        const nodeStyle = {
          "--node-x": `${node.layout.x}%`,
          "--node-y": `${node.layout.y}%`,
          "--node-delay": `${node.layout.delay}s`,
          "--node-scale": node.layout.size,
          "--node-heat": node.heat,
        } as CSSProperties;

        return (
          <a
            key={node.id}
            href={node.productHuntUrl}
            target={node.productHuntUrl.startsWith("http") ? "_blank" : undefined}
            rel={node.productHuntUrl.startsWith("http") ? "noopener noreferrer" : undefined}
            className="desktop-radar-node"
            style={nodeStyle}
            aria-label={`${node.name}. ${node.votesCount} voti, posizione ${node.index + 1}`}
          >
            <span className="desktop-radar-node__halo" aria-hidden="true" />
            <span className="desktop-radar-node__ring" aria-hidden="true" />
            <span className="desktop-radar-node__body" style={iconStyle}>
              {node.thumbnailUrl ? null : (
                <span className="desktop-radar-node__initials">
                  {node.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
            <span className="desktop-radar-node__label">
              <strong>{node.name}</strong>
              <small>{node.votesCount || "in scansione"} voti</small>
            </span>
            {node.index === 0 ? <span className="desktop-radar-node__badge">Caldo</span> : null}
          </a>
        );
      })}
    </div>
  );
}
