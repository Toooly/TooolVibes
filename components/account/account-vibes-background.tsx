"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function AccountVibesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    let animId = 0;
    let w = 0;
    let h = 0;
    const mouse = { x: -1000, y: -1000 };

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 80;
    const CONNECT_DIST = 140;
    const MOUSE_DIST = 200;

    const colors = [
      "rgba(124,77,255,",
      "rgba(0,229,255,",
      "rgba(179,136,255,",
    ];

    function resize() {
      if (!canvas || !ctx) return;
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const base = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 0.5,
          color: base,
        });
      }
    }

    function drawGrid() {
      const gridSize = 60;
      ctx.strokeStyle = "rgba(124,77,255,0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    function drawNebula() {
      const grads = [
        { x: w * 0.2, y: h * 0.3, r: Math.max(w, h) * 0.4, c: "rgba(124,77,255,0.05)" },
        { x: w * 0.8, y: h * 0.7, r: Math.max(w, h) * 0.35, c: "rgba(0,229,255,0.03)" },
        { x: w * 0.5, y: h * 0.15, r: Math.max(w, h) * 0.3, c: "rgba(106,60,255,0.04)" },
      ];
      for (const g of grads) {
        const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        grad.addColorStop(0, g.c);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = 1 - dist / CONNECT_DIST;
            ctx.strokeStyle = `rgba(124,77,255,${alpha * 0.12})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        // Mouse connection
        const mdx = particles[i].x - mouse.x;
        const mdy = particles[i].y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < MOUSE_DIST) {
          const alpha = 1 - mdist / MOUSE_DIST;
          ctx.strokeStyle = `rgba(0,229,255,${alpha * 0.2})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    function drawParticles() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        grad.addColorStop(0, p.color + "0.6)");
        grad.addColorStop(1, p.color + "0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      drawGrid();
      drawNebula();
      drawConnections();
      drawParticles();
      animId = requestAnimationFrame(animate);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    resize();
    initParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      initParticles();
    });
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        background: "linear-gradient(180deg, #06060E 0%, #0A0A18 40%, #12122A 100%)",
        zIndex: 0,
      }}
    />
  );
}
