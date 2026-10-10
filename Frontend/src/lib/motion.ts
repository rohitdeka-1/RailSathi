/** Single source of truth: seconds for Framer Motion/Lenis, pixels for travel. */
export const motionPerformance = { mobileBreakpoint: 760, mobileDurationScale: 0.8, targetFps: 60 } as const;

export function motionDuration(seconds: number, mobile = typeof window !== "undefined" && window.matchMedia(`(max-width: ${motionPerformance.mobileBreakpoint}px)`).matches) {
  return seconds * (mobile ? motionPerformance.mobileDurationScale : 1);
}

/** Runtime getters preserve desktop constants while scaling every consumer, including timers. */
function timed<T extends Record<string, number>>(values: T): T {
  const result = { ...values };
  for (const key of Object.keys(values)) {
    Object.defineProperty(result, key, { enumerable: true, get: () => motionDuration(values[key] ?? 0) });
  }
  return result;
}

function spring(stiffness: number, damping: number) {
  return { type: "spring" as const, get stiffness() { return stiffness / motionDuration(1) ** 2; }, get damping() { return damping / motionDuration(1); } };
}

export const motionTokens = {
  easing: {
    entrance: [0.16, 1, 0.3, 1] as const,
    transition: [0.76, 0, 0.24, 1] as const,
  },
  spring: {
    soft: spring(120, 18),
    snappy: spring(300, 24),
  },
  duration: timed({ micro: 0.15, standard: 0.35, entrance: 0.7, hero: 1.1 }),
  get stagger() { return motionDuration(0.07); },
  distance: { entrance: 20, sheet: 16 },
  scale: { hover: 1.01, press: 0.97, resting: 1 },
} as const;

export const entranceFrames = { opacity: [0, 1], y: [motionTokens.distance.entrance, 0] };
export const sheetFrames = { opacity: [0, 1], y: [motionTokens.distance.sheet, 0] };

export const polishMotion = {
  revealRise: 20,
  releaseSpring: spring(300, 14),
  cursor: { dot: 5, ring: 28, expanded: 44, trail: 0.085 },
} as const;

export function themeRevealRadius(x: number, y: number, width: number, height: number) {
  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}

export const searchMotion = {
  get suggestionStagger() { return motionDuration(0.03); },
  magneticLimit: 8,
  swapRotation: 180,
  shake: { x: [0, -6, 6, -6, 6, -6, 6, 0], get duration() { return motionDuration(0.3); } },
  get shineInterval() { return motionDuration(5); },
  get submitPause() { return motionDuration(0.5); },
} as const;

export const routeMotion = { rise: 20, lift: -4, get stagger() { return motionDuration(0.07); }, get flight() { return motionDuration(0.7); }, get glow() { return motionDuration(0.7); }, get train() { return motionDuration(1.4); } } as const;

export const bookingMotion = timed({ cardStagger: 0.06, chipStagger: 0.06, count: 0.7, expand: 0.35, loadingPreview: 0.7, rail: 1.1, morph: 0.7 });

export function bookingProgress(step: number) { return Math.max(0, Math.min(3, step)) / 3; }

const ticketTiming = timed({ entrance: 0.7, tearDelay: 0.45, tear: 0.35, checkDelay: 0.65, check: 0.35, sparks: 1.5, qrDelay: 0.9, qr: 0.7, detailsDelay: 0.8, detailStagger: 0.08 });
export const ticketMotion = Object.assign(ticketTiming, { rise: 24, tilt: -3 });

export const marqueeMotion = { speed: 36, get settle() { return motionDuration(0.35); }, get boostDecay() { return motionDuration(0.55); }, maxBoost: 3, maxSkew: 2.5, hoverScale: 1.08, get flight() { return motionDuration(0.7); } } as const;

export function marqueeScrollImpulse(velocity: number) {
  const strength = Math.min(1, Math.abs(velocity) / 1600);
  return { boost: strength * marqueeMotion.maxBoost, skew: Math.sign(velocity) * strength * marqueeMotion.maxSkew };
}

export function easeMarqueeSpeed(current: number, target: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, delta) / marqueeMotion.settle));
}

export function magneticOffset(position: number, size: number) {
  if (size <= 0) return 0;
  return Math.max(-searchMotion.magneticLimit, Math.min(searchMotion.magneticLimit, (position / size - 0.5) * searchMotion.magneticLimit * 2));
}

/** Home-only choreography: the photo continues after the two-second UI reveal. */
export const homeEntrance = {
  sessionKey: "rd-home-entrance-seen",
  zoom: { from: 1.08, to: 1, get duration() { return motionDuration(8); } },
  header: { get delay() { return motionDuration(0.08); }, distance: -16 },
  words: timed({ delay: 0.25, stagger: 0.08, duration: 0.7 }),
  underline: timed({ delay: 1.11, duration: 0.35 }),
  subhead: { get delay() { return motionDuration(0.65); }, distance: 20 },
  card: { get delay() { return motionDuration(0.85); }, distance: 40, scale: 0.97, get duration() { return motionDuration(0.7); } },
  routes: timed({ delay: 1.2, stagger: 0.08, duration: 0.55 }),
  marquee: timed({ delay: 1.72, duration: 0.35 }),
} as const;

export function claimHomeEntrance(storage: Pick<Storage, "getItem" | "setItem">, reducedMotion: boolean) {
  try {
    if (storage.getItem(homeEntrance.sessionKey)) return false;
    storage.setItem(homeEntrance.sessionKey, "1");
  } catch { /* In-memory mount still works when browser storage is unavailable. */ }
  return !reducedMotion;
}

export function expoEase(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export const heroDepth = {
  photoSpeed: 0.3,
  particles: 16,
  get particleDuration() { return motionDuration(18); },
  get trainInterval() { return motionDuration(25); },
  headlineScale: 0.94,
  headlineOpacity: 0.55,
} as const;

export function heroScrollState(distance: number, height: number) {
  const travel = Math.max(0, Math.min(distance, height));
  const progress = height > 0 ? travel / height : 0;
  return {
    photoY: travel * (1 - heroDepth.photoSpeed),
    headlineScale: 1 - progress * (1 - heroDepth.headlineScale),
    headlineOpacity: 1 - progress * (1 - heroDepth.headlineOpacity),
  };
}

/** Export the same values to legacy decorative CSS, not a second token set. */
export const motionCssVariables = {
  "--motion-ease-entrance": `cubic-bezier(${motionTokens.easing.entrance.join(",")})`,
  "--motion-ease-transition": `cubic-bezier(${motionTokens.easing.transition.join(",")})`,
  get "--motion-micro"() { return `${motionTokens.duration.micro}s`; },
  get "--motion-standard"() { return `${motionTokens.duration.standard}s`; },
  get "--motion-entrance"() { return `${motionTokens.duration.entrance}s`; },
  get "--motion-hero"() { return `${motionTokens.duration.hero}s`; },
} as const;