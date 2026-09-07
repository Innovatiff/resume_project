import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "./CtaBand.module.css";
import BlurText from "./BlurText";
import { cta } from "@/lib/pages";
import { hero } from "@/lib/content";
import { IconCheck, IconDoc } from "./icons";

interface Props {
  title?: string;
  lead?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

/** Closing call to action used at the bottom of every page. */
export default function CtaBand({ title = cta.title, lead = cta.lead, primary = cta.primary, secondary = cta.secondary }: Props) {
  const isExternal = (href: string) => href.startsWith("mailto:") || href.startsWith("http");
  return (
    <section className={`panel panel--ink ${styles.band}`} aria-labelledby="cta-title">
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.copy}>
          <BlurText as="h2" className="h-display h2" id="cta-title">
            {title}
          </BlurText>
          <p className="lead" data-reveal="">
            {lead}
          </p>
          <div className={styles.actions} data-reveal="">
            {isExternal(primary.href) ? (
              <a className="btn btn--coral btn--lg" href={primary.href}>
                {primary.label}
              </a>
            ) : (
              <Link className="btn btn--coral btn--lg" href={primary.href}>
                {primary.label}
              </Link>
            )}
            {isExternal(secondary.href) ? (
              <a className="btn btn--white btn--lg" href={secondary.href}>
                {secondary.label}
              </a>
            ) : (
              <Link className="btn btn--white btn--lg" href={secondary.href}>
                {secondary.label}
              </Link>
            )}
          </div>
          <ul className={styles.trust} data-reveal="">
            {hero.trust.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        <div className={styles.art} aria-hidden="true" data-reveal="scale">
          <span className={styles.wire} />
          <span className={`${styles.node} ${styles.nodeDoc}`} style={{ "--x": "18%", "--s": "64px", "--dur": "6.2s", "--delay": "-1s" } as CSSProperties}>
            <IconDoc />
          </span>
          <span className={`${styles.node} ${styles.nodeCheck}`} style={{ "--x": "50%", "--s": "96px", "--dur": "7s", "--delay": "0s" } as CSSProperties}>
            <IconCheck strokeWidth={2.2} />
          </span>
          <span className={`${styles.node} ${styles.nodeScore}`} style={{ "--x": "82%", "--s": "72px", "--dur": "6.6s", "--delay": "-2.6s" } as CSSProperties}>
            <span>
              91
              <small>score</small>
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
