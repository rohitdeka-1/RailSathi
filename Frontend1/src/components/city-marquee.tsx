import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { easeMarqueeSpeed, marqueeMotion, marqueeScrollImpulse, motionTokens, polishMotion } from "@/lib/motion";

type Flight = { city: string; start: DOMRect; end: DOMRect; fontSize: number };
type Ripple = { id: number; key: string; x: number; y: number };

export function CityMarquee({ cities, destination, onChoose }: {
  cities: readonly (readonly [string, string])[]; destination: string; onChoose: (city: string) => void;
}) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null), run = useRef<HTMLSpanElement>(null);
  const width = useRef(0), visible = useRef(true), speed = useRef(marqueeMotion.speed as number);
  const boost = useRef(0), skewImpulse = useRef(0), paused = useRef(false), focused = useRef(false);
  const x = useMotionValue(0), skew = useMotionValue(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const chooseRef = useRef(onChoose);
  chooseRef.current = onChoose;

  useEffect(() => {
    const element = root.current, group = run.current;
    if (!element || !group) return;
    const measure = () => { width.current = group.getBoundingClientRect().width; };
    const resize = new ResizeObserver(measure); resize.observe(group); measure();
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry?.isIntersecting ?? false; });
    observer.observe(element);
    let previousY = window.scrollY, previousTime = performance.now();
    const scroll = () => {
      const now = performance.now();
      const distance = window.scrollY - previousY;
      if (distance !== 0) {
        const impulse = marqueeScrollImpulse(distance / Math.max(0.016, Math.min(0.1, (now - previousTime) / 1000)));
        boost.current = Math.max(boost.current, impulse.boost); skewImpulse.current = impulse.skew;
      }
      previousY = window.scrollY; previousTime = now;
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { resize.disconnect(); observer.disconnect(); window.removeEventListener("scroll", scroll); };
  }, []);

  useEffect(() => {
    if (!reduced) return;
    x.set(0); skew.set(0); setRipple(null);
    if (flight) { chooseRef.current(flight.city); setFlight(null); }
  }, [reduced, x, skew, flight]);

  useAnimationFrame((_, delta) => {
    const track = root.current?.querySelector<HTMLElement>('.marquee-track');
    if (reduced || !visible.current || !width.current || document.hidden) { track?.style.removeProperty('will-change'); return; }
    const dt = Math.min(delta / 1000, 0.05);
    const decay = Math.exp(-dt / marqueeMotion.boostDecay);
    boost.current *= decay; skewImpulse.current *= decay;
    const stopped = paused.current || focused.current || !!flight;
    speed.current = easeMarqueeSpeed(speed.current, stopped ? 0 : marqueeMotion.speed * (1 + boost.current), dt);
    if (track) {
      if (speed.current > 0.1 || Math.abs(skew.get()) > 0.01) track.style.willChange = 'transform';
      else track.style.removeProperty('will-change');
    }
    const next = x.get() - speed.current * dt;
    x.set(((next % width.current) + width.current) % width.current - width.current);
    skew.set(easeMarqueeSpeed(skew.get(), stopped ? 0 : skewImpulse.current, dt));
  });

  function choose(city: string, key: string, event: MouseEvent<HTMLButtonElement>) {
    if (flight) return;
    const target = document.getElementById("destination");
    if (reduced || !target) { onChoose(city); return; }
    const text = event.currentTarget.querySelector(".marquee-city-text");
    if (!text) { onChoose(city); return; }
    const bounds = event.currentTarget.getBoundingClientRect();
    setRipple({ id: Date.now(), key, x: event.detail ? event.clientX - bounds.left : bounds.width / 2, y: event.detail ? event.clientY - bounds.top : bounds.height / 2 });
    setFlight({ city, start: text.getBoundingClientRect(), end: target.getBoundingClientRect(), fontSize: parseFloat(getComputedStyle(target).fontSize) });
  }

  return <>
    <div ref={root} className="route-marquee city-marquee" role="group" aria-label="Pick a destination city"
      onPointerEnter={event => { if (event.pointerType === "mouse") paused.current = true; }}
      onPointerLeave={() => { paused.current = false; setHovered(null); }}
      onFocusCapture={() => { focused.current = true; }}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) { focused.current = false; setHovered(null); } }}>
      <motion.div className="marquee-track" style={{ x, skewX: skew }}>
        {[0, 1].map(copy => <span key={copy} ref={copy === 0 ? run : undefined} className="marquee-run" aria-hidden={copy === 1 ? true : undefined}>
          {cities.map(([label, city], index) => {
            const key = `${copy}-${city}`;
            const active = hovered === key;
            return <span key={city} className="marquee-item">
              <Button asChild variant="ghost" className={`marquee-city${destination === city ? " on" : ""}`} data-motion-owned="true" type="button" tabIndex={copy === 1 ? -1 : 0} aria-pressed={destination === city} aria-label={`Set destination to ${city}`} onClick={event => choose(city, key, event)}>
                <motion.button animate={{ scale: reduced ? 1 : active ? marqueeMotion.hoverScale : 1, opacity: hovered && !active ? 0.5 : 1 }} transition={reduced ? { duration: 0 } : polishMotion.releaseSpring} whileTap={reduced ? {} : { scale: motionTokens.scale.press }}
                  onHoverStart={() => setHovered(key)} onHoverEnd={() => setHovered(null)}
                  onFocus={event => { setHovered(key); if (!reduced && event.currentTarget.matches(':focus-visible')) { const item = run.current?.children[index]; if (item instanceof HTMLElement) x.set(-item.offsetLeft); } }}>
                  <span className="marquee-city-text">{label}</span>
                  <AnimatePresence>{ripple?.key === key && <motion.span key={ripple.id} className="marquee-ripple" aria-hidden="true" style={{ left: ripple.x, top: ripple.y }} initial={{ scale: 0, opacity: 0.35 }} animate={{ scale: 12, opacity: 0 }} transition={{ duration: motionTokens.duration.entrance, ease: motionTokens.easing.entrance }} onAnimationComplete={() => setRipple(null)} />}</AnimatePresence>
                </motion.button>
              </Button><span className="marquee-dot" aria-hidden="true" />
            </span>;
          })}
        </span>)}
      </motion.div>
    </div>
    {flight && createPortal(<div className="marquee-flight-layer" aria-hidden="true"><motion.span className="marquee-flying-city" style={{ left: flight.start.left, top: flight.start.top, height: flight.start.height }} initial={{ x: 0, y: 0, scale: 1, opacity: 1 }} animate={{ x: flight.end.left - flight.start.left, y: flight.end.top - flight.start.top + (flight.end.height - flight.start.height) / 2, scale: flight.fontSize / 14 }} transition={{ duration: marqueeMotion.flight, ease: motionTokens.easing.transition }} onAnimationComplete={() => { chooseRef.current(flight.city); setFlight(null); }}>{flight.city}</motion.span></div>, document.body)}
  </>;
}