"use client";

import { Suspense, useRef, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  Stars,
  MeshDistortMaterial,
  ContactShadows,
  Environment,
  Sparkles,
} from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { usePathname } from "next/navigation";
import { useMounted } from "@/lib/hooks/use-mounted";

// ── Shared scroll state (module-level, accessible inside Canvas) ──
const scrollState = {
  scrollY: 0,
  scrollProgress: 0,
  velocity: 0,
  maxScroll: 1,
};

// ── Scroll Tracker (runs outside Canvas) ──
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
        scrollState.velocity = (y - lastY) * 0.1;
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

// ── Galaxy Core: central glowing orb ──
function GalaxyCore({ scrollRef }: { scrollRef: React.MutableRefObject<typeof scrollState> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = scrollRef.current;
    const vel = s.velocity;
    const prog = s.scrollProgress;

    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.05 + prog * 0.3;
      meshRef.current.rotation.y = t * 0.08 + prog * 0.5;
      const pulse = 1 + Math.sin(t * 0.7 + prog * Math.PI) * 0.08;
      meshRef.current.scale.setScalar(pulse);
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(t * 1.2) * 0.5 + Math.abs(vel) * 2;
    }
    if (groupRef.current) {
      // Parallax: core moves opposite to scroll
      const targetY = prog * -4 + vel * 0.5;
      const targetZ = prog * -2;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ - 12, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -12]}>
      <pointLight ref={lightRef} color="#6a3cff" intensity={2.5} distance={40} />
      <pointLight color="#39d2f6" intensity={1.2} distance={25} position={[4, 2, 2]} />
      <pointLight color="#f3bf4c" intensity={0.8} distance={20} position={[-3, -2, 3]} />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.5, 4]} />
        <MeshDistortMaterial
          color="#6a3cff"
          emissive="#2c1f86"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
          distort={0.35}
          speed={1.5}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Outer glow shells */}
      <mesh>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial color="#6a3cff" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4.5, 32, 32]} />
        <meshBasicMaterial color="#39d2f6" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ── Floating Artifacts: abstract 3D shapes representing AI tools ──
const ARTIFACT_SHAPES = [
  (key: number) => (
    <mesh key={key}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#6a3cff" emissive="#3a2397" emissiveIntensity={0.4} roughness={0.3} metalness={0.9} />
    </mesh>
  ),
  (key: number) => (
    <mesh key={key}>
      <octahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color="#39d2f6" emissive="#1d6a7a" emissiveIntensity={0.4} roughness={0.2} metalness={0.95} />
    </mesh>
  ),
  (key: number) => (
    <mesh key={key}>
      <torusGeometry args={[0.35, 0.12, 16, 32]} />
      <meshStandardMaterial color="#f3bf4c" emissive="#8a6a1c" emissiveIntensity={0.3} roughness={0.25} metalness={0.85} />
    </mesh>
  ),
  (key: number) => (
    <mesh key={key}>
      <dodecahedronGeometry args={[0.38, 0]} />
      <meshStandardMaterial color="#8b6cff" emissive="#4a2fa8" emissiveIntensity={0.35} roughness={0.3} metalness={0.9} />
    </mesh>
  ),
  (key: number) => (
    <mesh key={key}>
      <tetrahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial color="#2bb9de" emissive="#0d3d4d" emissiveIntensity={0.45} roughness={0.2} metalness={0.92} />
    </mesh>
  ),
  (key: number) => (
    <mesh key={key}>
      <icosahedronGeometry args={[0.32, 1]} />
      <meshStandardMaterial color="#d99d27" emissive="#5c3f0a" emissiveIntensity={0.35} roughness={0.3} metalness={0.88} wireframe />
    </mesh>
  ),
];

