"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function MicroScene() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.15;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} color="#6a3cff" intensity={30} />
      <pointLight position={[-2, -2, 2]} color="#39d2f6" intensity={20} />
      <Float speed={1} rotationIntensity={0.15} floatIntensity={0.2}>
        <Icosahedron ref={ref} args={[1, 1]} scale={0.8}>
          <meshStandardMaterial
            color="#6a3cff"
            emissive="#39d2f6"
            emissiveIntensity={0.2}
            roughness={0.2}
            metalness={0.8}
          />
        </Icosahedron>
      </Float>
    </>
  );
}

export function BrandLogo3D({ size = 36 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} aria-hidden="true">
      <Canvas
        dpr={[1, 1]}
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 3.5], fov: 35 }}
        style={{ width: "100%", height: "100%" }}
      >
        <MicroScene />
      </Canvas>
    </div>
  );
}
