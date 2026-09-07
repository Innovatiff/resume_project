import styles from "./OrgBlocks.module.css";
import BlurText from "./BlurText";
import { orgPage } from "@/lib/pages";
import { IconBriefcase, IconMapPin, IconTranslate } from "./icons";

const icons = [<IconBriefcase key="b" />, <IconTranslate key="t" />, <IconMapPin key="m" />];

export function WhoItsFor() {
  const w = orgPage.who;
  return (
    <section className={styles.section} aria-labelledby="who-title">
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="who-title">
            {w.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {w.lead}
          </p>
        </div>
        <div className={styles.cards}>
          {w.items.map((item, i) => (
            <article key={item.title} className={styles.card} data-reveal="">
              <span className={styles.icon} aria-hidden="true">
                {icons[i]}
              </span>
              <h3 className="h3">{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PilotSteps() {
  const p = orgPage.pilot;
  return (
    <section className={styles.pilot} aria-labelledby="pilot-title">
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="pilot-title">
            {p.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {p.lead}
          </p>
        </div>
        <ol className={styles.steps}>
          {p.steps.map((s) => (
            <li key={s.title} className={styles.step} data-reveal="">
              <h3 className="h3">{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
