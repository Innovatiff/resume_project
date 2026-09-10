import styles from "./OrgBlocks.module.css";
import BlurText from "./BlurText";
import { orgPage } from "@/lib/pages";
import { IllustOrgAgency, IllustOrgCollege, IllustOrgSettlement, IllustPilotCall, IllustPilotIntake, IllustPilotOnboarding, IllustPilotReport } from "./illustrations";

const whoArt = [<IllustOrgAgency key="a" />, <IllustOrgSettlement key="s" />, <IllustOrgCollege key="c" />];
const pilotArt = [<IllustPilotCall key="1" />, <IllustPilotIntake key="2" />, <IllustPilotOnboarding key="3" />, <IllustPilotReport key="4" />];

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
              <div className={styles.art} aria-hidden="true">
                {whoArt[i]}
              </div>
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
          {p.steps.map((s, i) => (
            <li key={s.title} className={styles.step} data-reveal="">
              <div className={`${styles.art} ${styles.artStep}`} aria-hidden="true">
                {pilotArt[i]}
              </div>
              <h3 className="h3">{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
