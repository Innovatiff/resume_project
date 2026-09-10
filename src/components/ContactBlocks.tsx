import styles from "./ContactBlocks.module.css";
import { contactPage } from "@/lib/pages";
import { IllustContactCustomer, IllustContactOrg, IllustContactPrivacy, IllustWhere } from "./illustrations";

const art = [<IllustContactCustomer key="c" />, <IllustContactOrg key="o" />, <IllustContactPrivacy key="p" />];

export default function ContactChannels() {
  return (
    <section className={styles.section} aria-label="Contact channels">
      <div className="wrap">
        <div className={styles.grid}>
          {contactPage.channels.map((c, i) => (
            <article key={c.title} className={styles.card} data-reveal="">
              <div className={styles.art} aria-hidden="true">
                {art[i]}
              </div>
              <h3 className="h3">{c.title}</h3>
              <p>{c.body}</p>
              <a className="btn btn--outline" href={`mailto:${c.email}?subject=${c.subject}`}>
                {c.email}
              </a>
            </article>
          ))}
        </div>
        <div className={styles.where} data-reveal="">
          <div className={styles.whereArt} aria-hidden="true">
            <IllustWhere />
          </div>
          <p className={styles.address}>{contactPage.address}</p>
        </div>
      </div>
    </section>
  );
}
