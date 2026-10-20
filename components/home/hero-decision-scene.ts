import * as THREE from "three";
import type { Locale } from "@/lib/i18n/locale";
export type HeroSceneController = {
  setActive: (active: boolean) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};
const smooth = (value: number) => { const x = THREE.MathUtils.clamp(value, 0, 1); return x * x * (3 - 2 * x); };
/** Actual geometry and independent motion; no postprocessing or third-party requests. */
export async function mountHeroScene(host: HTMLElement, locale: Locale, onLost: () => void): Promise<HeroSceneController> {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, host.clientWidth < 600 ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(4.2, 4.6, 10);
  camera.lookAt(0, 0, 0);
  const world = new THREE.Group();
  scene.add(world);
  const resources: Array<{
    dispose: () => void;
  }> = [];
  const own = <T extends {
    dispose: () => void;
  }>(value: T): T => { resources.push(value); return value; };
  try {
    const pmrem = new THREE.PMREMGenerator(renderer), studio = new THREE.Scene();
    studio.background = new THREE.Color("#080316");
    const studioResources: Array<{ dispose: () => void }> = [];
    const panels: [number, number, number, number, number, string, number][] = [
      [6, 4, -3, 4, -5, "#7950ff", 5],
      [1.5, 7, 4, 3, -4, "#f6c978", 5],
      [2, 4, 3, 3, -2, "#05cefb", 3],
      [4, 1, 0, 6, -1, "#cebfff", 2],
      [6, 3, 0, 0, 6, "#7950ff", 2],
    ];
    panels.forEach(([width, height, x, y, z, color, intensity]) => {
      const geometry = new THREE.PlaneGeometry(width, height);
      const panelMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
      const panel = new THREE.Mesh(geometry, panelMaterial);
      panel.position.set(x, y, z); panel.lookAt(0, 0, 0); studio.add(panel);
      studioResources.push(geometry, panelMaterial);
    });
    const environment = own(pmrem.fromScene(studio, 0.04));
    scene.environment = environment.texture;
    studioResources.forEach(resource => resource.dispose());
    studio.clear();
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xf4e6ff, 2);
    key.position.set(-3, 6, 5);
    key.castShadow = true;
    own(key.shadow);
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.left = key.shadow.camera.bottom = -5;
    key.shadow.camera.right = key.shadow.camera.top = 5;
    key.shadow.normalBias = 0.04;
    const violet = new THREE.PointLight(0x793fff, 36, 12, 2);
    violet.position.set(-3, -0.2, 1);
    const cyan = new THREE.PointLight(0x36cfff, 28, 12, 2);
    cyan.position.set(4, 1.5, 0);
    const gold = new THREE.PointLight(0xffd385, 24, 12, 2);
    gold.position.set(1, 4, -1);
    scene.add(new THREE.AmbientLight(0xc2b4ff, 0.6), key, violet, cyan, gold);
    function material(color: string, metalness = 0.55, roughness = 0.26) {
      return own(new THREE.MeshPhysicalMaterial({ color, metalness, roughness, clearcoat: 0.65, clearcoatRoughness: 0.25, envMap: environment.texture, envMapIntensity: 0.45 }));
    }
    const ink = material("#0b061b", 0.65, 0.2), face = material("#090717", 0.45, 0.23);
    ink.envMapIntensity = 0.18;
    ink.clearcoat = 0.8;
    ink.clearcoatRoughness = 0.18;
    const purple = material("#7342e0", 0.72, 0.25), goldMaterial = material("#eec361", 0.8, 0.22), cyanMaterial = material("#47cfff", 0.65, 0.24);
    function roundedGeometry(width: number, height: number, radius: number, depth: number) {
      const shape = new THREE.Shape(), x = -width / 2, y = -height / 2;
      shape.moveTo(x + radius, y);
      shape.lineTo(x + width - radius, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + radius);
      shape.lineTo(x + width, y + height - radius);
      shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      shape.lineTo(x + radius, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - radius);
      shape.lineTo(x, y + radius);
      shape.quadraticCurveTo(x, y, x + radius, y);
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 10 });
      geometry.center();
      return own(geometry);
    }
    const deck = new THREE.Group();
    deck.position.y = -1.3;
    world.add(deck);
    const body = new THREE.Mesh(roundedGeometry(7.3, 4.5, 0.28, 0.16), ink);
    body.receiveShadow = true;
    body.rotation.x = -Math.PI / 2;
    deck.add(body);
    const rim = new THREE.Mesh(roundedGeometry(7.36, 4.56, 0.3, 0.045), purple);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = -0.08;
    deck.add(rim);
    function canvasTexture(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context)
        throw new Error("Canvas unavailable");
      paint(context);
      const texture = own(new THREE.CanvasTexture(canvas));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }
    function textPlane(text: string, width: number, color = "#f3efe8") {
      const texture = canvasTexture(512, 128, ctx => { ctx.fillStyle = color; ctx.font = "500 66px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 256, 64); });
      return new THREE.Mesh(own(new THREE.PlaneGeometry(width, width / 4)), own(new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })));
    }
    const labels = locale === "en" ? ["Discover", "Compare", "Remember"] : ["Scopri", "Confronta", "Ricorda"];
    const deckTexture = canvasTexture(1024, 512, ctx => {
      ctx.textBaseline = "middle";
      labels.forEach((text, row) => {
        const y = 96 + row * 142;
        ctx.strokeStyle = "rgba(187,166,255,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, y - 58);
        ctx.lineTo(984, y - 58);
        ctx.stroke();
        ctx.fillStyle = row === 2 ? "#eec361" : "#d8cfe6";
        ctx.font = "500 48px Inter, sans-serif";
        ctx.fillText(text, 65, y);
      });
    });
    const deckUI = new THREE.Mesh(own(new THREE.PlaneGeometry(6.6, 1.65)), own(new THREE.MeshBasicMaterial({ map: deckTexture, transparent: true, depthWrite: false, toneMapped: false })));
    deckUI.rotation.x = -Math.PI / 2;
    deckUI.position.set(0, 0.125, 1.52);
    deck.add(deckUI);
    const loader = new THREE.TextureLoader();
    const textures = await Promise.all(["blink", "v0", "weweb"].map(async (slug) => {
      try {
        const texture = await loader.loadAsync(`/hero/${slug}.png`);
        texture.colorSpace = THREE.SRGBColorSpace;
        return own(texture);
      }
      catch {
        return null;
      }
    }));
    const tiles: THREE.Group[] = [], reflections: Array<THREE.Mesh | null> = [];
    const tileGeometry = roundedGeometry(1.57, 1.75, 0.19, 0.17), frontGeometry = roundedGeometry(1.5, 1.68, 0.17, 0.015);
    const iconGeometry = own(new THREE.PlaneGeometry(1.05, 1.05));
    ["Blink", "v0", "WeWeb"].forEach((name, i) => {
      const tile = new THREE.Group();
      const edge = new THREE.Mesh(tileGeometry, i === 1 ? purple : i === 2 ? cyanMaterial : goldMaterial);
      edge.castShadow = true;
      tile.add(edge);
      const front = new THREE.Mesh(frontGeometry, face);
      front.position.z = 0.105;
      tile.add(front);
      const texture = textures[i];
      if (texture) {
        const logo = new THREE.Mesh(iconGeometry, own(new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false })));
        logo.position.z = 0.16;
        tile.add(logo);
      }
      const label = textPlane(name, 1.6);
      label.rotation.x = -Math.PI / 2;
      label.position.set((i - 1) * 2.1, -1.16, i === 1 ? 0.47 : 0.05);
      world.add(label);
      tile.position.set((i - 1) * 2.1, -0.2, -0.35);
      if (i === 1) tile.scale.setScalar(1.1);
      world.add(tile);
      tiles.push(tile);
      let reflection = null;
      if (texture) {
        reflection = new THREE.Mesh(own(new THREE.PlaneGeometry(0.75, 0.75)), own(new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false })));
        reflection.rotation.x = -Math.PI / 2;
        reflection.position.set((i - 1) * 2.1, -1.18, 0.2);
        world.add(reflection);
      }
      reflections.push(reflection);
    });
    const bookmark = new THREE.Group(), shape = new THREE.Shape();
    shape.moveTo(-0.135, 0);
    shape.lineTo(0.135, 0);
    shape.lineTo(0.135, -0.43);
    shape.lineTo(0, -0.34);
    shape.lineTo(-0.135, -0.43);
    shape.closePath();
    bookmark.add(new THREE.Mesh(own(new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, steps: 1 })), goldMaterial));
    bookmark.position.set(0.46, 0.9, 0.155);
    tiles[1].add(bookmark);
    const fold = new THREE.Mesh(own(new THREE.CylinderGeometry(0.045, 0.045, 0.27, 12, 1, false, 0, Math.PI)), goldMaterial);
    fold.rotation.z = Math.PI / 2;
    fold.position.set(0, 0, -0.025);
    bookmark.add(fold);
    const choiceLabel = textPlane(locale === "en" ? "Your choice" : "La tua scelta", 1.65, "#efcb71");
    choiceLabel.rotation.x = -Math.PI / 2;
    choiceLabel.position.set(0, -1.15, 0.72);
    world.add(choiceLabel);
    const segments = 144, bands = 4, geometry = own(new THREE.BufferGeometry());
    const vertices = new Float32Array((segments + 1) * (bands + 1) * 3), colors = new Float32Array(vertices.length), indices: number[] = [];
    for (let i = 0; i < segments; i++)
      for (let j = 0; j < bands; j++) {
        const a = i * (bands + 1) + j, b = a + bands + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
    const violetColor = new THREE.Color("#4712a3"), cyanColor = new THREE.Color("#087baf"), warmColor = new THREE.Color("#c49346"), edgeColor = new THREE.Color("#b294ee");
    for (let i = 0; i <= segments; i++)
      for (let j = 0; j <= bands; j++) {
        const u = i / segments, color = violetColor.clone().lerp(u > 0.5 ? cyanColor : warmColor, Math.pow(Math.abs(u - 0.5) * 2, 5) * 0.8);
        if (j === 0 || j === bands)
          color.lerp(edgeColor, 0.3);
        color.toArray(colors, (i * (bands + 1) + j) * 3);
      }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const ribbon = new THREE.Mesh(geometry, own(new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.78, roughness: 0.23, clearcoat: 0.7, emissive: "#381079", emissiveIntensity: 0.18, side: THREE.DoubleSide, envMap: environment.texture, envMapIntensity: 0.95 })));
    ribbon.frustumCulled = false;
    ribbon.castShadow = true;
    world.add(ribbon);
    const center = new THREE.Vector3(), tangent = new THREE.Vector3(), across = new THREE.Vector3(), normal = new THREE.Vector3();
    function updateRibbon(time: number) {
      for (let i = 0; i <= segments; i++) {
        const u = i / segments, angle = u * Math.PI * 2;
        center.set(3.15 * Math.sin(angle), 1.05 + 1.23 * Math.sin(angle * 2) + Math.sin(time * 0.8 + angle * 2) * 0.22, -1.25 + 0.7 * Math.cos(angle) + Math.sin(time * 0.6 + angle) * 0.15);
        tangent.set(3.15 * Math.cos(angle), 2.46 * Math.cos(angle * 2), -0.7 * Math.sin(angle)).normalize();
        across.set(-tangent.y, tangent.x, 0).normalize();
        normal.crossVectors(tangent, across).normalize();
        const twist = angle + Math.sin(time * 0.65 + angle) * 0.5;
        for (let j = 0; j <= bands; j++) {
          const offset = (j / bands - 0.5) * 0.68, at = (i * (bands + 1) + j) * 3;
          vertices[at] = center.x + offset * (across.x * Math.cos(twist) + normal.x * Math.sin(twist));
          vertices[at + 1] = center.y + offset * (across.y * Math.cos(twist) + normal.y * Math.sin(twist));
          vertices[at + 2] = center.z + offset * (across.z * Math.cos(twist) + normal.z * Math.sin(twist));
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    const dots: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial>[] = [], dotGeometry = own(new THREE.CircleGeometry(0.075, 20));
    for (let row = 0; row < 3; row++)
      for (let column = 0; column < 3; column++) {
        const dot = new THREE.Mesh(dotGeometry, own(new THREE.MeshStandardMaterial({ color: column === 1 ? row === 2 ? "#efc663" : "#9460f4" : "#524368", emissive: column === 1 ? "#7e3eff" : "#161025", emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.4 })));
        dot.rotation.x = -Math.PI / 2;
        dot.position.set(-0.6 + column * 1.3, -1.16, 1.004 + row * 0.458);
        world.add(dot);
        dots.push(dot);
      }
    let disposed = false, lost = false, active = false, paused = false, frame = 0, last = 0, elapsed = 0;
    const pointer = new THREE.Vector2(), easedPointer = new THREE.Vector2();
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = host.getBoundingClientRect();
      pointer.set(
        THREE.MathUtils.clamp((event.clientX - box.left) / box.width - 0.5, -0.5, 0.5),
        THREE.MathUtils.clamp((event.clientY - box.top) / box.height - 0.5, -0.5, 0.5),
      );
    };
    const onLeave = () => pointer.set(0, 0);
    const fail = () => {
      lost = true;
      active = false;
      cancelAnimationFrame(frame);
      onLost();
    };
    const onContextLost = (event: Event) => { event.preventDefault(); fail(); };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    host.addEventListener("pointermove", onPointer);
    host.addEventListener("pointerleave", onLeave);
    function render() {
      if (disposed || lost)
        return;
      const intro = smooth(elapsed / 1.1);
      deck.position.y = -1.3 - (1 - intro) * 0.3;
      ribbon.scale.setScalar(0.92 + intro * 0.08);
      updateRibbon(elapsed);
      tiles.forEach((tile, i) => {
        const arrival = smooth((elapsed - i * 0.12) / 1.2), phase = elapsed * 0.65 - i * 0.75;
        tile.position.y = -0.19 - (1 - arrival) * 0.35 + Math.sin(phase) * 0.055 + (i === 1 ? smooth((elapsed - 1) / 0.8) * 0.17 : 0);
        tile.position.z = -0.35 + (i === 1 ? smooth((elapsed - 1) / 0.8) * (0.52 + Math.sin(elapsed * 0.7) * 0.13) : 0) + Math.sin(phase * 0.85) * 0.065;
        tile.rotation.y = Math.sin(phase * 0.7) * 0.065;
        tile.rotation.x = (1 - arrival) * -0.16;
        const reflection = reflections[i];
        if (reflection)
          reflection.position.z = tile.position.z + 0.55;
      });
      bookmark.rotation.x = (1 - smooth((elapsed - 1.4) / 0.65)) * -1 + Math.sin(elapsed * 1.1) * 0.09;
      choiceLabel.scale.setScalar(0.95 + smooth((elapsed - 1.4) / 0.6) * 0.05);
      dots.forEach((dot, i) => { dot.material.emissiveIntensity = i % 3 === 1 ? 0.45 + (0.5 + Math.sin(elapsed * 1.25 - Math.floor(i / 3) * 1.4)) * 0.8 : 0.2; });
      violet.position.x = -2.5 + Math.sin(elapsed * 0.45) * 1.3;
      cyan.position.y = 1.7 + Math.sin(elapsed * 0.6) * 0.6;
      gold.position.x = Math.sin(elapsed * 0.4) * 2;
      easedPointer.lerp(pointer, 0.045);
      world.rotation.y = easedPointer.x * 0.1;
      world.rotation.x = easedPointer.y * 0.055;
      renderer.render(scene, camera);
    }
    function tick(now: number) {
      if (disposed || !active || paused) return;
      frame = requestAnimationFrame(tick);
      if (now - last < 1000 / 30) return;
      elapsed += last ? Math.min((now - last) / 1000, 0.08) : 0;
      last = now;
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
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    }
    const resizeObserver = new ResizeObserver(() => { try { resize(); } catch { fail(); } });
    host.appendChild(renderer.domElement);
    resizeObserver.observe(host);
    resize();
    return {
      setActive(value) { active = value; sync(); },
      setPaused(value) { paused = value; sync(); },
      dispose() {
        disposed = true;
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        host.removeEventListener("pointermove", onPointer);
        host.removeEventListener("pointerleave", onLeave);
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        resources.forEach(resource => resource.dispose());
        scene.clear();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      },
    };
  }
  catch (error) {
    resources.forEach(resource => resource.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    throw error;
  }
}
