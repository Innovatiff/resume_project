"use client";

import { useEffect } from "react";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

/**
 * Page-wide scroll reveals.
 *
 *  data-reveal            fade + rise (+ blur) as the element enters
 *  data-reveal="scale"    fade + scale up
 *  data-reveal-text       word-by-word motion-blur reveal (see BlurText)
 *
 * Elements are batched by ScrollTrigger so siblings entering together
 * stagger naturally, like the reference.
 */
export default function RevealManager() {
  useEffect(() => {
    const gsap = ensureGsap();
    const root = document.documentElement;

    if (prefersReducedMotion()) {
      gsap.set("[data-reveal], [data-reveal-text] .wi", { clearProps: "all", opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const blocks = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      ScrollTrigger.batch(blocks, {
        start: "top 90%",
        once: true,
        onEnter: (batch) => {
          const els = batch as HTMLElement[];
          els.forEach((el, i) => {
            const mode = el.dataset.reveal;
            const delay = Number(el.dataset.revealDelay || 0) + i * 0.08;
            if (mode === "scale") {
              gsap.fromTo(
                el,
                { opacity: 0, scale: 0.88, filter: "blur(10px)" },
                { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.1, delay, ease: "power3.out", clearProps: "filter" },
              );
            } else {
              gsap.fromTo(
                el,
                { opacity: 0, y: 30, filter: "blur(10px)" },
                { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.05, delay, ease: "power3.out", clearProps: "filter,transform" },
              );
            }
          });
        },
      });

      const texts = gsap.utils.toArray<HTMLElement>("[data-reveal-text]");
      texts.forEach((el) => {
        const words = el.querySelectorAll<HTMLElement>(".wi");
        if (!words.length) return;
        const delay = Number(el.dataset.revealDelay || 0);
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => {
            gsap.fromTo(
              words,
              { opacity: 0, y: "0.35em", x: "0.2em", filter: "blur(16px)" },
              {
                opacity: 1,
                y: 0,
                x: 0,
                filter: "blur(0px)",
                duration: 0.9,
                delay,
                ease: "power3.out",
                stagger: 0.055,
                clearProps: "filter,transform",
              },
            );
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return null;
}
