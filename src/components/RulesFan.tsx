"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./RulesFan.module.css";
import BlurText from "./BlurText";
import { rules } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/motion";
import { IconBan, IconCardOff, IconDollar, IconDoorOpen, IconHand, IconHandshake, IconShield } from "./icons";

const icons: Record<string, ReactNode> = {
  fabricate: <IconShield />,
  pay: <IconDollar />,
  block: <IconDoorOpen />,
  submit: <IconHand />,
  renew: <IconCardOff />,
  promise: <IconHandshake />,
};

/* Fanned arc positions by offset from the active tile (in tile units). */
const slots: Record<number, { dx: number; dy: number; rot: number; sc: number; op: number; z: number }> = {
  [-2]: { dx: -2.25, dy: 0.42, rot: -22, sc: 0.9, op: 1, z: 1 },
  [-1]: { dx: -1.15, dy: 0.1, rot: -11, sc: 0.96, op: 1, z: 2 },
  [0]: { dx: 0, dy: -0.06, rot: 0, sc: 1.08, op: 1, z: 3 },
  [1]: { dx: 1.15, dy: 0.1, rot: 11, sc: 0.96, op: 1, z: 2 },
  [2]: { dx: 2.25, dy: 0.42, rot: 22, sc: 0.9, op: 1, z: 1 },
};
const hidden = { dx: 0, dy: 1.1, rot: 0, sc: 0.5, op: 0, z: 0 };

export default function RulesFan() {
  const n = rules.items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const visible = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion() || paused) return;
    const t = window.setInterval(() => {
      if (visible.current) setActive((a) => (a + 1) % n);
    }, 2800);
    return () => window.clearInterval(t);
  }, [paused, n]);

  const offsetOf = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <section
      className={`panel section ${styles.section}`}
      id="rules"
      aria-labelledby="rules-title"
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="wrap">
        <div className="section-head">
          <span className="icon-tile" data-reveal="scale">
            <IconBan />
          </span>
          <BlurText as="h2" className="h-display h2" id="rules-title">
            {rules.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {rules.lead}
          </p>
        </div>

        <div className={styles.fan} data-reveal="scale" role="tablist" aria-label="The six rules">
          {rules.items.map((r, i) => {
            const d = offsetOf(i);
            const s = Math.abs(d) <= 2 ? slots[d] : hidden;
            return (
              <button
                key={r.id}
                type="button"
                role="tab"
                id={`rule-tab-${r.id}`}
                aria-selected={i === active}
                aria-controls={`rule-panel-${r.id}`}
                aria-label={r.title}
                className={`${styles.item} ${i === active ? styles.active : ""}`}
                onClick={() => setActive(i)}
                style={
                  {
                    "--dx": s.dx,
                    "--dy": s.dy,
                    "--rot": `${s.rot}deg`,
                    "--sc": s.sc,
                    "--op": s.op,
                    "--z": s.z,
                  } as CSSProperties
                }
              >
                <span className={styles.num} aria-hidden="true">
                  0{i + 1}
                </span>
                {icons[r.id]}
              </button>
            );
          })}
        </div>

        <div className={styles.caption} data-reveal="">
          {rules.items.map((r, i) => (
            <div
              key={r.id}
              className={`${styles.capItem} ${i === active ? styles.on : ""}`}
              role="tabpanel"
              id={`rule-panel-${r.id}`}
              aria-labelledby={`rule-tab-${r.id}`}
              aria-hidden={i !== active}
            >
              <h3 className="h3">{r.title}</h3>
              <p>{r.body}</p>
            </div>
          ))}
        </div>

        <div className={styles.dots} data-reveal="">
          {rules.items.map((r, i) => (
            <button key={r.id} type="button" aria-label={`Show rule ${i + 1}: ${r.title}`} aria-current={i === active} onClick={() => setActive(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
