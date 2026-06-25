"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";

export type RadarSignal = {
  name: string;
  color: string;
  angle: number;
  distance: number;
  status: "hot" | "trending" | "new" | "rising";
};

/* ─── Deep sonar disc ─── */
function SonarDisc({ isMobile = false }: { isMobile?: boolean }) {
  const outerRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (outerRef.current) {
      const t = clock.getElapsedTime();
      const pulse = Math.sin(t * 1.5) * 0.02 + 1;
      outerRef.current.scale.set(pulse, pulse, 1);
    }
  });
  const r = isMobile ? 3.2 : 4.2;
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[r, 64]} />
        <meshBasicMaterial color="#06060E" transparent opacity={0.95} />
      </mesh>
      <mesh ref={outerRef} position={[0, 0, -0.01]}>
        <ringGeometry args={[r - 0.02, r, 64]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─── Sonar dotted grid with depth rings ─── */
function SonarGrid({ rings = 5, spokes = 12, isMobile = false }: { rings?: number; spokes?: number; isMobile?: boolean }) {
  const { gridPoints, ringPoints } = useMemo(() => {
    const pts: number[] = [];
    const ringPts: number[] = [];
    const segments = isMobile ? 64 : 128;
    for (let r = 1; r <= rings; r++) {
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        ringPts.push(r * Math.cos(a), r * Math.sin(a), 0);
      }
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * Math.PI * 2;
        for (let j = 1; j <= rings * 8; j++) {
          const t = j / (rings * 8);
          pts.push(rings * t * Math.cos(a), rings * t * Math.sin(a), 0);
        }
      }
    }
    return { gridPoints: new Float32Array(pts), ringPoints: new Float32Array(ringPts) };
  }, [rings, spokes, isMobile]);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gridPoints, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#00E5FF"
          size={isMobile ? 0.02 : 0.015}
          transparent
          opacity={0.25}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ringPoints, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#7C4DFF"
          size={isMobile ? 0.03 : 0.022}
          transparent
          opacity={0.2}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* ─── Sonar sweep — circular wedge with trail echoes ─── */
function SonarSweep({ color = "#00E5FF", speed = 0.6, beamWidth = 0.45, opacity = 0.45, echoDelay = 0 }: {
  color?: string;
  speed?: number;
  beamWidth?: number;
  opacity?: number;
  echoDelay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed - echoDelay * speed;
    if (meshRef.current) meshRef.current.rotation.z = -t;
    if (glowRef.current) glowRef.current.rotation.z = -t;
    if (trailRef.current) trailRef.current.rotation.z = -t + 0.08;
  });

  return (
    <group>
      <mesh ref={meshRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.1, 4.2, 64, 1, 0, beamWidth]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={glowRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0, 4.4, 64, 1, 0, beamWidth * 1.4]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.25}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={trailRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0, 4.3, 64, 1, 0, beamWidth * 0.6]} />
        <meshBasicMaterial
          color="#7C4DFF"
          transparent
          opacity={opacity * 0.12}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─── Contact ping ring — synchronized with sweep pass ─── */
