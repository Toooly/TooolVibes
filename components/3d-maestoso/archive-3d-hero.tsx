"use client";

import { motion } from "motion/react";
import { Search, SlidersHorizontal, Layers3 } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function GalaxyParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 6;
      const z = (Math.random() - 0.5) * 2;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(theta);
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z += delta * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#7C4DFF" size={0.02} transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function Archive3DHero() {
  const handleJump = (target: "search" | "filters" | "categories") => {
    const selector =
      target === "search"
        ? "[data-catalog-search]"
        : target === "filters"
          ? "[data-catalog-filters]"
          : "[data-catalog-categories]";
    const element = document.querySelector<HTMLElement>(selector);

    element?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (target === "search" && element instanceof HTMLInputElement) {
      window.setTimeout(() => element.focus({ preventScroll: true }), 320);
    }
  };

  return (
    <section className="archive-3d-hero relative flex min-h-[24rem] items-center justify-center overflow-hidden py-10 sm:py-12">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
          <ambientLight intensity={0.2} />
          <GalaxyParticles />
        </Canvas>
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <motion.p
          className="archive-3d-hero__title mb-3 text-sm font-semibold uppercase tracking-widest text-[#7C4DFF]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Catalogo TooolVibes
        </motion.p>
        <motion.h1
          className="sr-only"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Catalogo TooolVibes
        </motion.h1>
        <motion.div
          className="mt-5 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          <button
            type="button"
            onClick={() => handleJump("search")}
            className="archive-3d-hero__pill flex items-center gap-2 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-sm text-[#9E99B8]"
          >
            <Search size={14} /> Ricerca
          </button>
          <button
            type="button"
            onClick={() => handleJump("filters")}
            className="archive-3d-hero__pill flex items-center gap-2 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-sm text-[#9E99B8]"
          >
            <SlidersHorizontal size={14} /> Filtri
          </button>
          <button
            type="button"
            onClick={() => handleJump("categories")}
            className="archive-3d-hero__pill flex items-center gap-2 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-sm text-[#9E99B8]"
          >
            <Layers3 size={14} /> Categorie
          </button>
        </motion.div>
      </div>
    </section>
  );
}
