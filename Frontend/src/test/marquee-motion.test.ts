import { describe, expect, it } from "vitest";
import { easeMarqueeSpeed, marqueeMotion, marqueeScrollImpulse } from "@/lib/motion";

describe("marquee motion", () => {
  it("eases toward a stop rather than pausing abruptly", () => {
    const speed = easeMarqueeSpeed(36, 0, 0.016);
    expect(speed).toBeGreaterThan(0); expect(speed).toBeLessThan(36);
    expect(easeMarqueeSpeed(36, 0, 3)).toBeLessThan(0.01);
  });
  it("eases back up on leave", () => {
    const speed = easeMarqueeSpeed(0, 36, 0.016);
    expect(speed).toBeGreaterThan(0); expect(speed).toBeLessThan(36);
  });
  it("briefly boosts speed with page scroll velocity", () => {
    expect(marqueeScrollImpulse(0).boost).toBe(0);
    expect(marqueeScrollImpulse(800).boost).toBeGreaterThan(0);
    expect(marqueeScrollImpulse(1600).boost).toBeGreaterThan(marqueeScrollImpulse(800).boost);
  });
  it("caps scroll skew between two and three degrees in either direction", () => {
    expect(marqueeMotion.maxSkew).toBeGreaterThanOrEqual(2);
    expect(marqueeMotion.maxSkew).toBeLessThanOrEqual(3);
    expect(marqueeScrollImpulse(10000).skew).toBe(2.5);
    expect(marqueeScrollImpulse(-10000).skew).toBe(-2.5);
  });
});