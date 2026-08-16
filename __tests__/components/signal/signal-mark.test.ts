import { describe, expect, it } from "vitest";

import { signalPrimitiveForCode } from "@/components/signal/marks/signal-mark";

describe("signal marks", () => {
  it("maps canonical achievement codes to dedicated primitives", () => {
    expect(signalPrimitiveForCode("first_signal")).toBe("beacon");
    expect(signalPrimitiveForCode("first_verdict")).toBe("route");
    expect(signalPrimitiveForCode("stack_builder")).toBe("layers");
    expect(signalPrimitiveForCode("radar_return")).toBe("rings");
    expect(signalPrimitiveForCode("cartographer")).toBe("mesh");
  });
});
