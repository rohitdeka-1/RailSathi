import { useEffect, type RefObject } from "react";
import { animate, type AnimationPlaybackControls } from "framer-motion";
import { heroDepth, heroScrollState, motionDuration } from "@/lib/motion";

/** Independent decorative layers never contain the booking controls. */
export function useHeroDepth(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = ref.current;
    const stage = root?.querySelector<HTMLElement>('.journey-stage');
    const photo = root?.querySelector<HTMLElement>('.hero-photo-depth');
    const headline = root?.querySelector<HTMLElement>('.hero-content h1');
    const train = root?.querySelector<HTMLElement>('.night-train-runner');
    const track = root?.querySelector<HTMLElement>('.night-train-track');
    const card = root?.querySelector<HTMLElement>('.booking-console');
    if (!root || !stage || !photo || !headline || !train) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 760px)');
    let controls: AnimationPlaybackControls[] = [];
    let frame = 0;
    let visible = false;
    let ready = false;
    let idleTimer = 0;
    const particles = [...root.querySelectorAll<HTMLElement>('.night-firefly')];
    function placeTrain() {
      if (!stage || !track || !card) return;
      const bounds = stage.getBoundingClientRect();
      const cardBottom = card.getBoundingClientRect().bottom - bounds.top;
      const trackHeight = mobile.matches ? 60 : 84;
      // On phones the sticky button covers the bottom 88px of the viewport.
      const bottomLimit = mobile.matches ? Math.min(bounds.height, window.innerHeight - bounds.top - 88) : bounds.height;
      const gap = bottomLimit - cardBottom;
      // Use only existing empty space; never move or resize the booking experience.
      track.dataset['space'] = String(gap >= trackHeight + 32);
      track.style.setProperty('--night-track-top', `${cardBottom + Math.max(32, (gap - trackHeight) / 2)}px`);
    }
    function clearHints() {
      photo?.style.removeProperty('will-change'); headline?.style.removeProperty('will-change');
      train?.style.removeProperty('will-change'); particles.forEach(particle => particle.style.removeProperty('will-change'));
    }
    function update() {
      frame = 0;
      if (preference.matches || mobile.matches || !visible || document.hidden) return;
      const bounds = stage?.getBoundingClientRect();
      if (!bounds || !photo || !headline) return;
      const state = heroScrollState(-bounds.top, bounds.height);
      photo.style.willChange = 'transform'; headline.style.willChange = 'transform, opacity';
      // Keep scroll depth inside the photo's six-percent overscan at rest/zoom end.
      photo.style.transform = `translateY(${Math.min(state.photoY, bounds.height * 0.05)}px)`;
      headline.style.transform = `scale(${state.headlineScale})`;
      headline.style.opacity = String(state.headlineOpacity);
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => { photo.style.removeProperty('will-change'); headline.style.removeProperty('will-change'); }, 140);
    }
    function scroll() { if (!frame && visible && !mobile.matches && !preference.matches && !document.hidden) frame = requestAnimationFrame(update); }
    function sync() {
      const playing = visible && !document.hidden && !preference.matches;
      root?.setAttribute('data-decoration-state', !ready ? 'waiting' : playing ? 'playing' : 'paused');
      controls.forEach(control => playing ? control.play() : control.pause());
      if (!playing) clearHints();
      else if (ready) {
        if (train) train.style.willChange = 'transform, opacity';
        if (!mobile.matches) particles.forEach(particle => particle.style.willChange = 'transform, opacity');
      }
    }
    function configure() {
      placeTrain();
      controls.forEach(control => control.stop());
      controls = [];
      clearHints();
      particles.forEach(particle => { particle.style.opacity = '0'; });
      if (train) train.style.opacity = '0';
      if (preference.matches || mobile.matches) {
        photo?.style.removeProperty('transform');
        headline?.style.removeProperty('transform');
        headline?.style.removeProperty('opacity');
      }
      if (!ready || preference.matches) { sync(); return; }
      if (!mobile.matches) particles.forEach((particle, index) => {
        controls.push(animate(particle, {
          x: [0, index % 2 ? -16 : 18, 0], y: [0, -24 - index % 5 * 4, 0],
          opacity: [0.04, 0.18, 0.04],
        }, { duration: heroDepth.particleDuration + motionDuration(index % 6 * 2), delay: -(index * 1.3), repeat: Infinity, ease: 'easeInOut' }));
      });
      if (train && stage && !mobile.matches) controls.push(animate(train, {
        x: [-620, -416, stage.clientWidth + 220, stage.clientWidth + 220],
        opacity: [0, 1, 1, 0],
      }, { duration: heroDepth.trainInterval, times: [0, 0.08, 0.64, 1], repeat: Infinity, ease: ['easeIn', 'linear', 'easeOut'] }));
      sync(); scroll();
    }
    // Both the image and primary UI must be ready before decorative work starts.
    function checkReady() {
      if (ready || !root?.querySelector('.hero-loaded') || root.dataset['homeEntrance'] !== 'complete') return;
      ready = true; configure();
    }
    const loadObserver = new MutationObserver(checkReady);
    loadObserver.observe(root, { attributes: true, subtree: true, attributeFilter: ['class', 'data-home-entrance'] });
    checkReady();
    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      sync();
      if (visible) scroll();
    });
    observer.observe(stage);
    const layoutObserver = new ResizeObserver(placeTrain);
    layoutObserver.observe(stage);
    if (card) layoutObserver.observe(card);
    const visibility = () => { sync(); if (!document.hidden) scroll(); };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', configure);
    document.addEventListener('visibilitychange', visibility);
    preference.addEventListener('change', configure);
    mobile.addEventListener('change', configure);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(idleTimer); clearHints(); loadObserver.disconnect();
      controls.forEach(control => control.stop());
      observer.disconnect();
      layoutObserver.disconnect();
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', configure);
      document.removeEventListener('visibilitychange', visibility);
      preference.removeEventListener('change', configure);
      mobile.removeEventListener('change', configure);
    };
  }, [ref]);
}

