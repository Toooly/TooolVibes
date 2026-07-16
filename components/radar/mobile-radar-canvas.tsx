"use client";

import { useEffect, useRef } from "react";

interface RadarNode {
  angle: number;
  radius: number;
  size: number;
  color: string;
  label: string;
  phase: number;
  speed: number;
}

const COLORS = ["#6a3cff", "#39d2f6", "#f3bf4c", "#ffffff", "#a78bfa"];

const NODES: RadarNode[] = [
  { angle: 0.2, radius: 0.35, size: 10, color: COLORS[0], label: "Oggi", phase: 0, speed: 1.1 },
  { angle: 1.1, radius: 0.58, size: 9, color: COLORS[1], label: "Settimana", phase: 1.2, speed: 0.9 },
  { angle: 2.4, radius: 0.42, size: 10, color: COLORS[2], label: "Mese", phase: 2.1, speed: 1.0 },
  { angle: 3.6, radius: 0.72, size: 8, color: COLORS[4], label: "Segnali", phase: 0.8, speed: 1.3 },
  { angle: 4.8, radius: 0.55, size: 9, color: COLORS[0], label: "", phase: 3.2, speed: 0.8 },
  { angle: 5.5, radius: 0.28, size: 11, color: COLORS[1], label: "", phase: 1.5, speed: 1.2 },
  { angle: 0.8, radius: 0.82, size: 7, color: COLORS[2], label: "", phase: 2.6, speed: 0.7 },
  { angle: 2.0, radius: 0.65, size: 8, color: COLORS[3], label: "", phase: 0.3, speed: 1.0 },
  { angle: 3.1, radius: 0.38, size: 10, color: COLORS[4], label: "", phase: 1.9, speed: 1.1 },
  { angle: 4.2, radius: 0.78, size: 7, color: COLORS[0], label: "", phase: 3.5, speed: 0.9 },
  { angle: 5.0, radius: 0.48, size: 9, color: COLORS[1], label: "", phase: 0.6, speed: 1.2 },
  { angle: 1.7, radius: 0.88, size: 7, color: COLORS[2], label: "", phase: 2.3, speed: 0.8 },
];

export function MobileRadarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let disposed = false;
    let time = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = rect ? rect.width : 320;
      const h = rect ? rect.height : 320;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const render = () => {
      raf = requestAnimationFrame(render);
      if (disposed) return;
      time += 0.016;

      const w = canvas.width / Math.min(window.devicePixelRatio, 2);
      const h = canvas.height / Math.min(window.devicePixelRatio, 2);
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.42;

      ctx.clearRect(0, 0, w, h);

      // Rings
      const ringColors = ["rgba(106, 60, 255, 0.22)", "rgba(57, 210, 246, 0.18)", "rgba(243, 191, 76, 0.14)"];
      [0.35, 0.62, 0.88].forEach((ratio, i) => {
        const r = maxR * ratio;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ringColors[i];
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Grid cross
      ctx.strokeStyle = "rgba(106, 60, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Sweep
      const sweepAngle = time * 0.9;
      const sweepLen = maxR * 1.05;
      const sx = cx + Math.cos(sweepAngle) * sweepLen;
      const sy = cy + Math.sin(sweepAngle) * sweepLen;

      // Sweep glow
      const grad = ctx.createLinearGradient(cx, cy, sx, sy);
      grad.addColorStop(0, "rgba(106, 60, 255, 0.45)");
      grad.addColorStop(0.6, "rgba(57, 210, 246, 0.25)");
      grad.addColorStop(1, "rgba(106, 60, 255, 0)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Sweep echo
      const echoAngle = sweepAngle + 0.45;
      const ex = cx + Math.cos(echoAngle) * sweepLen * 0.85;
      const ey = cy + Math.sin(echoAngle) * sweepLen * 0.85;
      const echoGrad = ctx.createLinearGradient(cx, cy, ex, ey);
      echoGrad.addColorStop(0, "rgba(57, 210, 246, 0.2)");
      echoGrad.addColorStop(1, "rgba(57, 210, 246, 0)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = echoGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(106, 60, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Nodes
      NODES.forEach((node) => {
        const nx = cx + Math.cos(node.angle) * maxR * node.radius;
        const ny = cy + Math.sin(node.angle) * maxR * node.radius;

        // Breathing
        const breath = Math.sin(time * node.speed + node.phase) * 0.25 + 1;

        // Sweep focus
        const nodeAngleRaw = node.angle;
        let angleDiff = Math.abs(((nodeAngleRaw - sweepAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        const sweepProximity = Math.max(0, 1 - angleDiff / 0.7);
        const sweepBoost = 1 + sweepProximity * 0.8;
        const sweepGlow = sweepProximity * 18;

        const size = node.size * breath * sweepBoost;

        // Outer glow when sweep hits
        if (sweepGlow > 0.5) {
          ctx.beginPath();
          ctx.arc(nx, ny, size + sweepGlow, 0, Math.PI * 2);
          ctx.fillStyle = node.color + "22";
          ctx.fill();
        }

        // Ring
        ctx.beginPath();
        ctx.arc(nx, ny, size + 3, 0, Math.PI * 2);
        ctx.strokeStyle = node.color + "55";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Fill
        ctx.beginPath();
        ctx.arc(nx, ny, size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Inner highlight
        ctx.beginPath();
        ctx.arc(nx - size * 0.25, ny - size * 0.25, size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fill();

        // Label
        if (node.label) {
          ctx.font = `600 ${Math.max(12, 11 * sweepBoost)}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillText(node.label, nx, ny + size + 8);
        }
      });
    };

    raf = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ touchAction: "none" }}
    />
  );
}
