import * as THREE from "three";
import { HERO_ARTWORK, dampHeroScroll, getHeroScrollProgress } from "./hero-decision-motion";

export type HeroSceneController = {
  setActive: (active: boolean) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

const vertexShader = `
  varying vec2 vUv;
  varying float vRibbon;
  varying float vDeck;
  uniform float uTime;
  uniform float uScroll;

  float rectangle(vec2 uv, vec2 lo, vec2 hi) {
    vec2 inside = smoothstep(lo - 0.018, lo + 0.018, uv)
      * (1.0 - smoothstep(hi - 0.018, hi + 0.018, uv));
    return inside.x * inside.y;
  }

  void main() {
    vUv = uv;
    float leftTool = rectangle(uv, vec2(0.20, 0.45), vec2(0.40, 0.68));
    float middleTool = rectangle(uv, vec2(0.40, 0.41), vec2(0.64, 0.71));
    float rightTool = rectangle(uv, vec2(0.63, 0.34), vec2(0.85, 0.63));
    float tools = max(leftTool, max(middleTool, rightTool));
    vRibbon = smoothstep(0.47, 0.60, uv.y) * (1.0 - tools);
    vDeck = smoothstep(0.04, 0.14, uv.y) * (1.0 - smoothstep(0.40, 0.48, uv.y));

    // The very first draw is the unmodified artwork, including its alpha edge.
    float breathe = smoothstep(0.0, 1.8, uTime);
    float phase = uTime * 0.48;
    vec3 point = position;
    point.x += vRibbon * sin(uv.y * 8.0 + phase) * (0.004 * breathe + 0.003 * uScroll);
    point.y += vRibbon * sin(uv.x * 9.0 - phase * 0.72) * (0.003 * breathe + 0.005 * uScroll);
    // Whole tool faces move together; logo/text interiors do not ripple.
    point.y += middleTool * (sin(phase * 0.8) * 0.002 * breathe + 0.005 * uScroll);
    point.y += leftTool * sin(phase * 0.7 + 0.6) * 0.0016 * breathe;
    point.y += rightTool * sin(phase * 0.65 - 0.8) * 0.0014 * breathe;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vRibbon;
  varying float vDeck;
  uniform sampler2D uArtwork;
  uniform float uTime;
  uniform float uScroll;

  void main() {
    vec4 color = texture2D(uArtwork, vUv);
    float breathe = smoothstep(0.0, 1.8, uTime);
    float sheen = pow(0.5 + 0.5 * sin(vUv.x * 8.0 + vUv.y * 3.0 - uTime * 0.28 - uScroll * 1.8), 10.0);
    // Illumination follows existing reflective regions, never paints a new shape.
    color.rgb *= 1.0 + sheen * (vRibbon * 0.055 + vDeck * 0.025) * breathe;
    gl_FragColor = color;
    #include <colorspace_fragment>
  }
`;

/** One artwork from first paint through animation; scroll only changes its pose. */
export async function mountHeroScene(host: HTMLElement, onLost: () => void): Promise<HeroSceneController> {
  // Decode the exact same asset as the native image before allocating GPU state.
  const texture = await new THREE.TextureLoader().loadAsync(HERO_ARTWORK);
  texture.colorSpace = THREE.SRGBColorSpace;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch (error) {
    texture.dispose();
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 0.5, -0.5, 0.1, 10);
  camera.position.z = 2;
  const geometry = new THREE.PlaneGeometry(1, 1, 96, 80);
  const material = new THREE.ShaderMaterial({
    uniforms: { uArtwork: { value: texture }, uTime: { value: 0 }, uScroll: { value: 0 } },
    vertexShader, fragmentShader, transparent: true, depthWrite: false,
  });
  const artwork = new THREE.Mesh(geometry, material);
  scene.add(artwork);
  const imageAspect = texture.image.width / texture.image.height;
  const section = host.closest(".def-cockpit") ?? host;
  let disposed = false, lost = false, active = false, paused = false;
  let frame = 0, last = 0, elapsed = 0, progress = 0, target = 0;
  let start = 0, distance = 1, fitWidth = 1, fitHeight = 1;

  function readScroll() {
    // Passive scroll handler: one scalar update, no layout or rendering work.
    target = getHeroScrollProgress(window.scrollY, start, distance);
  }
  function fail() {
    if (disposed || lost) return;
    lost = true;
    cancelAnimationFrame(frame);
    onLost();
  }
  function render() {
    if (disposed || lost) return;
    const pose = progress * progress * (3 - 2 * progress);
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uScroll.value = pose;
    artwork.scale.set(fitWidth * (1 + pose * 0.018), fitHeight * (1 + pose * 0.018), 1);
    artwork.rotation.z = -pose * 0.007;
    artwork.position.y = pose * 0.012;
    renderer.render(scene, camera);
  }
  function tick(now: number) {
    if (disposed || lost || !active || paused) return;
    frame = requestAnimationFrame(tick);
    // Follow the display cadence without frame skipping on 60/90/120Hz screens.
    // A single textured mesh runs only while visible, unpaused and in the foreground.
    const delta = last ? Math.min((now - last) / 1000, 0.08) : 0;
    last = now;
    elapsed += delta;
    progress = dampHeroScroll(progress, target, delta);
    try { render(); } catch { fail(); }
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    if (active && !paused && !disposed && !lost) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height || disposed) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.left = -aspect / 2;
    camera.right = aspect / 2;
    camera.updateProjectionMatrix();
    fitWidth = Math.min(aspect, imageAspect);
    fitHeight = fitWidth / imageAspect;
    const bounds = section.getBoundingClientRect();
    start = Math.max(0, bounds.top + window.scrollY - 100);
    distance = Math.max(bounds.height, window.innerHeight * 0.65);
    readScroll();
    render();
  }
  const onContextLost = (event: Event) => { event.preventDefault(); fail(); };
  const onResize = () => { try { resize(); } catch { fail(); } };
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener("scroll", readScroll);
    window.removeEventListener("resize", onResize);
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    geometry.dispose(); material.dispose(); texture.dispose();
    scene.clear(); renderer.dispose(); renderer.forceContextLoss();
    renderer.domElement.remove();
  }
  try {
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    host.appendChild(renderer.domElement);
    resize();
    observer?.observe(host);
    if (section !== host) observer?.observe(section);
    return {
      setActive(value) { active = value; sync(); },
      setPaused(value) { paused = value; sync(); },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
