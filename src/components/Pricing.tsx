"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./Pricing.module.css";
import BlurText from "./BlurText";
import { pricing } from "@/lib/content";
import { IconCheck, IconDollar } from "./icons";

export default function Pricing({ showHead = true }: { showHead?: boolean }) {
  const tiersRef = useRef<HTMLDivElement>(null);

  /* On small screens the tiers are a snap scroller: open on the featured tier. */
  useEffect(() => {
    const el = tiersRef.current;
    if (!el || window.innerWidth > 720) return;
    const featured = el.querySelector<HTMLElement>("[data-featured='true']");
    if (!featured) return;
    const left = featured.offsetLeft - (el.clientWidth - featured.offsetWidth) / 2;
    el.scrollTo({ left, behavior: "auto" });
  }, []);

  return (
    <section className={`panel section ${styles.section}`} id="pricing" aria-labelledby={showHead ? "pricing-title" : undefined} aria-label={showHead ? undefined : "Pricing"}>
      <div className="wrap">
        {showHead ? (
          <div className="section-head">
            <span className="icon-tile" data-reveal="scale" style={{ color: "var(--green)" }}>
              <IconDollar />
            </span>
            <BlurText as="h2" className="h-display h2" id="pricing-title">
              {pricing.title}
            </BlurText>
            <p className="lead" data-reveal="">
              {pricing.lead}
            </p>
          </div>
        ) : null}

        <div className={styles.tiers} ref={tiersRef} data-lenis-prevent="">
          {pricing.tiers.map((t) => (
            <article
              key={t.id}
              className={`${styles.tier} ${t.featured ? styles.featured : ""}`}
              data-reveal=""
              data-featured={t.featured ? "true" : "false"}
              aria-label={`${t.name}, ${t.price}`}
            >
              {t.badge ? <span className={styles.badge}>{t.badge}</span> : null}
              <span className={styles.name}>{t.name}</span>
              <div className={styles.price}>
                <b>{t.price}</b>
                <span>{t.period}</span>
              </div>
              <p className={styles.blurb}>{t.blurb}</p>
              <ul className={styles.features}>
                {t.features.map((f) => (
                  <li key={f}>
                    <IconCheck />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link className={`btn ${t.featured ? "btn--coral" : "btn--outline"} btn--block`} href={t.cta.href}>
                {t.cta.label}
              </Link>
            </article>
          ))}
        </div>

        <div className={styles.below}>
          <div className={styles.guarantee} id="guarantee" data-reveal="">
            <div className={styles.gStat}>
              <b>{pricing.guarantee.stat}</b>
              <span>{pricing.guarantee.title}</span>
            </div>
            <div className={styles.gCopy}>
              <p>{pricing.guarantee.body}</p>
              <p className={styles.never}>{pricing.guarantee.never}</p>
            </div>
          </div>

          <div className={styles.addons} data-reveal="">
            <h3 className="h3">Add-ons</h3>
            <ul>
              {pricing.addons.map((a) => (
                <li key={a.item}>
                  <span>{a.item}</span>
                  <b>{a.price}</b>
                </li>
              ))}
            </ul>
            <p className={styles.fine}>Canadian dollars in Canada, US dollars everywhere else. Taxes calculated at checkout.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
