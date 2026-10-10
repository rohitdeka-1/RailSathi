import { describe, expect, it } from 'vitest';
import { magneticOffset, searchMotion } from '@/lib/motion';

describe('search micro-interaction rules', () => {
  it('staggers suggestions by 30 milliseconds', () => { expect(searchMotion.suggestionStagger).toBe(0.03); });
  it('caps magnetic movement at 8 pixels in both directions', () => {
    expect(magneticOffset(1000, 100)).toBe(8);
    expect(magneticOffset(-1000, 100)).toBe(-8);
    expect(magneticOffset(50, 100)).toBe(0);
  });
  it('spins the swap icon 180 degrees', () => { expect(searchMotion.swapRotation).toBe(180); });
  it('shakes three full oscillations in 300 milliseconds', () => {
    expect(searchMotion.shake.duration).toBe(0.3);
    expect(searchMotion.shake.x).toEqual([0, -6, 6, -6, 6, -6, 6, 0]);
  });
});