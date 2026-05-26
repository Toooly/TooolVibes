"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { SOUND_PLAY_EVENT } from "@/lib/config/sound";

const HIDDEN_PATHS = ["/admin"];

const experienceProperties = [
  "--tv-scroll-progress",
  "--tv-scroll-depth",
  "--tv-scroll-lift",
  "--tv-scroll-soft",
  "--tv-scroll-rise",
  "--tv-scroll-sweep",
  "--tv-scroll-glow",
  "--tv-depth-opacity",
  "--tv-stage-opacity",
  "--tv-field-opacity",
  "--tv-pointer-x",
  "--tv-pointer-y",
  "--tv-pointer-shift-x",
  "--tv-pointer-shift-y",
  "--tv-pointer-tilt-x",
  "--tv-pointer-tilt-y",
  "--tv-world-primary",
  "--tv-world-secondary",
  "--tv-world-tertiary",
] as const;

type SceneToneKey = "home" | "archive" | "compare" | "radar" | "wishlist" | "default";

type SceneTone = {
  key: SceneToneKey;
  primary: number;
  secondary: number;
  tertiary: number;
  primaryCss: string;
  secondaryCss: string;
  tertiaryCss: string;
};

const sceneTones: Record<SceneToneKey, SceneTone> = {
  home: {
    key: "home",
    primary: 0x6a3cff,
    secondary: 0x39d2f6,
    tertiary: 0xf3bf4c,
    primaryCss: "#6a3cff",
    secondaryCss: "#39d2f6",
    tertiaryCss: "#f3bf4c",
  },
  archive: {
    key: "archive",
    primary: 0x39d2f6,
    secondary: 0x6a3cff,
    tertiary: 0xf3bf4c,
    primaryCss: "#39d2f6",
    secondaryCss: "#6a3cff",
    tertiaryCss: "#f3bf4c",
  },
  compare: {
    key: "compare",
    primary: 0xf3bf4c,
    secondary: 0x6a3cff,
    tertiary: 0x39d2f6,
    primaryCss: "#f3bf4c",
    secondaryCss: "#6a3cff",
    tertiaryCss: "#39d2f6",
  },
  radar: {
    key: "radar",
    primary: 0xff6b4a,
    secondary: 0xf3bf4c,
    tertiary: 0x39d2f6,
    primaryCss: "#ff6b4a",
    secondaryCss: "#f3bf4c",
    tertiaryCss: "#39d2f6",
  },
  wishlist: {
    key: "wishlist",
    primary: 0xa855f7,
    secondary: 0x5cbf9c,
    tertiary: 0xf3bf4c,
    primaryCss: "#a855f7",
    secondaryCss: "#5cbf9c",
    tertiaryCss: "#f3bf4c",
  },
  default: {
    key: "default",
    primary: 0x6a3cff,
    secondary: 0x39d2f6,
    tertiary: 0xf3bf4c,
    primaryCss: "#6a3cff",
    secondaryCss: "#39d2f6",
    tertiaryCss: "#f3bf4c",
  },
};

function getSceneTone(pathname?: string | null): SceneTone {
  if (!pathname || pathname === "/") {
    return sceneTones.home;
  }

  if (pathname.startsWith("/archivio")) {
    return sceneTones.archive;
  }

  if (pathname.startsWith("/compare") || pathname.startsWith("/shortlist")) {
    return sceneTones.compare;
  }

  if (pathname.startsWith("/product-hunt")) {
    return sceneTones.radar;
  }

  if (pathname.startsWith("/wishlist")) {
    return sceneTones.wishlist;
  }

  return sceneTones.default;
}

function clearExperienceState(root: HTMLElement) {
  experienceProperties.forEach((property) => root.style.removeProperty(property));
  root.removeAttribute("data-experience-pointer");
  root.removeAttribute("data-experience-scroll");
  delete root.dataset.experienceDepth;
  delete root.dataset.experienceDevice;
  delete root.dataset.experienceRoute;
}

