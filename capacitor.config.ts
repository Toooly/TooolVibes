import type { CapacitorConfig } from "@capacitor/cli";

/**
 * TooolVibes — Capacitor shell config (foundation only).
 *
 * Architecture A: the shell loads the canonical remote product origin.
 * `server.url` is set per environment at sync time and is intentionally
 * absent here — never commit a dev live-reload URL as architecture.
 * Native ios/ + android/ projects are generated on a provisioned machine
 * (Xcode + Android SDK); see docs/platform/NATIVE-ARCHITECTURE.md.
 */
const config: CapacitorConfig = {
  appId: "eu.tooolvibes.app",
  appName: "TooolVibes",
  webDir: "out",
  backgroundColor: "#0b0620",
  android: {
    allowMixedContent: false,
  },
};

export default config;
