import { describe, expect, it } from "vitest";
import { polishMotion, themeRevealRadius, motionTokens } from "@/lib/motion";

describe("global polish rules", () => {
  it("reveals below-fold content with a 20px rise", () => { expect(polishMotion.revealRise).toBe(20); });
  it("presses to 0.97 and releases with an underdamped spring", () => {
    expect(motionTokens.scale.press).toBe(0.97);
    expect(polishMotion.releaseSpring.damping ** 2).toBeLessThan(4 * polishMotion.releaseSpring.stiffness);
  });
  it("covers every viewport corner from the toggle origin", () => {
    const radius = themeRevealRadius(1200, 40, 1280, 1800);
    expect(radius).toBe(Math.hypot(1200, 1760));
    for (const [x, y] of [[0, 0], [1280, 0], [0, 1800], [1280, 1800]]) {
      expect(Math.hypot((x ?? 0) - 1200, (y ?? 0) - 40)).toBeLessThanOrEqual(radius);
    }
  });
});