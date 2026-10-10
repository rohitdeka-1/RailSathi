import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CountFare, TrainSkeletons, useBookingReducedMotion } from "@/components/booking-motion";
import { bookingMotion, motionTokens } from "@/lib/motion";
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight, CalendarDays, TrainFront, ChevronDown } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { BookingShell, FareBar } from "@/components/booking-shell";
import { parseTrip, sampleTrains, rupees, tripDateLabel, type Availability, type Train } from "@/lib/trip";

export const Route = createFileRoute("/trains")({
  validateSearch: parseTrip,
  head: () => ({ meta: [
    { title: "Choose your train — Rail Daddy" },
    { name: "description", content: "Compare trains on your route: timings, duration, seat availability by class and fares." },
    { property: "og:title", content: "Choose your train — Rail Daddy" },
    { property: "og:description", content: "Compare trains, timings, class availability and fares on one screen." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Results,
});

export const statusIcon: Record<Availability, typeof CheckCircle2> = { Available: CheckCircle2, RAC: AlertTriangle, Waitlist: Clock };
const statusText = (s: Availability, n: number) => s === "Available" ? `Available ${n}` : s === "RAC" ? `RAC ${n}` : `Waitlist ${n}`;

function Results() {
  const trip = Route.useSearch();
  const reduced = useBookingReducedMotion();
  const [readyKey, setReadyKey] = useState("");
  const resultsKey = `${trip.from}:${trip.to}:${trip.date}`;
  const loading = !reduced && readyKey !== resultsKey;
  useEffect(() => { const timer = window.setTimeout(() => setReadyKey(resultsKey), reduced ? 0 : bookingMotion.loadingPreview * 1000); return () => clearTimeout(timer); }, [resultsKey, reduced]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const navigate = useNavigate();
  const trains = sampleTrains(trip.from, trip.to, trip.date);
  const [pick, setPick] = useState<{ train: string; cls: string } | null>(null);
  const picked = pick && trains.find((t) => t.number === pick.train)?.offers.find((o) => o.cls === pick.cls);
  const isFull = (t: Train) => t.offers.every((o) => o.status === "Waitlist");
  const go = () => pick && navigate({ to: "/seats", search: { ...trip, train: pick.train, cls: pick.cls } });

  return (
    <BookingShell step={1} trip={trip}
      back={<Link to="/">Edit search</Link>}
      bar={<FareBar note={picked && pick ? `${pick.cls} · ${trip.pax} passenger${trip.pax > 1 ? "s" : ""}` : "Pick a class to continue"} total={picked ? rupees(picked.fare * trip.pax) : "—"} action={<Button variant="journey" className="flow-cta" disabled={!picked} onClick={go}>Choose seats <ArrowRight size={18} /></Button>} />}>
      <div className="flow-title-row">
        <h1 className="flow-title">{trains.length} trains · {tripDateLabel(trip.date)}</h1>
        <p className="flow-sub">Sample timings and fares — live availability isn’t connected yet.</p>
      </div>
      {loading ? <TrainSkeletons /> : <motion.ul key={resultsKey} className="train-list" initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : motionTokens.duration.standard }}>
        {trains.map((t, index) => {
          const full = isFull(t);
          return (
            <motion.li key={t.number} data-motion-owned="true" className={`train-card ${full ? "is-full" : ""}`} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : motionTokens.duration.entrance, delay: reduced ? 0 : index * bookingMotion.cardStagger, ease: motionTokens.easing.entrance }}>
              <div className="train-head">
                <div><h2 className="train-name">{t.name}</h2><span className="train-number"><TrainFront size={14} aria-hidden="true" />#{t.number}</span></div>
                {full && <span className="status-tag waitlist"><XCircle size={14} aria-hidden="true" />Train full</span>}
              </div>
              <div className="train-times">
                <div><strong>{t.depart}</strong><span>{trip.from}</span></div>
                <div className="train-duration"><span>{t.duration}</span><i aria-hidden="true" /></div>
                <div className="end"><strong>{t.arrive}{t.days && <sup>{t.days}</sup>}</strong><span>{trip.to}</span></div>
              </div>
              <div className="class-offers" role="radiogroup" aria-label={`Classes on ${t.name}`}>
                {t.offers.map((o, chipIndex) => {
                  const Icon = statusIcon[o.status];
                  const on = pick?.train === t.number && pick.cls === o.cls;
                  return (
                    <Button variant="ghost" asChild key={o.cls}>
                    <motion.button type="button" data-motion-owned="true" role="radio" aria-checked={on} className={`offer-chip ${o.status.toLowerCase()} ${on ? "on" : ""}`} onClick={() => setPick({ train: t.number, cls: o.cls })} initial={{ scale: reduced ? 1 : 0.9, opacity: reduced ? 1 : 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={reduced ? {} : { scale: motionTokens.scale.hover }} whileTap={reduced ? {} : { scale: motionTokens.scale.press }} transition={{ ...motionTokens.spring.snappy, delay: reduced ? 0 : index * bookingMotion.cardStagger + chipIndex * bookingMotion.chipStagger }}>
                      <span className="offer-top"><b>{o.cls}</b><span className="offer-fare"><CountFare value={o.fare} delay={reduced ? 0 : index * bookingMotion.cardStagger + chipIndex * bookingMotion.chipStagger} /></span></span>
                      <span className="offer-status"><Icon size={14} aria-hidden="true" />{statusText(o.status, o.count)}</span>
                    </motion.button></Button>
                  );
                })}
              </div>
              <Button variant="ghost" className="train-details-toggle" aria-expanded={expanded.includes(t.number)} aria-controls={`details-${t.number}`} onClick={() => setExpanded(current => current.includes(t.number) ? current.filter(n => n !== t.number) : [...current, t.number])}>Journey details <motion.span animate={{ rotate: expanded.includes(t.number) ? 180 : 0 }} transition={{ duration: reduced ? 0 : motionTokens.duration.micro }}><ChevronDown size={16} /></motion.span></Button>
              <AnimatePresence initial={false}>{expanded.includes(t.number) && <motion.div id={`details-${t.number}`} className="train-expansion" initial={{ height: reduced ? 'auto' : 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: reduced ? 0 : bookingMotion.expand, ease: motionTokens.easing.transition }}><motion.div className="train-details" initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : motionTokens.duration.micro, delay: reduced ? 0 : bookingMotion.expand }}><span><TrainFront size={16} />{trip.from} → {trip.to}</span><span><Clock size={16} />{t.duration} · {t.depart}–{t.arrive}</span><span><CalendarDays size={16} />{tripDateLabel(trip.date)} · {trip.quota} quota</span></motion.div></motion.div>}</AnimatePresence>
              {full && <Alternates trip={trip} trains={trains.filter((x) => !isFull(x) && x.number !== t.number).slice(0, 2)} />}
            </motion.li>
          );
        })}
      </motion.ul>}
      <div className="flow-desktop-cta">
        {picked && pick ? <p>{pick.cls} on #{pick.train} · <strong>{rupees(picked.fare * trip.pax)}</strong> for {trip.pax}</p> : <p>Pick a class on any train to continue.</p>}
        <Button variant="journey" className="flow-cta" disabled={!picked} onClick={go}>Choose seats <ArrowRight size={18} /></Button>
      </div>
    </BookingShell>
  );
}

function Alternates({ trip, trains }: { trip: ReturnType<typeof parseTrip>; trains: Train[] }) {
  const d = parseISO(trip.date);
  const dates = [addDays(d, -1), addDays(d, 1), addDays(d, 2)].filter((x) => x >= addDays(new Date(), -1));
  return (
    <div className="alternates">
      <p className="alternates-title"><AlertTriangle size={16} aria-hidden="true" />All classes are waitlisted. Try these instead:</p>
      <div className="alternates-row">
        {trains.map((t) => (
          <a key={t.number} href={`#`} onClick={(e) => { e.preventDefault(); document.querySelectorAll(".train-card")[sampleTrains(trip.from, trip.to, trip.date).findIndex((x) => x.number === t.number)]?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="alt-chip"><TrainFront size={14} aria-hidden="true" />{t.name.split(" ").slice(1).join(" ")} · {t.depart}</a>
        ))}
        {dates.map((x) => (
          <Link key={x.toISOString()} to="/trains" search={{ ...trip, date: format(x, "yyyy-MM-dd") }} className="alt-chip"><CalendarDays size={14} aria-hidden="true" />{format(x, "EEE, d MMM")}</Link>
        ))}
      </div>
    </div>
  );
}
