"use client";

import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePathname } from "next/navigation";
import { useMounted } from "@/lib/hooks/use-mounted";

// ── Performance & Motion Preferences ──
function getPerformanceProfile() {
  if (typeof window === "undefined") return { dpr: 1 as const, particles: 0, planets: 0, enabled: false, reduced: false };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveData = (navigator as any).connection?.saveData === true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memory = (navigator as any).deviceMemory;
  const lowEnd = isMobile || saveData || (memory && memory < 4);

  if (reduced) {
    return { dpr: 1 as const, particles: 200, planets: 3, enabled: true, reduced: true };
  }
  if (lowEnd) {
    return { dpr: 1 as const, particles: 200, planets: 3, enabled: true, reduced: true };
  }
  return { dpr: Math.min(1.5, window.devicePixelRatio) as 1 | 1.5, particles: 250, planets: 3, enabled: true, reduced: false };
}

// ── Shared scroll state (module-level) ──
const scrollState = { scrollY: 0, scrollProgress: 0, velocity: 0, maxScroll: 1 };

function useScrollTracker(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let lastY = window.scrollY;
    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollState.scrollY = y;
        scrollState.scrollProgress = Math.min(1, Math.max(0, y / max));
        scrollState.velocity = (y - lastY) * 0.05;
        scrollState.maxScroll = max;
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);
}

