"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";
import BlurText from "./BlurText";
import { hero } from "@/lib/content";
import { ensureGsap, isTouchDevice, prefersReducedMotion } from "@/lib/motion";
import { IconBriefcase, IconCheck, IconDoc, IconEyes, IconFlag } from "./icons";

/* Tile geometry: centre position in % of the 1000x400 diagram, size in cqw. */
const tiles = [
  { id: "you", x: 8, y: 52, mx: 10, size: 10, depth: 1.2, dur: 6.5, delay: 0.2 },
  { id: "resume", x: 22, y: 22, mx: 25, size: 6.5, depth: 1.6, dur: 5.5, delay: 1.1 },
  { id: "posting", x: 25, y: 78, mx: 28, size: 8.5, depth: 1.4, dur: 6.2, delay: 0.6 },
  { id: "verdict", x: 50, y: 50, mx: 50, size: 13, depth: 0.6, dur: 7, delay: 0 },
  { id: "flag", x: 75, y: 22, mx: 73, size: 8.5, depth: 1.4, dur: 5.8, delay: 1.5 },
  { id: "pay", x: 77, y: 80, mx: 74, size: 7, depth: 1.6, dur: 6.4, delay: 0.9 },
  { id: "eyes", x: 93, y: 50, mx: 90, size: 10, depth: 1.2, dur: 6.8, delay: 0.4 },
] as const;

const wires = [
  "M132 208 H 434",
  "M255 88 H 300",
  "M300 88 L 442 186",
  "M292 312 H 335",
  "M335 312 L 442 222",
  "M708 88 H 660",
  "M660 88 L 558 186",
  "M735 320 H 690",
  "M690 320 L 558 220",
  "M566 200 H 878",
];

const dots = [
  [300, 88],
  [335, 312],
  [660, 88],
  [690, 320],
];

function TileFace({ id }: { id: (typeof tiles)[number]["id"] }) {
  switch (id) {
    case "you":
      return <div className={`${styles.tileInner} ${styles.avatar}`}>MR</div>;
    case "resume":
      return (
        <div className={`${styles.tileInner} ${styles.yellow}`}>
          <IconDoc />
        </div>
      );
    case "posting":
      return (
        <div className={`${styles.tileInner} ${styles.cyan}`}>
          <IconBriefcase />
        </div>
      );
    case "verdict":
      return (
        <div className={`${styles.tileInner} ${styles.center}`}>
          <IconCheck strokeWidth={2.2} />
        </div>
      );
    case "flag":
      return (
        <div className={`${styles.tileInner} ${styles.coral}`}>
          <IconFlag />
        </div>
      );
    case "pay":
      return (
        <div className={`${styles.tileInner} ${styles.pay}`}>
          <span>
            $70K
            <small>settled</small>
          </span>
        </div>
      );
    case "eyes":
      return (
        <div className={`${styles.tileInner} ${styles.white}`}>
          <IconEyes />
        </div>
      );
  }
}

export default function Hero() {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gsap = ensureGsap();
    const root = diagramRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const paths = gsap.utils.toArray<SVGPathElement>("path[data-wire]");
      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        "[data-tile]",
        { opacity: 0, scale: 0.55, filter: "blur(14px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.1, stagger: { each: 0.09, from: "center" }, ease: "back.out(1.5)", clearProps: "filter" },
        0.1,
      )
        .to(paths, { strokeDashoffset: 0, duration: 1.1, stagger: 0.05, ease: "power2.inOut" }, 0.35)
        .fromTo("[data-dot]", { scale: 0, transformOrigin: "center" }, { scale: 1, duration: 0.5, stagger: 0.06, ease: "back.out(2)" }, 0.9);

      // Gentle pointer parallax on devices with a fine pointer.
      if (!isTouchDevice()) {
        const tileEls = gsap.utils.toArray<HTMLElement>("[data-tile]");
        const setters = tileEls.map((el) => ({
          depth: Number(el.dataset.depth || 1),
          x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
        }));
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
          const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
          setters.forEach((s) => {
            s.x(nx * 18 * s.depth);
            s.y(ny * 14 * s.depth);
          });
        };
        const onLeave = () => setters.forEach((s) => (s.x(0), s.y(0)));
        const section = root.closest("section") ?? root;
        section.addEventListener("pointermove", onMove);
        section.addEventListener("pointerleave", onLeave);
        return () => {
          section.removeEventListener("pointermove", onMove);
          section.removeEventListener("pointerleave", onLeave);
        };
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className={`panel ${styles.hero}`} id="top" aria-labelledby="hero-title">
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.diagram} ref={diagramRef} aria-hidden="true">
          <svg className={styles.wires} viewBox="0 0 1000 400" preserveAspectRatio="none">
            {wires.map((d) => (
              <path key={d} d={d} className={styles.wire} data-wire="" />
            ))}
            {dots.map(([cx, cy]) => (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r="9" className={styles.pulse} />
                <circle cx={cx} cy={cy} r="4.2" className={styles.dot} data-dot="" />
              </g>
            ))}
          </svg>

          {tiles.map((t) => (
            <div
              key={t.id}
              className={styles.tile}
              data-tile=""
              data-depth={t.depth}
              style={
                {
                  "--x": `${t.x}%`,
                  "--mx": `${t.mx}%`,
                  "--y": `${t.y}%`,
                  "--size": t.size,
                  "--dur": `${t.dur}s`,
                  "--delay": `-${t.delay}s`,
                } as React.CSSProperties
              }
            >
              <TileFace id={t.id} />
            </div>
          ))}
        </div>

        <div className={styles.copy}>
          <h1 className={`h-display h1 ${styles.title}`} id="hero-title">
            <span className={styles.vA}>
              <BlurText as="span" delay={0.55}>{hero.variants.a}</BlurText>
            </span>
            <span className={styles.vB}>
              <BlurText as="span" delay={0.55}>{hero.variants.b}</BlurText>
            </span>
          </h1>
          <p className={`lead ${styles.lead}`} data-reveal="" data-reveal-delay="1">
            {hero.lead}
          </p>
          <div className={styles.ctas} data-reveal="" data-reveal-delay="1.15">
            <Link className="btn btn--coral btn--lg" href={hero.primary.href}>
              {hero.primary.label}
            </Link>
            <Link className="btn btn--ghost btn--lg" href={hero.secondary.href}>
              {hero.secondary.label}
            </Link>
          </div>
          <ul className={styles.trust} data-reveal="" data-reveal-delay="1.3">
            {hero.trust.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
