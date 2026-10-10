import { describe, expect, it } from "vitest";
import { heroDepth, heroScrollState } from "@/lib/motion";

describe('hero depth rules', () => {
  it('moves the mountain at 0.3x foreground scroll speed', () => {
    expect(heroDepth.photoSpeed).toBe(0.3);
    expect(-100 + heroScrollState(100, 1000).photoY).toBe(-30);
  });
  it('uses 10–20 fireflies', () => {
    expect(heroDepth.particles).toBeGreaterThanOrEqual(10);
    expect(heroDepth.particles).toBeLessThanOrEqual(20);
  });
  it('crosses with the train every 25 seconds', () => { expect(heroDepth.trainInterval).toBe(25); });
  it('gently fades and scales the headline as the hero passes', () => {
    expect(heroScrollState(0, 1000)).toMatchObject({ headlineScale: 1, headlineOpacity: 1 });
    expect(heroScrollState(1000, 1000)).toMatchObject({ headlineScale: 0.94, headlineOpacity: 0.55 });
  });
  it('clamps motion before and after the hero', () => {
    expect(heroScrollState(-100, 1000).photoY).toBe(0);
    expect(heroScrollState(2000, 1000).photoY).toBe(700);
    expect(heroScrollState(0, 0).headlineScale).toBe(1);
  });
});