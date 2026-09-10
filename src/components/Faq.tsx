"use client";

import { useState, type ReactNode } from "react";
import styles from "./Faq.module.css";
import BlurText from "./BlurText";
import { faq, type Faq as FaqItem } from "@/lib/content";
import { IconPlus } from "./icons";

interface Props {
  items?: FaqItem[];
  title?: string;
  /** One line under the title; only shown in the category layout. */
  lead?: string;
  /** Compact: a left-aligned category heading inside a larger page section. */
  compact?: boolean;
  /** A scene beside the list. Switches the compact block to the two-column category layout. */
  art?: ReactNode;
  tone?: "purple" | "coral" | "cyan" | "yellow";
  idPrefix?: string;
  initialOpen?: number;
  id?: string;
}

export default function Faq({ items = faq.items, title = faq.title, lead, compact = false, art, tone, idPrefix = "faq", initialOpen = 0, id = "faq" }: Props) {
  const [open, setOpen] = useState<number>(initialOpen);

  const list = (
    <div className={styles.list}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const qid = `${idPrefix}-q-${i}`;
        const aid = `${idPrefix}-a-${i}`;
        return (
          <div key={item.q} className={styles.item} data-open={isOpen} data-reveal="">
            <h3>
              <button type="button" className={styles.q} aria-expanded={isOpen} aria-controls={aid} id={qid} onClick={() => setOpen(isOpen ? -1 : i)}>
                {item.q}
                <span className={styles.plus} aria-hidden="true">
                  <IconPlus />
                </span>
              </button>
            </h3>
            <div className={styles.a} id={aid} role="region" aria-labelledby={qid}>
              <div className={styles.aInner}>
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (compact && art) {
    return (
      <div className={`${styles.compact} ${styles.cat}`} id={id} data-tone={tone}>
        <div className={styles.catHead}>
          <div className={styles.catArt} aria-hidden="true" data-reveal="scale">
            {art}
          </div>
          <h2 className={`h-display ${styles.compactTitle}`} data-reveal="">
            {title}
          </h2>
          {lead ? (
            <p className={styles.catLead} data-reveal="">
              {lead}
            </p>
          ) : null}
          <span className={styles.catCount} data-reveal="">
            {items.length} questions
          </span>
        </div>
        {list}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={styles.compact} id={id}>
        <h2 className={`h-display ${styles.compactTitle}`} data-reveal="">
          {title}
        </h2>
        {list}
      </div>
    );
  }

  return (
    <section className={`section ${styles.section}`} id={id} aria-labelledby={`${idPrefix}-title`}>
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id={`${idPrefix}-title`}>
            {title}
          </BlurText>
        </div>
        {list}
      </div>
    </section>
  );
}
