"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef as useThreeRef, useMemo } from "react";
import * as THREE from "three";
import { X } from "lucide-react";
import { SOUND_PLAY_EVENT, type TooolvibesSoundKind } from "@/lib/config/sound";

const INTRO_DURATION_MS = 4000;
const INTRO_EXIT_MS = 800;
const HAS_SEEN_INTRO_KEY = "tooolvibes:intro-3d-v1";

function dispatchSound(kind: TooolvibesSoundKind) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind } })
  );
}

function IntroScene() {
  const groupRef = useThreeRef<THREE.Group>(null);
  const particlesRef = useThreeRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const pos = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 3 + Math.random() * 4;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.15;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#7C4DFF" />
      <pointLight position={[-5, -3, 5]} intensity={0.5} color="#00E5FF" />
      <pointLight position={[0, 5, -5]} intensity={0.3} color="#FF4081" />

      {/* Icosahedron core */}
      <mesh>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial
          color="#7C4DFF"
          emissive="#7C4DFF"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
          wireframe
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.35, 2]} />
        <meshStandardMaterial
          color="#7C4DFF"
          emissive="#7C4DFF"
          emissiveIntensity={0.3}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Rings */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[2.2, 0.02, 16, 100]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.8, 0.015, 16, 100]} />
        <meshBasicMaterial color="#FF4081" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[3.4, 0.01, 16, 100]} />
        <meshBasicMaterial color="#7C4DFF" transparent opacity={0.2} />
      </mesh>

      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#B388FF"
          size={0.025}
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export function IntroCinematic3D({ onComplete }: { onComplete?: (skipped: boolean) => void }) {
  const [phase, setPhase] = useState<"entering" | "playing" | "leaving" | "unmounted">("entering");
  const [shouldRender, setShouldRender] = useState(false);
  const hasFinished = useRef(false);

  const finishIntro = useCallback(
    (skipped = false) => {
      if (hasFinished.current) return;
      hasFinished.current = true;
      try {
        sessionStorage.setItem(HAS_SEEN_INTRO_KEY, "true");
      } catch {}
      setPhase("leaving");
      setTimeout(() => {
        setPhase("unmounted");
        setShouldRender(false);
        onComplete?.(skipped);
      }, INTRO_EXIT_MS);
    },
    [onComplete]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const played = sessionStorage.getItem(HAS_SEEN_INTRO_KEY) === "true";
    const forced = new URLSearchParams(window.location.search).get("intro") === "1";

    if (reduced || (played && !forced)) {
      setShouldRender(false);
      setPhase("unmounted");
      onComplete?.(true);
      return;
    }

    hasFinished.current = false;
    setPhase("entering");
    setShouldRender(true);

    const timers: number[] = [];
    timers.push(window.setTimeout(() => dispatchSound("introOpen"), 200));
    timers.push(window.setTimeout(() => dispatchSound("reveal"), 600));
    timers.push(window.setTimeout(() => setPhase("playing"), 500));
    timers.push(window.setTimeout(() => dispatchSound("introClose"), INTRO_DURATION_MS - 500));
    timers.push(window.setTimeout(() => finishIntro(false), INTRO_DURATION_MS));
    timers.push(
      window.setTimeout(() => {
        if (!hasFinished.current) finishIntro(true);
      }, INTRO_DURATION_MS + 2000)
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [finishIntro, onComplete]);

  if (!shouldRender || phase === "unmounted") return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "var(--v-void)" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onPointerDown={() => finishIntro(true)}
      >
          <button
            className="absolute right-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.8)] text-[#F0EFFF] transition-colors hover:border-[rgba(124,77,255,0.4)]"
            onClick={() => finishIntro(true)}
            aria-label="Salta introduzione"
            type="button"
          >
            <X size={20} />
          </button>

          <div className="absolute inset-0">
            <Canvas
              camera={{ position: [0, 0, 7], fov: 50 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true }}
              style={{ background: "transparent" }}
            >
              <IntroScene />
            </Canvas>
          </div>

          <div className="relative z-10 text-center px-4">
            <motion.p
              className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#B388FF]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Welcome in
            </motion.p>
            <motion.h1
              className="v-text-gradient-purple text-5xl font-bold sm:text-6xl md:text-7xl"
              initial={{ opacity: 0, scale: 1.2, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              TooolVibes
            </motion.h1>
            <motion.p
              className="mt-4 text-lg text-[#9E99B8]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              Scopri. Confronta. Vibra.
            </motion.p>
          </div>
        </motion.div>
    </AnimatePresence>
  );
}
