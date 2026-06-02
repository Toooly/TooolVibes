"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

type SiteDepthToneKey =
  | "home"
  | "archive"
  | "compare"
  | "radar"
  | "wishlist"
  | "commerce"
  | "default";

type SiteDepthTone = {
  key: SiteDepthToneKey;
  primary: string;
  secondary: string;
  accent: string;
  label: string;
};

const siteDepthTones: Record<SiteDepthToneKey, SiteDepthTone> = {
  home: {
    key: "home",
    primary: "#6a3cff",
    secondary: "#39d2f6",
    accent: "#5b5bd6",
    label: "Discovery field",
  },
  archive: {
    key: "archive",
    primary: "#0f766e",
    secondary: "#1f5f8b",
    accent: "#111827",
    label: "Catalog field",
  },
  compare: {
    key: "compare",
    primary: "#2563eb",
    secondary: "#0f766e",
    accent: "#5b5bd6",
    label: "Decision field",
  },
  radar: {
    key: "radar",
    primary: "#dc6b2f",
    secondary: "#0f766e",
    accent: "#2563eb",
    label: "Signal field",
  },
  wishlist: {
    key: "wishlist",
    primary: "#5b5bd6",
    secondary: "#0f766e",
    accent: "#2563eb",
    label: "Submission field",
  },
  commerce: {
    key: "commerce",
    primary: "#0f766e",
    secondary: "#334155",
    accent: "#2563eb",
    label: "Commerce field",
  },
  default: {
    key: "default",
    primary: "#6a3cff",
    secondary: "#2563eb",
    accent: "#5b5bd6",
    label: "TooolVibes field",
  },
};

function getSiteDepthTone(pathname?: string | null): SiteDepthTone {
  if (!pathname || pathname === "/") return siteDepthTones.home;
  if (
    pathname.startsWith("/archivio") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/tags")
  )
    return siteDepthTones.archive;
  if (pathname.startsWith("/compare") || pathname.startsWith("/shortlist"))
    return siteDepthTones.compare;
  if (pathname.startsWith("/product-hunt")) return siteDepthTones.radar;
  if (pathname.startsWith("/wishlist")) return siteDepthTones.wishlist;
  if (pathname.startsWith("/shop") || pathname.startsWith("/account"))
    return siteDepthTones.commerce;
  return siteDepthTones.default;
}

function hexToThreeColor(hex: string) {
  const num = parseInt(hex.replace("#", ""), 16);
  return num;
}

