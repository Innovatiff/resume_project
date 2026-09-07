"use client";

import { useState } from "react";
import styles from "./Faq.module.css";
import BlurText from "./BlurText";
import { faq } from "@/lib/content";
import { IconPlus } from "./icons";

export default function Faq() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section className={`section ${styles.section}`} id="faq" aria-labelledby="faq-title">
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="faq-title">
            {faq.title}
          </BlurText>
        </div>

        <div className={styles.list}>
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={styles.item} data-open={isOpen} data-reveal="">
                <h3>
                  <button
                    type="button"
                    className={styles.q}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    {item.q}
                    <span className={styles.plus} aria-hidden="true">
                      <IconPlus />
                    </span>
                  </button>
                </h3>
                <div className={styles.a} id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                  <div className={styles.aInner}>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
