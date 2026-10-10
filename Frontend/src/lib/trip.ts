import { addDays, format, parseISO, isValid } from "date-fns";

/** Trip details carried between the post-search screens via URL search params. */
export type Trip = {
  from: string;
  to: string;
  date: string; // yyyy-MM-dd
  cls: string;
  pax: number;
  quota: string;
  train?: string | undefined;
  seats?: string | undefined; // comma-separated seat ids
};

const str = (v: unknown, d = "") => (typeof v === "string" && v.length < 80 ? v : d);

export function parseTrip(s: Record<string, unknown>): Trip {
  const pax = Number(s["pax"]);
  const date = str(s["date"]);
  return {
    from: str(s["from"], "New Delhi"),
    to: str(s["to"], "Jaipur"),
    date: isValid(parseISO(date)) ? date : format(addDays(new Date(), 1), "yyyy-MM-dd"),
    cls: ["SL", "3A", "2A", "1A"].includes(str(s["cls"])) ? str(s["cls"]) : "3A",
    pax: Number.isInteger(pax) && pax >= 1 && pax <= 9 ? pax : 1,
    quota: ["General", "Tatkal", "Ladies", "Senior Citizen"].includes(str(s["quota"])) ? str(s["quota"]) : "General",
    train: str(s["train"]) || undefined,
    seats: str(s["seats"]) || undefined,
  };
}

export type Availability = "Available" | "RAC" | "Waitlist";
export type ClassOffer = { cls: string; status: Availability; count: number; fare: number };
export type Train = { number: string; name: string; depart: string; arrive: string; duration: string; days: string; offers: ClassOffer[] };

const names = ["Shatabdi Express", "Rajdhani Express", "Vande Bharat Express", "Superfast Mail", "Intercity Express", "Duronto Express"];
const base: Record<string, number> = { SL: 1, "3A": 2.6, "2A": 3.7, "1A": 6.2 };

function hash(s: string) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

/** Deterministic sample trains for a route/date — design preview data, not live inventory. */
export function sampleTrains(from: string, to: string, date: string): Train[] {
  const seed = hash(from + to + date);
  return Array.from({ length: 5 }, (_, i) => {
    const h = hash(seed + ":" + i);
    const dep = (5 * 60 + i * 190 + (h % 50)) % (24 * 60);
    const dur = 240 + (h % 420);
    const arr = (dep + dur) % (24 * 60);
    const t = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const baseFare = 180 + (h % 260);
    const offers: ClassOffer[] = ["SL", "3A", "2A", "1A"].filter((_, k) => !(i === 0 && k === 0)).map((cls, k) => {
      const r = (h >> (k * 3)) % 7;
      const status: Availability = i === 2 ? "Waitlist" : r < 4 ? "Available" : r < 6 ? "RAC" : "Waitlist";
      return { cls, status, count: status === "Available" ? 8 + ((h >> k) % 120) : 2 + ((h >> k) % 30), fare: Math.round(baseFare * base[cls]! / 5) * 5 };
    });
    return {
      number: String(12000 + (h % 8000)),
      name: `${to.split(" ")[0]} ${names[(h + i) % names.length]}`,
      depart: t(dep), arrive: t(arr),
      duration: `${Math.floor(dur / 60)}h ${String(dur % 60).padStart(2, "0")}m`,
      days: dep + dur >= 24 * 60 ? "+1 day" : "",
      offers,
    };
  });
}

export const findTrain = (trip: Trip) => sampleTrains(trip.from, trip.to, trip.date).find((t) => t.number === trip.train);
export const offerFor = (train: Train | undefined, cls: string) => train?.offers.find((o) => o.cls === cls);
export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const tripDateLabel = (d: string) => format(parseISO(d), "EEE, d MMM");
