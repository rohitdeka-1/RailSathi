import { useLayoutEffect, type RefObject } from "react";
import { animate, type AnimationPlaybackControls } from "framer-motion";
import { claimHomeEntrance, homeEntrance as timing, motionTokens } from "@/lib/motion";

export function useHomeEntrance(ref: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let play = !preference.matches;
    try { play = claimHomeEntrance(window.sessionStorage, preference.matches); } catch { /* Private browsing. */ }
    root.dataset["homeEntrance"] = play ? "playing" : "complete";
    if (!play) return;

    const controls = new Set<AnimationPlaybackControls>();
    const cardControls = new Set<AnimationPlaybackControls>();
    const photoControls = new Set<AnimationPlaybackControls>();
    const ease = motionTokens.easing.entrance;
    function enter(selector: string, frames: { opacity?: number[]; y?: number[] | string[]; scale?: number[]; scaleX?: number[] }, delay: number, duration: number = motionTokens.duration.entrance, stagger = 0, card = false, linear = false) {
      root?.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
        if (element.matches('.routes-head, .route-marquee') && element.getBoundingClientRect().top >= window.innerHeight) {
          element.dataset["scrollReveal"] = "pending";
          return;
        }
        const control = animate(element, frames, { delay: delay + index * stagger, duration, ease: linear ? "linear" : ease });
        controls.add(control);
        if (element.matches('.hero-photo, .hero-placeholder')) photoControls.add(control);
        if (card) cardControls.add(control);
        void control.finished.then(() => {
          controls.delete(control);
          photoControls.delete(control);
          cardControls.delete(control);
          // Release containing blocks before any fixed picker is opened.
          if (frames.y || frames.scale) element.style.removeProperty("transform");
        });
      });
    }
    enter('.wordmark, .site-header > nav', { opacity: [0, 1], y: [timing.header.distance, 0] }, timing.header.delay);
    enter('.header-actions, .hero-eyebrow', { opacity: [0, 1] }, timing.header.delay);
    enter('.headline-word', { y: ["100%", "0%"] }, timing.words.delay, timing.words.duration, timing.words.stagger);
    enter('.destination-underline', { scaleX: [0, 1] }, timing.underline.delay, timing.underline.duration);
    enter('.hero-subhead', { opacity: [0, 1], y: [timing.subhead.distance, 0] }, timing.subhead.delay);
    enter('.booking-intro', { opacity: [0, 1] }, timing.card.delay);
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    root.classList.toggle('home-mobile-landing', mobile);
    // Only the independent surface moves on phones: the form contains fixed controls.
    enter(mobile ? '.booking-landing-surface' : '.booking-console', { opacity: [0, 1], y: [timing.card.distance, 0], scale: [timing.card.scale, 1] }, timing.card.delay, timing.card.duration, 0, true);
    if (mobile) enter('.booking-form, .booking-controls', { opacity: [0, 1] }, timing.card.delay, timing.card.duration, 0, true);
    enter('.booking-landing-shadow', { opacity: [0, 1] }, timing.card.delay, timing.card.duration, 0, true);
    enter('.routes-head', { opacity: [0, 1] }, timing.routes.delay);
    enter('.route-marquee', { opacity: [0, 1] }, timing.marquee.delay, timing.marquee.duration);

    let photoStarted = false;
    function startPhoto() {
      if (photoStarted || !root?.querySelector('.hero-loaded')) return;
      photoStarted = true;
      enter('.hero-photo, .hero-placeholder', { scale: [timing.zoom.from, timing.zoom.to] }, 0, timing.zoom.duration, 0, false, true);
    }
    startPhoto();
    const observer = new MutationObserver(startPhoto);
    observer.observe(root, { attributes: true, subtree: true, attributeFilter: ['class'] });
    let photoVisible = true;
    const syncPhoto = () => photoControls.forEach(control => photoVisible && !document.hidden ? control.play() : control.pause());
    const photoObserver = new IntersectionObserver(([entry]) => { photoVisible = entry?.isIntersecting ?? false; syncPhoto(); });
    const stage = root.querySelector('.journey-stage');
    if (stage) photoObserver.observe(stage);
    document.addEventListener('visibilitychange', syncPhoto);
    function releaseCard() {
      cardControls.forEach(control => control.complete());
      root?.querySelector<HTMLElement>('.booking-console')?.style.removeProperty('transform');
    }
    function skip() {
      if (!preference.matches) return;
      controls.forEach(control => control.complete());
      root?.querySelectorAll<HTMLElement>('.hero-photo, .hero-placeholder, .booking-console').forEach(element => element.style.removeProperty('transform'));
      if (root) root.dataset["homeEntrance"] = 'complete';
    }
    root.addEventListener('pointerdown', releaseCard, true);
    root.addEventListener('focusin', releaseCard);
    preference.addEventListener('change', skip);
    const done = window.setTimeout(() => {
      root.dataset["homeEntrance"] = 'complete';
      root.classList.remove('home-mobile-landing');
    }, (timing.marquee.delay + timing.marquee.duration) * 1000);
    return () => {
      controls.forEach(control => control.stop());
      observer.disconnect();
      photoObserver.disconnect(); document.removeEventListener('visibilitychange', syncPhoto);
      window.clearTimeout(done);
      root.removeEventListener('pointerdown', releaseCard, true);
      root.removeEventListener('focusin', releaseCard);
      preference.removeEventListener('change', skip);
    };
  }, [ref]);
}