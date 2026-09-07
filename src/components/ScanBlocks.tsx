import styles from "./ScanBlocks.module.css";
import BlurText from "./BlurText";
import { scanPage } from "@/lib/pages";
import { IconLock, IconTarget, IconDoc } from "./icons";

const getIcons = [<IconTarget key="t" />, <IconDoc key="d" />, <IconLock key="l" />];

export function ScanSteps() {
  return (
    <section className={styles.section} aria-labelledby="scan-steps-title">
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="scan-steps-title">
            {scanPage.steps.title}
          </BlurText>
        </div>
        <ol className={styles.grid}>
          {scanPage.steps.items.map((s) => (
            <li key={s.title} className={`${styles.card} ${styles.numbered}`} data-reveal="">
              <h3 className="h3">{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ScanGets() {
  return (
    <section className={`panel ${styles.section}`} aria-labelledby="scan-gets-title">
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="scan-gets-title">
            {scanPage.gets.title}
          </BlurText>
        </div>
        <div className={styles.grid}>
          {scanPage.gets.items.map((g, i) => (
            <article key={g.title} className={styles.card} data-reveal="">
              <span className={styles.icon} aria-hidden="true">
                {getIcons[i]}
              </span>
              <h3 className="h3">{g.title}</h3>
              <p>{g.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
