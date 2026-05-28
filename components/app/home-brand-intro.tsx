"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { SOUND_PLAY_EVENT } from "@/lib/config/sound";

const INTRO_STORAGE_KEY = "tooolvibes:brand-intro-singularity-v2";
const INTRO_DURATION_MS = 3400;
const INTRO_HIDDEN_PATHS = ["/admin", "/api", "/auth"];

const reactorNodes = [
  { label: "Discover", x: -20, y: -10, z: 10, rotate: -12 },
  { label: "Compare", x: 18, y: -8, z: 14, rotate: 10 },
  { label: "Shortlist", x: -16, y: 12, z: 18, rotate: 8 },
  { label: "Decide", x: 17, y: 11, z: 7, rotate: -10 },
];

const reactorRings = [
  { scale: 0.52, z: -44, delay: 0 },
  { scale: 0.82, z: -18, delay: 110 },
  { scale: 1.1, z: 14, delay: 220 },
  { scale: 1.42, z: 42, delay: 330 },
];

function hasPlayedIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
}

export function SiteBrandIntro() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "active" | "leaving">("active");
  const introCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const finishIntro = useCallback((quick = false) => {
    clearTimers();
    setPhase("leaving");
    window.dispatchEvent(new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introClose" } }));

    const hideTimer = window.setTimeout(
      () => {
        markIntroPlayed();
        document.documentElement.classList.remove("brand-intro-active", "brand-intro-preflight");
        window.dispatchEvent(new CustomEvent("tooolvibes:brand-intro-finished"));
        setPhase("hidden");
      },
      quick ? 360 : 620,
    );
    timersRef.current.push(hideTimer);
  }, [clearTimers]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyPlayed = hasPlayedIntro();
    const shouldHide = INTRO_HIDDEN_PATHS.some((path) => pathname?.startsWith(path));

    if (shouldHide || prefersReducedMotion || alreadyPlayed) {
      document.documentElement.classList.remove("brand-intro-active", "brand-intro-preflight");
      window.dispatchEvent(new CustomEvent("tooolvibes:brand-intro-finished"));
      setPhase("hidden");
      return undefined;
    }

    document.documentElement.classList.add("brand-intro-active");
    document.documentElement.classList.remove("brand-intro-preflight");
    setPhase("active");
    window.dispatchEvent(new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introOpen" } }));

    timersRef.current.push(
      window.setTimeout(() => finishIntro(false), INTRO_DURATION_MS),
    );

    return () => {
      clearTimers();
      document.documentElement.classList.remove("brand-intro-active", "brand-intro-preflight");
    };
  }, [clearTimers, finishIntro, pathname]);

  useEffect(() => {
    const canvas = introCanvasRef.current;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldHide = INTRO_HIDDEN_PATHS.some((path) => pathname?.startsWith(path));

    if (!canvas || shouldHide || prefersReducedMotion || hasPlayedIntro()) {
      return undefined;
    }

    let disposed = false;
    let animationFrame = 0;
    const cleanupCallbacks: Array<() => void> = [];
    const disposables: Array<{ dispose: () => void }> = [];

    void import("three").then((THREE) => {
      if (disposed) {
        return;
      }

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(1);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
      camera.position.set(0, 0, 10.2);

      const root = new THREE.Group();
      scene.add(root);

      const track = <T extends { dispose?: () => void }>(resource: T) => {
        if (resource.dispose) {
          disposables.push(resource as T & { dispose: () => void });
        }
        return resource;
      };

      const lineMaterial = (color: number, opacity: number) =>
        track(
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );

      const meshMaterial = (color: number, opacity: number) =>
        track(
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );

      const rings = new THREE.Group();
      rings.rotation.x = Math.PI / 2.55;
      root.add(rings);

      const ringGeometry = track(new THREE.TorusGeometry(1.42, 0.01, 8, 128));
      const wideRingGeometry = track(new THREE.TorusGeometry(2.52, 0.007, 8, 148));
      const ringMaterials = [
        meshMaterial(0x14b8a6, 0.42),
        meshMaterial(0x60a5fa, 0.24),
        meshMaterial(0xa78bfa, 0.2),
      ];
      const ringMeshes = [
        new THREE.Mesh(ringGeometry, ringMaterials[0]),
        new THREE.Mesh(wideRingGeometry, ringMaterials[1]),
        new THREE.Mesh(track(wideRingGeometry.clone()), ringMaterials[2]),
      ];
      ringMeshes[1].rotation.y = Math.PI / 2.7;
      ringMeshes[2].rotation.x = Math.PI / 3.3;
      ringMeshes.forEach((ring) => rings.add(ring));

      const core = new THREE.Group();
      core.position.z = 0.8;
      root.add(core);
      const coreShell = new THREE.Mesh(
        track(new THREE.TorusKnotGeometry(0.62, 0.13, 96, 10, 2, 3)),
        meshMaterial(0x020617, 0.72),
      );
      const coreSpark = new THREE.Mesh(
        track(new THREE.IcosahedronGeometry(0.36, 1)),
        meshMaterial(0x14b8a6, 0.34),
      );
      core.add(coreShell, coreSpark);

      const rails = new THREE.Group();
      root.add(rails);
      const railPoints = [
        [
          new THREE.Vector3(-3.7, -1.45, -1.8),
          new THREE.Vector3(-1.5, -0.32, -0.4),
          new THREE.Vector3(1.4, 0.24, -1.1),
          new THREE.Vector3(3.6, 1.2, -2.2),
        ],
        [
          new THREE.Vector3(-3.2, 1.25, -2.3),
          new THREE.Vector3(-0.8, 0.64, -0.6),
          new THREE.Vector3(1.6, -0.48, -1.4),
          new THREE.Vector3(3.2, -1.0, -2.0),
        ],
      ];
      const railLines = railPoints.map((points, index) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = track(new THREE.BufferGeometry().setFromPoints(curve.getPoints(56)));
        const material = lineMaterial(index === 0 ? 0x14b8a6 : 0x60a5fa, index === 0 ? 0.34 : 0.2);
        const line = new THREE.Line(geometry, material);
        rails.add(line);
        return { line, material };
      });

      const particleCount = 78;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        const angle = index * 2.399963 + 0.36;
        const radius = 1.6 + (index % 11) * 0.22;
        particlePositions[index * 3] = Math.cos(angle) * radius;
        particlePositions[index * 3 + 1] = Math.sin(angle * 0.78) * (0.9 + (index % 5) * 0.18);
        particlePositions[index * 3 + 2] = -3.5 + (index % 17) * 0.24;
      }
      const particleGeometry = track(new THREE.BufferGeometry());
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      const particles = new THREE.Points(
        particleGeometry,
        track(
          new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.034,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        ),
      );
      root.add(particles);

      let isMobile = false;
      const resize = () => {
        const width = Math.max(1, canvas.clientWidth);
        const height = Math.max(1, canvas.clientHeight);
        isMobile = width < 680;
        const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.12 : 1.35);
        renderer.setSize(Math.floor(width * dpr), Math.floor(height * dpr), false);
        camera.aspect = width / height;
        camera.fov = isMobile ? 56 : 44;
        camera.position.z = isMobile ? 8.8 : 9.6;
        root.scale.setScalar(isMobile ? 0.78 : 1);
        root.position.y = isMobile ? -0.16 : 0;
        camera.updateProjectionMatrix();
      };

      let startTime = 0;
      const render = (frameTime = 0) => {
        if (disposed) {
          return;
        }

        startTime ||= frameTime;
        const elapsed = (frameTime - startTime) / 1000;
        const introProgress = Math.min(1, elapsed / (INTRO_DURATION_MS / 1000));
        const mobileWeight = isMobile ? 0.7 : 1;

        root.rotation.y = Math.sin(elapsed * 0.34) * 0.06 * mobileWeight;
        root.rotation.x = -0.08 + Math.cos(elapsed * 0.28) * 0.035;
        root.position.z = -0.35 + introProgress * 0.35;

        rings.rotation.z = -elapsed * 0.46;
        ringMeshes.forEach((ring, index) => {
          ring.rotation.z -= 0.003 + index * 0.0009;
          ring.scale.setScalar(1.05 - introProgress * 0.11 + Math.sin(elapsed * 0.9 + index) * 0.018);
        });
        core.rotation.x = elapsed * 0.36;
        core.rotation.y = -elapsed * 0.62;
        core.rotation.z = -elapsed * 0.42;
        coreSpark.rotation.z = -elapsed * 0.58;
        particles.rotation.y = -elapsed * 0.08;
        particles.rotation.z = -elapsed * 0.045;
        railLines.forEach((rail, index) => {
          rail.line.position.y = Math.sin(elapsed * 0.72 + index) * 0.035;
          rail.material.opacity = (index === 0 ? 0.24 : 0.16) + Math.sin(elapsed * 1.1 + index) * 0.04;
        });

        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(render);
      };

      resize();
      window.addEventListener("resize", resize, { passive: true });
      cleanupCallbacks.push(() => window.removeEventListener("resize", resize));
      animationFrame = window.requestAnimationFrame(render);

      cleanupCallbacks.push(() => {
        window.cancelAnimationFrame(animationFrame);
        disposables.forEach((item) => item.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
      });
    });

    return () => {
      disposed = true;
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [pathname]);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div className={`brand-intro ${phase === "leaving" ? "is-leaving" : ""}`}>
      <div className="brand-intro__scene" aria-hidden="true">
        <canvas ref={introCanvasRef} className="brand-intro__canvas" />
        <span className="brand-intro__backdrop" />
        <span className="brand-intro__reactor-grid" />

        <span className="brand-intro__reactor-rings">
          {reactorRings.map((ring, index) => (
            <i
              key={index}
              style={
                {
                  "--intro-ring-scale": ring.scale,
                  "--intro-ring-z": `${ring.z}px`,
                  "--intro-ring-delay": `${ring.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>

        <span className="brand-intro__tool-cloud">
          {reactorNodes.map((node, index) => (
            <i
              key={node.label}
              style={
                {
                  "--intro-node-x": `${node.x * 0.72}rem`,
                  "--intro-node-y": `${node.y * 0.58}rem`,
                  "--intro-node-z": `${node.z}rem`,
                  "--intro-node-rotate": `${node.rotate}deg`,
                  "--intro-node-delay": `${260 + index * 90}ms`,
                } as CSSProperties
              }
            >
              {node.label}
            </i>
          ))}
        </span>

        <span className="brand-intro__core">
          <span className="brand-intro__core-shell" />
          <BrandLogo size={116} priority className="brand-intro__logo" />
          <span className="brand-intro__core-line brand-intro__core-line--one" />
          <span className="brand-intro__core-line brand-intro__core-line--two" />
        </span>

        <span className="brand-intro__title" aria-label="TOOOLVIBES">
          <span>TOOOL</span>
          <span>VIBES</span>
        </span>
        <span className="brand-intro__caption">AI tools singularity</span>

        <span className="brand-intro__mobile-composition">
          <span className="brand-intro__mobile-orbit brand-intro__mobile-orbit--one" />
          <span className="brand-intro__mobile-orbit brand-intro__mobile-orbit--two" />
          <span className="brand-intro__mobile-node brand-intro__mobile-node--one">Discover</span>
          <span className="brand-intro__mobile-node brand-intro__mobile-node--two">Radar</span>
          <span className="brand-intro__mobile-node brand-intro__mobile-node--three">Stack</span>
          <span className="brand-intro__mobile-device">
            <BrandLogo size={82} priority className="brand-intro__mobile-logo" />
            <span className="brand-intro__mobile-title">TOOOLVIBES</span>
            <span className="brand-intro__mobile-caption">singularity field</span>
          </span>
        </span>
      </div>

      <button
        type="button"
        className="brand-intro__skip"
        data-sonic-action="introClose"
        onClick={() => finishIntro(true)}
      >
        Salta
      </button>
    </div>
  );
}
