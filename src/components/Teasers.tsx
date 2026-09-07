import Link from "next/link";
import styles from "./Teasers.module.css";
import BlurText from "./BlurText";
import { pricing } from "@/lib/content";
import { teasers } from "@/lib/pages";
import { IconCheck, IconDollar } from "./icons";

const teaserFeatures: Record<string, string[]> = {
  single: ["Tailored resume and cover letter", "Verdict, pay report and red flags", "One free revision within 48 hours"],
  pass: ["Unlimited postings for 30 days", "One-click apply extension and tracker", "Metric interview and LinkedIn rewrite"],
  landed: ["Everything in the pass for 90 days", "Human review of every resume", "Two live coaching sessions"],
};

export function PricingTeaser() {
  const tiers = pricing.tiers.filter((t) => t.id !== "free");
  return (
    <section className={styles.pricing} aria-labelledby="pricing-teaser-title">
      <div className="wrap">
        <div className="section-head">
          <span className="icon-tile" data-reveal="scale" style={{ color: "var(--green)" }}>
            <IconDollar />
          </span>
          <BlurText as="h2" className="h-display h2" id="pricing-teaser-title">
            {teasers.pricing.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {teasers.pricing.lead}
          </p>
        </div>

        <div className={styles.tiers}>
          {tiers.map((t) => (
            <article key={t.id} className={`${styles.tier} ${t.featured ? styles.featured : ""}`} data-reveal="">
              <div className={styles.tierHead}>
                <span className={styles.name}>{t.name}</span>
                {t.featured ? <span className="chip chip--coral">Most popular</span> : null}
              </div>
              <div className={styles.price}>
                <b>{t.price}</b>
                <span>{t.period}</span>
              </div>
              <p className={styles.blurb}>{t.blurb}</p>
              <ul className={styles.features}>
                {teaserFeatures[t.id].map((f) => (
                  <li key={f}>
                    <IconCheck />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link className={`btn ${t.featured ? "btn--coral" : "btn--outline"} btn--block`} href="/pricing">
                See what&apos;s included
              </Link>
            </article>
          ))}
        </div>

        <div className={styles.foot} data-reveal="">
          <p>
            <b>Free scan, $0.</b> Your ATS score and the three reasons you are being filtered out. No card, no account.
          </p>
          <Link className="btn btn--ink" href={teasers.pricing.cta.href}>
            {teasers.pricing.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function OrgTeaser() {
  const t = teasers.org;
  return (
    <section className={`panel ${styles.org}`} aria-labelledby="org-teaser-title">
      <div className={`wrap ${styles.orgGrid}`}>
        <div className={styles.orgCopy}>
          <span className="eyebrow" data-reveal="">
            {t.eyebrow}
          </span>
          <BlurText as="h2" className="h-display h2" id="org-teaser-title">
            {t.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {t.lead}
          </p>
          <Link className="btn btn--ink btn--lg" href={t.cta.href} data-reveal="">
            {t.cta.label}
          </Link>
        </div>
        <div className={styles.facts}>
          {t.facts.map((f) => (
            <div key={f.label} className={styles.fact} data-reveal="">
              <b>{f.value}</b>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
