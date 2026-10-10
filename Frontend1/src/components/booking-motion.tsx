import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animate, AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { TrainFront, ArrowRight } from "lucide-react";
import { bookingMotion, motionTokens } from "@/lib/motion";
import { rupees, type Trip } from "@/lib/trip";

type Flight = { top: number; left: number; width: number; height: number; trip: Trip };
export function useBookingReducedMotion() {
  const preference = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated && !!preference;
}
const FlowContext = createContext({ begin: (_element: HTMLElement, _trip: Trip) => {}, land: () => {}, flying: false });

/** A persistent portal bridges route unmounts without transforming pinned controls. */
export function BookingMotionProvider({ children }: { children: ReactNode }) {
  const [flight, setFlight] = useState<Flight | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);
  const reduced = useBookingReducedMotion();
  return <FlowContext.Provider value={{
    begin: (element, trip) => { if (reduced) return; const rect = element.getBoundingClientRect(); setFlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height, trip }); },
    flying: !!flight,
    land: () => {
      const target = document.querySelector<HTMLElement>('.booking-summary');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setFlight(current => current ? { ...current, top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null);
      clearTimer.current = setTimeout(() => setFlight(null), bookingMotion.morph * 1000);
    },
  }}><LayoutGroup id="booking-flow">{children}
    {flight && createPortal(<motion.div key="search-flight" layoutId="booking-summary-flight" className="booking-summary-flight" aria-hidden="true" initial={false} animate={{ top: flight.top, left: flight.left, width: flight.width, height: flight.height }} transition={{ duration: bookingMotion.morph, ease: motionTokens.easing.transition }}><strong>{flight.trip.from}</strong><ArrowRight size={18} /><strong>{flight.trip.to}</strong></motion.div>, document.body)}
  </LayoutGroup></FlowContext.Provider>;
}

export const useBookingTransition = () => useContext(FlowContext);

export function BookingSummary({ children }: { children: ReactNode }) {
  const { land, flying } = useBookingTransition();
  const reduced = useBookingReducedMotion();
  useEffect(() => { const frame = requestAnimationFrame(() => land()); return () => cancelAnimationFrame(frame); }, []);
  return <motion.div data-motion-owned="true" className="booking-summary" initial={false} animate={{ opacity: flying && !reduced ? 0 : 1 }} transition={{ duration: reduced ? 0 : motionTokens.duration.micro }}>{children}</motion.div>;
}

export function CountFare({ value, delay = 0 }: { value: number; delay?: number }) {
  const reduced = useBookingReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reduced) { setShown(value); return; }
    setShown(0);
    const control = animate(0, value, { duration: bookingMotion.count, delay, ease: motionTokens.easing.entrance, onUpdate: n => setShown(Math.round(n)) });
    return () => control.stop();
  }, [value, delay, reduced]);
  return <span className="count-fare"><span className="sr-only">{rupees(value)}</span><span aria-hidden="true">{rupees(shown)}</span></span>;
}

export function RollingFare({ total }: { total: string }) {
  const reduced = useBookingReducedMotion();
  return <span className="rolling-fare" aria-live="polite" aria-atomic="true"><span className="sr-only">{total}</span><AnimatePresence initial={false} mode="popLayout"><motion.span key={total} aria-hidden="true" initial={{ y: reduced ? 0 : 20, opacity: reduced ? 1 : 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduced ? 0 : -20, opacity: 0 }} transition={{ duration: reduced ? 0 : motionTokens.duration.standard, ease: motionTokens.easing.entrance }}>{total}</motion.span></AnimatePresence></span>;
}

export function FareBarMotion({ total, children }: { total: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useBookingReducedMotion();
  useEffect(() => {
    if (!ref.current || reduced) return;
    const control = animate(ref.current, { y: [20, 0], opacity: [0.65, 1] }, { duration: motionTokens.duration.standard, ease: motionTokens.easing.entrance });
    return () => control.stop();
  }, [total, reduced]);
  return <div ref={ref} className="fare-bar-inner" data-motion-owned="true">{children}</div>;
}

export function RailLoader({ compact = false }: { compact?: boolean }) {
  return <div className={`booking-rail-loader${compact ? " compact" : ""}`} role="status" aria-label="Finding trains"><span className="loading-rail" /><TrainFront className="loading-train" size={18} aria-hidden="true" /><span className="sr-only">Finding trains</span></div>;
}

export function TrainSkeletons() {
  return <div className="booking-loading" aria-busy="true"><RailLoader /><div className="train-list" aria-hidden="true">{[0, 1, 2].map(i => <div className="train-card skeleton-card" key={i}><div className="skeleton-line title" /><div className="skeleton-times"><span className="skeleton-line" /><span className="skeleton-line" /></div><div className="class-offers">{[0, 1, 2, 3].map(k => <span className="skeleton-chip" key={k} />)}</div></div>)}</div></div>;
}