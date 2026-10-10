import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, format, isBefore, isSameDay, isSameMonth, nextSaturday, startOfDay, startOfMonth, startOfWeek } from "date-fns";

type Props = {
  open: boolean;
  anchor: RefObject<HTMLElement | null>;
  value: Date | undefined;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

const GAP = 8;
const MARGIN = 16;
const WIDTH = 340;
const ease = [0, 0, 0.2, 1] as const;

export function quickDates(now = new Date()) {
  const today = startOfDay(now);
  const day = today.getDay();
  return [
    { label: "Today", value: today },
    { label: "Tomorrow", value: addDays(today, 1) },
    { label: "This weekend", value: day === 6 || day === 0 ? today : nextSaturday(today) },
  ];
}

export function DatePanel({ open, anchor, value, onSelect, onClose }: Props) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, up: false, notch: WIDTH - 40 });
  const [month, setMonth] = useState(() => startOfMonth(value ?? new Date()));
  const [picking, setPicking] = useState(false);
  const closing = useRef<number | null>(null);
  const today = startOfDay(new Date());
  const minMonth = startOfMonth(today);
  const maxMonth = startOfMonth(new Date(today.getFullYear() + 1, 11));

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => { if (open) { setMonth(startOfMonth(value ?? today)); setPicking(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const place = useCallback(() => {
    const el = anchor.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const h = panelRef.current?.offsetHeight ?? 440;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(WIDTH, vw - MARGIN * 2);
    let left = r.right - width;
    left = Math.max(MARGIN, Math.min(left, vw - MARGIN - width));
    const spaceBelow = vh - r.bottom - GAP - MARGIN;
    const up = spaceBelow < h && r.top - GAP - MARGIN > spaceBelow;
    const top = up ? r.top - GAP - h : r.bottom + GAP;
    const notch = Math.max(20, Math.min(width - 20, r.left + r.width * 0.75 - left));
    setPos({ top, left, up, notch });
  }, [anchor]);

  useLayoutEffect(() => {
    if (!open || mobile) return;
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, mobile, place, picking, month]);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); anchor.current?.focus(); } };
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", down); };
  }, [open, onClose, anchor]);

  useEffect(() => () => { if (closing.current) window.clearTimeout(closing.current); }, []);

  const choose = (d: Date) => {
    onSelect(startOfDay(d));
    if (closing.current) window.clearTimeout(closing.current);
    closing.current = window.setTimeout(onClose, 150);
  };

  if (!mounted) return null;

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weeks = days[35] && !isSameMonth(days[35], month) ? days.slice(0, 35) : days;
  const canPrev = isBefore(minMonth, month);
  const canNext = isBefore(month, maxMonth);
  const months = Array.from({ length: 24 }, (_, i) => addMonths(minMonth, i)).filter((m) => !isBefore(maxMonth, m));

  const content = (
    <LayoutGroup id="date-panel">
      <div className="dp-chips" aria-label="Quick date choices">
        {quickDates().map((q) => {
          const on = !!value && isSameDay(value, q.value);
          return <button key={q.label} type="button" className={on ? "dp-chip on" : "dp-chip"} aria-pressed={on} onClick={() => choose(q.value)}>{q.label}</button>;
        })}
      </div>
      <div className="dp-head">
        <button type="button" className="dp-arrow" aria-label="Previous month" disabled={!canPrev || picking} onClick={() => setMonth((m) => addMonths(m, -1))}><ChevronLeft size={18} /></button>
        <button type="button" className="dp-title" aria-expanded={picking} onClick={() => setPicking((p) => !p)}>{format(month, "MMMM yyyy")}</button>
        <button type="button" className="dp-arrow" aria-label="Next month" disabled={!canNext || picking} onClick={() => setMonth((m) => addMonths(m, 1))}><ChevronRight size={18} /></button>
      </div>
      {picking ? (
        <div className="dp-months">
          {months.map((m) => <button key={m.toISOString()} type="button" className={isSameMonth(m, month) ? "dp-month on" : "dp-month"} onClick={() => { setMonth(m); setPicking(false); }}>{format(m, "MMM yyyy")}</button>)}
        </div>
      ) : (
        <div className="dp-grid" role="grid" aria-label={format(month, "MMMM yyyy")}>
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d} className="dp-weekday" role="columnheader">{d}</span>)}
          {weeks.map((d) => {
            const outside = !isSameMonth(d, month);
            const past = isBefore(d, today);
            const selected = !!value && isSameDay(d, value);
            if (outside) return <span key={d.toISOString()} className="dp-cell" aria-hidden="true" />;
            return (
              <span key={d.toISOString()} className="dp-cell" role="gridcell">
                <button type="button" disabled={past} aria-pressed={selected} aria-label={format(d, "EEEE, d MMMM yyyy")} className={["dp-day", past && "past", isSameDay(d, today) && "today", selected && "selected"].filter(Boolean).join(" ")} onClick={() => choose(d)}>
                  {selected && <motion.span layoutId="dp-selected" className="dp-selected" transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }} />}
                  <span className="dp-num">{format(d, "d")}</span>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </LayoutGroup>
  );

  return createPortal(
    <AnimatePresence>
      {open && (mobile ? (
        <motion.div key="sheet" ref={panelRef} className="date-panel date-sheet" role="dialog" aria-label="Choose travel date" data-motion-owned="true" data-lenis-prevent
          initial={reduced ? false : { y: "100%" }} animate={{ y: 0 }} exit={reduced ? { opacity: 0 } : { y: "100%" }} transition={{ duration: reduced ? 0 : 0.22, ease }}
          drag={reduced ? false : "y"} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}>
          <span className="dp-handle" aria-hidden="true" />
          {content}
        </motion.div>
      ) : (
        <motion.div key="panel" ref={panelRef} className={pos.up ? "date-panel up" : "date-panel"} role="dialog" aria-label="Choose travel date" data-motion-owned="true" data-lenis-prevent
          style={{ top: pos.top, left: pos.left, ["--dp-notch" as string]: `${pos.notch}px`, transformOrigin: `${pos.notch}px ${pos.up ? "100%" : "0%"}` }}
          initial={reduced ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.96 }} transition={{ duration: reduced ? 0 : 0.18, ease }}>
          <span className="dp-notch" aria-hidden="true" />
          {content}
        </motion.div>
      ))}
    </AnimatePresence>,
    document.body,
  );
}
