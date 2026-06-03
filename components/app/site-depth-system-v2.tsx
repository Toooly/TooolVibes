"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

type SiteDepthToneKey =
  | "home"
  | "archive"
  | "compare"
  | "radar"
  | "wishlist"
  | "commerce"
  | "default";

type SiteDepthTone = {
  key: SiteDepthToneKey;
  primary: string;
  secondary: string;
  accent: string;
  label: string;
};

const siteDepthTones: Record<SiteDepthToneKey, SiteDepthTone> = {
  home: {
    key: "home",
    primary: "#6a3cff",
    secondary: "#39d2f6",
    accent: "#5b5bd6",
    label: "Discovery field",
  },
  archive: {
    key: "archive",
    primary: "#0f766e",
    secondary: "#1f5f8b",
    accent: "#111827",
    label: "Catalog field",
  },
  compare: {
    key: "compare",
    primary: "#2563eb",
    secondary: "#0f766e",
    accent: "#5b5bd6",
    label: "Decision field",
  },
  radar: {
    key: "radar",
    primary: "#dc6b2f",
    secondary: "#0f766e",
    accent: "#2563eb",
    label: "Signal field",
  },
  wishlist: {
    key: "wishlist",
    primary: "#5b5bd6",
    secondary: "#0f766e",
    accent: "#2563eb",
    label: "Submission field",
  },
  commerce: {
    key: "commerce",
    primary: "#0f766e",
    secondary: "#334155",
    accent: "#2563eb",
    label: "Commerce field",
  },
  default: {
    key: "default",
    primary: "#6a3cff",
    secondary: "#2563eb",
    accent: "#5b5bd6",
    label: "TooolVibes field",
  },
};

function getSiteDepthTone(pathname?: string | null): SiteDepthTone {
  if (!pathname || pathname === "/") return siteDepthTones.home;
  if (
    pathname.startsWith("/archivio") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/tags")
  )
    return siteDepthTones.archive;
  if (pathname.startsWith("/compare") || pathname.startsWith("/shortlist"))
    return siteDepthTones.compare;
  if (pathname.startsWith("/product-hunt")) return siteDepthTones.radar;
  if (pathname.startsWith("/wishlist")) return siteDepthTones.wishlist;
  if (pathname.startsWith("/shop") || pathname.startsWith("/account"))
    return siteDepthTones.commerce;
  return siteDepthTones.default;
}

function hexToRgb(hex: string) {
  const num = parseInt(hex.replace("#", ""), 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
) {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  };
}

