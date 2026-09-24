#!/usr/bin/env node
// Minimal stdio MCP server exposing deterministic browser control backed by
// Playwright if browsers exist, else agent-browser CLI (already installed).
// Tools: browser_open, browser_screenshot, browser_snapshot, browser_click,
// browser_viewport, browser_close.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

function ab(...args) {
  const r = spawnSync("agent-browser", args, { encoding: "utf8", timeout: 120000 });
  return (r.stdout || "") + (r.stderr || "");
}
let viewport = { width: 390, height: 844 };
const handlers = {
  browser_open: ({ url }) => ab("open", url),
  browser_viewport: ({ width, height }) => {
    viewport = { width: Number(width) || 390, height: Number(height) || 844 };
    return ab("resize", String(viewport.width), String(viewport.height));
  },
  browser_snapshot: () => ab("snapshot", "-i"),
  browser_click: ({ ref }) => ab("click", ref),
  browser_screenshot: ({ path }) => {
    const out = path || "/tmp/ui-shot.png";
    return ab("screenshot", out);
  },
  browser_close: () => ab("close"),
};
const TOOLS = Object.keys(handlers).map((n) => ({ name: n, description: n }));
function send(obj) { process.stdout.write(JSON.stringify(obj) + "\n"); }
let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    const { id, method, params } = msg;
    if (method === "initialize") {
      send({ jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "tooolvibes-ui-browser", version: "1.0.0" } } });
    } else if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    } else if (method === "tools/call") {
      const name = params?.name;
      try {
        const output = handlers[name] ? handlers[name](params?.arguments ?? {}) : `unknown tool ${name}`;
        send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: String(output).slice(0, 8000) }] } });
      } catch (e) {
        send({ jsonrpc: "2.0", id, error: { code: -32000, message: String(e).slice(0, 500) } });
      }
    } else {
      send({ jsonrpc: "2.0", id, result: {} });
    }
  }
});
