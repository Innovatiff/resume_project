import type { ReactNode } from "react";
import styles from "./AboutBlocks.module.css";
import BlurText from "./BlurText";
import { rules } from "@/lib/content";
import { aboutPage } from "@/lib/pages";
import { IconBan, IconCheck, IconX } from "./icons";
import {
  IllustRuleBlock,
  IllustRuleFabricate,
  IllustRulePay,
  IllustRulePromise,
  IllustRuleRenew,
  IllustRuleSubmit,
  IllustSkyline,
  IllustWedgeMarkets,
  IllustWedgeSkip,
  IllustWedgeTrust,
} from "./illustrations";

const ruleArt: Record<string, ReactNode> = {
  fabricate: <IllustRuleFabricate />,
  pay: <IllustRulePay />,
  block: <IllustRuleBlock />,
  submit: <IllustRuleSubmit />,
  renew: <IllustRuleRenew />,
  promise: <IllustRulePromise />,
};

const wedgeArt = [<IllustWedgeSkip key="skip" />, <IllustWedgeTrust key="trust" />, <IllustWedgeMarkets key="markets" />];

export function Wedges() {
  const w = aboutPage.wedges;
  return (
    <section className={styles.section} aria-labelledby="wedges-title">
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="wedges-title">
            {w.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {w.lead}
          </p>
        </div>

        <div className={styles.wedges}>
          {w.items.map((item, i) => (
            <article key={item.title} className={styles.wedge} data-reveal="">
              <div className={styles.wedgeArt} aria-hidden="true">
                <span className={styles.wedgeNum}>0{i + 1}</span>
                {wedgeArt[i]}
              </div>
              <h3 className="h3">{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>

        <div className={styles.versus}>
          <div className={`${styles.col} ${styles.theirs}`} data-reveal="">
            <h4>What most AI resume tools do</h4>
            <ul>
              {w.theirs.map((t) => (
                <li key={t}>
                  <i>
                    <IconX />
                  </i>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${styles.col} ${styles.ours}`} data-reveal="">
            <h4>What Orvenic does</h4>
            <ul>
              {w.ours.map((t) => (
                <li key={t}>
                  <i>
                    <IconCheck strokeWidth={2.4} />
                  </i>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RulesGrid() {
  return (
    <section className={`panel ${styles.section}`} aria-labelledby="rules-grid-title" id="rules">
      <div className="wrap">
        <div className="section-head">
          <span className="icon-tile" data-reveal="scale">
            <IconBan />
          </span>
          <BlurText as="h2" className="h-display h2" id="rules-grid-title">
            {rules.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {rules.lead}
          </p>
        </div>
        <div className={styles.rules}>
          {rules.items.map((r, i) => (
            <article key={r.id} className={styles.rule} data-reveal="">
              <div className={styles.ruleArt} aria-hidden="true">
                <span className={styles.ruleNum}>0{i + 1}</span>
                {ruleArt[r.id]}
              </div>
              <h3 className="h3">{r.title}</h3>
              <p>{r.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Company() {
  const c = aboutPage.company;
  return (
    <section className={styles.company} aria-labelledby="company-title">
      <div className={`wrap ${styles.companyGrid}`}>
        <div className={styles.companyCopy}>
          <BlurText as="h2" className="h-display h2" id="company-title">
            {c.title}
          </BlurText>
          {c.body.map((p) => (
            <p key={p} data-reveal="">
              {p}
            </p>
          ))}
        </div>
        <div className={styles.facts} data-reveal="">
          <div className={styles.companyArt} aria-hidden="true">
            <IllustSkyline />
          </div>
          {c.facts.map((f) => (
            <div key={f.label} className={styles.factRow}>
              <span>{f.label}</span>
              <b>{f.value}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
