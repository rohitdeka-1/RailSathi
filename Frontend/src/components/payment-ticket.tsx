import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, TrainFront } from "lucide-react";
import qrcode from "qrcode-generator";
import { Button } from "@/components/ui/button";
import { motionTokens, ticketMotion } from "@/lib/motion";
import { tripDateLabel, type Trip, type Train } from "@/lib/trip";

function PreviewQR() {
  const { size, path } = useMemo(() => {
    const code = qrcode(0, "M");
    code.addData("Rail Daddy design preview. Not a valid travel ticket. No payment taken.");
    code.make();
    const count = code.getModuleCount();
    const cells: string[] = [];
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (code.isDark(row, col)) cells.push(`M${col + 4},${row + 4}h1v1h-1z`);
      }
    }
    return { size: count + 8, path: cells.join("") };
  }, []);
  return <svg className="ticket-qr-code" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Preview QR code — not valid for travel" shapeRendering="crispEdges"><path d={path} fill="currentColor" /></svg>;
}

export function PaymentTicket({ trip, train }: { trip: Trip; train: Train | undefined }) {
  const reduced = !!useReducedMotion();
  const [sparks, setSparks] = useState(!reduced);
  useEffect(() => {
    if (reduced) { setSparks(false); return; }
    const timer = setTimeout(() => setSparks(false), (ticketMotion.checkDelay + ticketMotion.sparks) * 1000);
    return () => clearTimeout(timer);
  }, [reduced]);
  const timing = (delay: number, duration: number = motionTokens.duration.standard) => ({
    delay: reduced ? 0 : delay, duration: reduced ? 0 : duration, ease: motionTokens.easing.entrance,
  });
  const details = [
    { label: "Train", value: train ? `${train.name} · #${train.number}` : "No train selected" },
    { label: "Seat & class", value: `${trip.seats?.split(",").join(", ") || "Not selected"} · ${trip.cls} · ${trip.pax} traveller${trip.pax > 1 ? "s" : ""}` },
    { label: "Departure", value: `${tripDateLabel(trip.date)} · ${train?.depart || "—"}` },
  ];
  return <section className="payment-celebration" aria-labelledby="ticket-success-title" data-motion-owned="true">
    <motion.article className="payment-ticket" aria-label="Journey preview ticket" initial={reduced ? false : { opacity: 0, y: ticketMotion.rise, rotate: ticketMotion.tilt }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={timing(0, ticketMotion.entrance)}>
      <div className="ticket-topline"><span><TrainFront size={18} aria-hidden="true" />Rail Daddy</span><span>Preview ticket</span></div>
      <div className="ticket-success-icon" aria-hidden="true">
        <motion.span className="ticket-success-ring" initial={reduced ? false : { scale: 0.65, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={timing(ticketMotion.checkDelay)} />
        {!reduced && <motion.span className="ticket-circle-burst" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [0.8, 1.9], opacity: [0, 0.55, 0] }} transition={timing(ticketMotion.checkDelay, ticketMotion.check + 0.2)} />}
        <svg viewBox="0 0 48 48" fill="none"><motion.path d="M13 24l8 8 14-16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={timing(ticketMotion.checkDelay, ticketMotion.check)} /></svg>
      </div>
      <h1 className="flow-title" id="ticket-success-title">Booking request sent</h1>
      <p className="ticket-preview-note" role="status">This is a design preview — no payment was taken and no ticket was issued.</p>
      <div className="ticket-route"><strong>{trip.from}</strong><ArrowRight size={20} aria-hidden="true" /><strong>{trip.to}</strong></div>
      <div className="ticket-perforation" aria-hidden="true" />
      <div className="ticket-body">
        <dl className="ticket-details">{details.map((detail, index) => <motion.div key={detail.label} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={timing(ticketMotion.detailsDelay + index * ticketMotion.detailStagger)}><dt>{detail.label}</dt><dd>{detail.value}</dd></motion.div>)}</dl>
        <div className="ticket-qr"><div className="ticket-qr-window"><PreviewQR />{!reduced && <motion.div className="ticket-qr-cover" aria-hidden="true" initial={{ y: "0%" }} animate={{ y: "101%" }} transition={timing(ticketMotion.qrDelay, ticketMotion.qr)}><span /></motion.div>}</div><span>Not valid for travel</span></div>
      </div>
      <div className="ticket-tear-slot" aria-hidden="true">{!reduced && <motion.div className="ticket-tear-strip" initial={{ y: 0, rotate: 0, opacity: 1 }} animate={{ y: 28, rotate: 3, opacity: 0 }} transition={timing(ticketMotion.tearDelay, ticketMotion.tear)}><span /></motion.div>}</div>
      {sparks && !reduced && <div className="ticket-sparks" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 70 + (i % 4) * 18;
        return <motion.i key={i} className={i % 3 === 0 ? "round" : ""} initial={{ x: 0, y: 0, scale: 0, opacity: 0 }} animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance + 40, scale: [0, 1, 0.5], opacity: [0, 0.7, 0], rotate: i * 36 }} transition={{ ...timing(ticketMotion.checkDelay, ticketMotion.sparks), ease: motionTokens.easing.transition }} />;
      })}</div>}
    </motion.article>
    <Button asChild variant="journey" className="flow-cta"><Link to="/">Plan another trip<ArrowRight size={18} aria-hidden="true" /></Link></Button>
  </section>;
}