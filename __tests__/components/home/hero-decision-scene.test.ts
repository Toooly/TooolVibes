// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountHeroScene } from "@/components/home/hero-decision-scene";

const mocks = vi.hoisted(() => ({ render: vi.fn(), dispose: vi.fn() }));
vi.mock("three", async () => {
  const actual = await vi.importActual<typeof import("three")>("three");
  return {
    ...actual,
    TextureLoader: class {
      async loadAsync() { const texture = new actual.Texture(); texture.image = { width: 1000, height: 833 }; return texture; }
    },
    WebGLRenderer: class {
      domElement = document.createElement("canvas");
      setPixelRatio() {} setClearColor() {} setSize() {} forceContextLoss() {}
      render = mocks.render;
      dispose = mocks.dispose;
    },
  };
});

let frames: Map<number, FrameRequestCallback>;
let frameId: number;
let host: HTMLDivElement;
let scene: Awaited<ReturnType<typeof mountHeroScene>> | undefined;
beforeEach(() => {
  vi.clearAllMocks(); frames = new Map(); frameId = 0;
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { frames.set(++frameId, fn); return frameId; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("scrollY", 0);
  host = document.createElement("div");
  Object.defineProperties(host, { clientWidth: { value: 600 }, clientHeight: { value: 454 } });
  document.body.append(host);
});
afterEach(() => { scene?.dispose(); scene = undefined; host.remove(); vi.unstubAllGlobals(); });
function step(time: number) {
  const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(time));
}
function artwork() {
  const renderedScene = mocks.render.mock.lastCall![0] as import("three").Scene;
  return renderedScene.children[0] as import("three").Mesh<import("three").PlaneGeometry, import("three").ShaderMaterial>;
}

describe("Hero continuous rendering", () => {
  it("advances internal motion on consecutive display frames without interaction", async () => {
    scene = await mountHeroScene(host, vi.fn());
    expect(artwork().material.uniforms.uTime.value).toBe(0);
    scene.setActive(true); step(1000); step(1016); step(1032);
    expect(artwork().material.uniforms.uTime.value).toBeCloseTo(0.032);
    expect(mocks.render).toHaveBeenCalledTimes(4);
    expect(frames.size).toBe(1);
  });
  it("changes the artwork pose on native scroll and reverses smoothly", async () => {
    scene = await mountHeroScene(host, vi.fn()); scene.setActive(true); step(1000);
    const initialScale = artwork().scale.x;
    vi.stubGlobal("scrollY", 350); window.dispatchEvent(new Event("scroll"));
    for (let i = 1; i <= 30; i++) step(1000 + i * 16);
    const moved = artwork().material.uniforms.uScroll.value;
    expect(moved).toBeGreaterThan(0.1);
    expect(artwork().scale.x).toBeGreaterThan(initialScale);
    expect(artwork().rotation.z).toBeLessThan(0);
    vi.stubGlobal("scrollY", 0); window.dispatchEvent(new Event("scroll"));
    step(1496);
    expect(artwork().material.uniforms.uScroll.value).toBeLessThan(moved);
    expect(artwork().material.uniforms.uScroll.value).toBeGreaterThan(0);
  });
  it("suspends offscreen and resumes automatically without a time jump", async () => {
    scene = await mountHeroScene(host, vi.fn()); scene.setActive(true); step(1000); step(1016);
    const time = artwork().material.uniforms.uTime.value;
    scene.setActive(false); expect(frames.size).toBe(0);
    scene.setActive(true); step(10000);
    expect(artwork().material.uniforms.uTime.value).toBe(time);
    step(10016); expect(artwork().material.uniforms.uTime.value).toBeGreaterThan(time);
  });
  it("follows a nested mobile scroller even when window scroll stays at zero", async () => {
    const shell = document.createElement("div");
    shell.style.overflowY = "auto";
    Object.defineProperties(shell, { clientHeight: { value: 844 }, scrollHeight: { value: 2400 } });
    document.body.append(shell); shell.append(host);
    try {
      scene = await mountHeroScene(host, vi.fn()); scene.setActive(true); step(1000);
      shell.scrollTop = 260;
      shell.dispatchEvent(new Event("scroll"));
      step(1016); step(1032);
      expect(window.scrollY).toBe(0);
      expect(artwork().material.uniforms.uScroll.value).toBeGreaterThan(0);
      const previous = artwork().material.uniforms.uScroll.value;
      shell.scrollTop = 0; shell.dispatchEvent(new Event("scroll")); step(1048);
      expect(artwork().material.uniforms.uScroll.value).toBeLessThan(previous);
    } finally { scene?.dispose(); scene = undefined; shell.remove(); }
  });
});
