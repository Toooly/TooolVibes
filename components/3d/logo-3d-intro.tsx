"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, TorusKnot } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";

function Ribbon({
  color,
  radius,
  speed,
  offset,
}: {
  color: string;
  radius: number;
  speed: number;
  offset: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.3;
    ref.current.rotation.y = t;
    ref.current.rotation.z = Math.cos(t * 0.3) * 0.2;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.04, 12, 80]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.8}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function LogoScene() {
  const knotRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!knotRef.current) return;
    knotRef.current.rotation.x = clock.getElapsedTime() * 0.15;
    knotRef.current.rotation.y = clock.getElapsedTime() * 0.25;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} color="#6a3cff" intensity={80} />
      <pointLight position={[-4, -2, 4]} color="#39d2f6" intensity={60} />
      <pointLight position={[0, -4, -2]} color="#f3bf4c" intensity={40} />

      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
        <TorusKnot
          ref={knotRef}
          args={[1.2, 0.35, 128, 32]}
          scale={1.6}
        >
          <MeshDistortMaterial
            color="#6a3cff"
            emissive="#39d2f6"
            emissiveIntensity={0.25}
            roughness={0.15}
            metalness={0.7}
            distort={0.25}
            speed={1.2}
          />
        </TorusKnot>
      </Float>

      <Ribbon color="#39d2f6" radius={2.0} speed={0.6} offset={0} />
      <Ribbon color="#f3bf4c" radius={2.3} speed={-0.5} offset={Math.PI} />

      <EffectComposer>
        <Bloom
          intensity={0.4}
          threshold={0.85}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function Logo3DIntro() {
  return (
    <div className="brand-intro__logo-stage">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <LogoScene />
      </Canvas>
    </div>
  );
}
