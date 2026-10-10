import { useEffect } from "react";
import { animate, type AnimationPlaybackControls } from "framer-motion";
import { entranceFrames, expoEase, motionCssVariables, motionTokens, polishMotion, sheetFrames } from "@/lib/motion";
import { useAnimationBudget } from "@/hooks/use-animation-budget";

const clickable = 'button, a[href], select, input:not([type="hidden"]), label[for], summary, [role="button"]';
const snappy = '[role="radio"], [role="switch"], .theme-toggle, .menu-toggle, .marquee-city, .seat, .quick-dates button, .rdp-day_button';
// Never transform an ancestor of a fixed CTA or full-screen station picker.
const entrances = '.site-header, .hero-eyebrow, .hero-content h1 .line > span, .hero-subhead, .booking-intro, .routes-head, .route-card, .city-marquee, .site-footer, .flow-header, .flow-steps, .flow-title-row, .train-card, .flow-main > .flow-card, .pax-form > fieldset, .pay-grid > *, .alternates, .coach, .info-bar, .info-head, .info-intro, .info-point, .info-closing, .info-trust, .info-cta';
const sheets = '.mobile-menu, .station-suggestions, [role="dialog"], .station-field.sheet-open';

/** Delegation also covers Radix portals, calendar days and controls mounted later. */
export function MotionSystem() {
  useAnimationBudget();
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(motionCssVariables).forEach(([key, value]) => root.style.setProperty(key, value));
    root.style.setProperty("--cursor-dot-size", `${polishMotion.cursor.dot}px`);
    root.style.setProperty("--cursor-ring-size", `${polishMotion.cursor.ring}px`);
    root.style.setProperty("--cursor-expanded-scale", String(polishMotion.cursor.expanded / polishMotion.cursor.ring));
    root.classList.add("motion-ready");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 760px)");
    const syncTiming = () => Object.entries(motionCssVariables).forEach(([key, value]) => root.style.setProperty(key, value));
    mobile.addEventListener("change", syncTiming);
    const seen = new WeakSet<Element>();
    const active = new Set<AnimationPlaybackControls>();
    const interactions = new Map<HTMLElement, AnimationPlaybackControls>();
    let hovered: HTMLElement | null = null;
    let pressed: HTMLElement | null = null;
    let stopScrolling: (() => void) | undefined;
    let disposed = false;
    let scrollGeneration = 0;
    const pendingReveals = new Set<HTMLElement>();
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
        const element = entry.target;
        revealObserver.unobserve(element); pendingReveals.delete(element);
        element.dataset["scrollReveal"] = "complete";
        if (preference.matches) { element.style.removeProperty("opacity"); continue; }
        const control = track(animate(element, { opacity: [0, 1], y: [polishMotion.revealRise, 0] }, { duration: motionTokens.duration.entrance, ease: motionTokens.easing.entrance }));
        void control.finished.then(() => element.style.removeProperty("transform"));
      }
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });

    function track(control: AnimationPlaybackControls) {
      active.add(control);
      void control.finished.then(() => active.delete(control));
      return control;
    }
    function controlFor(target: EventTarget | null) {
      if (!(target instanceof Element)) return null;
      const element = target.closest<HTMLElement>(clickable);
      if (!element || element.matches('[data-motion-owned="true"], :disabled, [aria-disabled="true"]')) return null;
      return element;
    }
    function interact(element: HTMLElement | null, scale: number) {
      if (!element || preference.matches) return;
      interactions.get(element)?.stop();
      const control = track(animate(element, { scale }, element.matches(snappy) ? motionTokens.spring.snappy : motionTokens.spring.soft));
      interactions.set(element, control);
      void control.finished.then(() => { if (interactions.get(element) === control) interactions.delete(element); });
    }
    function scan() {
      const candidates = [...document.querySelectorAll<HTMLElement>(`${entrances}, ${sheets}`)];
      let index = 0;
      for (const element of candidates) {
        if (seen.has(element) || element.dataset["motionOwned"] === "true" || !element.getClientRects().length) continue;
        // The home sequence owns its entrances; delegation still owns interaction feedback.
         const belowFold = element.getBoundingClientRect().top >= window.innerHeight || element.dataset["scrollReveal"] === "pending";
         if (element.closest('[data-home-entrance]') && !element.matches('.site-footer') && !element.matches(sheets) && !belowFold) continue;
        seen.add(element);
        if (preference.matches) continue;
        const isSheet = element.matches(sheets);
         if (belowFold && !isSheet) {
           element.dataset["scrollReveal"] = "pending";
           element.style.opacity = "0";
           pendingReveals.add(element); revealObserver.observe(element);
           continue;
         }
        const isHero = element.matches('.hero-content h1 .line > span');
        track(animate(element, isSheet ? sheetFrames : entranceFrames, {
          duration: isSheet ? motionTokens.duration.standard : isHero ? motionTokens.duration.hero : motionTokens.duration.entrance,
          ease: isSheet ? motionTokens.easing.transition : motionTokens.easing.entrance,
          delay: isSheet ? 0 : Math.min(index++, 8) * motionTokens.stagger,
        }));
      }
    }
    async function configureScrolling() {
      const generation = ++scrollGeneration;
      stopScrolling?.();
      stopScrolling = undefined;
      if (preference.matches || disposed) return;
      const { default: Lenis } = await import("lenis");
      if (disposed || preference.matches || generation !== scrollGeneration) return;
      const lenis = new Lenis({
        autoRaf: true,
        duration: motionTokens.duration.hero,
        easing: expoEase,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
        prevent: (node) => !!node.closest('[role="dialog"], [role="listbox"], .sheet-open, .vibe-chips, .routes-row, .route-marquee'),
      });
      const syncLock = () => {
        const stationSheet = window.matchMedia("(max-width: 760px)").matches && !!document.querySelector('.station-field.sheet-open');
        const locked = document.body.hasAttribute("data-scroll-locked") || stationSheet || !!document.querySelector('[role="dialog"][data-state="open"]');
        if (locked) lenis.stop(); else lenis.start();
      };
      const locks = new MutationObserver(syncLock);
      locks.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ["data-scroll-locked", "class", "data-state"] });
      syncLock();
      stopScrolling = () => { locks.disconnect(); lenis.destroy(); };
    }
    const over = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const element = controlFor(event.target);
      if (element === hovered) return;
      interact(hovered, motionTokens.scale.resting);
      hovered = element;
      interact(hovered, motionTokens.scale.hover);
    };
    const out = (event: PointerEvent) => {
      if (hovered && controlFor(event.relatedTarget) !== hovered) {
        interact(hovered, motionTokens.scale.resting); hovered = null;
      }
    };
    const down = (event: PointerEvent) => { pressed = controlFor(event.target); interact(pressed, motionTokens.scale.press); };
    const release = () => {
      if (pressed?.matches('button, [role="button"]') && !preference.matches) {
        interactions.get(pressed)?.stop();
        const element = pressed;
        const control = track(animate(element, { scale: element === hovered ? motionTokens.scale.hover : motionTokens.scale.resting }, polishMotion.releaseSpring));
        interactions.set(element, control);
        void control.finished.then(() => { if (interactions.get(element) === control) interactions.delete(element); });
      } else interact(pressed, pressed === hovered ? motionTokens.scale.hover : motionTokens.scale.resting);
      pressed = null;
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat || !["Enter", " "].includes(event.key)) return;
      const element = controlFor(event.target);
      if (element?.matches('input, select')) return;
      pressed = element; interact(pressed, motionTokens.scale.press);
    };
    const keyUp = (event: KeyboardEvent) => { if (["Enter", " "].includes(event.key)) release(); };
    const change = () => {
      if (preference.matches) {
        pendingReveals.forEach(element => { revealObserver.unobserve(element); element.style.removeProperty("opacity"); element.dataset["scrollReveal"] = "complete"; });
        pendingReveals.clear();
        active.forEach((control) => control.complete());
        interactions.clear(); hovered = null; pressed = null;
        document.querySelectorAll<HTMLElement>(clickable).forEach((element) => element.style.removeProperty("transform"));
      }
      void configureScrolling();
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    window.addEventListener("blur", release);
    preference.addEventListener("change", change);
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-state"] });
    scan();
    void configureScrolling();
    return () => {
      disposed = true;
      observer.disconnect(); revealObserver.disconnect(); pendingReveals.forEach(element => element.style.removeProperty("opacity")); stopScrolling?.(); active.forEach((control) => control.stop());
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", release);
      preference.removeEventListener("change", change);
      mobile.removeEventListener("change", syncTiming);
      root.classList.remove("motion-ready");
    };
  }, []);
  return null;
}