function FloatingArtifacts({ scrollRef }: { scrollRef: React.MutableRefObject<typeof scrollState> }) {
  const count = 18;
  const groupRefs = useRef<THREE.Group[]>([]);

  const artifacts = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      shapeIdx: i % ARTIFACT_SHAPES.length,
      basePosition: [
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10 - 4,
      ] as [number, number, number],
      parallaxFactor: 0.3 + Math.random() * 1.2, // each artifact moves at different speed
      floatSpeed: 1.5 + Math.random() * 2,
      floatIntensity: 0.8 + Math.random() * 1.2,
      rotationSpeed: [Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.3] as [number, number, number],
      scale: 0.7 + Math.random() * 0.6,
    }));
  }, []);

  useFrame(() => {
    const s = scrollRef.current;
    const prog = s.scrollProgress;
    const vel = s.velocity;

    groupRefs.current.forEach((group, i) => {
      if (!group) return;
      const a = artifacts[i];
      // Parallax Y movement + velocity bounce
      const targetY = a.basePosition[1] + prog * a.parallaxFactor * 8 + vel * a.parallaxFactor * 2;
      const targetZ = a.basePosition[2] + prog * a.parallaxFactor * 3;
      group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, 0.06);
      group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, 0.06);
      // Rotation reacts to velocity
      group.rotation.x += vel * 0.002 * a.parallaxFactor;
      group.rotation.y += vel * 0.003 * a.parallaxFactor;
    });
  });

  return (
    <>
      {artifacts.map((a, i) => (
        <Float
          key={a.id}
          speed={a.floatSpeed}
          rotationIntensity={0.6}
          floatIntensity={a.floatIntensity}
          floatingRange={[-0.6, 0.6]}
        >
          <group
            ref={(el) => {
              if (el) groupRefs.current[i] = el;
            }}
            position={a.basePosition}
            scale={a.scale}
          >
            <AutoRotate speed={a.rotationSpeed}>
              {ARTIFACT_SHAPES[a.shapeIdx](a.id)}
            </AutoRotate>
          </group>
        </Float>
      ))}
    </>
  );
}

function AutoRotate({
  children,
  speed,
}: {
  children: React.ReactNode;
  speed: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += speed[0] * delta;
      ref.current.rotation.y += speed[1] * delta;
      ref.current.rotation.z += speed[2] * delta;
    }
  });
  return <group ref={ref}>{children}</group>;
}

