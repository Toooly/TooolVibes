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

/* ─── Sonar dotted grid ─── */
function SonarGrid({ rings = 4, spokes = 8, isMobile = false }: { rings?: number; spokes?: number; isMobile?: boolean }) {
  const gridPoints = useMemo(() => {
    const pts: number[] = [];
    const segments = isMobile ? 48 : 96;
    // Concentric dotted rings
    for (let r = 1; r <= rings; r++) {
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(r * Math.cos(a), r * Math.sin(a), 0);
      }
    }
    // Radial dotted spokes
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      for (let j = 1; j <= rings * 8; j++) {
        const t = j / (rings * 8);
        pts.push(rings * t * Math.cos(a), rings * t * Math.sin(a), 0);
      }
    }
    return new Float32Array(pts);
  }, [rings, spokes, isMobile]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[gridPoints, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#00E5FF"
        size={isMobile ? 0.025 : 0.018}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Sonar sweep — circular wedge using RingGeometry ─── */
function SonarSweep({ color = "#00E5FF", speed = 0.8, beamWidth = 0.35, opacity = 0.35, echoDelay = 0 }: {
  color?: string;
  speed?: number;
  beamWidth?: number;
  opacity?: number;
  echoDelay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() * speed - echoDelay * speed;
      meshRef.current.rotation.z = -t;
    }
    if (glowRef.current) {
      const t = clock.getElapsedTime() * speed - echoDelay * speed;
      glowRef.current.rotation.z = -t;
    }
  });

  return (
    <group>
      {/* Main sweep wedge */}
      <mesh ref={meshRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0, 4, 48, 1, 0, beamWidth]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Glow behind sweep */}
      <mesh ref={glowRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0, 4.2, 48, 1, 0, beamWidth * 1.5]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.3}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─── Signal ping — synchronized with sweep pass ─── */
function SignalPing({ angle, color, isMobile = false }: {
  angle: number;
  color: string;
  isMobile?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !ringRef.current) return;
    const t = clock.getElapsedTime();

    // Calculate time since sweep last hit this signal
    // Sweep angle = (t * 0.8) mod (2π)
    // Hit when sweep angle = signal angle (mod 2π)
    const phase = ((t * 0.8 - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const timeSinceHit = phase / 0.8;
    const duration = 2.0;

    if (timeSinceHit > duration) {
      meshRef.current.visible = false;
      ringRef.current.visible = false;
      return;
    }

    const progress = timeSinceHit / duration;
    const scale = progress * 2.5;
    meshRef.current.scale.set(scale, scale, 1);
    ringRef.current.scale.set(scale * 1.3, scale * 1.3, 1);

    const fade = 1.0 - progress;
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.5;
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.25;

    meshRef.current.visible = true;
    ringRef.current.visible = true;
  });

  return (
    <group position={[0, 0, 0.02]}>
      <mesh ref={meshRef} visible={false} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.05, 0.2, isMobile ? 16 : 32, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ringRef} visible={false} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.2, 0.3, isMobile ? 16 : 32, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─── Signal node — illuminated by sweep with ping ─── */
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

  const x = signal.distance * Math.cos(signal.angle);
  const y = signal.distance * Math.sin(signal.angle);

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = clock.getElapsedTime() + timeOffset;

    // Fluttuazione
    const floatY = Math.sin(t * 1.5) * 0.15;
    meshRef.current.position.y = y + floatY;
    glowRef.current.position.y = y + floatY;

    // Illuminazione sweep: quando il fascio passa vicino, scala e illumina
    const sweepAngle = (t * 0.8) % (Math.PI * 2);
    let angleDiff = sweepAngle - signal.angle;
    while (angleDiff < 0) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI * 2) angleDiff -= Math.PI * 2;
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

    const hit = angleDiff < 0.4;

    const targetScale = hit ? 1.6 : 1.0;
    const targetEmissive = hit ? 1.5 : 0.4;
    const targetGlow = hit ? 0.5 : 0.15;

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
      {/* Ping effect synchronized with sweep */}
      <SignalPing angle={signal.angle} color={signal.color} isMobile={isMobile} />

      {/* Outer glow */}
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

      {/* Core sphere */}
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

/* ─── Center hub — sonar style with rotating rings ─── */
function SonarCenter() {
  const hubRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (hubRef.current) hubRef.current.rotation.z = clock.getElapsedTime() * 0.5;
    if (ring1Ref.current) ring1Ref.current.rotation.z = -clock.getElapsedTime() * 0.3;
    if (ring2Ref.current) ring2Ref.current.rotation.z = clock.getElapsedTime() * 0.2;
  });

  return (
    <group>
      {/* Core hub */}
      <mesh ref={hubRef}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 32]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Inner ring */}
      <mesh ref={ring1Ref} position={[0, 0, 0.01]}>
        <ringGeometry args={[0.3, 0.32, 32]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Outer ring */}
      <mesh ref={ring2Ref} position={[0, 0, 0.01]}>
        <ringGeometry args={[0.38, 0.4, 32]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─── Sonar background particles ─── */
function SonarParticles({ isMobile = false }: { isMobile?: boolean }) {
  const particles = useMemo(() => {
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
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} />
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
  );
}

/* ─── Scene ─── */
export function RadarScene({ signals, isMobile = false }: { signals: RadarSignal[]; isMobile?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 8]} intensity={0.4} color="#00E5FF" />
      <pointLight position={[0, 0, -4]} intensity={0.2} color="#7C4DFF" />

      {/* Sonar grid */}
      <SonarGrid rings={isMobile ? 3 : 4} spokes={8} isMobile={isMobile} />

      {/* Sweep with echo */}
      <SonarSweep color="#00E5FF" speed={0.8} beamWidth={0.35} opacity={0.35} />
      <SonarSweep color="#00E5FF" speed={0.8} beamWidth={0.25} opacity={0.15} echoDelay={0.15} />
      <SonarSweep color="#00E5FF" speed={0.8} beamWidth={0.15} opacity={0.08} echoDelay={0.3} />

      {/* Center hub */}
      <SonarCenter />

      {/* Signal nodes */}
      {signals.map((s, i) => (
        <SignalNode key={s.name} signal={s} timeOffset={i * 0.5} isMobile={isMobile} />
      ))}

      {/* Background particles */}
      <SonarParticles isMobile={isMobile} />
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
