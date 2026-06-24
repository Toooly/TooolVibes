"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, SpotLight } from "@react-three/drei";
import * as THREE from "three";

import { ArenaFighter, type FighterState } from "./arena-fighter";

/* ═══════════════════════════════════════════════════════════════
   Arena Stage Floor
   ═══════════════════════════════════════════════════════════════ */
function ArenaFloor() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (gridRef.current) {
      gridRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.02;
    }
  });

  return (
    <group ref={gridRef}>
      {/* Main circular platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <cylinderGeometry args={[4, 4.2, 0.3, 32]} />
        <meshStandardMaterial
          color="#0d0d1a"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {/* Ring glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]}>
        <ringGeometry args={[3.9, 4.1, 64]} />
        <meshBasicMaterial color="#7C4DFF" transparent opacity={0.5} />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]}>
        <ringGeometry args={[2.8, 2.9, 64]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.25} />
      </mesh>
      {/* Grid lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={`grid-${i}`}
            rotation={[-Math.PI / 2, angle, 0]}
            position={[
              Math.cos(angle) * 2,
              -0.33,
              Math.sin(angle) * 2,
            ]}
            scale={[0.005, 2, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              color="#7C4DFF"
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
      {/* Concentric circles */}
      {[1.5, 2.2, 3.0].map((radius, i) => (
        <mesh
          key={`circle-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.33, 0]}
        >
          <ringGeometry args={[radius - 0.01, radius + 0.01, 64]} />
          <meshBasicMaterial
            color={i === 1 ? "#00E5FF" : "#7C4DFF"}
            transparent
            opacity={0.12}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Floating Particles / Sparks
   ═══════════════════════════════════════════════════════════════ */
function ArenaParticles({ count = 30 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * 8,
      y: Math.random() * 4 + 0.5,
      z: (Math.random() - 0.5) * 8,
      speed: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      size: Math.random() * 0.06 + 0.02,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.5,
        p.y + Math.sin(t * p.speed * 1.5 + p.phase) * 0.3,
        p.z + Math.cos(t * p.speed + p.phase) * 0.5
      );
      dummy.scale.setScalar(p.size + Math.sin(t * 2 + p.phase) * 0.01);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#00E5FF" transparent opacity={0.6} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Impact Flash Effect
   ═══════════════════════════════════════════════════════════════ */
function ImpactFlash({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!meshRef.current || !lightRef.current) return;
    if (active) {
      meshRef.current.visible = true;
      lightRef.current.intensity = 8 + Math.random() * 4;
      meshRef.current.scale.setScalar(1 + Math.random() * 0.5);
    } else {
      meshRef.current.visible = false;
      lightRef.current.intensity = 0;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0.8, 0]} visible={false}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 1, 0]}
        color="#ffffff"
        intensity={0}
        distance={6}
        decay={2}
      />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Arena Scene Props
   ═══════════════════════════════════════════════════════════════ */
type ArenaScene3DProps = {
  fighterA: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    state: FighterState;
    isWinner?: boolean;
    isDefeated?: boolean;
  };
  fighterB: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    state: FighterState;
    isWinner?: boolean;
    isDefeated?: boolean;
  };
  impactFlash?: boolean;
};

function ArenaSceneContent({ fighterA, fighterB, impactFlash = false }: ArenaScene3DProps) {
  return (
    <>
      {/* Background */}
      <color attach="background" args={["#06060E"]} />
      <fog attach="fog" args={["#06060E", 8, 20]} />

      {/* Stars */}
      <Stars radius={15} depth={30} count={500} factor={2} saturation={0.2} fade speed={0.5} />

      {/* Lights */}
      <ambientLight intensity={0.3} color="#7C4DFF" />
      <SpotLight
        position={[0, 8, 2]}
        angle={0.5}
        penumbra={0.8}
        intensity={40}
        color="#7C4DFF"
        castShadow
        shadow-bias={-0.0001}
      />
      <SpotLight
        position={[-3, 5, -2]}
        angle={0.6}
        penumbra={0.7}
        intensity={20}
        color="#00E5FF"
      />
      <SpotLight
        position={[3, 5, -2]}
        angle={0.6}
        penumbra={0.7}
        intensity={20}
        color="#B388FF"
      />
      <pointLight position={[0, 2, 0]} color="#ffffff" intensity={3} distance={8} />

      {/* Floor */}
      <ArenaFloor />

      {/* Particles */}
      <ArenaParticles count={25} />

      {/* Impact flash */}
      <ImpactFlash active={impactFlash} />

      {/* Fighter A - Left */}
      <ArenaFighter
        position={[-2, 0, 0]}
        rotation={[0, Math.PI * 0.3, 0]}
        primaryColor={fighterA.primaryColor}
        secondaryColor={fighterA.secondaryColor}
        state={fighterA.state}
        isWinner={fighterA.isWinner}
        isDefeated={fighterA.isDefeated}
        side="left"
      />

      {/* Fighter B - Right */}
      <ArenaFighter
        position={[2, 0, 0]}
        rotation={[0, -Math.PI * 0.3, 0]}
        primaryColor={fighterB.primaryColor}
        secondaryColor={fighterB.secondaryColor}
        state={fighterB.state}
        isWinner={fighterB.isWinner}
        isDefeated={fighterB.isDefeated}
        side="right"
      />

      {/* Camera orbit controls (subtle) */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.55}
        minAzimuthAngle={-Math.PI * 0.25}
        maxAzimuthAngle={Math.PI * 0.25}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Exported Arena Canvas
   ═══════════════════════════════════════════════════════════════ */
export function ArenaScene3D({ fighterA, fighterB, impactFlash }: ArenaScene3DProps) {
  return (
    <div className="arena-3d-scene">
      <Canvas
        camera={{ position: [0, 2.5, 5], fov: 50, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <ArenaSceneContent
          fighterA={fighterA}
          fighterB={fighterB}
          impactFlash={impactFlash}
        />
      </Canvas>
    </div>
  );
}
