import Link from "next/link";
import styles from "./LegalPage.module.css";
import BlurText from "./BlurText";
import type { LegalDoc } from "@/lib/pages";

const related = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "Refund policy", href: "/refunds" },
];

export default function LegalPage({ doc, current }: { doc: LegalDoc; current: string }) {
  return (
    <>
      <section className={`panel ${styles.hero}`} aria-labelledby="legal-title">
        <div className={`wrap ${styles.heroInner}`}>
          <span className={styles.meta} data-reveal="">
            Legal <span>Last updated {doc.updated}</span>
          </span>
          <BlurText as="h1" className={`h-display h1 ${styles.title}`} id="legal-title" delay={0.1}>
            {doc.title}
          </BlurText>
          <p className={styles.intro} data-reveal="" data-reveal-delay="0.35">
            {doc.intro}
          </p>
        </div>
      </section>

      <div className={`wrap ${styles.body}`}>
        <div className={styles.grid}>
          <nav className={styles.toc} aria-label="On this page" data-reveal="">
            <h4>On this page</h4>
            {doc.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.heading}
              </a>
            ))}
          </nav>

          <article className={styles.prose}>
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} data-reveal="">
                <h2>{s.heading}</h2>
                {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
                {s.bullets ? (
                  <ul>
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
            <div className={styles.related}>
              <span>Also see:</span>
              {related
                .filter((r) => r.href !== current)
                .map((r) => (
                  <Link key={r.href} href={r.href}>
                    {r.label}
                  </Link>
                ))}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
