"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { SOUND_PLAY_EVENT } from "@/lib/config/sound";

const HIDDEN_PATHS = ["/admin"];

export function GlobalExperienceLayer() {
  const pathname = usePathname();
  const shouldHide = HIDDEN_PATHS.some((path) => pathname?.startsWith(path));
  const fieldCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (prefersReducedMotion.matches || shouldHide) {
      root.style.removeProperty("--tv-scroll-progress");
      root.style.removeProperty("--tv-scroll-depth");
      root.style.removeProperty("--tv-scroll-lift");
      root.style.removeProperty("--tv-scroll-soft");
      root.style.removeProperty("--tv-scroll-rise");
      root.style.removeProperty("--tv-scroll-sweep");
      root.style.removeProperty("--tv-scroll-glow");
      root.style.removeProperty("--tv-depth-opacity");
      root.style.removeProperty("--tv-stage-opacity");
      root.style.removeProperty("--tv-field-opacity");
      root.style.removeProperty("--tv-pointer-x");
      root.style.removeProperty("--tv-pointer-y");
      root.style.removeProperty("--tv-pointer-shift-x");
      root.style.removeProperty("--tv-pointer-shift-y");
      root.style.removeProperty("--tv-pointer-tilt-x");
      root.style.removeProperty("--tv-pointer-tilt-y");
      root.removeAttribute("data-experience-pointer");
      root.removeAttribute("data-experience-scroll");
      return;
    }

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
      const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const milestone = Math.floor(progress * 4);
      root.style.setProperty("--tv-scroll-progress", progress.toFixed(4));
      root.style.setProperty("--tv-scroll-depth", `${(progress * -92).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-lift", `${(progress * -42).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-soft", `${(progress * -18).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-rise", `${(progress * -21).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-sweep", `${(progress * 180).toFixed(2)}px`);
      root.style.setProperty("--tv-scroll-glow", `${(0.12 + progress * 0.34).toFixed(3)}`);
      root.style.setProperty("--tv-depth-opacity", `${(0.18 + Math.sin(progress * Math.PI) * 0.22).toFixed(3)}`);
      root.style.setProperty("--tv-stage-opacity", `${(0.28 + progress * 0.18).toFixed(3)}`);
      root.style.setProperty("--tv-field-opacity", `${(0.3 + Math.sin(progress * Math.PI) * 0.06 + progress * 0.07).toFixed(3)}`);
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
        pointerFrame = 0;
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
      root.style.removeProperty("--tv-scroll-progress");
      root.style.removeProperty("--tv-scroll-depth");
      root.style.removeProperty("--tv-scroll-lift");
      root.style.removeProperty("--tv-scroll-soft");
      root.style.removeProperty("--tv-scroll-rise");
      root.style.removeProperty("--tv-scroll-sweep");
      root.style.removeProperty("--tv-scroll-glow");
      root.style.removeProperty("--tv-depth-opacity");
      root.style.removeProperty("--tv-stage-opacity");
      root.style.removeProperty("--tv-field-opacity");
      root.style.removeProperty("--tv-pointer-x");
      root.style.removeProperty("--tv-pointer-y");
      root.style.removeProperty("--tv-pointer-shift-x");
      root.style.removeProperty("--tv-pointer-shift-y");
      root.style.removeProperty("--tv-pointer-tilt-x");
      root.style.removeProperty("--tv-pointer-tilt-y");
      root.removeAttribute("data-experience-pointer");
      root.removeAttribute("data-experience-scroll");
      delete root.dataset.experienceDepth;
    };
  }, [shouldHide]);

  useEffect(() => {
    const canvas = fieldCanvasRef.current;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || prefersReducedMotion.matches || shouldHide || window.innerWidth < 1024) {
      return;
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(39, window.innerWidth / window.innerHeight, 0.1, 80);
      camera.position.set(0, 0, 8.7);

      const field = new THREE.Group();
      field.position.set(0.16, -0.12, -2.8);
      scene.add(field);

      const corridor = new THREE.Group();
      corridor.rotation.x = -0.015;
      field.add(corridor);

      const prism = new THREE.Group();
      prism.position.set(3.05, 0.72, -0.7);
      field.add(prism);

      const signalRail = new THREE.Group();
      signalRail.position.set(-0.15, -0.12, -1.4);
      field.add(signalRail);

      const makeLineMaterial = (color: number, opacity: number) => {
        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        disposables.push(material);
        return material;
      };

      const makeMeshMaterial = (color: number, opacity: number) => {
        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          wireframe: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        disposables.push(material);
        return material;
      };

      const framePalette = [0x6a3cff, 0x39d2f6, 0xf3bf4c];
      const corridorFrames: Array<{
        line: InstanceType<typeof THREE.Line>;
        material: InstanceType<typeof THREE.LineBasicMaterial>;
        phase: number;
      }> = [];

      for (let index = 0; index < 8; index += 1) {
        const width = 6.4 + index * 0.22;
        const height = 3.7 + index * 0.12;
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-width, -height, 0),
          new THREE.Vector3(width, -height, 0),
          new THREE.Vector3(width, height, 0),
          new THREE.Vector3(-width, height, 0),
          new THREE.Vector3(-width, -height, 0),
        ]);
        disposables.push(geometry);

        const material = makeLineMaterial(framePalette[index % framePalette.length], 0.06);
        const line = new THREE.Line(geometry, material);
        line.rotation.z = index % 2 === 0 ? -0.012 : 0.018;
        corridor.add(line);
        corridorFrames.push({ line, material, phase: index * 0.82 });
      }

      const prismShellGeometry = new THREE.IcosahedronGeometry(1.12, 1);
      const prismCoreGeometry = new THREE.OctahedronGeometry(0.56, 0);
      const ringGeometry = new THREE.TorusGeometry(1.64, 0.008, 8, 96);
      const ringWideGeometry = new THREE.TorusGeometry(2.08, 0.006, 8, 112);
      disposables.push(prismShellGeometry, prismCoreGeometry, ringGeometry, ringWideGeometry);

      const prismShell = new THREE.Mesh(prismShellGeometry, makeMeshMaterial(0x6a3cff, 0.17));
      const prismCore = new THREE.Mesh(prismCoreGeometry, makeMeshMaterial(0x39d2f6, 0.2));
      const ringA = new THREE.Mesh(ringGeometry, makeMeshMaterial(0x39d2f6, 0.17));
      const ringB = new THREE.Mesh(ringWideGeometry, makeMeshMaterial(0xf3bf4c, 0.12));
      const ringC = new THREE.Mesh(ringWideGeometry.clone(), makeMeshMaterial(0xd8b4fe, 0.12));
      disposables.push(ringC.geometry);

      ringA.rotation.x = Math.PI / 2.25;
      ringB.rotation.y = Math.PI / 2.8;
      ringC.rotation.x = Math.PI / 3.4;
      ringC.rotation.y = Math.PI / 3;
      prism.add(prismShell, prismCore, ringA, ringB, ringC);

      const railCurves = [
        {
          color: 0x39d2f6,
          opacity: 0.16,
          points: [
            new THREE.Vector3(-6.1, -1.6, -1.2),
            new THREE.Vector3(-3.1, -0.52, -2.6),
            new THREE.Vector3(0.2, -0.2, -1.4),
            new THREE.Vector3(3.9, 1.0, -3.2),
            new THREE.Vector3(6.2, 1.48, -1.4),
          ],
        },
        {
          color: 0x6a3cff,
          opacity: 0.13,
          points: [
            new THREE.Vector3(-6.3, 1.28, -2.4),
            new THREE.Vector3(-3.6, 0.42, -1.2),
            new THREE.Vector3(-0.25, 0.72, -3.1),
            new THREE.Vector3(3.35, -0.68, -1.5),
            new THREE.Vector3(6.0, -1.18, -2.9),
          ],
        },
        {
          color: 0xf3bf4c,
          opacity: 0.11,
          points: [
            new THREE.Vector3(-5.6, 0.02, -3.2),
            new THREE.Vector3(-2.2, 1.12, -1.9),
            new THREE.Vector3(1.1, 0.18, -2.6),
            new THREE.Vector3(4.6, 0.42, -1.2),
          ],
        },
      ];

      const rails: Array<{
        line: InstanceType<typeof THREE.Line>;
        material: InstanceType<typeof THREE.LineBasicMaterial>;
        baseOpacity: number;
      }> = [];

      railCurves.forEach((rail) => {
        const curve = new THREE.CatmullRomCurve3(rail.points);
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(72));
        disposables.push(geometry);
        const material = makeLineMaterial(rail.color, rail.opacity);
        const line = new THREE.Line(geometry, material);
        signalRail.add(line);
        rails.push({ line, material, baseOpacity: rail.opacity });
      });

      const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
      const scroll = { current: 0, target: 0 };
      let startRenderTime = 0;
      let lastRenderTime = 0;

      const updateScroll = () => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scroll.target = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      };

      const updatePointer = (event: PointerEvent) => {
        if (event.pointerType === "touch") {
          return;
        }

        pointer.targetX = Math.min(1, Math.max(-1, (event.clientX / window.innerWidth - 0.5) * 2));
        pointer.targetY = Math.min(1, Math.max(-1, (event.clientY / window.innerHeight - 0.5) * 2));
      };

      const resize = () => {
        const width = Math.max(1, window.innerWidth);
        const height = Math.max(1, window.innerHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
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

        if (frameTime - lastRenderTime < 1000 / 60) {
          animationFrame = window.requestAnimationFrame(render);
          return;
        }

        lastRenderTime = frameTime;
        startRenderTime ||= frameTime;
        const elapsed = (frameTime - startRenderTime) / 1000;
        pointer.x += (pointer.targetX - pointer.x) * 0.06;
        pointer.y += (pointer.targetY - pointer.y) * 0.06;
        scroll.current += (scroll.target - scroll.current) * 0.055;

        camera.position.x = pointer.x * 0.34;
        camera.position.y = pointer.y * -0.24;
        camera.position.z = 8.7 - scroll.current * 1.1;
        camera.lookAt(pointer.x * 0.18, pointer.y * -0.12, -2.7);

        field.rotation.x = pointer.y * 0.045 - scroll.current * 0.028;
        field.rotation.y = pointer.x * 0.075 + scroll.current * 0.16;
        field.position.y = -0.12 + scroll.current * -0.32;

        corridorFrames.forEach((frame, index) => {
          const depth = (frame.phase + elapsed * 0.24 + scroll.current * 4.8) % 8.2;
          const focus = 1 - Math.abs(depth - 4.1) / 4.1;
          frame.line.position.z = -depth - 1.8;
          frame.line.scale.setScalar(0.92 + focus * 0.1 + scroll.current * 0.03);
          frame.line.rotation.z += index % 2 === 0 ? 0.00018 : -0.00016;
          frame.material.opacity = (0.035 + Math.max(0, focus) * 0.08) * (1 + scroll.current * 0.38);
        });

        prism.position.x = 3.05 + pointer.x * 0.2;
        prism.position.y = 0.72 + pointer.y * -0.16 + Math.sin(elapsed * 0.8) * 0.045;
        prism.rotation.x = elapsed * 0.16 + pointer.y * 0.16;
        prism.rotation.y = elapsed * 0.23 + pointer.x * 0.2 + scroll.current * 0.45;
        prism.rotation.z = -0.18 + Math.sin(elapsed * 0.36) * 0.04;

        prismShell.rotation.y = elapsed * 0.11;
        prismCore.rotation.x = -elapsed * 0.18;
        prismCore.rotation.z = elapsed * 0.14;
        ringA.rotation.z = elapsed * 0.17 + pointer.x * 0.06;
        ringB.rotation.x = Math.PI / 2.8 + elapsed * 0.09;
        ringC.rotation.y = Math.PI / 3 + elapsed * -0.08;

        rails.forEach((rail, index) => {
          rail.line.position.y = Math.sin(elapsed * 0.68 + index * 1.4) * 0.045 + scroll.current * -0.16;
          rail.line.rotation.z = Math.sin(elapsed * 0.28 + index) * 0.015 + pointer.x * 0.02;
          rail.material.opacity = rail.baseOpacity + Math.sin(elapsed * 0.72 + index) * 0.025 + scroll.current * 0.035;
        });

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

      render();

      cleanupCallbacks.push(() => {
        window.cancelAnimationFrame(animationFrame);
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
  }, [shouldHide]);

  if (shouldHide) {
    return null;
  }

  return (
    <div className="experience-orbit-layer" aria-hidden="true">
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
