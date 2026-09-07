import styles from "./ContactBlocks.module.css";
import { contactPage } from "@/lib/pages";
import { IconBriefcase, IconLock, IconMail } from "./icons";

const icons = [<IconMail key="m" />, <IconBriefcase key="b" />, <IconLock key="l" />];

export default function ContactChannels() {
  return (
    <section className={styles.section} aria-label="Contact channels">
      <div className="wrap">
        <div className={styles.grid}>
          {contactPage.channels.map((c, i) => (
            <article key={c.title} className={styles.card} data-reveal="">
              <span className={styles.icon} aria-hidden="true">
                {icons[i]}
              </span>
              <h3 className="h3">{c.title}</h3>
              <p>{c.body}</p>
              <a className="btn btn--outline" href={`mailto:${c.email}?subject=${c.subject}`}>
                {c.email}
              </a>
            </article>
          ))}
        </div>
        <p className={styles.address} data-reveal="">
          {contactPage.address}
        </p>
      </div>
    </section>
  );
}
