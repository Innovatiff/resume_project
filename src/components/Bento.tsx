"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./Bento.module.css";
import BlurText from "./BlurText";
import { bento } from "@/lib/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { IconCheck, IconDollar, IconFlag, IconPlus } from "./icons";
import { LogoMark } from "./Logo";
import { IllustFace, IllustMagnifier, IllustMap, IllustRing, IllustSkyline } from "./illustrations";

function Card({ copy, wide, children }: { copy: { title: string; body: string }; wide?: boolean; children: ReactNode }) {
  return (
    <article className={`${styles.card} ${wide ? styles.wide : ""}`} data-reveal="">
      <div className={styles.art}>{children}</div>
      <div className={styles.text}>
        <h3 className="h3">{copy.title}</h3>
        <p>{copy.body}</p>
      </div>
    </article>
  );
}

/* 1 ------------------------------------------------------------- */
const verdicts = [
  { title: "Warehouse Supervisor", org: "Auto parts supplier", stamp: "Skip", tone: styles.skip, pos: styles.postBack },
  { title: "Production Scheduler", org: "Packaging plant", stamp: "Borderline", tone: styles.borderline, pos: styles.postMid },
  { title: "Logistics Coordinator", org: "Food distributor", stamp: "Apply", tone: styles.apply, pos: styles.postFront, score: 88 },
];

function VerdictStack() {
  return (
    <>
      <span className={`chip chip--ink ${styles.floatChip}`}>61 → 91</span>
      <div className={styles.posts} aria-hidden="true">
        {verdicts.map((v) => (
          <div key={v.title} className={`${styles.post} ${v.pos}`} data-post="">
            <span className={styles.postMark} />
            <span className={styles.postTitle}>{v.title}</span>
            <span className={styles.postOrg}>{v.org}</span>
            <span className={styles.postLine} />
            <span className={styles.postLine} style={{ width: "62%" }} />
            <span className={`${styles.stamp} ${v.tone}`}>{v.stamp}</span>
            {v.score ? <IllustRing className={styles.postRing} value={v.score} /> : null}
          </div>
        ))}
      </div>
    </>
  );
}

/* 2 ------------------------------------------------------------- */
const payItems = [
  { t: "Windsor band · Logistics Coordinator", v: "$62–78K" },
  { t: "Offer received", v: "$64K" },
  { t: "Counter, citing the range", v: "$73K" },
  { t: "Settled", v: "$70K" },
];

