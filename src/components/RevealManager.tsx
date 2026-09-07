"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

/**
 * Page-wide scroll reveals, re-initialised on every route change.
 *
 *  data-reveal            fade + rise (+ blur) as the element enters
 *  data-reveal="scale"    fade + scale up
 *  data-reveal-text       word-by-word motion-blur reveal (see BlurText)
 *
 * Elements already in (or above) the viewport when a page mounts animate
 * in immediately with a stagger; everything else waits for ScrollTrigger.
 */
export default function RevealManager() {
  const pathname = usePathname();

  useEffect(() => {
    const gsap = ensureGsap();
    const root = document.documentElement;

    if (prefersReducedMotion()) {
      gsap.set("[data-reveal], [data-reveal-text] .wi", { clearProps: "all", opacity: 1 });
      return;
    }

    const revealBlock = (el: HTMLElement, i: number) => {
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
    };

    const revealText = (el: HTMLElement) => {
      const words = el.querySelectorAll<HTMLElement>(".wi");
      if (!words.length) return;
      const delay = Number(el.dataset.revealDelay || 0);
      gsap.fromTo(
        words,
        { opacity: 0, y: "0.35em", x: "0.2em", filter: "blur(16px)" },
        { opacity: 1, y: 0, x: 0, filter: "blur(0px)", duration: 0.9, delay, ease: "power3.out", stagger: 0.055, clearProps: "filter,transform" },
      );
    };

    const ctx = gsap.context(() => {
      const vh = window.innerHeight;
      const inView = (el: Element) => el.getBoundingClientRect().top < vh * 0.92;

      const blocks = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      const now = blocks.filter(inView);
      const later = blocks.filter((el) => !inView(el));
      now.forEach(revealBlock);
      if (later.length) {
        ScrollTrigger.batch(later, {
          start: "top 90%",
          once: true,
          onEnter: (batch) => (batch as HTMLElement[]).forEach(revealBlock),
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-reveal-text]").forEach((el) => {
        if (inView(el)) {
          revealText(el);
        } else {
          ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => revealText(el) });
        }
      });
    }, root);

    ScrollTrigger.refresh();

    // Safety net: anything still hidden inside the viewport after the intro window gets shown.
    const safety = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-text] .wi").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight && getComputedStyle(el).opacity === "0") {
          gsap.to(el, { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)", duration: 0.6, clearProps: "filter" });
        }
      });
    }, 3000);

    return () => {
      window.clearTimeout(safety);
      ctx.revert();
    };
  }, [pathname]);

  return null;
}