export function GlobalExperienceLayer() {
  const pathname = usePathname();
  const sceneTone = useMemo(() => getSceneTone(pathname), [pathname]);
  const shouldHide = HIDDEN_PATHS.some((path) => pathname?.startsWith(path));
  const fieldCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (prefersReducedMotion.matches || shouldHide) {
      clearExperienceState(root);
      return undefined;
    }

    root.dataset.experienceRoute = sceneTone.key;
    root.style.setProperty("--tv-world-primary", sceneTone.primaryCss);
    root.style.setProperty("--tv-world-secondary", sceneTone.secondaryCss);
    root.style.setProperty("--tv-world-tertiary", sceneTone.tertiaryCss);

    let scrollFrame = 0;
    let pointerFrame = 0;
    let pointerTimer = 0;
    let pressTimer = 0;
    let scrollTimer = 0;
    let scrollSoundTimer = 0;
    let lastScrollMilestone = -1;
    let hasCompletedInitialScrollSync = false;
    let latestPointer: { clientX: number; clientY: number; state: "active" | "pressed" } | null = null;
    let currentPointer: { clientX: number; clientY: number } | null = null;

    const updateScrollProgress = () => {
      scrollFrame = 0;
      const isMobile = window.innerWidth < 768;
      const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const milestone = Math.floor(progress * 4);
      const depthMultiplier = isMobile ? 46 : 92;
      const liftMultiplier = isMobile ? 24 : 42;

      root.dataset.experienceDevice = isMobile ? "mobile" : "desktop";
      root.style.setProperty("--tv-scroll-progress", progress.toFixed(4));
      root.style.setProperty("--tv-scroll-depth", `${(progress * -depthMultiplier).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-lift", `${(progress * -liftMultiplier).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-soft", `${(progress * (isMobile ? -11 : -18)).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-rise", `${(progress * (isMobile ? -12 : -21)).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-sweep", `${(progress * (isMobile ? 92 : 180)).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-glow", `${(0.04 + progress * (isMobile ? 0.08 : 0.11)).toFixed(3)}`);
      root.style.setProperty("--tv-depth-opacity", `${(0.1 + Math.sin(progress * Math.PI) * (isMobile ? 0.08 : 0.12)).toFixed(3)}`);
      root.style.setProperty("--tv-stage-opacity", `${(0.12 + progress * (isMobile ? 0.04 : 0.07)).toFixed(3)}`);
      root.style.setProperty("--tv-field-opacity", `${((isMobile ? 0.16 : 0.1) + Math.sin(progress * Math.PI) * 0.025 + progress * 0.025).toFixed(3)}`);
      root.dataset.experienceDepth = progress > 0.66 ? "deep" : progress > 0.28 ? "mid" : "near";
      root.setAttribute("data-experience-scroll", "active");
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        root.removeAttribute("data-experience-scroll");
      }, 520);

      if (hasCompletedInitialScrollSync && milestone !== lastScrollMilestone) {
        lastScrollMilestone = milestone;
        window.clearTimeout(scrollSoundTimer);
        scrollSoundTimer = window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "reveal" } }));
        }, 90);
      }
      lastScrollMilestone = milestone;
      hasCompletedInitialScrollSync = true;
    };

    const requestScrollProgress = () => {
      if (scrollFrame) {
        return;
      }
      scrollFrame = window.requestAnimationFrame(updateScrollProgress);
    };

    const applyPointerPosition = () => {
      pointerFrame = 0;

      if (!latestPointer) {
        return;
      }

      currentPointer ??= latestPointer;
      currentPointer = {
        clientX: currentPointer.clientX + (latestPointer.clientX - currentPointer.clientX) * 0.18,
        clientY: currentPointer.clientY + (latestPointer.clientY - currentPointer.clientY) * 0.18,
      };

      root.style.setProperty("--tv-pointer-x", `${currentPointer.clientX.toFixed(2)}px`);
      root.style.setProperty("--tv-pointer-y", `${currentPointer.clientY.toFixed(2)}px`);
      const pointerX = Math.min(1, Math.max(-1, (currentPointer.clientX / window.innerWidth - 0.5) * 2));
      const pointerY = Math.min(1, Math.max(-1, (currentPointer.clientY / window.innerHeight - 0.5) * 2));
      root.style.setProperty("--tv-pointer-shift-x", `${(pointerX * 16).toFixed(2)}px`);
      root.style.setProperty("--tv-pointer-shift-y", `${(pointerY * 11).toFixed(2)}px`);
      root.style.setProperty("--tv-pointer-tilt-x", `${(pointerY * -3.6).toFixed(2)}deg`);
      root.style.setProperty("--tv-pointer-tilt-y", `${(pointerX * 4.2).toFixed(2)}deg`);
      root.setAttribute("data-experience-pointer", latestPointer.state);

      if (latestPointer.state === "active") {
        window.clearTimeout(pointerTimer);
        pointerTimer = window.setTimeout(() => {
          root.removeAttribute("data-experience-pointer");
        }, 1400);
      }

      const delta =
        Math.abs(latestPointer.clientX - currentPointer.clientX) +
        Math.abs(latestPointer.clientY - currentPointer.clientY);
      if (delta > 0.7) {
        pointerFrame = window.requestAnimationFrame(applyPointerPosition);
      }
    };

    const requestPointerPosition = (clientX: number, clientY: number, state: "active" | "pressed" = "active") => {
      if (window.innerWidth < 768) {
        return;
      }

      latestPointer = { clientX, clientY, state };

      if (pointerFrame) {
        return;
      }

      pointerFrame = window.requestAnimationFrame(applyPointerPosition);
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      requestPointerPosition(event.clientX, event.clientY);
    };

    const pressPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || window.innerWidth < 768) {
        return;
      }

      requestPointerPosition(event.clientX, event.clientY, "pressed");

      window.clearTimeout(pointerTimer);
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => {
        root.setAttribute("data-experience-pointer", "active");
        pointerTimer = window.setTimeout(() => {
          root.removeAttribute("data-experience-pointer");
        }, 900);
      }, 360);
    };

    updateScrollProgress();

    window.addEventListener("scroll", requestScrollProgress, { passive: true });
    window.addEventListener("resize", requestScrollProgress, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", pressPointer, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestScrollProgress);
      window.removeEventListener("resize", requestScrollProgress);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", pressPointer);
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(pointerFrame);
      window.clearTimeout(pointerTimer);
      window.clearTimeout(pressTimer);
      window.clearTimeout(scrollSoundTimer);
      window.clearTimeout(scrollTimer);
      clearExperienceState(root);
    };
  }, [sceneTone, shouldHide]);

  useEffect(() => {
    const canvas = fieldCanvasRef.current;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || prefersReducedMotion.matches || shouldHide) {
      return undefined;
    }

    let disposed = false;
    let animationFrame = 0;
    let hasStartedField = false;
    const cleanupCallbacks: Array<() => void> = [];
    const disposables: Array<{ dispose: () => void }> = [];

    const startField = () => {
      if (disposed || hasStartedField) {
        return;
      }
      hasStartedField = true;

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
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 130);
        camera.position.set(0, 0, 9.2);

        const track = <T extends { dispose?: () => void }>(resource: T) => {
          if (resource.dispose) {
            disposables.push(resource as T & { dispose: () => void });
          }
          return resource;
        };

        const makeLineMaterial = (color: number, opacity: number) =>
          track(
            new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity,
              blending: THREE.NormalBlending,
              depthWrite: false,
            }),
          );

        const makeMeshMaterial = (color: number, opacity: number, wireframe = false) =>
          track(
            new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity,
              wireframe,
              side: THREE.DoubleSide,
              blending: THREE.NormalBlending,
              depthWrite: false,
            }),
          );

        const world = new THREE.Group();
        world.position.set(0, -0.05, -2.4);
        scene.add(world);

        const corridor = new THREE.Group();
        const matrix = new THREE.Group();
        const core = new THREE.Group();
        const rails = new THREE.Group();
        world.add(corridor, matrix, core, rails);

        const palette = [sceneTone.primary, sceneTone.secondary, sceneTone.tertiary];
        const corridorFrames: Array<{
          line: InstanceType<typeof THREE.Line>;
          material: InstanceType<typeof THREE.LineBasicMaterial>;
          phase: number;
        }> = [];

        for (let index = 0; index < 12; index += 1) {
          const width = 4.6 + index * 0.38;
          const height = 2.6 + index * 0.2;
          const geometry = track(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(-width, -height, 0),
              new THREE.Vector3(width, -height, 0),
              new THREE.Vector3(width, height, 0),
              new THREE.Vector3(-width, height, 0),
              new THREE.Vector3(-width, -height, 0),
            ]),
          );
          const material = makeLineMaterial(palette[index % palette.length], 0.045);
          const line = new THREE.Line(geometry, material);
          line.rotation.z = index % 2 === 0 ? -0.014 : 0.018;
          corridor.add(line);
          corridorFrames.push({ line, material, phase: index * 0.76 });
        }

        const cardGeometry = track(new THREE.PlaneGeometry(1.18, 0.68, 1, 1));
        const cardDeck: Array<{
          mesh: InstanceType<typeof THREE.Mesh>;
          material: InstanceType<typeof THREE.MeshBasicMaterial>;
          originX: number;
          originY: number;
          originZ: number;
          phase: number;
        }> = [];

        const deckCount = sceneTone.key === "compare" ? 16 : sceneTone.key === "radar" ? 14 : 12;
        for (let index = 0; index < deckCount; index += 1) {
          const column = index % 4;
          const row = Math.floor(index / 4);
          const fan = sceneTone.key === "radar" ? (index / deckCount) * Math.PI * 2 : 0;
          const originX =
            sceneTone.key === "radar"
              ? Math.cos(fan) * (2.1 + (index % 3) * 0.18)
              : -2.9 + column * 1.92 + (row % 2) * 0.32;
          const originY =
            sceneTone.key === "radar"
              ? Math.sin(fan) * 1.12
              : 1.28 - row * 0.88;
          const originZ = -0.8 - row * 0.42 - (index % 4) * 0.13;
          const material = makeMeshMaterial(palette[index % palette.length], sceneTone.key === "compare" ? 0.12 : 0.1, true);
          const mesh = new THREE.Mesh(cardGeometry, material);
          mesh.position.set(originX, originY, originZ);
          mesh.rotation.set(-0.05 + row * 0.025, -0.22 + column * 0.15, -0.05 + column * 0.025);
          matrix.add(mesh);
          cardDeck.push({ mesh, material, originX, originY, originZ, phase: index * 0.54 });
        }

        const coreShell = new THREE.Mesh(
          track(new THREE.IcosahedronGeometry(0.82, 1)),
          makeMeshMaterial(sceneTone.secondary, 0.08, true),
        );
        const coreInner = new THREE.Mesh(
          track(new THREE.OctahedronGeometry(0.42, 0)),
          makeMeshMaterial(sceneTone.primary, 0.1, true),
        );
        const ringA = new THREE.Mesh(
          track(new THREE.TorusGeometry(1.22, 0.009, 8, 104)),
          makeMeshMaterial(sceneTone.primary, 0.08, true),
        );
        const ringB = new THREE.Mesh(
          track(new THREE.TorusGeometry(1.74, 0.006, 8, 116)),
          makeMeshMaterial(sceneTone.tertiary, 0.07, true),
        );
        ringA.rotation.x = Math.PI / 2.4;
        ringB.rotation.y = Math.PI / 2.75;
        core.position.set(sceneTone.key === "compare" ? 2.95 : 3.2, 0.82, -0.34);
        core.add(coreShell, coreInner, ringA, ringB);

        const railCurves = [
          {
            color: sceneTone.secondary,
            opacity: 0.045,
            points: [
              new THREE.Vector3(-6.0, -1.42, -1.8),
              new THREE.Vector3(-3.0, -0.38, -2.8),
              new THREE.Vector3(0.2, -0.12, -1.2),
              new THREE.Vector3(3.8, 0.92, -2.9),
              new THREE.Vector3(6.1, 1.38, -1.6),
            ],
          },
          {
            color: sceneTone.primary,
            opacity: 0.04,
            points: [
              new THREE.Vector3(-6.2, 1.14, -2.4),
              new THREE.Vector3(-3.4, 0.44, -1.0),
              new THREE.Vector3(-0.24, 0.82, -3.0),
              new THREE.Vector3(3.38, -0.64, -1.45),
              new THREE.Vector3(6.0, -1.08, -2.7),
            ],
          },
          {
            color: sceneTone.tertiary,
            opacity: 0.035,
            points: [
              new THREE.Vector3(-5.7, 0.02, -3.0),
              new THREE.Vector3(-2.2, 1.04, -1.8),
              new THREE.Vector3(1.1, 0.18, -2.4),
              new THREE.Vector3(4.7, 0.42, -1.15),
            ],
          },
        ];

        const railLines = railCurves.map((rail) => {
          const curve = new THREE.CatmullRomCurve3(rail.points);
          const geometry = track(new THREE.BufferGeometry().setFromPoints(curve.getPoints(72)));
          const material = makeLineMaterial(rail.color, rail.opacity);
          const line = new THREE.Line(geometry, material);
          rails.add(line);
          return { line, material, baseOpacity: rail.opacity };
        });

        const particleCount = 230;
        const particlePositions = new Float32Array(particleCount * 3);
        for (let index = 0; index < particleCount; index += 1) {
          const layer = index % 29;
          const angle = index * 2.399963 + layer * 0.08;
          const radius = 2.4 + (layer % 9) * 0.48;
          particlePositions[index * 3] = Math.cos(angle) * radius;
          particlePositions[index * 3 + 1] = Math.sin(angle * 0.74) * (1.15 + (index % 5) * 0.32);
          particlePositions[index * 3 + 2] = -8.6 + (index % 37) * 0.28;
        }
        const particleGeometry = track(new THREE.BufferGeometry());
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
        const particleMaterial = track(
          new THREE.PointsMaterial({
            color: sceneTone.secondary,
            size: 0.032,
            transparent: true,
            opacity: 0.38,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        world.add(particles);

        const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
        const scroll = { current: 0, target: 0 };
        const device = { mobile: false, width: 1, height: 1 };
        let startRenderTime = 0;
        let lastRenderTime = 0;

        const updateScroll = () => {
          const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          scroll.target = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        };

        const updatePointer = (event: PointerEvent) => {
          if (event.pointerType === "touch" || window.innerWidth < 768) {
            return;
          }

          pointer.targetX = Math.min(1, Math.max(-1, (event.clientX / window.innerWidth - 0.5) * 2));
          pointer.targetY = Math.min(1, Math.max(-1, (event.clientY / window.innerHeight - 0.5) * 2));
        };

        const resize = () => {
          const width = Math.max(1, canvas.clientWidth || window.innerWidth);
          const height = Math.max(1, canvas.clientHeight || window.innerHeight);
          device.mobile = width < 768;
          device.width = width;
          device.height = height;
          const dpr = Math.min(window.devicePixelRatio || 1, device.mobile ? 1.05 : 1.35);
          renderer.setSize(Math.floor(width * dpr), Math.floor(height * dpr), false);
          camera.aspect = width / height;
          camera.fov = device.mobile ? 56 : 40;
          camera.position.z = device.mobile ? 10.6 : 8.9;
          camera.position.y = device.mobile ? 0.12 : 0;
          world.scale.setScalar(device.mobile ? 0.72 : 1);
          world.position.x = device.mobile ? 0 : 0.16;
          world.position.y = device.mobile ? -0.18 : -0.08;
          camera.updateProjectionMatrix();
        };

        const render = (frameTime = 0) => {
          if (disposed) {
            return;
          }

          if (document.visibilityState === "hidden") {
            animationFrame = window.requestAnimationFrame(render);
            return;
          }

          const targetFrameMs = device.mobile ? 1000 / 42 : 1000 / 60;
          if (frameTime - lastRenderTime < targetFrameMs) {
            animationFrame = window.requestAnimationFrame(render);
            return;
          }

          lastRenderTime = frameTime;
          startRenderTime ||= frameTime;
          const elapsed = (frameTime - startRenderTime) / 1000;
          pointer.x += (pointer.targetX - pointer.x) * (device.mobile ? 0.04 : 0.06);
          pointer.y += (pointer.targetY - pointer.y) * (device.mobile ? 0.04 : 0.06);
          scroll.current += (scroll.target - scroll.current) * 0.055;

          camera.position.x = pointer.x * (device.mobile ? 0.12 : 0.34);
          camera.position.y = (device.mobile ? 0.12 : 0) + pointer.y * (device.mobile ? -0.08 : -0.24);
          camera.position.z = (device.mobile ? 10.6 : 8.9) - scroll.current * (device.mobile ? 0.48 : 1.1);
          camera.lookAt(pointer.x * 0.16, pointer.y * -0.1, -2.9);

          world.rotation.x = pointer.y * 0.045 - scroll.current * (device.mobile ? 0.018 : 0.028);
          world.rotation.y = pointer.x * 0.075 + scroll.current * (device.mobile ? 0.08 : 0.16);
          world.position.y = (device.mobile ? -0.18 : -0.08) + scroll.current * (device.mobile ? -0.12 : -0.32);

          corridorFrames.forEach((frame, index) => {
            const depth = (frame.phase + elapsed * (device.mobile ? 0.16 : 0.24) + scroll.current * 4.8) % 8.8;
            const focus = 1 - Math.abs(depth - 4.4) / 4.4;
            frame.line.position.z = -depth - 1.8;
            frame.line.scale.setScalar((device.mobile ? 0.76 : 0.92) + focus * 0.1 + scroll.current * 0.03);
            frame.line.rotation.z += index % 2 === 0 ? 0.00018 : -0.00016;
            frame.material.opacity = (0.03 + Math.max(0, focus) * 0.08) * (1 + scroll.current * 0.36);
          });

          cardDeck.forEach((card, index) => {
            const wave = Math.sin(elapsed * 0.72 + card.phase);
            card.mesh.position.x = card.originX + pointer.x * 0.12 + wave * 0.025;
            card.mesh.position.y = card.originY + pointer.y * -0.08 + Math.cos(elapsed * 0.6 + card.phase) * 0.035;
            card.mesh.position.z = card.originZ + scroll.current * (device.mobile ? -0.16 : -0.34);
            card.mesh.rotation.x += index % 2 === 0 ? 0.00024 : -0.00018;
            card.mesh.rotation.y += index % 3 === 0 ? -0.00028 : 0.00022;
            card.material.opacity = (device.mobile ? 0.045 : 0.07) + Math.max(0, wave) * 0.024;
          });

          core.position.x = (sceneTone.key === "compare" ? 2.95 : 3.2) + pointer.x * 0.2;
          core.position.y = 0.82 + pointer.y * -0.16 + Math.sin(elapsed * 0.8) * 0.045;
          core.rotation.x = elapsed * 0.16 + pointer.y * 0.16;
          core.rotation.y = elapsed * 0.23 + pointer.x * 0.2 + scroll.current * 0.45;
          core.rotation.z = -0.18 + Math.sin(elapsed * 0.36) * 0.04;
          coreShell.rotation.y = elapsed * 0.11;
          coreInner.rotation.x = -elapsed * 0.18;
          coreInner.rotation.z = elapsed * 0.14;
          ringA.rotation.z = elapsed * 0.17 + pointer.x * 0.06;
          ringB.rotation.x = Math.PI / 2.75 + elapsed * 0.09;

          railLines.forEach((rail, index) => {
            rail.line.position.y = Math.sin(elapsed * 0.68 + index * 1.4) * 0.045 + scroll.current * -0.16;
            rail.line.rotation.z = Math.sin(elapsed * 0.28 + index) * 0.015 + pointer.x * 0.02;
            rail.material.opacity = rail.baseOpacity + Math.sin(elapsed * 0.72 + index) * 0.025 + scroll.current * 0.035;
          });

          particles.rotation.y = elapsed * 0.014 + scroll.current * 0.08;
          particles.rotation.z = Math.sin(elapsed * 0.11) * 0.018;
          particleMaterial.opacity = device.mobile ? 0.09 : 0.14;

          renderer.render(scene, camera);
          animationFrame = window.requestAnimationFrame(render);
        };

        resize();
        updateScroll();
        window.addEventListener("resize", resize, { passive: true });
        window.addEventListener("scroll", updateScroll, { passive: true });
        window.addEventListener("pointermove", updatePointer, { passive: true });
        cleanupCallbacks.push(
          () => window.removeEventListener("resize", resize),
          () => window.removeEventListener("scroll", updateScroll),
          () => window.removeEventListener("pointermove", updatePointer),
        );

        animationFrame = window.requestAnimationFrame(render);

        cleanupCallbacks.push(() => {
          window.cancelAnimationFrame(animationFrame);
          scene.clear();
          disposables.forEach((item) => item.dispose());
          renderer.dispose();
          renderer.forceContextLoss();
        });
      });
    };

    const introIsPresent = () =>
      document.documentElement.classList.contains("brand-intro-active") ||
      Boolean(document.querySelector(".brand-intro"));

    if (introIsPresent()) {
      const startAfterIntro = () => startField();
      const fallbackTimer = window.setTimeout(startField, 5200);
      window.addEventListener("tooolvibes:brand-intro-finished", startAfterIntro, { once: true });
      cleanupCallbacks.push(
        () => window.clearTimeout(fallbackTimer),
        () => window.removeEventListener("tooolvibes:brand-intro-finished", startAfterIntro),
      );
    } else {
      startField();
    }

    return () => {
      disposed = true;
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [sceneTone, shouldHide]);

  if (shouldHide) {
    return null;
  }

  return (
    <div className={`experience-orbit-layer experience-orbit-layer--${sceneTone.key}`} aria-hidden="true">
      <canvas ref={fieldCanvasRef} className="experience-orbit-layer__field" />
      <span className="experience-orbit-layer__chroma" />
      <span className="experience-orbit-layer__depth-grid" />
      <span className="experience-orbit-layer__depth-ribbon experience-orbit-layer__depth-ribbon--one" />
      <span className="experience-orbit-layer__depth-ribbon experience-orbit-layer__depth-ribbon--two" />
      <span className="experience-orbit-layer__depth-ribbon experience-orbit-layer__depth-ribbon--three" />
      <span className="experience-orbit-layer__node experience-orbit-layer__node--one" />
      <span className="experience-orbit-layer__node experience-orbit-layer__node--two" />
      <span className="experience-orbit-layer__stage">
        <span className="experience-orbit-layer__stage-panel experience-orbit-layer__stage-panel--back" />
        <span className="experience-orbit-layer__stage-panel experience-orbit-layer__stage-panel--middle" />
        <span className="experience-orbit-layer__stage-panel experience-orbit-layer__stage-panel--front" />
      </span>
      <span className="experience-orbit-layer__scroll-trace" />
      <span className="experience-orbit-layer__cursor" />
      <span className="experience-orbit-layer__progress" />
      <span className="experience-orbit-layer__comet experience-orbit-layer__comet--one" />
      <span className="experience-orbit-layer__comet experience-orbit-layer__comet--two" />
      <span className="experience-orbit-layer__comet experience-orbit-layer__comet--three" />
      <span className="experience-orbit-layer__radar" />
    </div>
  );
}
