import { describe, expect, it } from 'vitest';
import { routeMotion } from '@/lib/motion';
describe('route motion rules', () => {
  it('rises 20px on scroll', () => expect(routeMotion.rise).toBe(20));
  it('lifts 4px on hover', () => expect(routeMotion.lift).toBe(-4));
  it('uses shared 60–80ms stagger', () => { expect(routeMotion.stagger).toBeGreaterThanOrEqual(0.06); expect(routeMotion.stagger).toBeLessThanOrEqual(0.08); });
});