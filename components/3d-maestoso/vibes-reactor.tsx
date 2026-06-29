"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Shared types ─── */
export type ToolOrb = {
  name: string;
  logo?: string;
  color: string;
  position: [number, number, number];
  speed: number;
};

/* ─── Single particle sphere ─── */
function ParticleSphere({
  count,
  color,
  size,
  spread,
  speed,
}: {
  count: number;
  color: string;
  size: number;
  spread: number;
  speed: number;
}) {
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
    meshRef.current.rotation.y += delta * speed * 0.05;
    meshRef.current.rotation.x += delta * speed * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Floating Orb (tool node) ─── */
function OrbNode({
  tool,
  timeOffset,
}: {
  tool: ToolOrb;
  timeOffset: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = clock.getElapsedTime() + timeOffset;
    const x = tool.position[0] * Math.cos(t * tool.speed);
    const z = tool.position[2] * Math.sin(t * tool.speed);
    const y = tool.position[1] + Math.sin(t * 0.5) * 0.3;
    meshRef.current.position.set(x, y, z);
    glowRef.current.position.set(x, y, z);
    meshRef.current.rotation.y = t * 0.5;
  });

  return (
    <>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial
          color={tool.color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color={tool.color}
          emissive={tool.color}
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </>
  );
}

/* ─── Central Reactor (hero centerpiece) ─── */
function ReactorCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const coreColor = "#4D22C7";
  const coreEmissive = "#2D126F";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
    if (ring1Ref.current) { ring1Ref.current.rotation.x = t * 0.3; ring1Ref.current.rotation.y = t * 0.4; }
    if (ring2Ref.current) { ring2Ref.current.rotation.x = t * 0.5 + 1; ring2Ref.current.rotation.y = t * 0.3 + 0.5; }
    if (ring3Ref.current) { ring3Ref.current.rotation.x = t * 0.2 + 2; ring3Ref.current.rotation.y = t * 0.6 + 1; }
  });

  return (
    <group>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 2]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreEmissive}
          emissiveIntensity={0.55}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Inner wireframe */}
      <mesh>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color="#C4B5FD" transparent opacity={0.18} wireframe />
      </mesh>
      {/* Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.02, 16, 100]} />
        <meshBasicMaterial color="#64FFDA" transparent opacity={0.56} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.3, 0.015, 16, 100]} />
        <meshBasicMaterial color="#FFD166" transparent opacity={0.34} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[2.8, 0.01, 16, 100]} />
        <meshBasicMaterial color="#FF6B9D" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

/* ─── Main Scene ─── */
export function VibesReactorScene({
  orbs,
  isMobile = false,
}: {
  orbs: ToolOrb[];
  isMobile?: boolean;
}) {
  const visibleOrbs = isMobile ? orbs.slice(0, 4) : orbs;
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#7C4DFF" />
      <pointLight position={[-10, -5, 10]} intensity={0.5} color="#00E5FF" />
      <pointLight position={[0, 5, -10]} intensity={0.3} color="#FF4081" />

      <ReactorCore />
      {visibleOrbs.map((orb, i) => (
        <OrbNode key={orb.name} tool={orb} timeOffset={i * 1.5} />
      ))}

      <ParticleSphere count={isMobile ? 120 : 300} color="#7C4DFF" size={0.03} spread={8} speed={1} />
      <ParticleSphere count={isMobile ? 60 : 150} color="#00E5FF" size={0.02} spread={6} speed={0.5} />
      <ParticleSphere count={isMobile ? 40 : 100} color="#FF4081" size={0.015} spread={10} speed={0.3} />
    </>
  );
}

/* ─── Wrapped Canvas ─── */
export function VibesReactor({
  orbs,
  className = "",
  style,
}: {
  orbs: ToolOrb[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return (
    <div className={`${className}`} style={{ position: "absolute", inset: 0, ...style }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <VibesReactorScene orbs={orbs} isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