// ── Black Hole: central dark sphere + glowing accretion rings ──
function BlackHole({ scrollRef, reduced }: { scrollRef: React.MutableRefObject<typeof scrollState>; reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const fadeRef = useRef(0);

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    const s = scrollRef.current;
    if (ringsRef.current) {
      ringsRef.current.rotation.z = t * 0.025 + s.scrollProgress * 0.15;
      ringsRef.current.rotation.x = Math.sin(t * 0.04) * 0.1;
    }
    if (groupRef.current) {
      // Very subtle parallax: black hole stays mostly centered but shifts slightly
      const targetY = -1.2 + s.scrollProgress * -1.0;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.03);
      // Gentle fade-in over first ~2s
      fadeRef.current = THREE.MathUtils.lerp(fadeRef.current, 1, 0.015);
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = Math.min(1, fadeRef.current) * (child.userData.baseOpacity ?? 1);
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.2, -18]}>
      <pointLight color="#6a3cff" intensity={1.4} distance={30} position={[0, 0, 2]} />
      <pointLight color="#39d2f6" intensity={0.45} distance={20} position={[3, -2, 4]} />

      {/* Event horizon — smaller and less harsh */}
      <mesh>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial color="#0a0618" />
      </mesh>

      {/* Inner glow shell (subtle) */}
      <mesh>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial color="#6a3cff" transparent opacity={0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <group ref={ringsRef} rotation={[Math.PI / 2.2, 0, 0]}>
        {/* Main accretion disk — thinner and more transparent */}
        <mesh userData={{ baseOpacity: 0.22 }}>
          <torusGeometry args={[3.2, 0.035, 8, 64]} />
          <meshBasicMaterial color="#6a3cff" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh userData={{ baseOpacity: 0.14 }}>
          <torusGeometry args={[3.9, 0.025, 8, 64]} />
          <meshBasicMaterial color="#39d2f6" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh userData={{ baseOpacity: 0.08 }}>
          <torusGeometry args={[4.6, 0.018, 8, 64]} />
          <meshBasicMaterial color="#f3bf4c" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

// ── Orbiting Planets ──
const PLANET_CONFIG = [
  { radius: 0.45, orbitRadius: 7, orbitSpeed: 0.12, color: "#6a3cff", emissive: "#3a1f99", yOffset: 1.2 },
  { radius: 0.35, orbitRadius: 9.5, orbitSpeed: 0.08, color: "#39d2f6", emissive: "#15607a", yOffset: -0.8 },
  { radius: 0.55, orbitRadius: 12, orbitSpeed: 0.05, color: "#f3bf4c", emissive: "#8a6a1c", yOffset: 0.4 },
  { radius: 0.3, orbitRadius: 5.5, orbitSpeed: 0.18, color: "#8b6cff", emissive: "#4a2fa8", yOffset: -1.5 },
  { radius: 0.4, orbitRadius: 14, orbitSpeed: 0.04, color: "#2bb9de", emissive: "#0d3d4d", yOffset: 2.0 },
];

function Planets({ scrollRef, count, reduced }: { scrollRef: React.MutableRefObject<typeof scrollState>; count: number; reduced: boolean }) {
  const planetRefs = useRef<THREE.Mesh[]>([]);
  const groupRefs = useRef<THREE.Group[]>([]);
  const configs = useMemo(() => PLANET_CONFIG.slice(0, count), [count]);

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    const s = scrollRef.current;
    configs.forEach((cfg, i) => {
      const group = groupRefs.current[i];
      const mesh = planetRefs.current[i];
      if (!group || !mesh) return;
      const angle = t * cfg.orbitSpeed + i * 1.5;
      const x = Math.cos(angle) * cfg.orbitRadius;
      const z = Math.sin(angle) * cfg.orbitRadius - 10;
      // Scroll parallax: each planet shifts slightly at different rate
      const parallaxY = cfg.yOffset + s.scrollProgress * (1 + i * 0.4) * -1.2;
      group.position.x = THREE.MathUtils.lerp(group.position.x, x, 0.04);
      group.position.y = THREE.MathUtils.lerp(group.position.y, parallaxY, 0.04);
      group.position.z = THREE.MathUtils.lerp(group.position.z, z, 0.04);
      mesh.rotation.y += 0.003;
    });
  });

  return (
    <>
      {configs.map((cfg, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) groupRefs.current[i] = el;
          }}
        >
          <mesh
            ref={(el) => {
              if (el) planetRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[cfg.radius, 16, 16]} />
            <meshStandardMaterial
              color={cfg.color}
              emissive={cfg.emissive}
              emissiveIntensity={0.25}
              roughness={0.4}
              metalness={0.7}
            />
          </mesh>
          {/* Subtle planet glow */}
          <mesh scale={1.4}>
            <sphereGeometry args={[cfg.radius, 16, 16]} />
            <meshBasicMaterial color={cfg.color} transparent opacity={0.04} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ── Starfield ──
function Starfield({ count, reduced }: { count: number; reduced: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) - 15;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (reduced || !pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#ffffff"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ── Scroll Camera ──
function ScrollCamera({ scrollRef, reduced }: { scrollRef: React.MutableRefObject<typeof scrollState>; reduced: boolean }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 10));

  useFrame(() => {
    if (reduced) return;
    const s = scrollRef.current;
    // Very subtle parallax: slight Y shift and tiny Z zoom
    targetPos.current.set(
      Math.sin(s.scrollProgress * Math.PI) * 0.8,
      s.scrollProgress * -1.2,
      10 - s.scrollProgress * 1.5
    );
    camera.position.lerp(targetPos.current, 0.03);
    camera.lookAt(0, s.scrollProgress * -0.5, 0);
  });

  return null;
}

// ── Visibility Pauser ──
function VisibilityPauser() {
  const { invalidate } = useThree();
  useEffect(() => {
    const onVis = () => {
      invalidate();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [invalidate]);
  return null;
}

// ── Scene Composer ──
function Scene({ scrollRef, profile }: { scrollRef: React.MutableRefObject<typeof scrollState>; profile: ReturnType<typeof getPerformanceProfile> }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isSpatialUiRoute = pathname === "/" || pathname?.startsWith("/archivio");

  if (isAdmin) {
    return (
      <>
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 0, -8]} color="#6a3cff" intensity={1.2} />
        <Starfield count={Math.min(400, profile.particles)} reduced={profile.reduced} />
        <BlackHole scrollRef={scrollRef} reduced={profile.reduced} />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.12} />
      <ScrollCamera scrollRef={scrollRef} reduced={profile.reduced} />
      {!isSpatialUiRoute && <BlackHole scrollRef={scrollRef} reduced={profile.reduced} />}
      <Planets scrollRef={scrollRef} count={profile.planets} reduced={profile.reduced} />
      <Starfield count={profile.particles} reduced={profile.reduced} />
      <VisibilityPauser />
    </>
  );
}

// ── Main Export ──
export function SiteUniverseBackground() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const mounted = useMounted();
  const scrollRef = useRef(scrollState);
  const profile = useMemo(() => getPerformanceProfile(), []);

  useScrollTracker(!isAdmin && profile.enabled && !profile.reduced);

  const bgStyle = isAdmin
    ? "radial-gradient(circle at 50% 50%, #0d0823 0%, #050313 100%)"
    : "radial-gradient(circle at 50% 45%, #ede9fe 0%, #f7f5ff 55%, #f7f5ff 100%)";

  if (!profile.enabled || !mounted) {
    return (
      <div
        className="fixed inset-0 z-0"
        style={{ background: bgStyle, pointerEvents: "none" }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ background: bgStyle, pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55, near: 0.1, far: 100 }}
        gl={{
          antialias: window.innerWidth >= 1024,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={profile.dpr}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        frameloop={profile.reduced ? "demand" : "always"}
      >
        <Suspense fallback={null}>
          <Scene scrollRef={scrollRef} profile={profile} />
        </Suspense>
      </Canvas>

      {/* Subtle bottom vignette for content readability */}
      <div
        className="absolute inset-0"
        style={{
          background: isAdmin
            ? "linear-gradient(180deg, transparent 0%, transparent 60%, rgba(5,3,19,0.7) 100%)"
            : "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(247,245,255,0.6) 90%, rgba(247,245,255,0.95) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
