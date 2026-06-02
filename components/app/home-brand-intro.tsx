"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { SOUND_PLAY_EVENT } from "@/lib/config/sound";

const INTRO_STORAGE_KEY = "tooolvibes:brand-intro-neural-v3";
const INTRO_DURATION_MS = 3200;
const INTRO_HIDDEN_PATHS = ["/admin", "/api", "/auth"];

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
    // noop
  }
}

export function SiteBrandIntro() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "active" | "leaving">("hidden");
  const introCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const finishIntro = useCallback(
    (quick = false) => {
      clearTimers();
      setPhase("leaving");
      window.dispatchEvent(
        new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introClose" } }),
      );

      const hideTimer = window.setTimeout(
        () => {
          markIntroPlayed();
          document.documentElement.classList.remove("brand-intro-active");
          window.dispatchEvent(
            new CustomEvent("tooolvibes:brand-intro-finished"),
          );
          window.setTimeout(() => {
            document.documentElement.classList.remove("brand-intro-preflight");
          }, 120);
          setPhase("hidden");
        },
        quick ? 360 : 620,
      );
      timersRef.current.push(hideTimer);
    },
    [clearTimers],
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const alreadyPlayed = hasPlayedIntro();
    const shouldHide = INTRO_HIDDEN_PATHS.some((path) =>
      pathname?.startsWith(path),
    );

    if (shouldHide || prefersReducedMotion || alreadyPlayed) {
      document.documentElement.classList.remove(
        "brand-intro-active",
        "brand-intro-preflight",
      );
      window.dispatchEvent(
        new CustomEvent("tooolvibes:brand-intro-finished"),
      );
      setPhase("hidden");
      return undefined;
    }

    document.documentElement.classList.add("brand-intro-active");
    setPhase("active");
    window.dispatchEvent(
      new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introOpen" } }),
    );

    timersRef.current.push(
      window.setTimeout(() => finishIntro(false), INTRO_DURATION_MS),
    );

    return () => {
      clearTimers();
      document.documentElement.classList.remove(
        "brand-intro-active",
        "brand-intro-preflight",
      );
    };
  }, [clearTimers, finishIntro, pathname]);

  useEffect(() => {
    const canvas = introCanvasRef.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const shouldHide = INTRO_HIDDEN_PATHS.some((path) =>
      pathname?.startsWith(path),
    );

    if (!canvas || shouldHide || prefersReducedMotion || hasPlayedIntro()) {
      return undefined;
    }

    let disposed = false;
    let animationFrame = 0;
    const cleanupCallbacks: Array<() => void> = [];
    const disposables: Array<{ dispose: () => void }> = [];

    void import("three").then((THREE) => {
      if (disposed) return;

      type TMesh = InstanceType<typeof THREE.Mesh>;
      type TBufferAttribute = InstanceType<typeof THREE.BufferAttribute>;
      type TMeshBasicMaterial = InstanceType<typeof THREE.MeshBasicMaterial>;

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
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 10);

      const root = new THREE.Group();
      scene.add(root);

      const track = <T extends { dispose?: () => void }>(resource: T) => {
        if (resource.dispose) {
          disposables.push(resource as T & { dispose: () => void });
        }
        return resource;
      };

      // ── Neural Core: points on a sphere ──
      const POINT_COUNT = 280;
      const pointPositions = new Float32Array(POINT_COUNT * 3);
      const pointOriginal = new Float32Array(POINT_COUNT * 3);
      const pointPhase = new Float32Array(POINT_COUNT);

      for (let i = 0; i < POINT_COUNT; i += 1) {
        const phi = Math.acos(-1 + (2 * i) / POINT_COUNT);
        const theta = Math.sqrt(POINT_COUNT * Math.PI) * phi;
        const r = 1.3 + (Math.random() - 0.5) * 0.5;
        const x = r * Math.cos(theta) * Math.sin(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(phi);
        pointPositions[i * 3] = x;
        pointPositions[i * 3 + 1] = y;
        pointPositions[i * 3 + 2] = z;
        pointOriginal[i * 3] = x;
        pointOriginal[i * 3 + 1] = y;
        pointOriginal[i * 3 + 2] = z;
        pointPhase[i] = Math.random() * Math.PI * 2;
      }

      const pointGeo = track(new THREE.BufferGeometry());
      pointGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(pointPositions, 3),
      );
      const pointMat = track(
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.042,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const corePoints = new THREE.Points(pointGeo, pointMat);
      root.add(corePoints);

      // ── Connections (constellation lines) ──
      const MAX_CONNECTIONS = 340;
      const linePositions = new Float32Array(MAX_CONNECTIONS * 2 * 3);
      const lineGeo = track(new THREE.BufferGeometry());
      lineGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3),
      );
      const lineMat = track(
        new THREE.LineBasicMaterial({
          color: 0x6a3cff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const connections = new THREE.LineSegments(lineGeo, lineMat);
      root.add(connections);

      // ── Orbital Rings ──
      const ringsGroup = new THREE.Group();
      root.add(ringsGroup);

      const ringDefs = [
        { r: 2.2, color: 0x6a3cff, opacity: 0.28, speed: 0.4, axis: new THREE.Vector3(0.3, 0.9, 0.2) },
        { r: 2.9, color: 0x39d2f6, opacity: 0.2, speed: -0.25, axis: new THREE.Vector3(0.8, 0.2, 0.5) },
        { r: 1.6, color: 0xf3bf4c, opacity: 0.18, speed: 0.55, axis: new THREE.Vector3(0.1, 0.6, 0.9) },
      ];

      const ringMeshes: TMesh[] = [];
      ringDefs.forEach((def) => {
        const geo = track(new THREE.TorusGeometry(def.r, 0.008, 8, 128));
        const mat = track(
          new THREE.MeshBasicMaterial({
            color: def.color,
            transparent: true,
            opacity: 0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { speed: def.speed, axis: def.axis };
        ringsGroup.add(mesh);
        ringMeshes.push(mesh);
      });

      // ── Ambient Glow ──
      const glowGeo = track(new THREE.IcosahedronGeometry(0.55, 2));
      const glowMat = track(
        new THREE.MeshBasicMaterial({
          color: 0x6a3cff,
          transparent: true,
          opacity: 0,
          wireframe: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      root.add(glowMesh);

      // ── Dust particles ──
      const DUST_COUNT = 200;
      const dustPositions = new Float32Array(DUST_COUNT * 3);
      const dustVel = new Float32Array(DUST_COUNT * 3);
      for (let i = 0; i < DUST_COUNT; i += 1) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 22;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4;
        dustVel[i * 3] = (Math.random() - 0.5) * 0.003;
        dustVel[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
        dustVel[i * 3 + 2] = (Math.random() - 0.5) * 0.0015;
      }
      const dustGeo = track(new THREE.BufferGeometry());
      dustGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(dustPositions, 3),
      );
      const dustMat = track(
        new THREE.PointsMaterial({
          color: 0xa78bfa,
          size: 0.016,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const dust = new THREE.Points(dustGeo, dustMat);
      root.add(dust);

      let isMobile = false;
      const resize = () => {
        const width = Math.max(1, canvas.clientWidth);
        const height = Math.max(1, canvas.clientHeight);
        isMobile = width < 680;
        const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.1 : 1.35);
        renderer.setSize(Math.floor(width * dpr), Math.floor(height * dpr), false);
        camera.aspect = width / height;
        camera.fov = isMobile ? 56 : 45;
        camera.position.z = isMobile ? 9 : 10;
        root.scale.setScalar(isMobile ? 0.72 : 1);
        camera.updateProjectionMatrix();
      };

      let startTime = 0;
      let frameCount = 0;

      const render = (frameTime = 0) => {
        if (disposed) return;
        startTime ||= frameTime;
        const elapsed = (frameTime - startTime) / 1000;
        const introProgress = Math.min(1, elapsed / 1.6);
        const ease = 1 - Math.pow(1 - introProgress, 3);
        const mobileWeight = isMobile ? 0.7 : 1;

        // Camera entrance
        camera.position.z = (isMobile ? 9 : 10) + (1 - ease) * 3;

        // Root gentle motion
        root.rotation.y = elapsed * 0.15 * mobileWeight;
        root.rotation.x = Math.sin(elapsed * 0.28) * 0.04;

        // Core pulse & point drift
        const pulse = 1 + Math.sin(elapsed * 1.1) * 0.06;
        corePoints.scale.setScalar(pulse);

        const posAttr = pointGeo.attributes.position as TBufferAttribute;
        for (let i = 0; i < POINT_COUNT; i += 1) {
          const ox = pointOriginal[i * 3];
          const oy = pointOriginal[i * 3 + 1];
          const oz = pointOriginal[i * 3 + 2];
          const ph = pointPhase[i];
          posAttr.setXYZ(
            i,
            ox + Math.sin(elapsed * 0.6 + ph) * 0.06,
            oy + Math.cos(elapsed * 0.5 + ph * 1.3) * 0.06,
            oz + Math.sin(elapsed * 0.4 + ph * 0.7) * 0.04,
          );
        }
        posAttr.needsUpdate = true;

        // Connections (update every 2 frames for perf)
        if (frameCount % 2 === 0) {
          const lineAttr = lineGeo.attributes.position as TBufferAttribute;
          let lineIdx = 0;
          const threshold = 0.52;
          // sample subset for performance
          const step = isMobile ? 2 : 1;
          outer: for (let i = 0; i < POINT_COUNT; i += step) {
            const ix = posAttr.getX(i);
            const iy = posAttr.getY(i);
            const iz = posAttr.getZ(i);
            for (let j = i + 1; j < POINT_COUNT; j += step) {
              const dx = ix - posAttr.getX(j);
              const dy = iy - posAttr.getY(j);
              const dz = iz - posAttr.getZ(j);
              const dist = dx * dx + dy * dy + dz * dz;
              if (dist < threshold * threshold) {
                lineAttr.setXYZ(lineIdx, ix, iy, iz);
                lineAttr.setXYZ(lineIdx + 1, posAttr.getX(j), posAttr.getY(j), posAttr.getZ(j));
                lineIdx += 2;
                if (lineIdx >= MAX_CONNECTIONS * 2) break outer;
              }
            }
          }
          // hide remaining
          for (let k = lineIdx; k < MAX_CONNECTIONS * 2; k += 1) {
            lineAttr.setXYZ(k, 9999, 9999, 9999);
          }
          lineAttr.needsUpdate = true;
        }

        // Rings rotation
        ringMeshes.forEach((mesh) => {
          const { speed, axis } = mesh.userData;
          mesh.rotateOnAxis(axis, speed * 0.008);
        });

        // Glow
        glowMesh.rotation.x = elapsed * 0.35;
        glowMesh.rotation.y = elapsed * 0.55;
        glowMesh.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.15);

        // Dust drift
        const dustAttr = dustGeo.attributes.position as TBufferAttribute;
        for (let i = 0; i < DUST_COUNT; i += 1) {
          const x = dustAttr.getX(i) + dustVel[i * 3];
          const y = dustAttr.getY(i) + dustVel[i * 3 + 1];
          const z = dustAttr.getZ(i) + dustVel[i * 3 + 2];
          dustAttr.setXYZ(
            i,
            x > 11 ? -11 : x < -11 ? 11 : x,
            y > 11 ? -11 : y < -11 ? 11 : y,
            z > 8 ? -8 : z < -12 ? 12 : z,
          );
        }
        dustAttr.needsUpdate = true;

        // Opacity fade-in
        const targetOpacity = 1;
        pointMat.opacity = THREE.MathUtils.lerp(pointMat.opacity, targetOpacity * 0.75, 0.04);
        lineMat.opacity = THREE.MathUtils.lerp(lineMat.opacity, targetOpacity * 0.35, 0.04);
        dustMat.opacity = THREE.MathUtils.lerp(dustMat.opacity, targetOpacity * 0.3, 0.04);
        glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, targetOpacity * 0.08, 0.04);
        ringMeshes.forEach((mesh, idx) => {
          const target = ringDefs[idx].opacity;
          const mat = mesh.material as TMeshBasicMaterial;
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, target, 0.03);
        });

        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(render);
        frameCount += 1;
      };

      resize();
      window.addEventListener("resize", resize, { passive: true });
      cleanupCallbacks.push(() => window.removeEventListener("resize", resize));
      animationFrame = window.requestAnimationFrame(render);

      cleanupCallbacks.push(() => {
        window.cancelAnimationFrame(animationFrame);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
      });
    });

    return () => {
      disposed = true;
      cleanupCallbacks.forEach((cb) => cb());
    };
  }, [pathname]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`brand-intro ${phase === "leaving" ? "is-leaving" : ""}`}
      aria-hidden={phase === "leaving"}
    >
      <div className="brand-intro__scene">
        <canvas ref={introCanvasRef} className="brand-intro__canvas" />

        <div className="brand-intro__overlay">
          <span className="brand-intro__core-ring" aria-hidden="true" />
          <BrandLogo size={96} priority className="brand-intro__logo" />
          <span className="brand-intro__title" aria-label="TOOOLVIBES">
            <span>TOOOL</span>
            <span>VIBES</span>
          </span>
          <span className="brand-intro__caption">AI tools singularity</span>
        </div>
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
