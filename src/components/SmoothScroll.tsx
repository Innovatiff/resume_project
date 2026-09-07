"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { setLenis } from "@/lib/lenis-store";

/**
 * Lenis smooth scrolling synced to GSAP's ticker + ScrollTrigger.
 * Skipped entirely when the user prefers reduced motion.
 */
export default function SmoothScroll() {
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

    // Re-measure once web fonts are in, so triggers line up with final layout.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
