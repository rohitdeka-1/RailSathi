import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motionTokens, polishMotion, routeMotion } from "@/lib/motion";

type RouteChoice = { from: string; to: string; fromLabel: string; toLabel: string; note: string };
type Flight = { id: string; text: string; start: DOMRect; end: DOMRect };

export function RouteCard({ route, index, onChoose }: { route: RouteChoice; index: number; onChoose: () => void }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [landing, setLanding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, motionTokens.spring.soft), sy = useSpring(y, motionTokens.spring.soft);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!flights.length) return;
    const frame = requestAnimationFrame(() => setLanding(true));
    return () => cancelAnimationFrame(frame);
  }, [flights]);

  function finish() {
    setFlights([]); setLanding(false);
    onChoose();
    document.querySelector('.booking-console')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' });
    if (!reduced) {
      document.querySelectorAll('.source-field, .destination-field').forEach(field => {
        field.classList.remove('route-field-arrival');
        requestAnimationFrame(() => field.classList.add('route-field-arrival'));
      });
    }
  }
  function choose() {
    if (flights.length) return;
    if (reduced) { finish(); return; }
    const items: Flight[] = [];
    for (const [id, text] of [['source', route.from], ['destination', route.to]] as const) {
      const origin = ref.current?.querySelector(`[data-city="${id}"]`);
      const target = document.getElementById(id);
      if (origin && target) items.push({ id: `${index}-${id}`, text, start: origin.getBoundingClientRect(), end: target.getBoundingClientRect() });
    }
    if (!items.length) { finish(); return; }
    // Keep the target stationary throughout the shared-element flight; scroll only after landing.
    setLanding(false); setFlights(items);
    timer.current = setTimeout(finish, routeMotion.flight * 1000 + 60);
  }

  return <>
    <Button ref={ref} variant="ghost" asChild className="route-card" data-motion-owned="true" data-flying={flights.length > 0} type="button" onClick={choose} aria-label={`${route.fromLabel} to ${route.toLabel}, ${route.note}`}>
      <motion.button initial={reduced ? false : { opacity: 0, y: routeMotion.rise }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: reduced ? 0 : motionTokens.duration.entrance, delay: reduced ? 0 : index * routeMotion.stagger, ease: motionTokens.easing.entrance, scale: reduced ? { duration: 0 } : polishMotion.releaseSpring }}
        whileHover={reduced ? {} : { y: routeMotion.lift, transition: motionTokens.spring.soft }} whileTap={reduced ? {} : { scale: motionTokens.scale.press, transition: motionTokens.spring.soft }}
        onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}
        onPointerMove={event => { if (reduced || event.pointerType !== 'mouse') return; const bounds = event.currentTarget.getBoundingClientRect(); x.set(event.clientX - bounds.left - 90); y.set(event.clientY - bounds.top - 90); }}>
        <motion.span className="route-spotlight" aria-hidden="true" style={{ x: sx, y: sy }} animate={{ opacity: hovered && !reduced ? 1 : 0 }} transition={{ duration: motionTokens.duration.standard }} />
        <svg className="route-border-draw" aria-hidden="true"><motion.rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="12" initial={false} animate={{ pathLength: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }} transition={{ duration: reduced ? 0 : motionTokens.duration.standard, ease: motionTokens.easing.entrance }} /></svg>
        <span className="route-names"><span data-city="source">{route.fromLabel}</span><span className="route-journey-track"><motion.span className="route-track-line" aria-hidden="true" animate={{ scaleX: hovered ? 1 : 0 }} transition={motionTokens.spring.snappy} /><ArrowRight size={14} /><motion.span className="route-train-dot" aria-hidden="true" animate={hovered && !reduced ? { x: [-9, 9], opacity: [0, 1, 1, 0] } : { x: -9, opacity: 0 }} transition={{ duration: routeMotion.train, repeat: hovered && !reduced ? Infinity : 0, ease: 'linear' }} /></span><span data-city="destination" className="route-to">{route.toLabel}</span><ArrowUpRight className="route-go" size={15} aria-hidden="true" /></span>
        <span className="route-note">{route.note}</span>
      </motion.button>
    </Button>
    {flights.length > 0 && createPortal(<div className="route-flight-layer" aria-hidden="true">{flights.map(flight => {
      return <motion.span key={flight.id} layoutId={`route-flight-${flight.id}`} className="route-flying-city" style={{ left: flight.start.left, top: flight.start.top, height: flight.start.height }} initial={{ x: 0, y: 0, scale: 1 }} animate={{ x: landing ? flight.end.left - flight.start.left : 0, y: landing ? flight.end.top - flight.start.top + (flight.end.height - flight.start.height) / 2 : 0, scale: landing ? 22 / 14 : 1 }} transition={{ duration: routeMotion.flight, ease: motionTokens.easing.transition }}>{flight.text}</motion.span>;
    })}</div>, document.body)}
  </>;
}