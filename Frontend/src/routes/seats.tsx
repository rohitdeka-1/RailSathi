import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingShell, FareBar } from "@/components/booking-shell";
import { parseTrip, findTrain, offerFor, rupees } from "@/lib/trip";

export const Route = createFileRoute("/seats")({
  validateSearch: parseTrip,
  head: () => ({ meta: [
    { title: "Pick your seats — Rail Daddy" },
    { name: "description", content: "Choose berths in your coach before adding passenger details." },
    { property: "og:title", content: "Pick your seats — Rail Daddy" },
    { property: "og:description", content: "Choose lower, middle, upper or side berths in your coach." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Seats,
});

const berthTypes = ["Lower", "Middle", "Upper", "Lower", "Middle", "Upper", "Side lower", "Side upper"];

function Seats() {
  const trip = Route.useSearch();
  const navigate = useNavigate();
  const train = findTrain(trip);
  const offer = offerFor(train, trip.cls);
  const [selected, setSelected] = useState<string[]>(trip.seats?.split(",").filter(Boolean) ?? []);
  const [error, setError] = useState("");
  const coach = `${trip.cls === "SL" ? "S" : trip.cls === "3A" ? "B" : trip.cls === "2A" ? "A" : "H"}2`;
  const seed = Number(trip.train ?? 1);
  const taken = (n: number) => (n * 7 + seed) % 5 === 0;
  const total = (offer?.fare ?? 0) * trip.pax;

  function toggle(id: string) {
    setError("");
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length >= trip.pax ? [...s.slice(1), id] : [...s, id]);
  }
  function next() {
    if (selected.length !== trip.pax) { setError(`Pick ${trip.pax - selected.length} more seat${trip.pax - selected.length > 1 ? "s" : ""} — one for each passenger.`); return; }
    navigate({ to: "/passengers", search: { ...trip, seats: selected.join(",") } });
  }
  const cta = <Button variant="journey" className="flow-cta" onClick={next}>Add passengers <ArrowRight size={18} /></Button>;

  if (!train || !offer) return (
    <BookingShell step={1} trip={trip} back={<Link to="/trains" search={trip}>Back to trains</Link>}>
      <p className="flow-empty">That train isn’t available any more. <Link to="/trains" search={trip}>Choose another train</Link>.</p>
    </BookingShell>
  );

  return (
    <BookingShell step={1} trip={trip} back={<Link to="/trains" search={{ ...trip, train: undefined, seats: undefined }}>Back to trains</Link>}
      bar={<FareBar note={`${selected.length}/${trip.pax} seats · ${trip.cls}`} total={rupees(total)} action={cta} />}>
      <div className="flow-title-row">
        <h1 className="flow-title">Pick {trip.pax} seat{trip.pax > 1 ? "s" : ""}</h1>
        <p className="flow-sub">{train.name} #{train.number} · Coach {coach} · {train.depart} → {train.arrive}</p>
      </div>
      <div className="flow-card">
        <div className="seat-legend"><span><i className="seat-key free" />Free</span><span><i className="seat-key on" />Your pick</span><span><i className="seat-key taken" />Booked</span></div>
        <div className="coach">
          {Array.from({ length: 6 }, (_, bay) => (
            <div key={bay} className="bay" aria-label={`Bay ${bay + 1}`}>
              {berthTypes.map((type, k) => {
                const n = bay * 8 + k + 1, id = `${coach}-${n}`;
                const isTaken = taken(n), on = selected.includes(id);
                return (
                  <button key={id} type="button" disabled={isTaken} aria-pressed={on} aria-label={`Seat ${n}, ${type}${isTaken ? ", booked" : ""}`} className={`seat ${k >= 6 ? "side" : ""} ${on ? "on" : ""}`} onClick={() => toggle(id)}>
                    <b>{n}</b><span>{type === "Side lower" ? "Side low" : type === "Side upper" ? "Side up" : type}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {error && <p className="field-error" role="alert"><AlertCircle size={16} aria-hidden="true" />{error}</p>}
      </div>
      <div className="flow-desktop-cta"><p>{selected.length ? selected.join(", ") : "No seats picked yet"} · <strong>{rupees(total)}</strong></p>{cta}</div>
    </BookingShell>
  );
}
