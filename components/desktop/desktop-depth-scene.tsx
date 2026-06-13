"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bookmark, GitCompare, Search } from "lucide-react";
import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

function useMouseParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      pendingRef.current = { x, y };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          setPos(pendingRef.current);
          rafRef.current = null;
        });
      }
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  return pos;
}

type DesktopDepthSceneProps = {
  focusTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
};

const sceneRoutes = [
  { icon: Search, label: "Discover", href: "/archivio" },
  { icon: GitCompare, label: "Compare", href: "/compare" },
  { icon: Bookmark, label: "Shortlist", href: "/shortlist" },
];

const contextSignals = ["AI App Builder", "Automation", "Vibe Coding", "No-Code"];

export function DesktopDepthScene({ focusTool, supportingTools }: DesktopDepthSceneProps) {
  const router = useRouter();
  const { x, y } = useMouseParallax();
  const midgroundTools = supportingTools.slice(0, 3);
  const navigate = (href: string) => {
    router.push(href);
  };

  return (
    <DepthSceneRoot>
      <DepthLayerBackground />
      <DepthLayerMidground tools={midgroundTools} onNavigate={navigate} parallaxX={x} parallaxY={y} />
      <DepthLayerForeground focusTool={focusTool} onNavigate={navigate} />
    </DepthSceneRoot>
  );
}

function DepthSceneRoot({ children }: { children: ReactNode }) {
  return (
    <div className="depth-scene" aria-label="Scena desktop TooolVibes">
      <SceneGlow />
      <div className="depth-scene__camera">
        <div className="depth-scene__world">{children}</div>
      </div>
    </div>
  );
}

function DepthLayerBackground() {
  return (
    <div className="depth-scene__layer depth-scene__layer--background" aria-hidden="true">
      <SceneGrid />
      <div className="depth-scene__context-plane">
        {contextSignals.map((signal) => (
          <span key={signal}>{signal}</span>
        ))}
      </div>
    </div>
  );
}

function DepthLayerMidground({
  tools,
  onNavigate,
  parallaxX,
  parallaxY,
}: {
  tools: DirectoryTool[];
  onNavigate: (href: string) => void;
  parallaxX: number;
  parallaxY: number;
}) {
  return (
    <div className="depth-scene__layer depth-scene__layer--midground">
      {tools.map((tool, index) => (
        <DepthCard key={tool.slug} tool={tool} index={index} onNavigate={onNavigate} parallaxX={parallaxX} parallaxY={parallaxY} />
      ))}
    </div>
  );
}

function DepthLayerForeground({
  focusTool,
  onNavigate,
}: {
  focusTool?: DirectoryTool | null;
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="depth-scene__layer depth-scene__layer--foreground">
      {focusTool ? <FloatingToolPanel tool={focusTool} onNavigate={onNavigate} /> : null}
      <div className="depth-scene__decision-panel">
        <span>Decision path</span>
        <strong>3 passaggi, zero rumore</strong>
        <div className="depth-scene__route-stack">
          {sceneRoutes.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="depth-scene__route-link"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(item.href);
                }}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DepthCard({
  tool,
  index,
  onNavigate,
  parallaxX,
  parallaxY,
}: {
  tool: DirectoryTool;
  index: number;
  onNavigate: (href: string) => void;
  parallaxX: number;
  parallaxY: number;
}) {
  const href = `/toools/${tool.slug}`;

  return (
    <Link
      href={href}
      className={`depth-card depth-scene__card depth-card--${index + 1}`}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
      style={
        {
          "--tool-from": tool.accentFrom,
          "--tool-to": tool.accentTo,
          "--parallax-ry": `${parallaxX * 6}deg`,
          "--parallax-rx": `${-parallaxY * 6}deg`,
        } as CSSProperties
      }
    >
      <DirectoryToolGlyph tool={tool} size="sm" />
      <span>
        <strong>{tool.name}</strong>
        <small>{tool.categoryLabel}</small>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

function FloatingToolPanel({
  tool,
  onNavigate,
}: {
  tool: DirectoryTool;
  onNavigate: (href: string) => void;
}) {
  const href = `/toools/${tool.slug}`;

  return (
    <article
      className="depth-scene__focus-panel"
      style={
        {
          "--tool-from": tool.accentFrom,
          "--tool-to": tool.accentTo,
        } as CSSProperties
      }
    >
      <div className="depth-scene__focus-header">
        <DirectoryToolGlyph tool={tool} size="lg" />
        <span>
          <small>Tool in evidenza</small>
          <strong>{tool.name}</strong>
        </span>
      </div>
      <p>{tool.whyItMatters}</p>
      <div className="depth-scene__focus-tags">
        {tool.highlights.slice(0, 3).map((highlight) => (
          <span key={highlight}>{highlight}</span>
        ))}
      </div>
      <Link
        href={href}
        className="depth-scene__focus-open"
        onClick={(event) => {
          event.preventDefault();
          onNavigate(href);
        }}
      >
        Apri scheda
        <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  );
}

function SceneGlow() {
  return (
    <>
      <span className="depth-scene__wash depth-scene__wash--one" aria-hidden="true" />
      <span className="depth-scene__wash depth-scene__wash--two" aria-hidden="true" />
    </>
  );
}

function SceneGrid() {
  return (
    <>
      <span className="depth-scene__grid" style={{ filter: "blur(2px)", opacity: 0.6 }} />
      <span className="depth-scene__horizon depth-scene__horizon--one" />
      <span className="depth-scene__horizon depth-scene__horizon--two" />
    </>
  );
}
