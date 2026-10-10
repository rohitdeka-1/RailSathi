import { useEffect, useRef, type ComponentProps, type RefObject } from "react";
import { animate, AnimatePresence, LayoutGroup, motion, useMotionValue, useReducedMotion, useSpring, type AnimationPlaybackControls } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { RailLoader, useBookingReducedMotion } from "@/components/booking-motion";
import { DayButton } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { CalendarDayButton } from "@/components/ui/calendar";
import { magneticOffset, motionTokens, polishMotion, searchMotion } from "@/lib/motion";

export { AnimatePresence, LayoutGroup, motion };

export function SelectionMark({ id, circle = false }: { id: string; circle?: boolean }) {
  const reduced = useReducedMotion();
  return <motion.span aria-hidden="true" className={circle ? "date-selection-highlight" : "selection-highlight"} {...(reduced ? {} : { layoutId: id })} transition={motionTokens.spring.snappy} />;
}

export function DrawnCheck() {
  const reduced = useBookingReducedMotion();
  return <svg className="drawn-check" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><motion.path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: motionTokens.duration.micro }} /></svg>;
}

export function SearchCalendarDay(props: ComponentProps<typeof DayButton>) {
  return <CalendarDayButton {...props}>{props.modifiers['selected'] && !props.modifiers['outside'] && <SelectionMark id="search-date" circle />}<span className="selection-content">{props.children}</span></CalendarDayButton>;
}

export function RollingNumber({ value, direction }: { value: number; direction: number }) {
  const reduced = useReducedMotion();
  return <strong className="rolling-number" aria-live="polite" aria-atomic="true"><span className="sr-only">{value}</span><AnimatePresence initial={false} custom={direction}><motion.span key={value} aria-hidden="true" custom={direction} variants={{ enter: (d: number) => ({ y: reduced ? 0 : d * 24, opacity: reduced ? 1 : 0 }), exit: (d: number) => ({ y: reduced ? 0 : -d * 24, opacity: 0 }) }} initial="enter" animate={{ y: 0, opacity: 1 }} exit="exit" transition={{ duration: reduced ? 0 : motionTokens.duration.micro, ease: motionTokens.easing.entrance }}>{value}</motion.span></AnimatePresence></strong>;
}

export function SearchAction({ busy }: { busy: boolean }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const springX = useSpring(x, motionTokens.spring.soft), springY = useSpring(y, motionTokens.spring.soft);
  useEffect(() => { if (reduced || busy) { x.set(0); y.set(0); } }, [reduced, busy, x, y]);
  return <Button variant="journey" type="submit" className="search-action" data-motion-owned="true" aria-label={busy ? "Finding trains" : "Find my train"} aria-busy={busy} disabled={busy}
    onPointerMove={event => {
      if (reduced || busy || event.pointerType !== 'mouse') return;
      const bounds = event.currentTarget.getBoundingClientRect();
      x.set(magneticOffset(event.clientX - bounds.left, bounds.width));
      y.set(magneticOffset(event.clientY - bounds.top, bounds.height));
    }} onPointerLeave={() => { x.set(0); y.set(0); }} asChild>
    <motion.button style={{ x: springX, y: springY }} whileHover={reduced || busy ? {} : { scale: motionTokens.scale.hover }} whileTap={reduced || busy ? {} : { scale: motionTokens.scale.press }} transition={polishMotion.releaseSpring}>
      <motion.span className="button-shine" aria-hidden="true" initial={{ x: '-200%', opacity: 0 }} animate={reduced || busy ? { opacity: 0 } : { x: ['-200%', '500%', '500%'], opacity: [0, 0.35, 0] }} transition={{ duration: searchMotion.shineInterval, times: [0, 0.2, 1], repeat: Infinity, ease: 'linear' }} />
      <span className="search-action-label"><AnimatePresence mode="wait" initial={false}><motion.span className="search-action-state" key={busy ? 'busy' : 'ready'} initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduced ? 1 : 0.9 }} transition={{ duration: reduced ? 0 : motionTokens.duration.micro }}>{busy ? <RailLoader compact /> : <><span className="journey-title">Find my train</span><ArrowRight className="search-arrow" size={18} aria-hidden="true" /></>}</motion.span></AnimatePresence></span>
    </motion.button>
  </Button>;
}

/** Own only independent overlays/inputs, never ancestors of fixed phone sheets. */
export function useSearchMicroMotion(ref: RefObject<HTMLDivElement | null>, swapTurns: number, validationAttempt: number) {
  const previousSwap = useRef(swapTurns);
  const active = useRef(new Set<AnimationPlaybackControls>());
  function play(element: HTMLElement, frames: { x?: number[]; scale?: number[]; opacity?: number[]; rotate?: number }, options: { duration?: number; ease?: 'linear' | readonly [number, number, number, number]; type?: 'spring'; stiffness?: number; damping?: number }) {
    const control = animate(element, frames, options);
    active.current.add(control);
    void control.finished.then(() => active.current.delete(control));
    return control;
  }
  useEffect(() => {
    if (swapTurns === previousSwap.current) return;
    previousSwap.current = swapTurns;
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const icon = root.querySelector<HTMLElement>('.swap-glyph');
    if (icon) play(icon, { rotate: swapTurns * searchMotion.swapRotation }, motionTokens.spring.snappy);
  }, [swapTurns, ref]);
  useEffect(() => {
    if (!validationAttempt || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.querySelectorAll<HTMLElement>('.field-invalid input, .date-button.field-invalid .date-value').forEach(element => {
      play(element, { x: [...searchMotion.shake.x] }, { duration: searchMotion.shake.duration, ease: 'linear' });
    });
  }, [validationAttempt, ref]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => {
      if (!preference.matches) return;
      active.current.forEach(control => control.complete());
      ref.current?.querySelectorAll<HTMLElement>('.swap-city-ghost').forEach(element => element.remove());
    };
    preference.addEventListener('change', stop);
    return () => { preference.removeEventListener('change', stop); active.current.forEach(control => control.stop()); active.current.clear(); };
  }, [ref]);

  function swapNames() {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const [id, direction] of [['source', 1], ['destination', -1]] as const) {
      const input = root.querySelector<HTMLInputElement>(`#${id}`);
      if (!input) continue;
      const ghost = document.createElement('span');
      ghost.className = 'swap-city-ghost';
      ghost.textContent = input.value || input.placeholder;
      ghost.setAttribute('aria-hidden', 'true');
      input.parentElement?.appendChild(ghost);
      const control = play(ghost, { x: [0, direction * 24], opacity: [1, 0] }, { duration: motionTokens.duration.standard, ease: motionTokens.easing.transition });
      void control.finished.then(() => ghost.remove());
      play(input, { x: [-direction * 24, 0], opacity: [0, 1] }, { duration: motionTokens.duration.standard, ease: motionTokens.easing.transition });
    }
  }

  async function leaveSearch() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    await new Promise(resolve => window.setTimeout(resolve, searchMotion.submitPause * 1000));
  }
  return { swapNames, leaveSearch };
}