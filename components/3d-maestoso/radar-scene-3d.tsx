"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type RadarSignal = {
  name: string;
  color: string;
  angle: number;
  distance: number;
  status: "hot" | "trending" | "new" | "rising";
};

/* ─── Radar grid ─── */
function RadarGrid({ rings = 4, segments = 64 }: { rings?: number; segments?: number }) {
  const lines = useMemo(() => {
    const pts: number[] = [];
    for (let r = 1; r <= rings; r++) {
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(r * Math.cos(a), r * Math.sin(a), 0);
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pts.push(0, 0, 0, rings * Math.cos(a), rings * Math.sin(a), 0);
    }
    return new Float32Array(pts);
  }, [rings, segments]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[lines, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#7C4DFF" transparent opacity={0.25} />
    </lineSegments>
  );
}

/* ─── Sweep beam ─── */
function SweepBeam() {
  const beamRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z -= delta * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={beamRef} rotation={[0, 0, 0]} position={[2, 0, 0]}>
        <planeGeometry args={[4, 0.15]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <planeGeometry args={[4, 0.4]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─── Signal node (illuminated by sweep) ─── */
function SignalNode({
  signal,
  timeOffset,
  isMobile = false,
}: {
  signal: RadarSignal;
  timeOffset: number;
  isMobile?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);

  const x = signal.distance * Math.cos(signal.angle);
  const y = signal.distance * Math.sin(signal.angle);

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = clock.getElapsedTime() + timeOffset;

    // Fluttuazione
    const floatY = Math.sin(t * 1.5) * 0.15;
    meshRef.current.position.y = y + floatY;
    glowRef.current.position.y = y + floatY;
    if (labelRef.current) labelRef.current.position.y = y + floatY;

    // Illuminazione sweep: quando il fascio passa vicino, scala e illumina
    const sweepAngle = -t * 0.8; // stessa rotazione del sweep
    const angleDiff = ((sweepAngle - signal.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const hit = angleDiff < 0.4 || angleDiff > Math.PI * 2 - 0.4;

    const targetScale = hit ? 1.4 : 1.0;
    const targetEmissive = hit ? 1.2 : 0.4;
    const targetGlow = hit ? 0.4 : 0.15;

    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = THREE.MathUtils.lerp(
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity,
      targetEmissive,
      0.1
    );
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity,
      targetGlow,
      0.1
    );
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh ref={glowRef} position={[0, y, 0]}>
        <sphereGeometry args={[0.35, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
        <meshBasicMaterial
          color={signal.color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={meshRef} position={[0, y, 0]}>
        <sphereGeometry args={[0.15, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
        <meshStandardMaterial
          color={signal.color}
          emissive={signal.color}
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

/* ─── Center hub ─── */
function CenterHub() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.getElapsedTime() * 0.5;
  });
  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
      <meshStandardMaterial
        color="#00E5FF"
        emissive="#00E5FF"
        emissiveIntensity={0.6}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

/* ─── Scene ─── */
export function RadarScene({ signals, isMobile = false }: { signals: RadarSignal[]; isMobile?: boolean }) {
  const radarParticles = useMemo(() => {
    const count = isMobile ? 80 : 200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 3.5;
      pos[i * 3] = r * Math.cos(a);
      pos[i * 3 + 1] = r * Math.sin(a);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return pos;
  }, [isMobile]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 8]} intensity={0.6} color="#7C4DFF" />
      <pointLight position={[0, 0, -4]} intensity={0.3} color="#00E5FF" />

      <RadarGrid rings={isMobile ? 3 : 4} segments={isMobile ? 32 : 64} />
      <SweepBeam />
      <CenterHub />

      {signals.map((s, i) => (
        <SignalNode key={s.name} signal={s} timeOffset={i * 0.5} isMobile={isMobile} />
      ))}

      {/* Particelle radar */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[radarParticles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#00E5FF"
          size={0.02}
          transparent
          opacity={0.4}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

/* ─── Wrapped Canvas ─── */
export function RadarScene3D({
  signals,
  className = "",
  style,
  isMobile,
}: {
  signals: RadarSignal[];
  className?: string;
  style?: React.CSSProperties;
  isMobile?: boolean;
}) {
  const isMobileDetected = isMobile ?? (typeof window !== 'undefined' && window.innerWidth < 768);
  return (
    <div className={`${className}`} style={{ position: "absolute", inset: 0, ...style }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={isMobileDetected ? 1 : [1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <RadarScene signals={signals} isMobile={isMobileDetected} />
      </Canvas>
    </div>
  );
}