export function HeroAtmosphere() {
  return <div className="hero-atmosphere" aria-hidden="true">
    <div className="night-fireflies">{Array.from({ length: heroDepth.particles }, (_, index) => <span key={index} className="night-firefly" />)}</div>
    <div className="night-train-track">
      <div className="night-train-runner">
        <span className="night-train-trail" />
        <span className="night-train-headlight" />
        <span className="night-train-ground" />
        <svg className="night-train-silhouette" viewBox="0 0 260 44" fill="none">
          {[8, 68.5, 129].map(start => <g key={start}>
            <rect x={start} y="10" width="58" height="27" rx="1.5" fill="currentColor" />
            <path d={`M${start + 1.5} 10h55`} className="night-train-edge" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {Array.from({ length: 9 }, (_, index) => <rect key={index} x={start + 4 + index * 5.8} y="15" width="3.6" height="4.5" rx="1" className="night-train-windows" />)}
          </g>)}
          <path d="M189.5 10H232l20 18v9h-62.5Z" fill="currentColor" />
          <path d="M191 10h41l20 18" className="night-train-edge" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {[66, 126.5, 187].map(x => <rect key={x} x={x} y="20" width="2.5" height="13" fill="currentColor" className="night-train-edge" strokeWidth="0.5" />)}
          {Array.from({ length: 8 }, (_, index) => <rect key={index} x={194 + index * 4.8} y="15" width="3.2" height="4.5" rx="1" className="night-train-windows" />)}
          {[18,54,80,116,142,178,207,235].map(x => <circle key={x} cx={x} cy="38.4" r="1.6" fill="currentColor" className="night-train-edge" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />)}
          <rect x="246" y="25.5" width="8" height="3" rx="1" className="night-train-windows" />
        </svg>
      </div>
    </div>
  </div>;
}