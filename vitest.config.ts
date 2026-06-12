import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  plugins: [react()],
  test: {
    environment: "node",
    globals: false,
    exclude: [
      "node_modules",
      ".codex-tmp",
      ".worktrees",
      ".next",
      ".open-next",
      "dist",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
};

export default config;
