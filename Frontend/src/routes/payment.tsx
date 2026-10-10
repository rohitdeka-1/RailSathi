import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle, CreditCard, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { BookingShell, FareBar } from "@/components/booking-shell";
import { PaymentTicket } from "@/components/payment-ticket";
import { parseTrip, findTrain, offerFor, rupees, tripDateLabel } from "@/lib/trip";

export const Route = createFileRoute("/payment")({
  validateSearch: parseTrip,
  head: () => ({ meta: [
    { title: "Pay for your ticket — Rail Daddy" },
    { name: "description", content: "Review your fare and pay securely by UPI or card." },
    { property: "og:title", content: "Pay for your ticket — Rail Daddy" },
    { property: "og:description", content: "Review the fare breakdown and pay by UPI or card." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Payment,
});

const upiSchema = z.string().trim().regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, "Enter a UPI ID like name@okbank");
const cardSchema = {
  number: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY, e.g. 08/28"),
  cvv: z.string().regex(/^\d{3}$/, "CVV is the 3 digits on the back"),
  name: z.string().trim().min(2, "Enter the name on the card").max(60),
};

function Payment() {
  const trip = Route.useSearch();
  const train = findTrain(trip);
  const offer = offerFor(train, trip.cls);
  const fare = (offer?.fare ?? 0) * trip.pax;
  const fee = 20 * trip.pax;
  const total = fare + fee;
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const check = (key: string, value: string) => {
    const schema = key === "upi" ? upiSchema : cardSchema[key as keyof typeof cardSchema];
    const r = schema.safeParse(value);
    setErrors((e) => ({ ...e, [key]: r.success ? "" : r.error.issues[0]?.message ?? "Check this value" }));
    return r.success;
  };
  function pay(e: FormEvent) {
    e.preventDefault();
    const ok = method === "upi" ? check("upi", upi) : (Object.keys(cardSchema) as (keyof typeof card)[]).map((k) => check(k, card[k])).every(Boolean);
    if (ok) setDone(true);
  }
  const field = (id: string, label: string, input: React.ReactNode) => (
    <div className={`form-field ${errors[id] ? "invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>{input}
      {errors[id] && <p id={`${id}-err`} className="field-error"><AlertCircle size={14} aria-hidden="true" />{errors[id]}</p>}
    </div>
  );
  const a = (id: string) => ({ id, "aria-invalid": !!errors[id], "aria-describedby": errors[id] ? `${id}-err` : undefined });
  const cta = <Button variant="journey" type="submit" form="pay-form" className="flow-cta"><Lock size={16} />Pay {rupees(total)}</Button>;

  if (done) return (
    <BookingShell step={3} trip={trip}>
      <PaymentTicket trip={trip} train={train} />
    </BookingShell>
  );

  return (
    <BookingShell step={3} trip={trip} back={<Link to="/passengers" search={trip}>Back to passengers</Link>}
      bar={<FareBar note="Total incl. fees" total={rupees(total)} action={cta} />}>
      <div className="flow-title-row"><h1 className="flow-title">Pay securely</h1><p className="flow-sub">Tickets are issued through authorized Indian Railways channels.</p></div>
      <div className="pay-grid">
        <form id="pay-form" noValidate onSubmit={pay} className="flow-card">
          <div className="pay-tabs" role="radiogroup" aria-label="Payment method">
            <button type="button" role="radio" aria-checked={method === "upi"} className={method === "upi" ? "on" : ""} onClick={() => setMethod("upi")}><Smartphone size={18} />UPI</button>
            <button type="button" role="radio" aria-checked={method === "card"} className={method === "card" ? "on" : ""} onClick={() => setMethod("card")}><CreditCard size={18} />Card</button>
          </div>
          {method === "upi" ? (
            <div className="form-grid">{field("upi", "UPI ID", <input {...a("upi")} value={upi} maxLength={60} placeholder="name@okbank" onChange={(e) => { setUpi(e.target.value); setErrors((x) => ({ ...x, upi: "" })); }} onBlur={() => upi && check("upi", upi)} />)}</div>
          ) : (
            <div className="form-grid two">
              <div className="span-2">{field("number", "Card number", <input {...a("number")} inputMode="numeric" autoComplete="cc-number" maxLength={16} value={card.number} placeholder="16 digits" onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/\D/g, "") }))} onBlur={() => card.number && check("number", card.number)} />)}</div>
              {field("expiry", "Expiry", <input {...a("expiry")} autoComplete="cc-exp" maxLength={5} value={card.expiry} placeholder="MM/YY" onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setCard((c) => ({ ...c, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d })); }} onBlur={() => card.expiry && check("expiry", card.expiry)} />)}
              {field("cvv", "CVV", <input {...a("cvv")} type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={3} value={card.cvv} placeholder="3 digits" onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "") }))} onBlur={() => card.cvv && check("cvv", card.cvv)} />)}
              <div className="span-2">{field("name", "Name on card", <input {...a("name")} autoComplete="cc-name" maxLength={60} value={card.name} placeholder="As printed on card" onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} onBlur={() => card.name && check("name", card.name)} />)}</div>
            </div>
          )}
          <p className="trust-line"><ShieldCheck size={16} aria-hidden="true" />Secure payment · Full refund if the ticket isn’t confirmed</p>
          <div className="flow-desktop-cta inline">{cta}</div>
        </form>
        <aside className="flow-card fare-summary" aria-label="Fare summary">
          <h2>Fare summary</h2>
          <p className="fare-train">{train?.name} #{train?.number}<br /><span>{tripDateLabel(trip.date)} · {train?.depart} → {train?.arrive} · {trip.cls}</span></p>
          <dl>
            <div><dt>Ticket fare ({trip.pax} × {rupees(offer?.fare ?? 0)})</dt><dd>{rupees(fare)}</dd></div>
            <div><dt>Convenience fee</dt><dd>{rupees(fee)}</dd></div>
            <div className="total"><dt>Total</dt><dd>{rupees(total)}</dd></div>
          </dl>
          <p className="field-hint">Seats: {trip.seats?.split(",").join(", ") || "—"}</p>
        </aside>
      </div>
    </BookingShell>
  );
}
