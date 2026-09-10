import type { ReactNode } from "react";
import styles from "./ProcessTimeline.module.css";
import BlurText from "./BlurText";
import { processPage, type ProcessStep } from "@/lib/pages";
import { IllustStepApply, IllustStepIntake, IllustStepPay, IllustStepProfile, IllustStepRewrite, IllustStepScore, IllustStepVerdict } from "./illustrations";

const art: Record<ProcessStep["icon"], ReactNode> = {
  upload: <IllustStepIntake />,
  doc: <IllustStepProfile />,
  target: <IllustStepScore />,
  check: <IllustStepVerdict />,
  dollar: <IllustStepPay />,
  chat: <IllustStepRewrite />,
  compass: <IllustStepApply />,
};

export default function ProcessTimeline() {
  return (
    <section className={styles.section} aria-labelledby="process-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.sticky}>
          <span className="eyebrow" data-reveal="">
            The pipeline
          </span>
          <BlurText as="h2" className="h-display h2" id="process-title">
            Seven steps. One question answered.
          </BlurText>
          <p className="lead" data-reveal="">
            Every step exists to answer whether this posting is worth your time, then to do the work for the ones that are.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat} data-reveal="">
              <b>&lt;5 min</b>
              <span>from upload to delivery</span>
            </div>
            <div className={styles.stat} data-reveal="">
              <b>85+</b>
              <span>guaranteed score, or it&apos;s free</span>
            </div>
            <div className={styles.stat} data-reveal="">
              <b>0</b>
              <span>numbers invented, ever</span>
            </div>
            <div className={styles.stat} data-reveal="">
              <b>3</b>
              <span>better roles nearby, every scan</span>
            </div>
          </div>
        </div>

        <ol className={styles.steps}>
          {processPage.steps.map((s, i) => (
            <li key={s.id} className={styles.step} data-reveal="">
              <div className={styles.art} data-step={i + 1} aria-hidden="true">
                <span className={styles.badge}>{i + 1}</span>
                {art[s.icon]}
              </div>
              <div className={styles.body}>
                <span className={styles.num}>Step {i + 1}</span>
                <h3 className="h3">{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