function ContactPing({ angle, color, isMobile = false }: {
  angle: number;
  color: string;
  isMobile?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !ringRef.current) return;
    const t = clock.getElapsedTime();
    const phase = ((t * 0.6 - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const timeSinceHit = phase / 0.6;
    const duration = 1.8;

    if (timeSinceHit > duration) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const progress = timeSinceHit / duration;
    const scale = 1 + progress * 2.5;
    ringRef.current.scale.set(scale, scale, 1);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.4;
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={ringRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.12, 0.35, isMobile ? 20 : 40, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─── Signal node — illuminated by sweep with label ─── */
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
  const labelRef = useRef<HTMLDivElement>(null);

  const x = signal.distance * Math.cos(signal.angle);
  const y = signal.distance * Math.sin(signal.angle);

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = clock.getElapsedTime() + timeOffset;

    // Float
    const floatY = Math.sin(t * 1.2) * 0.12;
    meshRef.current.position.y = y + floatY;
    glowRef.current.position.y = y + floatY;

    // Sweep hit
    const sweepAngle = (t * 0.6) % (Math.PI * 2);
    let angleDiff = sweepAngle - signal.angle;
    while (angleDiff < 0) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI * 2) angleDiff -= Math.PI * 2;
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

    const hit = angleDiff < 0.5;

    const targetScale = hit ? 1.5 : 1.0;
    const targetEmissive = hit ? 2.0 : 0.35;
    const targetGlow = hit ? 0.6 : 0.12;

    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = THREE.MathUtils.lerp(
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity,
      targetEmissive,
      0.08
    );
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity,
      targetGlow,
      0.08
    );

    // Label brightness
    if (labelRef.current) {
      labelRef.current.style.opacity = hit ? "1" : "0.75";
      labelRef.current.style.filter = hit ? `drop-shadow(0 0 6px ${signal.color})` : "none";
      labelRef.current.style.transform = `translate(-50%, -50%) translateY(${hit ? -2 : 0}px)`;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <ContactPing angle={signal.angle} color={signal.color} isMobile={isMobile} />

      <mesh ref={glowRef} position={[0, y, 0]}>
        <sphereGeometry args={[isMobile ? 0.3 : 0.28, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
        <meshBasicMaterial
          color={signal.color}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={meshRef} position={[0, y, 0]}>
        <sphereGeometry args={[isMobile ? 0.14 : 0.12, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
        <meshStandardMaterial
          color={signal.color}
          emissive={signal.color}
          emissiveIntensity={0.35}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      <Html
        position={[0, y + (isMobile ? 0.55 : 0.5), 0]}
        center
        distanceFactor={6}
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={labelRef}
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: isMobile ? "10px" : "11px",
            fontWeight: 700,
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
            transition: "opacity 0.2s, filter 0.2s, transform 0.2s",
            fontFamily: "Rubik, sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          {signal.name}
        </div>
      </Html>
    </group>
  );
}

/* ─── Center hub — sonar style with rotating rings and ping ─── */
function SonarCenter() {
  const hubRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const pingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (hubRef.current) hubRef.current.rotation.z = t * 0.5;
    if (ring1Ref.current) ring1Ref.current.rotation.z = -t * 0.3;
    if (ring2Ref.current) ring2Ref.current.rotation.z = t * 0.15;
    if (pingRef.current) {
      const ping = (t * 1.2) % 2;
      const scale = ping < 1 ? 1 + ping * 2 : 1;
      const opacity = ping < 1 ? 0.5 * (1 - ping) : 0;
      pingRef.current.scale.set(scale, scale, 1);
      (pingRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  return (
    <group>
      <mesh ref={hubRef}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={1.2}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>
      <mesh ref={ring1Ref} position={[0, 0, 0.015]}>
        <ringGeometry args={[0.28, 0.3, 32]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0, 0.01]}>
        <ringGeometry args={[0.36, 0.38, 32]} />
        <meshBasicMaterial
          color="#7C4DFF"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={pingRef} position={[0, 0, 0.005]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.42, 32]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0}
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
    const count = isMobile ? 60 : 150;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 3.5;
      pos[i * 3] = r * Math.cos(a);
      pos[i * 3 + 1] = r * Math.sin(a);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
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
        size={0.018}
        transparent
        opacity={0.35}
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
      <fog attach="fog" args={["#06060E", 5, 12]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 6]} intensity={0.5} color="#00E5FF" />
      <pointLight position={[0, 0, -3]} intensity={0.2} color="#7C4DFF" />
      <pointLight position={[3, 3, 2]} intensity={0.15} color="#ffffff" />

      <SonarDisc isMobile={isMobile} />
      <SonarGrid rings={isMobile ? 3 : 5} spokes={12} isMobile={isMobile} />

      <SonarSweep color="#00E5FF" speed={0.6} beamWidth={0.45} opacity={0.45} />
      <SonarSweep color="#39d2f6" speed={0.6} beamWidth={0.3} opacity={0.18} echoDelay={0.12} />
      <SonarSweep color="#7C4DFF" speed={0.6} beamWidth={0.18} opacity={0.08} echoDelay={0.25} />

      <SonarCenter />

      {signals.map((s, i) => (
        <SignalNode key={s.name} signal={s} timeOffset={i * 0.5} isMobile={isMobile} />
      ))}

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
        camera={{ position: [0, 0, 7.5], fov: 48 }}
        dpr={isMobileDetected ? 1 : [1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <RadarScene signals={signals} isMobile={isMobileDetected} />
      </Canvas>
    </div>
  );
}
