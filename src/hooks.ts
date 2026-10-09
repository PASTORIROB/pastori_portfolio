import { useEffect, useRef, useState, type RefObject } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.3 }): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView];
}

/** Smoothly animates a number toward its target. Interrupted tweens continue from the current value. */
export function useTween(target: number, ms = 450) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (prefersReducedMotion()) { from.current = target; setValue(target); return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      from.current = a + (target - a) * eased;
      setValue(from.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/** Page-wide effects: scroll reveals, pointer spotlight on glass surfaces, scroll progress and parallax. */
export function useSiteEffects() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      els.forEach((el) => el.classList.add('in'));
    } else {
      io = new IntersectionObserver(
        (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io?.unobserve(en.target); } }),
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      );
      els.forEach((el) => io!.observe(el));
    }

    const onPointer = (e: PointerEvent) => {
      const glass = (e.target as Element | null)?.closest<HTMLElement>('.glass');
      if (!glass) return;
      const r = glass.getBoundingClientRect();
      glass.style.setProperty('--mx', `${e.clientX - r.left}px`);
      glass.style.setProperty('--my', `${e.clientY - r.top}px`);
    };

    const bar = document.getElementById('progress');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        if (bar) bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
        h.style.setProperty('--sy', String(window.scrollY));
        ticking = false;
      });
    };

    document.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      io?.disconnect();
      document.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}
