import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowDownUp, ArrowRight, ArrowUpRight, CalendarDays, Check, MapPin, Menu, MessageCircle, Sparkles, TrainFront, AlertCircle, X, Users, Minus, Plus, History, ChevronDown, ShieldCheck, RotateCcw, Mic, Send } from "lucide-react";
import { addDays, format, isSameDay, nextSaturday, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { DatePanel } from "@/components/date-panel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import heroAvif from "@/assets/midnight-lake.avif.asset.json";
import heroWebp from "@/assets/midnight-lake.webp.asset.json";
import heroPlaceholder from "@/assets/midnight-lake-placeholder.webp.asset.json";
import { useHomeEntrance } from "@/hooks/use-home-entrance";
import { HeroAtmosphere, useHeroDepth } from "@/components/hero-depth";
import { AnimatePresence, LayoutGroup, motion, DrawnCheck, SelectionMark, RollingNumber, SearchAction, SearchCalendarDay, useSearchMicroMotion } from "@/components/search-motion";
import { useReducedMotion } from "framer-motion";
import { motionTokens, searchMotion } from "@/lib/motion";
import { RouteCard } from "@/components/route-card";
import { CityMarquee } from "@/components/city-marquee";
import { useBookingTransition } from "@/components/booking-motion";
import { ThemeToggle } from "@/components/global-polish";

export const Route = createFileRoute("/")({
  head: () => ({ links: [
    { rel: "preload", as: "image", href: heroAvif.url, type: "image/avif", fetchPriority: "high" },
  ], meta: [
    { title: "Rail Daddy — Find train routes & book tickets across India" },
    { name: "description", content: "Rail Daddy shows you available train routes and tickets: pick where from, where to, when, and your class." },
    { property: "og:title", content: "Rail Daddy — Find train routes & book tickets across India" },
    { property: "og:description", content: "Available train routes and tickets in one place: route, date, class and passengers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:image", content: heroWebp.url },
    { name: "twitter:image", content: heroWebp.url },
  ] }),
  component: Index,
});

const popularRoutes = [
  { from: "New Delhi", to: "Jaipur", fromLabel: "Delhi", toLabel: "Jaipur", note: "~4h 25m · from ₹350" },
  { from: "Mumbai Central", to: "Goa", fromLabel: "Mumbai", toLabel: "Goa", note: "~8h 30m · from ₹485" },
  { from: "New Delhi", to: "Varanasi", fromLabel: "Delhi", toLabel: "Varanasi", note: "~8h · from ₹420" },
  { from: "Bengaluru", to: "Chennai Central", fromLabel: "Bengaluru", toLabel: "Chennai", note: "~4h 25m · from ₹190" },
  { from: "New Delhi", to: "Shimla", fromLabel: "Delhi", toLabel: "Shimla", note: "~5h 30m · from ₹290" },
];
const marqueeCities = [
  ["DELHI", "New Delhi"],
  ["JAIPUR", "Jaipur"],
  ["GOA", "Goa"],
  ["VARANASI", "Varanasi"],
  ["SHIMLA", "Shimla"],
  ["MUMBAI", "Mumbai Central"],
  ["KOCHI", "Kochi"],
  ["DARJEELING", "Darjeeling"],
  ["UDAIPUR", "Udaipur"],
] as const;

type Station = { name: string; code: string; city: string };

const stations: Station[] = [
  { name: "New Delhi", code: "NDLS", city: "Delhi" },
  { name: "Mumbai Central", code: "BCT", city: "Mumbai" },
  { name: "Indore Junction", code: "INDB", city: "Indore" },
  { name: "Bengaluru", code: "SBC", city: "Bengaluru" },
  { name: "Chennai Central", code: "MAS", city: "Chennai" },
  { name: "Kolkata", code: "HWH", city: "Howrah" },
  { name: "Jaipur", code: "JP", city: "Jaipur" },
  { name: "Hyderabad", code: "HYB", city: "Hyderabad" },
  { name: "Pune", code: "PUNE", city: "Pune" },
  { name: "Ahmedabad", code: "ADI", city: "Ahmedabad" },
  { name: "Goa", code: "MAO", city: "Madgaon" },
  { name: "Varanasi", code: "BSB", city: "Varanasi" },
  { name: "Shimla", code: "SML", city: "Shimla" },
  { name: "Lucknow", code: "LKO", city: "Lucknow" },
  { name: "Bhopal", code: "BPL", city: "Bhopal" },
  { name: "Chandigarh", code: "CDG", city: "Chandigarh" },
  { name: "Patna", code: "PNBE", city: "Patna" },
  { name: "Kochi", code: "ERS", city: "Ernakulam" },
  { name: "Udaipur", code: "UDZ", city: "Udaipur" },
  { name: "Darjeeling", code: "NJP", city: "New Jalpaiguri" },
  { name: "Amritsar", code: "ASR", city: "Amritsar" },
  { name: "Agra Cantt", code: "AGC", city: "Agra" },
];
const popularStationNames = ["New Delhi", "Mumbai Central", "Bengaluru", "Indore Junction", "Goa"];
const findStation = (name: string) => stations.find((s) => s.name === name);
const shortName = (name: string) => findStation(name)?.city ?? name;

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = (row[0] ?? 0); row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = (row[j] ?? 0);
      row[j] = Math.min((row[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return (row[b.length] ?? 0);
}

/** Ranks stations by code, name, city, then typo-tolerant similarity. */
function searchStations(query: string): Station[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = stations.map((s) => {
    const name = s.name.toLowerCase(), city = s.city.toLowerCase(), code = s.code.toLowerCase();
    let score = 99;
    if (code === q) score = 0;
    else if (name.startsWith(q) || city.startsWith(q) || code.startsWith(q)) score = 1;
    else if (name.includes(q) || city.includes(q)) score = 2;
    else if (q.length >= 3) {
      const d = Math.min(editDistance(q, name.slice(0, q.length)), editDistance(q, city.slice(0, q.length)), editDistance(q, name), editDistance(q, city));
      if (d <= (q.length >= 6 ? 2 : 1)) score = 3 + d;
    }
    return { s, score };
  });
  return scored.filter((x) => x.score < 99).sort((a, b) => a.score - b.score).slice(0, 6).map((x) => x.s);
}

const classes = [
  { name: "SL", tip: "Sleeper: budget beds, open windows, no AC" },
  { name: "3A", tip: "AC 3-tier: air-conditioned, 6 berths per bay" },
  { name: "2A", tip: "AC 2-tier: more space, curtains, 4 berths per bay" },
  { name: "1A", tip: "First AC: private lockable cabins, most comfort" },
];

/** True on phone widths, where the search card switches to its compact row layout. */
function useCompactSearchCard() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return compact;
}

type StationFieldProps = {
  id: "source" | "destination";
  label: string;
  hint: string;
  errorText: string;
  placeholder: string;
  compactPlaceholder: string;
  compact: boolean;
  value: string;
  invalid: boolean;
  recent: string[];
  onChange: (value: string) => void;
};

function StationField({ id, label, hint, errorText, placeholder, compactPlaceholder, compact, value, invalid, recent, onChange }: StationFieldProps) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = value.trim();
  const groups: { title: string; items: Station[] }[] = [];
  if (query && !findStation(value)) {
    const found = searchStations(query);
    groups.push({ title: found.length ? "Matching stations" : "", items: found });
  } else {
    const recentItems = recent.map(findStation).filter((s): s is Station => !!s).slice(0, 3);
    if (recentItems.length) groups.push({ title: "Recent", items: recentItems });
    groups.push({ title: "Popular", items: popularStationNames.filter((n) => !recent.includes(n)).map(findStation).filter((s): s is Station => !!s) });
  }
  const flat = groups.flatMap((g) => g.items);

  function choose(station: Station) {
    onChange(station.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && open && flat.length > 0) {
      event.preventDefault();
      const station = flat[Math.max(activeIndex, 0)];
      if (station) choose(station);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  let running = -1;
  return (
    <div className={`station-field ${id}-field pop${invalid ? " field-invalid" : ""}${open ? " sheet-open" : ""}`}>
      <span className="field-focus-glow" aria-hidden="true" /><label htmlFor={id}><MapPin size={15} /> {label}</label>
      <span className="row-pin" aria-hidden="true"><MapPin size={16} /></span>
      <button type="button" className="sheet-close" aria-label="Close station search" onMouseDown={(event) => event.preventDefault()} onClick={() => { setOpen(false); (document.activeElement as HTMLElement | null)?.blur(); }}><X size={20} /></button>
      <input
        id={id}
        maxLength={100}
        value={value}
        onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
        aria-label={label}
        placeholder={compact ? compactPlaceholder : placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && flat.length > 0}
        aria-controls={`${id}-suggestions`}
        aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
      />
      <motion.span key={invalid ? "error" : "hint"} initial={invalid && !reduced ? { y: -8, opacity: 0 } : false} animate={{ y: 0, opacity: 1 }} transition={{ duration: motionTokens.duration.micro }} id={`${id}-hint`} className="field-hint">{invalid ? <><AlertCircle size={15} aria-hidden="true" /> {errorText}</> : (findStation(value) ? `${findStation(value)?.code} · ${findStation(value)?.city}` : hint)}</motion.span>
      <AnimatePresence>
      {open && flat.length > 0 && (
        <motion.div key="suggestions" data-motion-owned="true" initial={{ scaleY: reduced ? 1 : 0.85, opacity: reduced ? 1 : 0 }} animate={{ scaleY: 1, opacity: 1 }} exit={{ scaleY: reduced ? 1 : 0.95, opacity: 0 }} transition={{ duration: reduced ? 0 : motionTokens.duration.micro, ease: motionTokens.easing.entrance }} id={`${id}-suggestions`} className="station-suggestions" role="listbox"><LayoutGroup id={`${id}-suggestions`}>
          {groups.map((group) => (
            <div key={group.title} role="group" aria-label={group.title || "Stations"}>
              {group.title && <div className="suggestion-group">{group.title === "Recent" ? <History size={12} /> : null}{group.title}</div>}
              {group.items.map((station) => {
                running += 1;
                const index = running;
                return (
                  <motion.div key={station.code} className="suggestion-motion-row" initial={{ y: reduced ? 0 : -6, opacity: reduced ? 1 : 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: reduced ? 0 : motionTokens.duration.micro, delay: reduced ? 0 : index * searchMotion.suggestionStagger }}>
                  <Button
                    id={`${id}-option-${index}`}
                    key={station.code}
                    variant="ghost"
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={activeIndex === index ? "active" : ""}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(station)}
                  >
                    {activeIndex === index && <SelectionMark id="station-highlight" />}<MapPin size={14} /><span className="suggestion-name">{station.name}<small>{station.city}</small></span><span className="suggestion-code">{station.code}</span>
                  </Button></motion.div>
                );
              })}
            </div>
          ))}
        </LayoutGroup></motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function Index() {
  const { begin } = useBookingTransition();
  const homeRef = useRef<HTMLDivElement>(null);
  useHomeEntrance(homeRef);
  useHeroDepth(homeRef);
  const heroRef = useRef<HTMLImageElement>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = window.localStorage.getItem("rd-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("rd-theme", theme);
  }, [theme]);
  useEffect(() => {
    const image = heroRef.current;
    if (image?.complete && image.naturalWidth > 0) setHeroLoaded(true);
  }, []);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const compactCard = useCompactSearchCard();
  const today = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(new Date(), 1));
  const [date, setDate] = useState<Date | undefined>(tomorrow);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cardMode, setCardMode] = useState<"search" | "ai">("search");
  const [askText, setAskText] = useState("");
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const closeCalendar = useCallback(() => setCalendarOpen(false), []);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState({ source: false, destination: false, date: false });
  const [travelClass, setTravelClass] = useState("3A");
  const [passengers, setPassengers] = useState(2);
  const [dialog, setDialog] = useState<"journey" | "ai" | "about" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quota, setQuota] = useState("General");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [swapTurns, setSwapTurns] = useState(0);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [ctaFloating, setCtaFloating] = useState(false);
  useEffect(() => {
    const controls = homeRef.current?.querySelector(".booking-console");
    if (!controls) return;
    const observer = new IntersectionObserver((entries) => { const entry = entries[0]; if (entry) setCtaFloating(!entry.isIntersecting); }, { threshold: 0 });
    observer.observe(controls);
    return () => observer.disconnect();
  }, []);
  const submittingRef = useRef(false);
  const [counterDirection, setCounterDirection] = useState(1);
  const reduced = useReducedMotion();
  const { swapNames, leaveSearch } = useSearchMicroMotion(homeRef, swapTurns, validationAttempt);
  const [recent, setRecent] = useState<string[]>([]);
  const [lastSearch, setLastSearch] = useState<{ from: string; to: string; date: string } | null>(null);
  useEffect(() => {
    try {
      const r = JSON.parse(window.localStorage.getItem("rd-recent-stations") ?? "[]");
      if (Array.isArray(r)) setRecent(r.filter((x) => typeof x === "string").slice(0, 5));
      const l = JSON.parse(window.localStorage.getItem("rd-last-search") ?? "null");
      if (l && typeof l.from === "string" && typeof l.to === "string" && typeof l.date === "string") setLastSearch(l);
    } catch { /* ignore corrupt storage */ }
  }, []);
  const navigate = useNavigate();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    const invalid = { source: !source.trim(), destination: !destination.trim(), date: !date };
    setInvalidFields(invalid);
    setValidationAttempt(attempt => attempt + 1);
    if (invalid.source || invalid.destination || invalid.date) { setError("Fill in the highlighted fields to search."); return; }
    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) { setError("Choose a destination different from your departure."); return; }
    if (!date) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    const nextRecent = [destination.trim(), source.trim(), ...recent.filter((r) => r !== source.trim() && r !== destination.trim())].slice(0, 5);
    setRecent(nextRecent);
    const search = { from: source.trim(), to: destination.trim(), date: date ? date.toISOString() : "" };
    try { window.localStorage.setItem("rd-recent-stations", JSON.stringify(nextRecent)); window.localStorage.setItem("rd-last-search", JSON.stringify(search)); } catch { /* storage unavailable */ }
    await leaveSearch();
    const consoleElement = homeRef.current?.querySelector<HTMLElement>('.booking-console');
    if (consoleElement) {
      begin(consoleElement, { from: source.trim(), to: destination.trim(), date: format(date, "yyyy-MM-dd"), cls: travelClass, pax: passengers, quota });
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
    await navigate({ to: "/trains", search: { from: source.trim(), to: destination.trim(), date: format(date, "yyyy-MM-dd"), cls: travelClass, pax: passengers, quota } });
  }
  const renderPrefsControls = (groupId: string) => (
    <>
      <span className="controls-label">Class:</span>
      <LayoutGroup id={groupId}><div className="vibe-chips" role="radiogroup" aria-label="Travel class">
        {classes.map(({ name, tip }) => <Button variant="ghost" key={name} type="button" role="radio" aria-checked={travelClass === name} aria-describedby={`tip-${groupId}-${name}`} className={`vibe-chip ${travelClass === name ? "on" : ""}`} onClick={() => setTravelClass(name)}>{travelClass === name && <SelectionMark id="class-highlight" />}<span className="class-choice-content"><span className="class-check-slot">{travelClass === name && <DrawnCheck />}</span>{name}</span><span id={`tip-${groupId}-${name}`} role="tooltip" className="class-tip">{tip}</span></Button>)}
      </div></LayoutGroup>
      <span className="controls-divider" aria-hidden="true" />
      <div className="crew-stepper"><Users size={15} /><span>Passengers</span><Button variant="ghost" size="icon" type="button" aria-label="Fewer passengers" disabled={passengers <= 1} onClick={() => { setCounterDirection(-1); setPassengers(c => Math.max(1, c - 1)); }}><Minus size={16} /></Button><RollingNumber value={passengers} direction={counterDirection} /><Button variant="ghost" size="icon" type="button" aria-label="More passengers" disabled={passengers >= 9} onClick={() => { setCounterDirection(1); setPassengers(c => Math.min(9, c + 1)); }}><Plus size={16} /></Button></div>
      <span className="controls-divider" aria-hidden="true" />
      <label className="quota-field"><span className="controls-label">Quota</span><span className="quota-select"><select value={quota} onChange={(e) => setQuota(e.target.value)} aria-label="Quota">{["General", "Tatkal", "Ladies", "Senior Citizen"].map((q) => <option key={q} value={q}>{q}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
    </>
  );

  return (
    <div ref={homeRef} className={`railway-app${ctaFloating ? " cta-floating" : ""}`} data-home-entrance="pending">
      <div className="hero-dark">
      <header className="site-header reveal" style={{ ["--d" as string]: "0ms" }}>
        <a href="/" className="wordmark" aria-label="Rail Daddy home"><span className="wordmark-type" aria-hidden="true">RAIL <span className="wordmark-daddy">D<span className="wordmark-wink">A</span>DDY</span><span className="wordmark-stop">.</span></span></a>
        <nav aria-label="Main navigation"><Button variant="nav" className="active" onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Find a train</Button><Button variant="nav" onClick={() => setDialog("about")}>Why rail? <ArrowUpRight size={13} /></Button></nav>
        <div className="header-actions">
          <ThemeToggle theme={theme} onChange={setTheme} />
          <Button variant="travel" className="ai-cta" onClick={() => setDialog("ai")}>Ask Daddy AI <ArrowUpRight size={14} /><span className="ai-tip" role="tooltip">Ask: best train to Goa this weekend</span></Button>
          <button type="button" className="ai-icon-btn" aria-label="Ask Daddy AI" onClick={() => setDialog("ai")}><Sparkles size={16} aria-hidden="true" /><span>Ask Daddy</span></button>
          <button type="button" className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}><Menu size={20} /></button>
          {menuOpen && (
            <div className="mobile-menu" role="menu" aria-label="Site menu">
              <Button variant="nav" role="menuitem" onClick={() => { setMenuOpen(false); document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>Find a train</Button>
              <Button variant="nav" role="menuitem" onClick={() => { setMenuOpen(false); setDialog("about"); }}>Why rail? <ArrowUpRight size={13} /></Button>
              <Button variant="nav" role="menuitem" onClick={() => { setMenuOpen(false); setDialog("ai"); }}>Ask Daddy AI <ArrowUpRight size={13} /></Button>
              <div className="mobile-menu-theme" role="group" aria-label="Theme">
                <span>Theme</span>
                <ThemeToggle theme={theme} onChange={setTheme} />
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="journey-stage" aria-label="Find your train">
          <div className={`stage-parallax${heroLoaded ? " hero-loaded" : ""}`} aria-hidden="true">
            <div className="hero-photo-depth">
            <img src={heroPlaceholder.url} width={1920} height={1088} alt="" className="lights-backdrop hero-placeholder" />
            <picture>
              <source srcSet={heroAvif.url} type="image/avif" />
              <img ref={heroRef} src={heroWebp.url} width={1920} height={1088} alt="" className="lights-backdrop hero-photo" fetchPriority="high" decoding="async" onLoad={() => setHeroLoaded(true)} />
            </picture>
            </div>
          </div>
          <div className="stage-shade" />
          <HeroAtmosphere />

          <div className="hero-content">
            <div className="hero-eyebrow reveal" style={{ ["--d" as string]: "100ms" }}><span className="status-dot" /> YOUR ROUTE. YOUR SEAT.</div>
            <h1 aria-label="REACH YOUR DESTINATION."><span className="line" aria-hidden="true"><span className="headline-mask"><span className="headline-word">REACH</span></span>{" "}<span className="headline-mask"><span className="headline-word">YOUR</span></span>{" "}<br className="h1-break" /><span className="headline-mask destination-mask"><span className="headline-word h1-accent">DESTINATION.</span><span className="destination-underline" /></span></span><span className="headline-star" aria-hidden="true">✳</span></h1>
            <p className="hero-subhead reveal" style={{ ["--d" as string]: "400ms" }}>Compare trains, check seat availability, and book in under a minute.</p>
          </div>

          <div className="booking-area" id="booking">
            <div className="booking-intro reveal" style={{ ["--d" as string]: "550ms" }}><span><span className="mini-track" /> Start with the route. We'll find the trains.</span>{lastSearch ? <button type="button" className="last-search" aria-label={`Repeat last search: ${shortName(lastSearch.from)} to ${shortName(lastSearch.to)}`} onClick={() => { setSource(lastSearch.from); setDestination(lastSearch.to); const d = new Date(lastSearch.date); if (!Number.isNaN(d.getTime()) && d >= startOfDay(new Date())) setDate(startOfDay(d)); setInvalidFields({ source: false, destination: false, date: false }); setError(""); }}><History size={14} aria-hidden="true" /><span className="last-search-label">Last search</span> {shortName(lastSearch.from)} to {shortName(lastSearch.to)}{lastSearch.date && !Number.isNaN(new Date(lastSearch.date).getTime()) ? `, ${format(new Date(lastSearch.date), "EEE")}` : ""}</button> : <span className="booking-step">01 <span>/ ROUTE BASICS</span></span>}</div>
            <form onSubmit={submit} data-mode={cardMode} className={`booking-console${submitting ? " search-submitting" : ""}`} aria-busy={submitting}>
              <span className="booking-landing-surface" aria-hidden="true" />
              <span className="booking-landing-shadow" aria-hidden="true" />
              <div className="mode-switch" role="tablist" aria-label="Search mode">
                {(["search", "ai"] as const).map((m) => (
                  <button key={m} type="button" role="tab" aria-selected={cardMode === m} className={cardMode === m ? "on" : ""} onClick={() => setCardMode(m)}>
                    {cardMode === m && <motion.span layoutId="mode-switch-pill" className="mode-switch-pill" transition={{ type: "spring", stiffness: 300, damping: 24 }} />}
                    <span className="mode-switch-label">{m === "ai" && <Sparkles size={15} aria-hidden="true" />}{m === "search" ? "Search trains" : "Ask Daddy"}</span>
                  </button>
                ))}
              </div>
              {cardMode === "ai" && (
                <div className="ask-pane" role="tabpanel" aria-label="Ask Daddy">
                  <div className="ask-box">
                    <textarea aria-label="Ask Daddy" value={askText} onChange={(e) => setAskText(e.target.value)} placeholder="Where do you want to go? Try: 'Beach trip from Mumbai this weekend under Rs 1500'" rows={4} />
                    <div className="ask-actions">
                      <button type="button" className="ask-mic" aria-label="Speak your trip"><Mic size={18} aria-hidden="true" /></button>
                      <button type="button" className="ask-send" aria-label="Send to Daddy" onClick={() => setDialog("ai")}><Send size={17} aria-hidden="true" /></button>
                    </div>
                  </div>
                  <div className="ask-chips">
                    {["Weekend getaway", "Cheapest to Goa", "Overnight to Delhi"].map((c) => (
                      <button key={c} type="button" onClick={() => setAskText(c)}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="booking-form">
              <div className="route-block">
              <StationField id="source" label="From" hint="City, station or code" errorText="Choose where you're starting from" recent={recent} placeholder="Boarding station" compactPlaceholder="From" compact={compactCard} value={source} invalid={invalidFields.source} onChange={(value) => { setSource(value); setInvalidFields((fields) => ({ ...fields, source: false })); setError(""); }} />
              <Button variant="swap" size="icon" type="button" aria-label="Swap start and destination" title="Swap start and destination" onClick={() => { swapNames(); setSource(destination); setDestination(source); setInvalidFields({ source: false, destination: false, date: false }); setError(""); setSwapTurns((t) => t + 1); }}><span className="swap-glyph"><ArrowDownUp size={18} /></span></Button>
              <StationField id="destination" label="To" hint="City, station or code" errorText="Choose where you're going" recent={recent} placeholder="Destination city" compactPlaceholder="To" compact={compactCard} value={destination} invalid={invalidFields.destination} onChange={(value) => { setDestination(value); setInvalidFields((fields) => ({ ...fields, destination: false })); setError(""); }} />
              </div>
              <div className="date-row">
              <Button ref={dateButtonRef} variant="date" type="button" aria-label="Open travel calendar" aria-haspopup="dialog" aria-expanded={calendarOpen} data-open={calendarOpen ? "true" : undefined} className={[invalidFields.date ? "field-invalid" : "", calendarOpen ? "date-open" : ""].join(" ").trim()} onClick={() => setCalendarOpen((o) => !o)}><span className="field-focus-glow" aria-hidden="true" /><span className="field-label"><CalendarDays size={15} /> Date</span><span className="date-value">{date ? format(date, "dd MMM yyyy") : "Pick a date"}</span><span className="date-value-short"><CalendarDays size={16} aria-hidden="true" />{date ? format(date, "EEE, d MMM") : "Pick a date"}</span><span className="field-hint">{invalidFields.date ? <><AlertCircle size={15} aria-hidden="true" /> Pick a travel date</> : date ? format(date, "EEEE") : "Open the calendar"}</span><CalendarDays className="date-chevron" size={16} aria-hidden="true" /></Button>
              <span className="date-quick" role="group" aria-label="Quick travel dates">
                <button type="button" className={date && isSameDay(date, today) ? "on" : ""} aria-pressed={!!date && isSameDay(date, today)} onClick={() => { setDate(today); setInvalidFields((fields) => ({ ...fields, date: false })); setError(""); }}>Today</button>
                <button type="button" className={date && isSameDay(date, tomorrow) ? "on" : ""} aria-pressed={!!date && isSameDay(date, tomorrow)} onClick={() => { setDate(tomorrow); setInvalidFields((fields) => ({ ...fields, date: false })); setError(""); }}>Tomorrow</button>
              </span>
              </div>
              </div>
             <button type="button" className="prefs-summary" aria-haspopup="dialog" aria-expanded={prefsOpen} onClick={() => setPrefsOpen(true)}>
               <span className="prefs-summary-text">{travelClass}<span className="prefs-dot" aria-hidden="true" />{passengers} passenger{passengers > 1 ? "s" : ""}<span className="prefs-dot" aria-hidden="true" />{quota}</span>
               <ChevronDown size={16} aria-hidden="true" />
             </button>
             <AnimatePresence>{error && <motion.p key={validationAttempt} initial={{ y: reduced ? 0 : -8, opacity: reduced ? 1 : 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : motionTokens.duration.micro }} className="form-error" role="alert"><AlertCircle size={16} aria-hidden="true" /><strong>Error:</strong> {error}</motion.p>}</AnimatePresence>
             <div className="booking-controls reveal" style={{ ["--d" as string]: "870ms" }}>
              <div className="controls-panel">{renderPrefsControls("search-class")}</div>
               <SearchAction busy={submitting} />
            </div>
            </form>
          </div>

        </section>
      </main>
      </div>
      <section className="content-light" aria-label="Popular routes and destinations">
          <div className="popular-routes reveal" style={{ ["--d" as string]: "1080ms" }}>
            <div className="routes-head"><span className="routes-label">Popular routes</span><span className="routes-sub">Tap one — it fills the form</span></div>
            <div className="routes-row">
              {popularRoutes.map((route, index) => (
                <RouteCard key={route.from + route.to} route={route} index={index} onChoose={() => { setSource(route.from); setDestination(route.to); setInvalidFields({ source: false, destination: false, date: false }); setError(""); }} />
              ))}
            </div>
          </div>
        <CityMarquee cities={marqueeCities} destination={destination} onChoose={city => { setDestination(city); setInvalidFields(fields => ({ ...fields, destination: false })); setError(""); }} />
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand"><span className="footer-wordmark">RAIL DADDY<span className="footer-stop">.</span></span><p className="footer-tagline">Trips worth the ride.</p></div>
          <nav className="footer-links" aria-label="About Rail Daddy">
            <Link to="/info/$topic" params={{ topic: "about" }}>About</Link>
            <Link to="/info/$topic" params={{ topic: "help" }}>Help</Link>
            <Link to="/info/$topic" params={{ topic: "cancellation" }}>Cancellation and refund policy</Link>
            <Link to="/info/$topic" params={{ topic: "privacy" }}>Privacy</Link>
            <Link to="/info/$topic" params={{ topic: "contact" }}>Contact</Link>
          </nav>
        </div>
        <p className="footer-note">Rail Daddy is a booking assistant. Tickets are issued through authorized Indian Railways channels.</p>
        <div className="footer-bottom">
          <span className="footer-copy">© {new Date().getFullYear()} Rail Daddy</span>
          <div className="trust-row"><span className="trust-badge"><ShieldCheck size={15} aria-hidden="true" /> Secure payment</span><span className="trust-badge"><RotateCcw size={15} aria-hidden="true" /> Refund policy</span></div>
          <a className="scenic-link" href="#booking">Take the scenic route <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </footer>
      </section>
      {prefsOpen && (
        <div className="prefs-sheet-root" role="dialog" aria-modal="true" aria-label="Class, passengers and quota">
          <button type="button" className="prefs-sheet-backdrop" aria-label="Close" onClick={() => setPrefsOpen(false)} />
          <div className="prefs-sheet">
            <span className="prefs-sheet-handle" aria-hidden="true" />
            <div className="prefs-sheet-body">{renderPrefsControls("search-class-sheet")}</div>
            <Button variant="journey" type="button" className="prefs-sheet-done" onClick={() => setPrefsOpen(false)}>Done</Button>
          </div>
        </div>
      )}
      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><DialogContent className="railway-dialog"><DialogHeader><div className="dialog-icon">{dialog === "ai" ? <MessageCircle /> : <TrainFront />}</div><DialogTitle>{dialog === "ai" ? "Hey, Daddy AI here." : dialog === "journey" ? "Your route." : "Why travel by rail?"}</DialogTitle><DialogDescription>{dialog === "ai" ? "No plan? No problem. Tell me your route, budget and dates and I’ll find the best train options for you. Live AI chat isn’t connected in this design preview." : dialog === "journey" ? `${travelClass} class, ${quota} quota, for ${passengers} passenger${passengers > 1 ? "s" : ""}. Live train availability and fares aren’t connected in this design preview.` : "Rail travel means no airport stress, more scenery and a journey that’s part of the holiday. Rail Daddy finds the right train for you."}</DialogDescription></DialogHeader>{dialog === "journey" && <div className="journey-summary"><div><span>{source}</span><ArrowRight /><span>{destination}</span></div><p><CalendarDays size={16} />{date ? format(date, "EEEE, dd MMMM yyyy") : ""}</p></div>}<Button variant="travel" onClick={() => setDialog(null)}>{dialog === "journey" ? "Back to search" : "Got it"}<X size={16} /></Button></DialogContent></Dialog>
      <DatePanel open={calendarOpen} anchor={dateButtonRef} value={date} onClose={closeCalendar} onSelect={(d) => { setDate(d); setInvalidFields((fields) => ({ ...fields, date: false })); setError(""); }} />
      <div className="cta-fade" aria-hidden="true" />
    </div>
  );
}
