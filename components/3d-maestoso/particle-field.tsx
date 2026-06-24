"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleCloud({ count, color, size, spread }: { count: number; color: string; size: number; spread: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = spread * Math.cbrt(Math.random());
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count, spread]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={size} transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function ParticleField({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return (
    <div className={`${className}`} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", touchAction: 'none', ...style }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={isMobile ? 1 : [1, 1.5]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <ParticleCloud count={isMobile ? 150 : 400} color="#7C4DFF" size={0.025} spread={15} />
        <ParticleCloud count={isMobile ? 80 : 200} color="#00E5FF" size={0.018} spread={12} />
        <ParticleCloud count={isMobile ? 40 : 100} color="#FF4081" size={0.012} spread={18} />
      </Canvas>
    </div>
  );
}
