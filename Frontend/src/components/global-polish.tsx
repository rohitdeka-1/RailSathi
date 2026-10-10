import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { motionTokens, polishMotion, themeRevealRadius } from "@/lib/motion";

const targets = 'button:not(:disabled), a[href], select, label[for], summary, [role="button"], [role="radio"], [role="switch"]';

/** Fixed, inert siblings of the app: never create containing blocks for controls. */
export function DesktopCursor() {
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const fine = window.matchMedia("(min-width: 761px) and (hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, visible = false, x = 0, y = 0, rx = 0, ry = 0, last = 0;
    const root = document.documentElement;
    function clearHints() { dot.current?.style.removeProperty("will-change"); ring.current?.style.removeProperty("will-change"); }
    function hide() { visible = false; cancelAnimationFrame(frame); frame = 0; clearHints(); root.classList.remove("custom-cursor-active"); }
    function update(time: number) {
      const delta = last ? Math.min((time - last) / 1000, 0.05) : 0;
      last = time;
      const ease = 1 - Math.exp(-delta / polishMotion.cursor.trail);
      rx += (x - rx) * ease; ry += (y - ry) * ease;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (visible && Math.hypot(x - rx, y - ry) > 0.1) frame = requestAnimationFrame(update);
      else { frame = 0; clearHints(); }
    }
    function move(event: PointerEvent) {
      if (!fine.matches || reduced.matches || event.pointerType !== "mouse") { hide(); return; }
      const target = event.target instanceof Element ? event.target : null;
      // Preserve familiar text-selection and editing cursors.
      if (target?.closest('input, textarea, [contenteditable="true"]')) { hide(); return; }
      x = event.clientX; y = event.clientY;
      if (!visible) { rx = x; ry = y; last = 0; visible = true; root.classList.add("custom-cursor-active"); }
      ring.current?.classList.toggle("cursor-over-control", !!target?.closest(targets));
      if (dot.current) dot.current.style.willChange = "transform";
      if (ring.current) ring.current.style.willChange = "transform";
      if (!frame) frame = requestAnimationFrame(update);
    }
    function visibility() { if (document.hidden) hide(); }
    document.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", visibility);
    fine.addEventListener("change", hide); reduced.addEventListener("change", hide);
    return () => {
      cancelAnimationFrame(frame); hide();
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", visibility);
      fine.removeEventListener("change", hide); reduced.removeEventListener("change", hide);
    };
  }, []);
  return <div className="desktop-cursor" aria-hidden="true"><span ref={dot} className="cursor-dot" /><span ref={ring} className="cursor-ring"><span /></span></div>;
}

export function ThemeToggle({ theme, onChange }: { theme: "light" | "dark"; onChange: (theme: "light" | "dark") => void }) {
  const reduced = useReducedMotion();
  const busy = useRef(false);
  const dark = theme === "dark";
  async function toggle(button: HTMLButtonElement) {
    if (busy.current) return;
    const next = dark ? "light" : "dark";
    const apply = () => {
      flushSync(() => onChange(next));
      document.documentElement.classList.toggle("dark", next === "dark");
    };
    if (reduced || !document.startViewTransition) { apply(); return; }
    busy.current = true;
    const bounds = button.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2, y = bounds.top + bounds.height / 2;
    const radius = themeRevealRadius(x, y, window.innerWidth, window.innerHeight);
    document.documentElement.classList.add("theme-revealing");
    try {
      const transition = document.startViewTransition(apply);
      await transition.ready;
      await document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, {
        duration: motionTokens.duration.entrance * 1000,
        easing: `cubic-bezier(${motionTokens.easing.entrance.join(",")})`,
        pseudoElement: "::view-transition-new(root)",
      }).finished;
      await transition.finished;
    } catch { /* Unsupported capture: the theme is still applied immediately. */ }
    finally { busy.current = false; document.documentElement.classList.remove("theme-revealing"); }
  }
  const transition = { duration: reduced ? 0 : motionTokens.duration.standard, ease: motionTokens.easing.entrance };
  // Sun and crescent morph by cross-fading with a rotate + scale transition;
  // each glyph stays inside the 24-unit view box so nothing is clipped.
  return <Button variant="ghost" type="button" className="theme-toggle" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"} onClick={event => void toggle(event.currentTarget)}>
    <svg className="theme-glyph" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.g
        initial={false}
        animate={dark ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.55, rotate: -45 }}
        style={{ transformOrigin: "12px 12px" }}
        transition={transition}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </motion.g>
      <motion.g
        initial={false}
        animate={dark ? { opacity: 0, scale: 0.55, rotate: 45 } : { opacity: 1, scale: 1, rotate: 0 }}
        style={{ transformOrigin: "12px 12px" }}
        transition={transition}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M5.4 18.6l1.7-1.7M16.9 7.1l1.7-1.7" />
      </motion.g>
    </svg>
  </Button>;
}