export function SiteDepthSystemV2() {
  const pathname = usePathname();
  const tone = useMemo(() => getSiteDepthTone(pathname), [pathname]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const toneRef = useRef(tone);

  useEffect(() => {
    toneRef.current = tone;
  }, [tone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return undefined;

    let disposed = false;
    let raf = 0;
    const cleanup: Array<() => void> = [];
    const disposables: Array<{ dispose: () => void }> = [];

    void import("three").then((THREE) => {
      void import("three/examples/jsm/postprocessing/EffectComposer.js").then(
        ({ EffectComposer }) => {
          void import(
            "three/examples/jsm/postprocessing/RenderPass.js"
          ).then(({ RenderPass }) => {
            void import(
              "three/examples/jsm/postprocessing/UnrealBloomPass.js"
            ).then(({ UnrealBloomPass }) => {
              void import(
                "three/examples/jsm/postprocessing/OutputPass.js"
              ).then(({ OutputPass }) => {
                if (disposed) return;

                type TVector3 = InstanceType<typeof THREE.Vector3>;

                const isMobile = window.innerWidth < 768;
                const POINT_COUNT = isMobile ? 300 : 1000;
                const MAX_CONNECTIONS = isMobile ? 80 : 220;

                const renderer = new THREE.WebGLRenderer({
                  canvas,
                  alpha: true,
                  antialias: false,
                  powerPreference: "low-power",
                });
                renderer.setClearColor(0x000000, 0);
                renderer.setPixelRatio(
                  Math.min(window.devicePixelRatio || 1, 1.5)
                );

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(
                  60,
                  1,
                  0.1,
                  60
                );
                camera.position.set(0, 0, 8);

                const composer = new EffectComposer(renderer);
                const renderPass = new RenderPass(scene, camera);
                composer.addPass(renderPass);
                const bloomPass = new UnrealBloomPass(
                  new THREE.Vector2(1, 1),
                  1.2,
                  0.5,
                  0.15
                );
                composer.addPass(bloomPass);
                const outputPass = new OutputPass();
                composer.addPass(outputPass);

                const track = <T extends { dispose?: () => void }>(r: T) => {
                  if (r.dispose)
                    disposables.push(r as T & { dispose: () => void });
                  return r;
                };

                // Current & target colors for smooth transitions
                const currentPrimary = hexToRgb(toneRef.current.primary);
                const currentSecondary = hexToRgb(
                  toneRef.current.secondary
                );
                let targetPrimary = { ...currentPrimary };
                let targetSecondary = { ...currentSecondary };

                // ── Instanced Particles ──
                const sphereGeo = track(
                  new THREE.SphereGeometry(0.035, 6, 6)
                );
                const particleMat = track(
                  new THREE.MeshBasicMaterial({
                    color: new THREE.Color(
                      currentPrimary.r,
                      currentPrimary.g,
                      currentPrimary.b
                    ),
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  })
                );
                const instancedMesh = new THREE.InstancedMesh(
                  sphereGeo,
                  particleMat,
                  POINT_COUNT
                );
                instancedMesh.instanceMatrix.setUsage(
                  THREE.DynamicDrawUsage
                );
                scene.add(instancedMesh);

                const dummy = new THREE.Object3D();
                const positions: TVector3[] = [];
                const velocities: TVector3[] = [];
                const origins: TVector3[] = [];
                const phases: number[] = [];

                for (let i = 0; i < POINT_COUNT; i++) {
                  const x = (Math.random() - 0.5) * 28;
                  const y = (Math.random() - 0.5) * 20;
                  const z = (Math.random() - 0.5) * 12;
                  const pos = new THREE.Vector3(x, y, z);
                  positions.push(pos);
                  origins.push(pos.clone());
                  velocities.push(
                    new THREE.Vector3(
                      (Math.random() - 0.5) * 0.0015,
                      (Math.random() - 0.5) * 0.001,
                      (Math.random() - 0.5) * 0.0005
                    )
                  );
                  phases.push(Math.random() * Math.PI * 2);
                }

                // ── Connection Lines ──
                const linePos = new Float32Array(MAX_CONNECTIONS * 2 * 3);
                const lineGeo = track(new THREE.BufferGeometry());
                lineGeo.setAttribute(
                  "position",
                  new THREE.BufferAttribute(linePos, 3)
                );
                const lineMat = track(
                  new THREE.LineBasicMaterial({
                    color: new THREE.Color(
                      currentSecondary.r,
                      currentSecondary.g,
                      currentSecondary.b
                    ),
                    transparent: true,
                    opacity: 0.1,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  })
                );
                const lines = new THREE.LineSegments(lineGeo, lineMat);
                scene.add(lines);

                // ── Mouse & Scroll state ──
                const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
                let scrollY = window.scrollY || 0;

                const onMouseMove = (e: MouseEvent) => {
                  mouse.tx =
                    (e.clientX / window.innerWidth - 0.5) * 2;
                  mouse.ty =
                    (e.clientY / window.innerHeight - 0.5) * 2;
                };
                const onScroll = () => {
                  scrollY = window.scrollY || 0;
                };
                window.addEventListener("mousemove", onMouseMove, {
                  passive: true,
                });
                window.addEventListener("scroll", onScroll, {
                  passive: true,
                });
                cleanup.push(() => {
                  window.removeEventListener("mousemove", onMouseMove);
                  window.removeEventListener("scroll", onScroll);
                });

                // ── Visibility pausing ──
                let visible = true;
                const onVis = () => {
                  visible = !document.hidden;
                };
                document.addEventListener("visibilitychange", onVis);
                cleanup.push(() =>
                  document.removeEventListener("visibilitychange", onVis)
                );

                const resize = () => {
                  const w = Math.max(1, canvas.clientWidth);
                  const h = Math.max(1, canvas.clientHeight);
                  renderer.setSize(w, h, false);
                  composer.setSize(w, h);
                  camera.aspect = w / h;
                  camera.updateProjectionMatrix();
                };
                resize();
                window.addEventListener("resize", resize, {
                  passive: true,
                });
                cleanup.push(() =>
                  window.removeEventListener("resize", resize)
                );

                let frameCount = 0;
                let time = 0;

                const render = () => {
                  raf = window.requestAnimationFrame(render);
                  if (!visible || disposed) return;
                  frameCount += 1;
                  time += 0.004;

                  // Smooth color transition
                  const newTargetPrimary = hexToRgb(
                    toneRef.current.primary
                  );
                  const newTargetSecondary = hexToRgb(
                    toneRef.current.secondary
                  );
                  targetPrimary = lerpColor(
                    targetPrimary,
                    newTargetPrimary,
                    0.015
                  );
                  targetSecondary = lerpColor(
                    targetSecondary,
                    newTargetSecondary,
                    0.015
                  );

                  particleMat.color.setRGB(
                    targetPrimary.r,
                    targetPrimary.g,
                    targetPrimary.b
                  );
                  lineMat.color.setRGB(
                    targetSecondary.r,
                    targetSecondary.g,
                    targetSecondary.b
                  );

                  // Project mouse to world plane z=0
                  const mouseWorldX = mouse.x * 12;
                  const mouseWorldY = mouse.y * 8;
                  const forceRadius = 4.5;
                  const forceStrength = 0.018;

                  // Update particles
                  for (let i = 0; i < POINT_COUNT; i++) {
                    const pos = positions[i];
                    const vel = velocities[i];
                    const orig = origins[i];
                    const phase = phases[i];

                    // Drift
                    pos.x += vel.x;
                    pos.y += vel.y;
                    pos.z += vel.z;

                    // Orbital motion around origin
                    const orbitR = 0.002;
                    pos.x += Math.cos(time + phase) * orbitR;
                    pos.y += Math.sin(time + phase * 0.7) * orbitR;

                    // Wrap
                    if (pos.x > 14) pos.x = -14;
                    if (pos.x < -14) pos.x = 14;
                    if (pos.y > 10) pos.y = -10;
                    if (pos.y < -10) pos.y = 10;
                    if (pos.z > 6) pos.z = -6;
                    if (pos.z < -6) pos.z = 6;

                    // Spring back to origin
                    pos.x += (orig.x - pos.x) * 0.0003;
                    pos.y += (orig.y - pos.y) * 0.0003;
                    pos.z += (orig.z - pos.z) * 0.0003;

                    // Mouse force field (repulsion)
                    const dx = pos.x - mouseWorldX;
                    const dy = pos.y - mouseWorldY;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < forceRadius * forceRadius && distSq > 0.01) {
                      const dist = Math.sqrt(distSq);
                      const force =
                        (1 - dist / forceRadius) * forceStrength;
                      pos.x += (dx / dist) * force;
                      pos.y += (dy / dist) * force;
                    }

                    // Scale pulse
                    const scale =
                      0.8 +
                      Math.sin(time * 2 + phase) * 0.3 +
                      Math.sin(time * 0.5 + phase * 3) * 0.2;

                    dummy.position.copy(pos);
                    dummy.scale.setScalar(scale);
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(i, dummy.matrix);
                  }
                  instancedMesh.instanceMatrix.needsUpdate = true;

                  // Connections (every 2 frames)
                  if (frameCount % 2 === 0) {
                    const lAttr = lineGeo.attributes.position;
                    let li = 0;
                    const thr = 3.2;
                    const thrSq = thr * thr;
                    const step = isMobile ? 3 : 1;
                    outer: for (
                      let i = 0;
                      i < POINT_COUNT;
                      i += step
                    ) {
                      const ix = positions[i].x;
                      const iy = positions[i].y;
                      const iz = positions[i].z;
                      for (
                        let j = i + 1;
                        j < POINT_COUNT;
                        j += step
                      ) {
                        const dx = ix - positions[j].x;
                        const dy = iy - positions[j].y;
                        const dz = iz - positions[j].z;
                        if (dx * dx + dy * dy + dz * dz < thrSq) {
                          lAttr.setXYZ(li, ix, iy, iz);
                          lAttr.setXYZ(
                            li + 1,
                            positions[j].x,
                            positions[j].y,
                            positions[j].z
                          );
                          li += 2;
                          if (li >= MAX_CONNECTIONS * 2) break outer;
                        }
                      }
                    }
                    for (let k = li; k < MAX_CONNECTIONS * 2; k++) {
                      lAttr.setXYZ(k, 9999, 9999, 9999);
                    }
                    lAttr.needsUpdate = true;
                  }

                  // Mouse parallax
                  mouse.x += (mouse.tx - mouse.x) * 0.04;
                  mouse.y += (mouse.ty - mouse.y) * 0.04;
                  scene.rotation.y = mouse.x * 0.04;
                  scene.rotation.x = mouse.y * 0.03;
                  camera.position.y = -scrollY * 0.0006;

                  composer.render();
                };
                raf = window.requestAnimationFrame(render);

                cleanup.push(() => {
                  window.cancelAnimationFrame(raf);
                  disposables.forEach((d) => d.dispose());
                  renderer.dispose();
                  renderer.forceContextLoss();
                  composer.dispose();
                });
              });
            });
          });
        }
      );
    });

    return () => {
      disposed = true;
      cleanup.forEach((cb) => cb());
    };
  }, []);

  return (
    <div
      className="site-depth-system-v2"
      data-site-depth-route={tone.key}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="site-depth-system-v2__canvas" />
    </div>
  );
}
