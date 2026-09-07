import type { CSSProperties, ReactNode } from "react";
import styles from "./PageHero.module.css";
import BlurText from "./BlurText";
import { IconCheck, IconDoc, IconFlag } from "./icons";

interface Props {
  eyebrow: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
  /** Show the floating tile trio for product pages; off for legal pages. */
  tiles?: boolean;
  id?: string;
}

/** Consistent header panel for every sub-page. */
export default function PageHero({ eyebrow, title, lead, actions, tiles = true, id = "page-title" }: Props) {
  return (
    <section className={`panel ${styles.hero}`} aria-labelledby={id}>
      <div className={`wrap ${styles.inner}`}>
        {tiles ? (
          <div className={styles.tiles} aria-hidden="true" data-reveal="scale">
            <span className={styles.tile} style={{ "--dur": "6.4s", "--delay": "-1.2s" } as CSSProperties}>
              <IconDoc />
            </span>
            <span className={styles.tile} style={{ "--dur": "7s" } as CSSProperties}>
              <IconCheck strokeWidth={2.2} />
            </span>
            <span className={styles.tile} style={{ "--dur": "6s", "--delay": "-2.4s" } as CSSProperties}>
              <IconFlag />
            </span>
          </div>
        ) : null}
        <span className={styles.eyebrow} data-reveal="">
          {eyebrow}
        </span>
        <BlurText as="h1" className={`h-display h1 ${styles.title}`} id={id} delay={0.15}>
          {title}
        </BlurText>
        {lead ? (
          <p className={`lead ${styles.lead}`} data-reveal="" data-reveal-delay="0.45">
            {lead}
          </p>
        ) : null}
        {actions ? (
          <div className={styles.actions} data-reveal="" data-reveal-delay="0.6">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
