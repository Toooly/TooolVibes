import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  plugins: [react()],
  test: {
    environment: "node",
    environmentOptions: {
      jsdom: {
        // A concrete origin makes browser storage available to every
        // per-file `@vitest-environment jsdom` contract suite.
        url: "http://localhost",
      },
    },
    setupFiles: ["./tests/setup-vitest.ts"],
    globals: false,
    // La suite completa esegue piu' scenari jsdom/axe in parallelo: 5s e'
    // troppo stretto sotto contesa su Windows e produce timeout non funzionali.
    testTimeout: 10_000,
    exclude: [
      "node_modules",
      "**/node_modules/**",
      ".codex-tmp",
      ".worktrees",
      ".slim",
      ".slim/**",
      ".next",
      ".open-next",
      ".opencode/**",
      "dist",
      "tests/e2e/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
};

export default config;
