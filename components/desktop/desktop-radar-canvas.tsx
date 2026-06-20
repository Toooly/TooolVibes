"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

export function DesktopRadarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let disposed = false;
    let raf = 0;
    const cleanup: Array<() => void> = [];
    const disposables: Array<{ dispose: () => void }> = [];

    void import("three").then((THREE) => {
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 6, 6);
      camera.lookAt(0, 0, 0);

      const root = new THREE.Group();
      scene.add(root);

      type TMaterial = InstanceType<typeof THREE.Material>;

      const track = <T extends { dispose?: () => void }>(r: T) => {
        if (r.dispose) disposables.push(r as T & { dispose: () => void });
        return r;
      };

      // Grid
      const grid = new THREE.GridHelper(12, 24, 0x6a3cff, 0x1a1040);
      grid.position.y = -0.5;
      (grid.material as TMaterial).transparent = true;
      (grid.material as TMaterial).opacity = 0.16;
      root.add(grid);

      // Rings — brighter and more visible
      const ringColors = [0x6a3cff, 0x39d2f6, 0xf3bf4c];
      [2.5, 4, 5.5].forEach((radius, i) => {
        const geo = track(
          new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64),
        );
        const mat = track(
          new THREE.MeshBasicMaterial({
            color: ringColors[i],
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        root.add(mesh);
      });

      // Sweep blade — primary
      const sweepGeo = track(new THREE.PlaneGeometry(5.5, 0.14));
      const sweepMat = track(
        new THREE.MeshBasicMaterial({
          color: 0x6a3cff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      const sweep = new THREE.Mesh(sweepGeo, sweepMat);
      sweep.rotation.x = -Math.PI / 2;
      sweep.position.y = -0.48;
      root.add(sweep);

      // Sweep blade — secondary fast echo
      const sweepEchoGeo = track(new THREE.PlaneGeometry(5.5, 0.06));
      const sweepEchoMat = track(
        new THREE.MeshBasicMaterial({
          color: 0x39d2f6,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      const sweepEcho = new THREE.Mesh(sweepEchoGeo, sweepEchoMat);
      sweepEcho.rotation.x = -Math.PI / 2;
      sweepEcho.position.y = -0.47;
      root.add(sweepEcho);

      // Ambient signal squares are disabled: the live tool nodes carry the scene.
      const signalCount = 0;
      interface SignalNode {
        mesh: THREE.Mesh;
        ring: THREE.Mesh;
        baseX: number;
        baseZ: number;
        baseSize: number;
        color: THREE.Color;
        phase: number;
        speed: number;
      }
      const signals: SignalNode[] = [];
      const signalColors = [0x6a3cff, 0x39d2f6, 0xf3bf4c, 0xffffff, 0x8b6cff];

      for (let i = 0; i < signalCount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const r = 0.8 + Math.random() * 4.8;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const colorHex = signalColors[i % signalColors.length];
        const baseSize = 0.22 + Math.random() * 0.42; // 0.22 - 0.64 units

        // Core glow sprite
        const geo = track(new THREE.PlaneGeometry(baseSize, baseSize));
        const mat = track(
          new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, -0.48, z);
        root.add(mesh);

        // Subtle ring around node
        const ringGeo = track(new THREE.RingGeometry(baseSize * 0.6, baseSize * 0.75, 24));
        const ringMat = track(
          new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, -0.475, z);
        root.add(ring);

        signals.push({
          mesh,
          ring,
          baseX: x,
          baseZ: z,
          baseSize,
          color: new THREE.Color(colorHex),
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.2,
        });
      }

      const resize = () => {
        const rect = canvas.parentElement?.getBoundingClientRect();
        const w = rect ? Math.max(1, rect.width) : 300;
        const h = rect ? Math.max(1, rect.height) : 300;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      if (canvas.parentElement) ro.observe(canvas.parentElement);
      cleanup.push(() => ro.disconnect());

      let time = 0;
      let paused = false;
      const render = () => {
        if (paused) return;
        raf = window.requestAnimationFrame(render);
        if (disposed) return;
        time += 0.016;
        const sweepAngle = time * 0.8;
        sweep.rotation.z = 0;
        sweepEcho.rotation.z = 0;

        // Animate each signal node — watchOS-like pulse + sweep focus
        signals.forEach((sig) => {
          // Distance from center affects base scale (closer = slightly larger)
          const distFromCenter = Math.sqrt(sig.baseX * sig.baseX + sig.baseZ * sig.baseZ);
          const centerBoost = 1 + Math.max(0, (2.5 - distFromCenter) * 0.08);

          // Breathing pulse
          const breath = Math.sin(time * sig.speed + sig.phase) * 0.18 + 1;

          // Sweep focus: when sweep passes near node's angle, flash bigger
          const nodeAngle = Math.atan2(sig.baseZ, sig.baseX);
          let angleDiff = Math.abs(((nodeAngle + sweepAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
          if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
          const sweepProximity = Math.max(0, 1 - angleDiff / 0.55);
          const sweepBoost = 1 + sweepProximity * 0.65;
          const sweepOpacityBoost = 1 + sweepProximity * 0.5;

          const scale = sig.baseSize * centerBoost * breath * sweepBoost;
          const scaleRatio = scale / sig.baseSize;
          sig.mesh.scale.set(scaleRatio, scaleRatio, 1);

          (sig.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1, 0.75 * sweepOpacityBoost);
          (sig.ring.material as THREE.MeshBasicMaterial).opacity = Math.min(1, 0.35 * sweepOpacityBoost);
          sig.ring.scale.set(scaleRatio, scaleRatio, 1);
        });

        renderer.render(scene, camera);
      };
      raf = window.requestAnimationFrame(render);

      const observer = new IntersectionObserver(
        ([entry]) => {
          const wasPaused = paused;
          paused = !entry.isIntersecting;
          if (wasPaused && !paused) {
            raf = window.requestAnimationFrame(render);
          }
        },
        { threshold: 0 },
      );
      observer.observe(canvas);
      cleanup.push(() => observer.disconnect());

      cleanup.push(() => {
        window.cancelAnimationFrame(raf);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
      });
    });

    return () => {
      disposed = true;
      cleanup.forEach((cb) => cb());
    };
  }, []);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && (
        <div className="desktop-stage-canvas desktop-stage-canvas--loading" aria-hidden="true">
          <span className="desktop-stage-skeleton" />
        </div>
      )}
      <canvas ref={canvasRef} className="desktop-stage-canvas" />
    </>
  );
}