export function SiteDepthSystem() {
  const pathname = usePathname();
  const tone = useMemo(() => getSiteDepthTone(pathname), [pathname]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return undefined;

    let disposed = false;
    let raf = 0;
    const cleanup: Array<() => void> = [];
    const disposables: Array<{ dispose: () => void }> = [];

    void import("three").then((THREE) => {
      if (disposed) return;

      type TBufferAttribute = InstanceType<typeof THREE.BufferAttribute>;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 60);
      camera.position.set(0, 0, 8);

      const root = new THREE.Group();
      scene.add(root);

      const track = <T extends { dispose?: () => void }>(r: T) => {
        if (r.dispose) disposables.push(r as T & { dispose: () => void });
        return r;
      };

      const primaryColor = hexToThreeColor(tone.primary);
      const secondaryColor = hexToThreeColor(tone.secondary);

      // ── Field Points ──
      const POINT_COUNT = window.innerWidth < 768 ? 80 : 140;
      const positions = new Float32Array(POINT_COUNT * 3);
      const velocities = new Float32Array(POINT_COUNT * 3);
      for (let i = 0; i < POINT_COUNT; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 26;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        velocities[i * 3] = (Math.random() - 0.5) * 0.0012;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0008;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0004;
      }
      const pGeo = track(new THREE.BufferGeometry());
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pMat = track(
        new THREE.PointsMaterial({
          color: primaryColor,
          size: 0.055,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const points = new THREE.Points(pGeo, pMat);
      root.add(points);

      // ── Connection Lines ──
      const MAX_LINES = 220;
      const linePos = new Float32Array(MAX_LINES * 2 * 3);
      const lineGeo = track(new THREE.BufferGeometry());
      lineGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(linePos, 3),
      );
      const lineMat = track(
        new THREE.LineBasicMaterial({
          color: secondaryColor,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const lines = new THREE.LineSegments(lineGeo, lineMat);
      root.add(lines);

      // ── Mouse & Scroll state ──
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      let scrollY = window.scrollY || 0;

      const onMouseMove = (e: MouseEvent) => {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      const onScroll = () => {
        scrollY = window.scrollY || 0;
      };
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanup.push(() => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("scroll", onScroll);
      });

      // ── Visibility pausing ──
      let visible = true;
      const onVis = () => {
        visible = !document.hidden;
      };
      document.addEventListener("visibilitychange", onVis);
      cleanup.push(() => document.removeEventListener("visibilitychange", onVis));

      const resize = () => {
        const w = Math.max(1, canvas.clientWidth);
        const h = Math.max(1, canvas.clientHeight);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize, { passive: true });
      cleanup.push(() => window.removeEventListener("resize", resize));

      let frameCount = 0;
      const render = () => {
        raf = window.requestAnimationFrame(render);
        if (!visible || disposed) return;

        frameCount += 1;

        // Drift points
        const pAttr = pGeo.attributes.position as TBufferAttribute;
        for (let i = 0; i < POINT_COUNT; i += 1) {
          const x = pAttr.getX(i) + velocities[i * 3];
          const y = pAttr.getY(i) + velocities[i * 3 + 1];
          const z = pAttr.getZ(i) + velocities[i * 3 + 2];
          pAttr.setXYZ(
            i,
            x > 13 ? -13 : x < -13 ? 13 : x,
            y > 9 ? -9 : y < -9 ? 9 : y,
            z > 5 ? -5 : z < -5 ? 5 : z,
          );
        }
        pAttr.needsUpdate = true;

        // Connections (every 2 frames)
        if (frameCount % 2 === 0) {
          const lAttr = lineGeo.attributes.position as TBufferAttribute;
          let li = 0;
          const thr = 3.8;
          const thrSq = thr * thr;
          const step = window.innerWidth < 768 ? 2 : 1;
          outer: for (let i = 0; i < POINT_COUNT; i += step) {
            const ix = pAttr.getX(i);
            const iy = pAttr.getY(i);
            const iz = pAttr.getZ(i);
            for (let j = i + 1; j < POINT_COUNT; j += step) {
              const dx = ix - pAttr.getX(j);
              const dy = iy - pAttr.getY(j);
              const dz = iz - pAttr.getZ(j);
              if (dx * dx + dy * dy + dz * dz < thrSq) {
                lAttr.setXYZ(li, ix, iy, iz);
                lAttr.setXYZ(li + 1, pAttr.getX(j), pAttr.getY(j), pAttr.getZ(j));
                li += 2;
                if (li >= MAX_LINES * 2) break outer;
              }
            }
          }
          for (let k = li; k < MAX_LINES * 2; k += 1) {
            lAttr.setXYZ(k, 9999, 9999, 9999);
          }
          lAttr.needsUpdate = true;
        }

        // Mouse parallax
        mouse.x += (mouse.tx - mouse.x) * 0.04;
        mouse.y += (mouse.ty - mouse.y) * 0.04;
        root.position.x = mouse.x * 1.2;
        root.position.y = -scrollY * 0.0006 + mouse.y * 0.6;
        root.rotation.y = mouse.x * 0.04;
        root.rotation.x = mouse.y * 0.03;

        renderer.render(scene, camera);
      };
      raf = window.requestAnimationFrame(render);

      cleanup.push(() => {
        window.cancelAnimationFrame(raf);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
      });
    });

    return () => {
      disposed = true;
      cleanup.forEach((cb) => cb());
    };
  }, [tone]);

  return (
    <div
      className="site-depth-system"
      data-site-depth-route={tone.key}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="site-depth-system__canvas" />
    </div>
  );
}
