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
  return (
    <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden py-16">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
          <ambientLight intensity={0.2} />
          <GalaxyParticles />
        </Canvas>
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <motion.p
          className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#7C4DFF]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Catalogo 3D
        </motion.p>
        <motion.h1
          className="v-text-gradient-purple text-4xl font-bold sm:text-5xl md:text-6xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Cerca, filtra e attraversa i tool come livelli
        </motion.h1>
        <motion.p
          className="mx-auto mt-5 max-w-xl text-lg text-[#9E99B8]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Il catalogo diventa una console: ricerca davanti, categorie in prospettiva, schede tool su piani diversi.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-sm text-[#9E99B8]">
            <Search size={14} /> Ricerca
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-sm text-[#9E99B8]">
            <SlidersHorizontal size={14} /> Filtri
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-sm text-[#9E99B8]">
            <Layers3 size={14} /> Categorie
          </div>
        </motion.div>
      </div>
    </section>
  );
}
