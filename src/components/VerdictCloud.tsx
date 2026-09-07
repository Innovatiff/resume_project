"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import styles from "./VerdictCloud.module.css";
import BlurText from "./BlurText";
import PostingCard from "./PostingCard";
import { cloud, postings } from "@/lib/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { IconTarget } from "./icons";

/* Cloud layout: top-left of each card in % of the stage, rotation, parallax speed. */
const layout = [
  { x: 2, y: 4, r: -5, speed: 1 },
  { x: 15, y: 30, r: 3, speed: -0.6 },
  { x: 3, y: 56, r: -2, speed: 0.55 },
  { x: 17, y: 76, r: 4, speed: -1 },
  { x: 68, y: 6, r: 4, speed: -0.8 },
  { x: 82, y: 26, r: -3, speed: 0.9 },
  { x: 69, y: 54, r: -4, speed: -0.5 },
  { x: 83, y: 72, r: 3, speed: 0.75 },
];

export default function VerdictCloud() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const gsap = ensureGsap();
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 961px)", () => {
        gsap.utils.toArray<HTMLElement>("[data-cloud-card]").forEach((el) => {
          const speed = Number(el.dataset.speed || 0.5);
          gsap.fromTo(
            el,
            { y: speed * 170 },
            {
              y: -speed * 170,
              ease: "none",
              scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
        gsap.fromTo(
          "[data-cloud-card]",
          { opacity: 0, scale: 0.85, filter: "blur(10px)" },
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.1,
            stagger: { each: 0.07, from: "random" },
            ease: "power3.out",
            clearProps: "filter",
            scrollTrigger: { trigger: root, start: "top 70%", once: true },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.section} id="verdicts" aria-labelledby="cloud-title" ref={ref}>
      <div className={styles.stage}>
        <ul className={styles.cards} aria-label="Example verdicts">
          {postings.map((p, i) => {
            const l = layout[i];
            return (
              <li
                key={p.title}
                className={styles.card}
                data-cloud-card=""
                data-speed={l.speed}
                style={{ "--x": `${l.x}%`, "--y": `${l.y}%`, "--r": `${l.r}deg` } as CSSProperties}
              >
                <PostingCard p={p} />
              </li>
            );
          })}
        </ul>

        <div className={styles.copy}>
          <span className="icon-tile" data-reveal="scale" style={{ color: "var(--purple)" }}>
            <IconTarget />
          </span>
          <BlurText as="h2" className="h-display h2" id="cloud-title">
            {cloud.title}
          </BlurText>
          <p className={`lead ${styles.lead}`} data-reveal="">
            {cloud.lead}
          </p>
          <Link className="btn btn--purple btn--lg" href={cloud.cta.href} data-reveal="">
            {cloud.cta.label}
          </Link>
        </div>
      </div>

      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.track}>
          {[...postings, ...postings].map((p, i) => (
            <div className={styles.slot} key={`${p.title}-${i}`}>
              <PostingCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
