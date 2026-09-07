"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { getLenis, setLenis } from "@/lib/lenis-store";

/**
 * Lenis smooth scrolling synced to GSAP's ticker + ScrollTrigger.
 * Skipped entirely when the user prefers reduced motion.
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const gsap = ensureGsap();
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
    });
    setLenis(lenis);

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  /* On client-side navigation start each page at the top (unless a hash is targeted). */
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.location.hash) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
