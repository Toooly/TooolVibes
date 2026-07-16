"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type FighterState = "idle" | "move" | "combat" | "victory" | "defeat";

type ArenaFighterProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  primaryColor: string;
  secondaryColor: string;
  state: FighterState;
  isWinner?: boolean;
  isDefeated?: boolean;
  side?: "left" | "right";
};

export function ArenaFighter({
  position,
  rotation,
  primaryColor,
  secondaryColor,
  state,
  side = "left",
}: ArenaFighterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const swordRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const animTime = useRef(0);
  const combatFlash = useRef(0);

  const materials = useMemo(() => {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.4,
      metalness: 0.3,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.3,
      metalness: 0.5,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: "#1a1a2e",
      roughness: 0.6,
      metalness: 0.2,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: "#e8d5c4",
      roughness: 0.8,
      metalness: 0,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0,
    });
    const pupilMat = new THREE.MeshStandardMaterial({
      color: "#000000",
      roughness: 0.2,
      metalness: 0,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
    });
    return { bodyMat, accentMat, darkMat, skinMat, eyeMat, pupilMat, glowMat };
  }, [primaryColor, secondaryColor]);

  useFrame((_, delta) => {
    animTime.current += delta;
    const t = animTime.current;
    const g = groupRef.current;
    const body = bodyRef.current;
    const sword = swordRef.current;
    const shield = shieldRef.current;
    const head = headRef.current;
    const lArm = leftArmRef.current;
    const rArm = rightArmRef.current;
    const lLeg = leftLegRef.current;
    const rLeg = rightLegRef.current;

    if (!g || !body || !sword || !shield || !head || !lArm || !rArm || !lLeg || !rLeg) return;

    const s = side === "left" ? 1 : -1;

    switch (state) {
      case "idle": {
        // Breathing bob
        body.position.y = Math.sin(t * 2) * 0.05;
        body.scale.y = 1 + Math.sin(t * 3) * 0.015;
        body.scale.x = 1 + Math.sin(t * 3 + 1) * 0.01;
        body.scale.z = 1 + Math.sin(t * 3 + 2) * 0.01;
        // Subtle rotation
        g.rotation.y = rotation[1] + Math.sin(t * 1.5) * 0.08 * s;
        // Arms sway
        lArm.rotation.x = Math.sin(t * 2.5) * 0.1;
        lArm.rotation.z = Math.sin(t * 2.2) * 0.05 + 0.15 * s;
        rArm.rotation.x = Math.sin(t * 2.5 + 1) * 0.1;
        rArm.rotation.z = Math.sin(t * 2.2 + 1) * 0.05 - 0.15 * s;
        // Sword idle
        sword.rotation.x = Math.sin(t * 2) * 0.05;
        sword.rotation.z = Math.sin(t * 1.8) * 0.03;
        // Shield idle
        shield.rotation.y = Math.sin(t * 1.5) * 0.04;
        // Legs
        lLeg.rotation.x = Math.sin(t * 2) * 0.03;
        rLeg.rotation.x = Math.sin(t * 2 + 1) * 0.03;
        // Head look
        head.rotation.y = Math.sin(t * 1.2) * 0.1 * s;
        head.rotation.x = Math.sin(t * 1.8) * 0.03;
        // Reset glow
        materials.bodyMat.emissive.set("#000000");
        materials.bodyMat.emissiveIntensity = 0;
        materials.glowMat.opacity = 0.6;
        break;
      }
      case "move": {
        // March toward center
        const moveT = (t * 1.5) % (Math.PI * 2);
        body.position.y = Math.abs(Math.sin(moveT * 2)) * 0.15;
        // Lean forward
        body.rotation.x = 0.15;
        g.rotation.y = rotation[1] + 0.2 * s;
        // Arms pumping
        lArm.rotation.x = -Math.sin(moveT * 4) * 0.4;
        rArm.rotation.x = Math.sin(moveT * 4) * 0.4;
        // Sword forward
        sword.rotation.x = -0.6;
        sword.rotation.z = -0.2 * s;
        // Legs marching
        lLeg.rotation.x = Math.sin(moveT * 4) * 0.5;
        rLeg.rotation.x = -Math.sin(moveT * 4) * 0.5;
        // Reset glow
        materials.bodyMat.emissive.set("#000000");
        materials.bodyMat.emissiveIntensity = 0;
        materials.glowMat.opacity = 0.6;
        break;
      }
      case "combat": {
        combatFlash.current += delta;
        const ct = combatFlash.current;
        // Rapid shake
        const shake = Math.sin(ct * 25) * 0.03;
        g.position.x = position[0] + shake;
        g.position.z = position[2] + Math.cos(ct * 20) * 0.02;
        // Aggressive stance
        body.position.y = 0.1;
        body.rotation.x = -0.2;
        // Sword swing
        const swing = Math.sin(ct * 12) * 0.8;
        sword.rotation.x = swing - 0.5;
        sword.rotation.y = swing * 0.3 * s;
        sword.rotation.z = swing * 0.2 * s;
        // Shield block
        shield.rotation.y = -0.5 * s + Math.sin(ct * 8) * 0.2;
        shield.position.x = 0.35 * s + Math.sin(ct * 10) * 0.02;
        // Arms combat
        lArm.rotation.x = -0.6 + Math.sin(ct * 10) * 0.3;
        rArm.rotation.x = -0.8 + Math.sin(ct * 12) * 0.4;
        // Head bob
        head.rotation.x = Math.sin(ct * 15) * 0.1;
        head.rotation.y = Math.sin(ct * 10) * 0.15 * s;
        // Legs stance
        lLeg.rotation.x = -0.2 + Math.sin(ct * 8) * 0.1;
        rLeg.rotation.x = 0.2 + Math.sin(ct * 8 + 1) * 0.1;
        // Glow pulse on body
        materials.bodyMat.emissive.set(primaryColor);
        materials.bodyMat.emissiveIntensity = 0.2 + Math.sin(ct * 10) * 0.3;
        break;
      }
      case "victory": {
        const vt = t * 2;
        // Jump
        body.position.y = Math.abs(Math.sin(vt)) * 0.6;
        // Spin
        g.rotation.y = rotation[1] + vt * 2;
        // Scale up
        const scalePulse = 1 + Math.sin(vt * 2) * 0.08;
        g.scale.set(scalePulse, scalePulse, scalePulse);
        // Arms raised
        lArm.rotation.z = Math.PI * 0.7 * s;
        rArm.rotation.z = -Math.PI * 0.7 * s;
        lArm.rotation.x = -0.3;
        rArm.rotation.x = -0.3;
        // Sword up
        sword.rotation.x = -Math.PI * 0.4;
        sword.rotation.z = Math.sin(vt * 3) * 0.2;
        // Head tilt back
        head.rotation.x = -0.3 + Math.sin(vt * 3) * 0.1;
        // Glow
        materials.bodyMat.emissive.set(secondaryColor);
        materials.bodyMat.emissiveIntensity = 0.5 + Math.sin(vt * 4) * 0.3;
        materials.glowMat.opacity = 0.4 + Math.sin(vt * 3) * 0.2;
        break;
      }
      case "defeat": {
        const dt = Math.min(t * 0.8, 1);
        // Fall forward
        g.rotation.x = dt * 1.2;
        g.position.y = position[1] - dt * 0.3;
        // Scale down
        const shrink = 1 - dt * 0.15;
        g.scale.set(shrink, shrink, shrink);
        // Arms drop
        lArm.rotation.x = dt * 0.5;
        rArm.rotation.x = dt * 0.5;
        lArm.rotation.z = dt * 0.3 * s;
        rArm.rotation.z = -dt * 0.3 * s;
        // Sword drops
        sword.rotation.x = dt * 0.8;
        // Head down
        head.rotation.x = dt * 0.6;
        // Dim glow
        materials.glowMat.opacity = 0.6 * (1 - dt);
        materials.bodyMat.emissiveIntensity = 0.2 * (1 - dt);
        break;
      }
    }
  });

  const s = side === "left" ? 1 : -1;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Aura glow sphere */}
      <mesh position={[0, 0.5, 0]} scale={[1.2, 1.6, 1.2]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <primitive object={materials.glowMat} attach="material" />
      </mesh>

      {/* Body group */}
      <group ref={bodyRef}>
        {/* Head */}
        <group ref={headRef} position={[0, 1.15, 0]}>
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            <primitive object={materials.skinMat} attach="material" />
          </mesh>
          {/* Helmet / crown */}
          <mesh position={[0, 0.1, 0]} scale={[1.1, 0.5, 1.1]}>
            <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
            <primitive object={materials.bodyMat} attach="material" />
          </mesh>
          {/* Eyes */}
          <mesh position={[0.08 * s, 0.02, 0.18]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <primitive object={materials.eyeMat} attach="material" />
          </mesh>
          <mesh position={[0.08 * s, 0.02, 0.2]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <primitive object={materials.pupilMat} attach="material" />
          </mesh>
          <mesh position={[-0.08 * s, 0.02, 0.18]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <primitive object={materials.eyeMat} attach="material" />
          </mesh>
          <mesh position={[-0.08 * s, 0.02, 0.2]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <primitive object={materials.pupilMat} attach="material" />
          </mesh>
        </group>

        {/* Torso */}
        <mesh position={[0, 0.6, 0]} scale={[0.5, 0.7, 0.35]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={materials.bodyMat} attach="material" />
        </mesh>
        {/* Chest plate */}
        <mesh position={[0, 0.68, 0.16]} scale={[0.35, 0.25, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={materials.accentMat} attach="material" />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.32, 0]} scale={[0.52, 0.08, 0.38]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={materials.darkMat} attach="material" />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[0.32 * s, 0.85, 0]}>
          <mesh position={[0, -0.2, 0]} scale={[0.12, 0.4, 0.12]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
            <primitive object={materials.bodyMat} attach="material" />
          </mesh>
          {/* Shoulder pad */}
          <mesh position={[0, 0.05, 0]} scale={[0.2, 0.15, 0.2]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <primitive object={materials.accentMat} attach="material" />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.42, 0]} scale={[0.1, 0.1, 0.1]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <primitive object={materials.skinMat} attach="material" />
          </mesh>
        </group>

        {/* Right Arm (sword arm) */}
        <group ref={rightArmRef} position={[-0.32 * s, 0.85, 0]}>
          <mesh position={[0, -0.2, 0]} scale={[0.12, 0.4, 0.12]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
            <primitive object={materials.bodyMat} attach="material" />
          </mesh>
          {/* Shoulder pad */}
          <mesh position={[0, 0.05, 0]} scale={[0.2, 0.15, 0.2]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <primitive object={materials.accentMat} attach="material" />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.42, 0]} scale={[0.1, 0.1, 0.1]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <primitive object={materials.skinMat} attach="material" />
          </mesh>
          {/* Sword group attached to right arm */}
          <group ref={swordRef} position={[0, -0.5, 0.15]}>
            {/* Handle */}
            <mesh position={[0, -0.15, 0]} scale={[0.04, 0.3, 0.04]}>
              <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
              <primitive object={materials.darkMat} attach="material" />
            </mesh>
            {/* Guard */}
            <mesh position={[0, 0.02, 0]} scale={[0.25, 0.04, 0.08]}>
              <boxGeometry args={[1, 1, 1]} />
              <primitive object={materials.accentMat} attach="material" />
            </mesh>
            {/* Blade */}
            <mesh position={[0, 0.35, 0]} scale={[0.06, 0.6, 0.02]}>
              <boxGeometry args={[1, 1, 1]} />
              <primitive object={materials.accentMat} attach="material" />
            </mesh>
            {/* Blade tip */}
            <mesh position={[0, 0.72, 0]} scale={[0.06, 0.08, 0.02]}>
              <coneGeometry args={[0.5, 1, 4]} />
              <primitive object={materials.accentMat} attach="material" />
            </mesh>
            {/* Sword glow */}
            <mesh position={[0, 0.35, 0]} scale={[0.08, 0.65, 0.04]}>
              <boxGeometry args={[1, 1, 1]} />
              <primitive object={materials.glowMat} attach="material" />
            </mesh>
          </group>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[0.15 * s, 0.2, 0]}>
          <mesh position={[0, -0.2, 0]} scale={[0.14, 0.45, 0.14]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
            <primitive object={materials.darkMat} attach="material" />
          </mesh>
          {/* Boot */}
          <mesh position={[0, -0.45, 0.04]} scale={[0.16, 0.12, 0.2]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={materials.bodyMat} attach="material" />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[-0.15 * s, 0.2, 0]}>
          <mesh position={[0, -0.2, 0]} scale={[0.14, 0.45, 0.14]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
            <primitive object={materials.darkMat} attach="material" />
          </mesh>
          {/* Boot */}
          <mesh position={[0, -0.45, 0.04]} scale={[0.16, 0.12, 0.2]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={materials.bodyMat} attach="material" />
          </mesh>
        </group>

        {/* Shield (attached to left arm side) */}
        <group ref={shieldRef} position={[0.45 * s, 0.5, 0.1]}>
          <mesh rotation={[0, 0, 0]} scale={[0.35, 0.45, 0.06]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
            <primitive object={materials.accentMat} attach="material" />
          </mesh>
          {/* Shield border */}
          <mesh position={[0, 0, 0.02]} scale={[0.38, 0.48, 0.04]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
            <primitive object={materials.darkMat} attach="material" />
          </mesh>
          {/* Shield center */}
          <mesh position={[0, 0, 0.04]} scale={[0.15, 0.15, 0.08]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
            <primitive object={materials.bodyMat} attach="material" />
          </mesh>
          {/* Shield glow */}
          <mesh position={[0, 0, 0.05]} scale={[0.4, 0.5, 0.02]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
            <primitive object={materials.glowMat} attach="material" />
          </mesh>
        </group>
      </group>

      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]} scale={[0.6, 0.6, 0.1]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