// ── Particle Nebula ──
function NebulaParticles({ scrollRef }: { scrollRef: React.MutableRefObject<typeof scrollState> }) {
  const count = 3000;
  const meshRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const color1 = new THREE.Color("#6a3cff");
    const color2 = new THREE.Color("#39d2f6");
    const color3 = new THREE.Color("#f3bf4c");

    for (let i = 0; i < count; i++) {
      const r = Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(phi) - 8;

      const mixRatio = Math.random();
      const c = new THREE.Color().lerpColors(
        mixRatio < 0.5 ? color1 : color2,
        mixRatio < 0.5 ? color2 : color3,
        Math.random()
      );
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const s = scrollRef.current;
      const vel = s.velocity;
      // Rotation speed increases with scroll velocity
      meshRef.current.rotation.y += (0.002 + Math.abs(vel) * 0.001);
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.1 + s.scrollProgress * 0.2;
      // Parallax Y
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        s.scrollProgress * 3,
        0.03
      );
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ── Mouse-reactive + Scroll-reactive energy field ──
function EnergyField({ scrollRef }: { scrollRef: React.MutableRefObject<typeof scrollState> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        const s = scrollRef.current;
        material.uniforms.uTime.value = state.clock.elapsedTime;
        material.uniforms.uMouse.value.set(
          (state.pointer.x * viewport.width) / 2,
          (state.pointer.y * viewport.height) / 2
        );
        material.uniforms.uScroll.value = s.scrollProgress;
        material.uniforms.uVelocity.value = s.velocity;
      }
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uVelocity: { value: 0 },
      uColor1: { value: new THREE.Color("#6a3cff") },
      uColor2: { value: new THREE.Color("#39d2f6") },
      uColor3: { value: new THREE.Color("#f3bf4c") },
    }),
    []
  );

  return (
    <mesh ref={meshRef} position={[0, 0, -6]} rotation={[-Math.PI / 2.5, 0, 0]}>
      <planeGeometry args={[30, 30, 64, 64]} />
      <shaderMaterial
        transparent
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying float vElevation;
          uniform float uTime;
          uniform float uScroll;
          uniform float uVelocity;
          uniform vec2 uMouse;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            float dist = distance(uv, vec2(0.5));
            float wave = sin(dist * 10.0 - uTime * 1.5) * 0.3;
            float scrollWave = sin(uv.y * 8.0 + uScroll * 10.0) * uScroll * 0.4;
            float velWave = sin(uv.x * 12.0 - uTime * 3.0) * abs(uVelocity) * 0.3;
            float mouseDist = distance(uv, uMouse * 0.05 + 0.5);
            float mouseWave = sin(mouseDist * 15.0 - uTime * 2.0) * 0.5 / (mouseDist + 0.5);
            pos.z = wave + mouseWave + scrollWave + velWave;
            vElevation = pos.z;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uScroll;
          uniform float uVelocity;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            float mixVal = (vElevation + 0.8) * 0.5;
            vec3 color = mix(uColor1, uColor2, vUv.x + sin(uTime * 0.3) * 0.2 + uScroll * 0.3);
            color = mix(color, uColor3, vUv.y + cos(uTime * 0.2) * 0.15 + abs(uVelocity) * 0.2);
            float alpha = 0.15 + mixVal * 0.1 + uScroll * 0.05;
            gl_FragColor = vec4(color, alpha);
          }
        `}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Shooting Stars ──
function ShootingStars({ scrollRef }: { scrollRef: React.MutableRefObject<typeof scrollState> }) {
  const trailRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef(new THREE.Vector3());
  const progressRef = useRef(0);
  const timerRef = useRef(0);

  useFrame((state, delta) => {
    const s = scrollRef.current;
    // Increase shooting star frequency with scroll velocity
    timerRef.current += delta + Math.abs(s.velocity) * 0.02;

    if (timerRef.current > 3) {
      timerRef.current = 0;
      targetRef.current.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10 - s.scrollProgress * 5,
        (Math.random() - 0.5) * 10
      );
      progressRef.current = 0;
    }

    if (trailRef.current) {
      progressRef.current += delta * 0.4;
      const p = Math.min(progressRef.current, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      trailRef.current.position.lerp(targetRef.current, ease * 0.15);
      trailRef.current.rotation.z += delta * 2;
      const mat = trailRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(p * Math.PI) * (0.6 + Math.abs(s.velocity) * 0.3);
    }
  });

  return (
    <mesh ref={trailRef} position={[10, 5, -5]}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ── Scroll Camera Controller ──
function ScrollCamera({ scrollRef }: { scrollRef: React.MutableRefObject<typeof scrollState> }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 8));

  useFrame(() => {
    const s = scrollRef.current;
    const prog = s.scrollProgress;
    const vel = s.velocity;

    // Camera moves deeper and tilts as user scrolls
    targetPos.current.set(
      Math.sin(prog * Math.PI) * 2, // slight horizontal drift
      prog * -3 + vel * 0.3, // vertical parallax
      8 - prog * 3 // zoom in slightly
    );

    camera.position.lerp(targetPos.current, 0.04);
    camera.lookAt(0, prog * -1, 0);
    if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
      const pcam = camera as THREE.PerspectiveCamera;
      pcam.fov = THREE.MathUtils.lerp(pcam.fov, 60 - prog * 8, 0.03);
      pcam.updateProjectionMatrix();
    }
  });

  return null;
}

// ── Scene Composer ──
function Scene({ scrollRef }: { scrollRef: React.MutableRefObject<typeof scrollState> }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, -8]} color="#6a3cff" intensity={1.5} />
        <Stars radius={20} depth={40} count={2000} factor={3} saturation={0.5} fade speed={1.5} />
        <NebulaParticles scrollRef={scrollRef} />
        <GalaxyCore scrollRef={scrollRef} />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.15} />
      <ScrollCamera scrollRef={scrollRef} />
      <GalaxyCore scrollRef={scrollRef} />
      <FloatingArtifacts scrollRef={scrollRef} />
      <NebulaParticles scrollRef={scrollRef} />
      <EnergyField scrollRef={scrollRef} />
      <ShootingStars scrollRef={scrollRef} />
      <Stars radius={25} depth={50} count={4000} factor={4} saturation={0.6} fade speed={1} />
      <Sparkles count={150} scale={15} size={2} speed={0.4} opacity={0.4} color="#a78bfa" />
      <ContactShadows position={[0, -6, 0]} opacity={0.15} scale={25} blur={2.5} far={12} color="#6a3cff" />
      <Environment preset="city" />
    </>
  );
}

// ── Post Processing ──
function PostFX() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.25}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Noise opacity={0.03} blendFunction={BlendFunction.ADD} />
      <Vignette eskil={false} offset={0.35} darkness={0.6} />
    </EffectComposer>
  );
}

// ── Main Export ──
export function SiteUniverseBackground() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const mounted = useMounted();
  const scrollRef = useRef(scrollState);

  // Enable scroll tracking only on public site
  useScrollTracker(!isAdmin);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background: isAdmin
          ? "radial-gradient(circle at 50% 50%, #0d0823 0%, #050313 100%)"
          : "radial-gradient(circle at 50% 30%, #1a0f4a 0%, #0d0823 40%, #f7f5ff 100%)",
        pointerEvents: "none",
      }}
    >
      {mounted && (
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.5]}
          style={{ position: "absolute", inset: 0 }}
        >
          <Suspense fallback={null}>
            <Scene scrollRef={scrollRef} />
            <PostFX />
          </Suspense>
        </Canvas>
      )}
      {/* CSS overlay for blending with page content */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(247,245,255,0.85) 85%, rgba(247,245,255,0.98) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