function PayStack() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = window.setInterval(() => setActive((a) => (a + 1) % payItems.length), 2600);
      } else if (timer) {
        window.clearInterval(timer);
        timer = undefined;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) window.clearInterval(timer);
    };
  }, []);

  const roleFor = (i: number) => {
    const d = (i - active + payItems.length) % payItems.length;
    if (d === 0) return styles.front;
    if (d === 1) return styles.mid;
    if (d === 2) return styles.back;
    return styles.gone;
  };

  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      <IllustSkyline className={styles.skyline} />
      <div className={styles.stack} aria-live="off">
        {payItems.map((item, i) => (
          <div key={item.t} className={`${styles.note} ${roleFor(i)}`}>
            <span className={styles.noteIcon}>
              <IconDollar />
            </span>
            <b>{item.t}</b>
            <strong>{item.v}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 3 ------------------------------------------------------------- */
function RedFlagDoc() {
  return (
    <div className={styles.sheets} aria-hidden="true">
      <div className={`${styles.sheet} ${styles.sheetBack}`}>
        <span className={styles.line} style={{ "--w": "55%" } as CSSProperties} />
        <span className={styles.line} style={{ "--w": "90%" } as CSSProperties} />
        <span className={styles.line} style={{ "--w": "80%" } as CSSProperties} />
        <span className={styles.line} style={{ "--w": "86%" } as CSSProperties} />
        <span className={styles.line} style={{ "--w": "60%" } as CSSProperties} />
      </div>
      <div className={`${styles.sheet} ${styles.sheetFront}`}>
        <span className={styles.line} style={{ "--w": "48%" } as CSSProperties} />
        <span className={styles.line} style={{ "--w": "92%" } as CSSProperties} />
        <span className={styles.flagLine}>
          <IconFlag /> Salary: “competitive”
        </span>
        <span className={styles.line} style={{ "--w": "84%" } as CSSProperties} />
        <span className={styles.flagLine}>
          <IconFlag /> Relocation at own cost
        </span>
        <span className={styles.line} style={{ "--w": "70%" } as CSSProperties} />
        <span className={styles.flagLine}>
          <IconFlag /> Posted 94 days ago
        </span>
      </div>
      <div className={styles.flagTile}>
        <IconFlag />
      </div>
      <IllustMagnifier className={styles.magnifier} />
    </div>
  );
}

/* 4 ------------------------------------------------------------- */
function MetricInterview() {
  return (
    <div className={styles.chat}>
      <div className={styles.thread}>
        <div className={styles.turn} data-bubble="">
          <span className={styles.speaker}>
            <LogoMark size={30} />
          </span>
          <div className={styles.bubble}>
            <small>Orvenic</small>
            You mention reducing picking errors. By how much, and over what period?
          </div>
        </div>
        <div className={`${styles.turn} ${styles.turnMe}`} data-bubble="">
          <div className={`${styles.bubble} ${styles.me}`}>
            <small>You</small>
            34%, over seven months. It is in my 2023 review.
          </div>
          <span className={`${styles.speaker} ${styles.speakerMe}`}>
            <IllustFace />
          </span>
        </div>
        <div className={styles.result} data-bubble="">
          <span>
            Cut picking errors <mark>34% over seven months</mark> by introducing a weekly WMS cycle-count routine.
          </span>
          <span className={styles.verified}>
            <IconCheck /> Every figure found in your source
          </span>
        </div>
      </div>
      <div className={styles.checks} aria-hidden="true">
        <h4>Figures checked</h4>
        <div className={styles.check} data-bubble="">
          <b>34%</b> found in 2023 review
          <i>
            <IconCheck />
          </i>
        </div>
        <div className={styles.check} data-bubble="">
          <b>6 yrs</b> WMS, found in work history
          <i>
            <IconCheck />
          </i>
        </div>
        <div className={styles.check} data-bubble="">
          <b>$1.2M</b> not in source, asked you
          <i className={styles.ask}>
            <IconPlus />
          </i>
        </div>
      </div>
    </div>
  );
}

/* 5 ------------------------------------------------------------- */
/* Ordered so the shortest labels sit at the orbit's left and right, where the card edge is closest. */
const sats = [
  { label: "Supply Planner", delta: "+$4K" },
  { label: "Operations Coordinator", delta: "Windsor" },
  { label: "Inventory Analyst", delta: "+$9K" },
  { label: "Fleet Coordinator", delta: "+$2K" },
  { label: "Purchasing Assistant", delta: "LaSalle" },
  { label: "Production Scheduler", delta: "Tecumseh" },
];

function PlanBOrbit() {
  return (
    <div className={styles.orbitWrap} aria-hidden="true">
      <div className={styles.hub}>
        <IllustMap />
      </div>
      <div className={styles.orbit}>
        {sats.map((s, i) => (
          <span key={s.label} className={styles.sat} style={{ "--a": `${(360 / sats.length) * i}deg` } as CSSProperties}>
            <span className={styles.satInner}>
              {s.label} <em>{s.delta}</em>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
export default function Bento() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const gsap = ensureGsap();
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-post]", {
        opacity: 0,
        scale: 0.8,
        duration: 1,
        stagger: 0.14,
        ease: "back.out(1.6)",
        clearProps: "all",
        scrollTrigger: { trigger: "[data-post]", start: "top 85%", once: true },
      });
      gsap.from("[data-bubble]", {
        opacity: 0,
        y: 16,
        filter: "blur(8px)",
        duration: 0.8,
        stagger: 0.18,
        ease: "power3.out",
        clearProps: "filter",
        scrollTrigger: { trigger: "[data-bubble]", start: "top 85%", once: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const [c1, c2, c3, c4, c5] = bento.cards;

  return (
    <section className={styles.section} id="how-it-works" aria-labelledby="bento-title" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="bento-title">
            {bento.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {bento.lead}
          </p>
        </div>

        <div className={styles.grid}>
          <Card copy={c1}>
            <VerdictStack />
          </Card>
          <Card copy={c2}>
            <PayStack />
          </Card>
          <Card copy={c3}>
            <RedFlagDoc />
          </Card>
          <Card copy={c4} wide>
            <MetricInterview />
          </Card>
          <Card copy={c5}>
            <PlanBOrbit />
          </Card>
        </div>
      </div>
    </section>
  );
}
