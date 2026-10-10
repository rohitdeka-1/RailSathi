import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, AlertCircle, User } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { BookingShell, FareBar } from "@/components/booking-shell";
import { parseTrip, findTrain, offerFor, rupees } from "@/lib/trip";

export const Route = createFileRoute("/passengers")({
  validateSearch: parseTrip,
  head: () => ({ meta: [
    { title: "Passenger details — Rail Daddy" },
    { name: "description", content: "Add traveller names, ages and contact details for your train booking." },
    { property: "og:title", content: "Passenger details — Rail Daddy" },
    { property: "og:description", content: "Add traveller and contact details before payment." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Passengers,
});

const paxSchema = z.object({
  name: z.string().trim().min(2, "Enter the full name as on ID").max(60, "Keep the name under 60 characters").regex(/^[A-Za-z .'-]+$/, "Use letters only"),
  age: z.string().trim().regex(/^\d{1,3}$/, "Enter age in years").refine((v) => +v >= 1 && +v <= 120, "Age must be between 1 and 120"),
  gender: z.enum(["Female", "Male", "Other"], { message: "Choose a gender" }),
});
const contactSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  email: z.string().trim().email("Enter a valid email, like name@mail.com").max(255),
});

type Pax = { name: string; age: string; gender: string };
type Errors = Record<string, string>;

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string | undefined; hint?: string | undefined; children: React.ReactNode }) {
  return (
    <div className={`form-field ${error ? "invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p id={`${id}-err`} className="field-error"><AlertCircle size={14} aria-hidden="true" />{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

function Passengers() {
  const trip = Route.useSearch();
  const navigate = useNavigate();
  const offer = offerFor(findTrain(trip), trip.cls);
  const seats = trip.seats?.split(",") ?? [];
  const [pax, setPax] = useState<Pax[]>(() => Array.from({ length: trip.pax }, () => ({ name: "", age: "", gender: "" })));
  const [contact, setContact] = useState({ phone: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const total = (offer?.fare ?? 0) * trip.pax;

  const checkPax = (i: number, p: Pax, key: keyof Pax) => {
    const r = paxSchema.shape[key].safeParse(p[key]);
    setErrors((e) => ({ ...e, [`p${i}-${key}`]: r.success ? "" : r.error.issues[0]!.message }));
  };
  const checkContact = (key: "phone" | "email") => {
    const r = contactSchema.shape[key].safeParse(contact[key]);
    setErrors((e) => ({ ...e, [key]: r.success ? "" : r.error.issues[0]!.message }));
  };
  const update = (i: number, key: keyof Pax, v: string) => {
    setPax((list) => list.map((p, k) => k === i ? { ...p, [key]: v } : p));
    if (errors[`p${i}-${key}`]) setErrors((e) => ({ ...e, [`p${i}-${key}`]: "" }));
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    pax.forEach((p, i) => { const r = paxSchema.safeParse(p); if (!r.success) r.error.issues.forEach((iss) => { next[`p${i}-${String(iss.path[0])}`] ??= iss.message; }); });
    const c = contactSchema.safeParse(contact); if (!c.success) c.error.issues.forEach((iss) => { next[String(iss.path[0])] ??= iss.message; });
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) { document.getElementById(first)?.focus(); return; }
    navigate({ to: "/payment", search: trip });
  }
  const aria = (id: string) => ({ id, "aria-invalid": !!errors[id], "aria-describedby": errors[id] ? `${id}-err` : undefined });
  const cta = <Button variant="journey" type="submit" form="pax-form" className="flow-cta">Continue to pay <ArrowRight size={18} /></Button>;

  return (
    <BookingShell step={2} trip={trip} back={<Link to="/seats" search={trip}>Back to seats</Link>}
      bar={<FareBar note={`${trip.pax} passenger${trip.pax > 1 ? "s" : ""} · ${trip.cls}`} total={rupees(total)} action={cta} />}>
      <div className="flow-title-row"><h1 className="flow-title">Who’s travelling?</h1><p className="flow-sub">Names must match a government ID shown on board.</p></div>
      <form id="pax-form" noValidate onSubmit={submit} className="pax-form">
        {pax.map((p, i) => (
          <fieldset key={i} className="flow-card">
            <legend className="pax-legend"><User size={16} aria-hidden="true" />Passenger {i + 1}{seats[i] && <span>Seat {seats[i]}</span>}</legend>
            <div className="form-grid">
              <Field id={`p${i}-name`} label="Full name" error={errors[`p${i}-name`]}>
                <input {...aria(`p${i}-name`)} autoComplete="name" maxLength={60} value={p.name} placeholder="e.g. Priya Sharma" onChange={(e) => update(i, "name", e.target.value)} onBlur={() => checkPax(i, p, "name")} />
              </Field>
              <Field id={`p${i}-age`} label="Age" error={errors[`p${i}-age`]}>
                <input {...aria(`p${i}-age`)} inputMode="numeric" maxLength={3} value={p.age} placeholder="Years" onChange={(e) => update(i, "age", e.target.value.replace(/\D/g, ""))} onBlur={() => checkPax(i, p, "age")} />
              </Field>
              <Field id={`p${i}-gender`} label="Gender" error={errors[`p${i}-gender`]}>
                <select {...aria(`p${i}-gender`)} value={p.gender} onChange={(e) => { update(i, "gender", e.target.value); }} onBlur={() => checkPax(i, p, "gender")}>
                  <option value="">Select</option><option>Female</option><option>Male</option><option>Other</option>
                </select>
              </Field>
            </div>
          </fieldset>
        ))}
        <fieldset className="flow-card">
          <legend className="pax-legend">Contact for ticket updates</legend>
          <div className="form-grid two">
            <Field id="phone" label="Mobile number" error={errors["phone"]} hint="We’ll send the PNR by SMS.">
              <input {...aria("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={contact.phone} placeholder="10-digit number" onChange={(e) => { setContact((c) => ({ ...c, phone: e.target.value.replace(/\D/g, "") })); setErrors((x) => ({ ...x, phone: "" })); }} onBlur={() => checkContact("phone")} />
            </Field>
            <Field id="email" label="Email" error={errors["email"]} hint="Your e-ticket goes here.">
              <input {...aria("email")} type="email" autoComplete="email" maxLength={255} value={contact.email} placeholder="name@mail.com" onChange={(e) => { setContact((c) => ({ ...c, email: e.target.value })); setErrors((x) => ({ ...x, email: "" })); }} onBlur={() => checkContact("email")} />
            </Field>
          </div>
        </fieldset>
      </form>
      <div className="flow-desktop-cta"><p>Total for {trip.pax}: <strong>{rupees(total)}</strong></p>{cta}</div>
    </BookingShell>
  );
}
