"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import Link from "next/link";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { TiltCard3D } from "./tilt-card-3d";

function ArenaParticles({ count = 300 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 4 * Math.cbrt(Math.random());
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#FFD740"
        size={0.025}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Compare3DHero() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div
      className={`compare-space-hero relative flex ${
        isMobile ? "min-h-[38vh]" : "min-h-[58vh]"
      } items-center justify-center overflow-hidden`}
    >
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,215,64,0.08) 0%, transparent 60%)" }}
      />
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 55 }}
          dpr={isMobile ? 1 : [1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.6} color="#FFD740" />
          <pointLight position={[-5, -3, 5]} intensity={0.4} color="#FF4081" />
          <ArenaParticles count={isMobile ? 120 : 300} />
        </Canvas>
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <h1 className="compare-space-hero__title v-text-gradient-amber text-4xl font-bold sm:text-5xl md:text-6xl">
          La stanza dove puoi confrontare tutti i tool che ti interessano.
        </h1>
      </div>
    </div>
  );
}

export function Compare3DFloatCard({ tool, index }: { tool: DirectoryTool; index: number }) {
  return (
    <TiltCard3D tiltAmount={8} glowColor="rgba(255,215,64,0.25)">
      <Link
        href={`/toools/${tool.slug}`}
        className="flex flex-col items-center gap-3 rounded-2xl p-5 v-card-3d"
        style={{ background: `linear-gradient(145deg, ${tool.accentFrom}15, ${tool.accentTo}10)` }}
      >
        <DirectoryToolGlyph tool={tool} size={index === 0 ? "lg" : "md"} />
        <span className="text-center">
          <strong className="block text-[#F0EFFF]">{tool.name}</strong>
          <small className="text-[#9E99B8]">{tool.levelLabel}</small>
        </span>
      </Link>
    </TiltCard3D>
  );
}
