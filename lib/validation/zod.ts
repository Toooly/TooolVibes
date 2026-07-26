import * as z from "zod";

// La CSP di release non consente unsafe-eval. Questa configurazione deve
// precedere la creazione di qualsiasi schema per evitare il fast path JIT di
// Zod e il relativo probe Function("") osservato da Firefox.
if (typeof z.config === "function") {
  z.config({ jitless: true });
}

export { z };
