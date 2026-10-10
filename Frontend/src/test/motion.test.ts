import { describe, expect, it } from "vitest";
import { claimHomeEntrance, entranceFrames, homeEntrance, motionTokens, sheetFrames } from "@/lib/motion";

describe("shared motion rules", () => {
  it("uses the requested entrance easing", () => { expect(motionTokens.easing.entrance).toEqual([0.16, 1, 0.3, 1]); });
  it("uses the requested transition easing", () => { expect(motionTokens.easing.transition).toEqual([0.76, 0, 0.24, 1]); });
  it("uses 120/18 for soft springs", () => { expect(motionTokens.spring.soft).toMatchObject({ stiffness: 120, damping: 18 }); });
  it("uses 300/24 for snappy springs", () => { expect(motionTokens.spring.snappy).toMatchObject({ stiffness: 300, damping: 24 }); });
  it("uses 150ms micro motion", () => { expect(motionTokens.duration.micro).toBe(0.15); });
  it("uses 350ms standard motion", () => { expect(motionTokens.duration.standard).toBe(0.35); });
  it("uses 700ms entrances", () => { expect(motionTokens.duration.entrance).toBe(0.7); });
  it("uses 1100ms hero motion", () => { expect(motionTokens.duration.hero).toBe(1.1); });
  it("staggers by 60–80ms", () => { expect(motionTokens.stagger).toBeGreaterThanOrEqual(0.06); expect(motionTokens.stagger).toBeLessThanOrEqual(0.08); });
  it("keeps all entrance travel within 16–24px", () => {
    for (const frames of [entranceFrames, sheetFrames]) { expect(frames.y[0]).toBeGreaterThanOrEqual(16); expect(frames.y[0]).toBeLessThanOrEqual(24); expect(frames.y[1]).toBe(0); }
  });
  it("only animates transform and opacity on entrance", () => { expect(Object.keys(entranceFrames)).toEqual(["opacity", "y"]); expect(Object.keys(sheetFrames)).toEqual(["opacity", "y"]); });
  it("presses to exactly 0.97", () => { expect(motionTokens.scale.press).toBe(0.97); });
});

describe("home first-load sequence", () => {
  it("plays once per session", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(claimHomeEntrance(storage, false)).toBe(true);
    expect(claimHomeEntrance(storage, false)).toBe(false);
  });
  it("skips motion when reduced motion is requested", () => {
    expect(claimHomeEntrance({ getItem: () => null, setItem: () => {} }, true)).toBe(false);
  });
  it("zooms the photo from 1.08 to 1 over 8 seconds", () => {
    expect(homeEntrance.zoom).toEqual({ from: 1.08, to: 1, duration: 8 });
  });
  it("staggers headline words by 80ms", () => { expect(homeEntrance.words.stagger).toBe(0.08); });
  it("slides the header down from 16px above", () => { expect(homeEntrance.header.distance).toBe(-16); });
  it("raises the subhead by 20px", () => { expect(homeEntrance.subhead.distance).toBe(20); });
  it("raises the search card 40px from scale 0.97", () => {
    expect(homeEntrance.card.distance).toBe(40);
    expect(homeEntrance.card.scale).toBe(0.97);
  });
  it("draws the underline after the final word reveals", () => {
    expect(homeEntrance.underline.delay).toBeGreaterThanOrEqual(homeEntrance.words.delay + 2 * homeEntrance.words.stagger + homeEntrance.words.duration);
  });
  it("finishes the UI sequence in about two seconds, with the marquee last", () => {
    expect(homeEntrance.routes.delay + 4 * homeEntrance.routes.stagger).toBeLessThan(homeEntrance.marquee.delay);
    expect(homeEntrance.marquee.delay + homeEntrance.marquee.duration).toBeCloseTo(2.07);
  });
});