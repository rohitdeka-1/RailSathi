import { useEffect } from "react";
import { motionDuration } from "@/lib/motion";

/** Observe compositor animations without per-frame layout reads or React renders. */
export function useAnimationBudget() {
  useEffect(() => {
    const visibility = new Map<Element, boolean>();
    const paused = new Set<Animation>();
    const hinted = new Set<HTMLElement | SVGElement>();
    const observed = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visibility.set(entry.target, entry.isIntersecting));
      sync();
    });
    const mobile = window.matchMedia("(max-width: 760px)");
    function sync() {
      const active = new Set<HTMLElement | SVGElement>();
      const animations = document.getAnimations();
      for (const animation of animations) {
        const effect = animation.effect;
        if (!(effect instanceof KeyframeEffect) || !(effect.target instanceof Element)) continue;
        const element = effect.target;
        // The train deliberately leaves the viewport between cycles; its hero observer
        // owns pausing so an off-edge engine cannot strand the crossing animation.
        // The pinned search button is fixed while its in-flow slot sits off-screen;
        // pausing it would strand the slide-up on its first frame.
        if (element.matches('.night-train-runner, .booking-controls .journey-button')) continue;
        if (!observed.has(element)) { observed.add(element); observer.observe(element); }
        const hidden = document.hidden || visibility.get(element) === false;
        if (hidden && animation.playState === "running") { animation.pause(); paused.add(animation); }
        else if (!hidden && paused.has(animation)) { animation.play(); paused.delete(animation); }
        // CSS animations with literal durations share the same phone multiplier.
        if (animation instanceof CSSAnimation) animation.playbackRate = 1 / motionDuration(1, mobile.matches);
        if (!hidden && animation.playState === "running" && (element instanceof HTMLElement || element instanceof SVGElement)) {
          const frames = effect.getKeyframes();
          // Hinting transform creates a containing block, even for opacity-only motion.
          if (!element.matches('.booking-form, .booking-controls, .booking-console, .flow-main, .flow-shell, .pay-grid, .station-field.sheet-open') && frames.some(frame => "transform" in frame || "opacity" in frame)) active.add(element);
        }
      }
      hinted.forEach(element => { if (!active.has(element)) { element.style.removeProperty("will-change"); hinted.delete(element); } });
      active.forEach(element => { element.style.willChange = "transform, opacity"; hinted.add(element); });
      observed.forEach(element => { if (!element.isConnected) { observer.unobserve(element); observed.delete(element); visibility.delete(element); } });
      paused.forEach(animation => { if (!animations.includes(animation)) paused.delete(animation); });
    }
    const timer = window.setInterval(sync, 120);
    document.addEventListener("visibilitychange", sync);
    mobile.addEventListener("change", sync);
    sync();
    return () => {
      clearInterval(timer); observer.disconnect();
      hinted.forEach(element => element.style.removeProperty("will-change"));
      paused.forEach(animation => animation.play());
      document.removeEventListener("visibilitychange", sync); mobile.removeEventListener("change", sync);
    };
  }, []);
}