"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as RPointerEvent } from "react";
import styles from "./StoryCarousel.module.css";
import BlurText from "./BlurText";
import { story } from "@/lib/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { IconArrowLeft, IconArrowRight } from "./icons";

export default function StoryCarousel() {
  const steps = story.steps;
  const n = steps.length;
  const [index, setIndex] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const visible = useRef(false);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => Math.min(n - 1, Math.max(0, i + dir)));
    },
    [n],
  );

  /* Autoplay while in view, until the reader takes over. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion() || interacted) return;
    const t = window.setInterval(() => {
      if (visible.current) setIndex((i) => (i + 1) % n);
    }, 5200);
    return () => window.clearInterval(t);
  }, [interacted, n]);

  /* Entrance: the first card rises out of a purple envelope, like the reference. */
  useEffect(() => {
    const gsap = ensureGsap();
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "[data-stage]", start: "top 72%", once: true },
        defaults: { ease: "power3.out" },
      });
      tl.set("[data-envelope]", { opacity: 1 })
        .fromTo("[data-envelope]", { y: 80, scale: 0.9 }, { y: 0, scale: 1, duration: 0.8 })
        .fromTo("[data-card]", { y: 240, opacity: 0, rotate: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.04, clearProps: "transform,opacity" }, 0.3)
        .to("[data-envelope]", { y: 160, opacity: 0, duration: 0.9, ease: "power2.inOut" }, 0.9);
    }, root);
    return () => ctx.revert();
  }, []);

  /* Swipe */
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, t: Date.now() };
  };
  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dt = Date.now() - drag.current.t;
    drag.current = null;
    if (Math.abs(dx) > 40 || (Math.abs(dx) > 18 && dt < 220)) {
      setInteracted(true);
      go(dx < 0 ? 1 : -1);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      setInteracted(true);
      go(1);
    } else if (e.key === "ArrowLeft") {
      setInteracted(true);
      go(-1);
    }
  };

  return (
    <section className={`section ${styles.section}`} id="story" aria-labelledby="story-title" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="story-title">
            {story.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {story.lead}
          </p>
          <div className={styles.person} data-reveal="">
            <span className={styles.avatar} aria-hidden="true">
              {story.person.initial}
            </span>
            <span>
              <b>{story.person.name}</b>
              <small>{story.person.meta}</small>
            </span>
          </div>
        </div>

        <div
          className={styles.stage}
          ref={stageRef}
          data-stage=""
          role="region"
          aria-roledescription="carousel"
          aria-label="Maria's journey, step by step"
          tabIndex={0}
          onKeyDown={onKey}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (drag.current = null)}
        >
          {steps.map((s, i) => {
            const o = i - index;
            const ao = Math.abs(o);
            return (
              <article
                key={s.id}
                className={`${styles.card} ${i === index ? styles.on : ""}`}
                data-card=""
                data-far={ao > 2}
                aria-hidden={i !== index}
                style={{ "--o": o, "--ao": ao } as CSSProperties}
                onClick={() => {
                  if (i !== index) {
                    setInteracted(true);
                    setIndex(i);
                  }
                }}
              >
                <div className={styles.content}>
                  <span className={styles.kicker}>{s.kicker}</span>
                  <span className={styles.stat}>{s.stat}</span>
                  <span className={styles.statLabel}>{s.statLabel}</span>
                  <h3 className={`h3 ${styles.title}`}>{s.title}</h3>
                  <p className={styles.body}>{s.body}</p>
                </div>
              </article>
            );
          })}

          <div className={styles.envelope} data-envelope="" aria-hidden="true">
            <svg viewBox="0 0 560 190" preserveAspectRatio="none">
              <path d="M0 40 L280 190 L560 40 V190 H0 Z" fill="#8b5cf6" />
              <path d="M0 40 L280 190 L560 40" fill="none" stroke="#7443f0" strokeWidth="2" />
              <path d="M0 190 L280 60 L560 190 Z" fill="#a98af9" />
            </svg>
          </div>
        </div>

        <div className={styles.controls} data-reveal="">
          <button
            type="button"
            className={styles.arrow}
            aria-label="Previous step"
            disabled={index === 0}
            onClick={() => {
              setInteracted(true);
              go(-1);
            }}
          >
            <IconArrowLeft />
          </button>
          <span className={styles.count} aria-live="polite">
            <b>{index + 1}</b> / {n}
          </span>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Next step"
            disabled={index === n - 1}
            onClick={() => {
              setInteracted(true);
              go(1);
            }}
          >
            <IconArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
}
