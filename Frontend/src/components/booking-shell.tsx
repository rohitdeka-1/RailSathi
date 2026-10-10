import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { bookingMotion, bookingProgress, motionTokens } from "@/lib/motion";
import { DrawnCheck } from "@/components/search-motion";
import { BookingSummary, FareBarMotion, RollingFare, useBookingReducedMotion } from "@/components/booking-motion";
import { tripDateLabel, type Trip } from "@/lib/trip";

const steps = ["Search", "Choose train", "Passengers", "Pay"];

/** Light-theme frame for post-search screens: header, trip summary, 4-step progress, sticky mobile bar. */
export function BookingShell({ step, trip, back, children, bar }: {
  step: 1 | 2 | 3;
  trip: Trip;
  back?: ReactNode | undefined;
  children: ReactNode;
  bar?: ReactNode | undefined;
}) {
  const reduced = useBookingReducedMotion();
  return (
    <div className="flow-app">
      <header className="flow-header" data-motion-owned="true">
        <Link to="/" className="flow-wordmark" aria-label="Rail Daddy home">RAIL <span>DADDY</span>.</Link>
        <BookingSummary><p className="flow-trip"><strong>{trip.from}</strong><ArrowRight size={14} aria-hidden="true" /><strong>{trip.to}</strong><span>· {tripDateLabel(trip.date)} · {trip.cls} · {trip.pax} pax</span></p></BookingSummary>
      </header>
      <nav aria-label="Booking progress" className="flow-steps" data-motion-owned="true">
        <ol>
          {steps.map((label, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={label} className={`flow-step ${state}`} aria-current={state === "current" ? "step" : undefined}>
                <span className="flow-dot">{state === "done" ? <><DrawnCheck /><span className="sr-only">Completed</span></> : i + 1}</span>
                <span className="flow-label">{label}</span>
                {i < 3 && <span className="flow-connector" aria-hidden="true"><motion.span initial={{ scaleX: reduced && i < step ? 1 : 0 }} animate={{ scaleX: bookingProgress(step) * 3 > i ? 1 : 0 }} transition={{ duration: reduced ? 0 : bookingMotion.morph, ease: motionTokens.easing.transition }} /></span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <motion.main className="flow-main" initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : motionTokens.duration.standard }}>
        {back && <div className="flow-back"><ChevronLeft size={16} aria-hidden="true" />{back}</div>}
        {children}
      </motion.main>
      {bar && <div className="flow-bar">{bar}</div>}
    </div>
  );
}

export function FareBar({ total, note, action }: { total: string; note: string; action: ReactNode }) {
  return (
    <FareBarMotion total={total}>
      <div><span className="fare-bar-note">{note}</span><strong className="fare-bar-total"><RollingFare total={total} /></strong></div>
      {action}
    </FareBarMotion>
  );
}
