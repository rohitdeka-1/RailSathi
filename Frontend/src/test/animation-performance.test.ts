import { describe, expect, it } from "vitest";
import { motionDuration, motionPerformance } from "@/lib/motion";

describe("animation performance rules", () => {
  it("targets 60fps", () => { expect(motionPerformance.targetFps).toBe(60); });
  it("shortens phone durations by exactly 20%", () => { expect(motionDuration(1, true)).toBe(0.8); expect(motionDuration(0.7, true)).toBeCloseTo(0.56); });
  it("preserves desktop duration", () => { expect(motionDuration(0.7, false)).toBe(0.7); });
});