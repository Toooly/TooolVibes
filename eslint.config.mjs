import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".codex-tmp/**",
      ".wrangler/**",
      ".worktrees/**",
      "test-results/**",
      "playwright-report/**",
      "coverage/**",
      "artifacts/database-drill/**",
      "audits/**",
      "artifacts/audit-v3/**",
      "artifacts/responsiveness/**",
      "_audit_*.mjs",
      "_responsiveness.mjs",
      "_inspect_*.mjs",
      "_debug_*.mjs",
      "_quick_test.mjs",
      ".slim/**",
      ".tmp-qa/**",
      "supabase/.temp/**",
      ".tmp-edit*.js",
      ".tmp-edit*.ts",
      "next-env.d.ts",
      "cloudflare-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
