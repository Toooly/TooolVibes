"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  speed: number;
  twinkle: number;
  twinkleSpeed: number;
}

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    let animationId = 0;
    let width = 0;
    let height = 0;

    const stars: Star[] = [];
    const STAR_COUNT = 180;

    function resize() {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initStars() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.2 + 0.3,
          opacity: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 0.15 + 0.02,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    }

    function drawNebula() {
      // Soft nebula glows
      const gradients = [
        { x: width * 0.25, y: height * 0.3, r: Math.max(width, height) * 0.45, color: "rgba(124,77,255,0.06)" },
        { x: width * 0.75, y: height * 0.6, r: Math.max(width, height) * 0.4, color: "rgba(0,229,255,0.04)" },
        { x: width * 0.5, y: height * 0.15, r: Math.max(width, height) * 0.35, color: "rgba(106,60,255,0.05)" },
      ];

      for (const g of gradients) {
        const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        grad.addColorStop(0, g.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
    }

    function drawPlanet() {
      const cx = width * 0.88;
      const cy = height * 0.18;
      const r = Math.min(width, height) * 0.18;

      const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      grad.addColorStop(0, "rgba(124,77,255,0.18)");
      grad.addColorStop(0.5, "rgba(0,229,255,0.08)");
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.35);
      core.addColorStop(0, "rgba(124,77,255,0.12)");
      core.addColorStop(1, "transparent");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      drawNebula();
      drawPlanet();

      for (const star of stars) {
        star.twinkle += star.twinkleSpeed;
        const twinkleFactor = Math.sin(star.twinkle) * 0.3 + 0.7;
        ctx.globalAlpha = star.opacity * twinkleFactor;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function animate() {
      draw();
      animationId = requestAnimationFrame(animate);
    }

    resize();
    initStars();
    animate();

    function handleResize() {
      resize();
      initStars();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ background: "linear-gradient(180deg, #06060E 0%, #0A0A18 40%, #12122A 100%)" }}
    />
  );
}
