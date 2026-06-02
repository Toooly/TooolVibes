"use client";

import { useEffect, useRef } from "react";

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
      (grid.material as TMaterial).opacity = 0.22;
      root.add(grid);

      // Rings
      const ringColors = [0x6a3cff, 0x39d2f6, 0xf3bf4c];
      [2.5, 4, 5.5].forEach((radius, i) => {
        const geo = track(
          new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64),
        );
        const mat = track(
          new THREE.MeshBasicMaterial({
            color: ringColors[i],
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        root.add(mesh);
      });

      // Sweep blade
      const sweepGeo = track(new THREE.PlaneGeometry(5.5, 0.12));
      const sweepMat = track(
        new THREE.MeshBasicMaterial({
          color: 0x6a3cff,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      const sweep = new THREE.Mesh(sweepGeo, sweepMat);
      sweep.rotation.x = -Math.PI / 2;
      sweep.position.y = -0.48;
      root.add(sweep);

      // Signal points
      const signalCount = 24;
      const signalPos = new Float32Array(signalCount * 3);
      for (let i = 0; i < signalCount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const r = 0.5 + Math.random() * 5;
        signalPos[i * 3] = Math.cos(angle) * r;
        signalPos[i * 3 + 1] = -0.48;
        signalPos[i * 3 + 2] = Math.sin(angle) * r;
      }
      const signalGeo = track(new THREE.BufferGeometry());
      signalGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(signalPos, 3),
      );
      const signalMat = track(
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.08,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const signals = new THREE.Points(signalGeo, signalMat);
      root.add(signals);

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
      const render = () => {
        raf = window.requestAnimationFrame(render);
        if (disposed) return;
        time += 0.016;
        sweep.rotation.z = -time * 0.8;
        signals.rotation.y = time * 0.02;
        renderer.render(scene, camera);
      };
      raf = window.requestAnimationFrame(render);

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

  return <canvas ref={canvasRef} className="desktop-stage-canvas" />;
}
