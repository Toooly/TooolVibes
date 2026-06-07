"use client";

import { useEffect, useRef, useState } from "react";

export function DesktopCompareCanvas() {
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
      camera.position.set(0, 4, 7);
      camera.lookAt(0, 0, 0);

      const root = new THREE.Group();
      scene.add(root);

      const track = <T extends { dispose?: () => void }>(r: T) => {
        if (r.dispose) disposables.push(r as T & { dispose: () => void });
        return r;
      };

      // Horizontal planes
      const planeColors = [0x6a3cff, 0x39d2f6, 0xf3bf4c];
      [-1.5, 0, 1.5].forEach((y, i) => {
        const geo = track(new THREE.PlaneGeometry(5, 3));
        const mat = track(
          new THREE.MeshBasicMaterial({
            color: planeColors[i],
            transparent: true,
            opacity: 0.07,
            wireframe: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = y;
        root.add(mesh);
      });

      // Vertical connector lines
      const lineCount = 6;
      const linePos = new Float32Array(lineCount * 2 * 3);
      for (let i = 0; i < lineCount; i += 1) {
        const x = (i - lineCount / 2) * 0.8;
        linePos[i * 6] = x;
        linePos[i * 6 + 1] = -1.5;
        linePos[i * 6 + 2] = 0;
        linePos[i * 6 + 3] = x;
        linePos[i * 6 + 4] = 1.5;
        linePos[i * 6 + 5] = 0;
      }
      const lineGeo = track(new THREE.BufferGeometry());
      lineGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(linePos, 3),
      );
      const lineMat = track(
        new THREE.LineBasicMaterial({
          color: 0x6a3cff,
          transparent: true,
          opacity: 0.1,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      root.add(new THREE.LineSegments(lineGeo, lineMat));

      // Dust particles between planes
      const dustCount = 60;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i += 1) {
        dustPos[i * 3] = (Math.random() - 0.5) * 8;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
      const dustGeo = track(new THREE.BufferGeometry());
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = track(
        new THREE.PointsMaterial({
          color: 0xa78bfa,
          size: 0.04,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      root.add(new THREE.Points(dustGeo, dustMat));

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
        root.rotation.y = Math.sin(time * 0.1) * 0.05;
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
