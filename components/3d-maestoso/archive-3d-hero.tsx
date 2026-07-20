"use client";

import { motion } from "motion/react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const openCatalogPanel = (panel: "search" | "filters") => {
    window.dispatchEvent(new CustomEvent("tooolvibes:catalog-panel", { detail: panel }));
  };

  const content = (
    <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
      <motion.p
        className="archive-3d-hero__eyebrow mb-3 text-sm font-semibold uppercase tracking-widest text-[#7C4DFF]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Directory editoriale
      </motion.p>
      <motion.h1
        className="archive-3d-hero__title"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        Il catalogo, senza il caos.
      </motion.h1>
      <motion.p
        className="archive-3d-hero__lede"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.6 }}
      >
        Cerca per obiettivo e confronta solo tool selezionati per aiutarti a
        decidere.
      </motion.p>
      <motion.div
        className="mt-5 flex flex-wrap items-center justify-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
      >
        <button
          type="button"
          onClick={() => openCatalogPanel("search")}
          className="archive-3d-hero__pill flex items-center gap-2 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-sm text-[#9E99B8]"
        >
          <Search size={14} /> Ricerca
        </button>
        <button
          type="button"
          onClick={() => openCatalogPanel("filters")}
          className="archive-3d-hero__pill flex items-center gap-2 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-sm text-[#9E99B8]"
        >
          <SlidersHorizontal size={14} /> Filtri
        </button>
      </motion.div>
    </div>
  );

  const staticBackdrop = (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, rgba(124, 77, 255, 0.18), transparent 58%), radial-gradient(circle at 76% 18%, rgba(57, 210, 246, 0.12), transparent 44%), linear-gradient(180deg, #06060e 0%, #08030f 56%, #06060e 100%)",
      }}
    />
  );

  if (isMobile === true) {
    return (
      <section className="archive-3d-hero relative flex min-h-[24rem] items-center justify-center overflow-hidden py-10 sm:py-12">
        {staticBackdrop}
        {content}
      </section>
    );
  }

  if (isMobile === false) {
    return (
      <section className="archive-3d-hero relative flex min-h-[24rem] items-center justify-center overflow-hidden py-10 sm:py-12">
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
            <ambientLight intensity={0.2} />
            <GalaxyParticles />
          </Canvas>
        </div>
        {content}
      </section>
    );
  }

  // During SSR / hydration measurement, render a static placeholder so the
  // WebGL canvas is never mounted for viewports that will resolve as mobile.
  return (
    <section className="archive-3d-hero relative flex min-h-[24rem] items-center justify-center overflow-hidden py-10 sm:py-12">
      {staticBackdrop}
      {content}
    </section>
  );
}
