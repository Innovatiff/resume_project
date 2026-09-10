import styles from "./Organizations.module.css";
import BlurText from "./BlurText";
import { organizations as org } from "@/lib/content";
import { IconCheckCircle } from "./icons";
import { IllustIntakePage } from "./illustrations";

export default function Organizations() {
  return (
    <section className={`panel panel--ink ${styles.section}`} id="organizations" aria-labelledby="org-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy}>
          <span className="eyebrow" data-reveal="">
            {org.eyebrow}
          </span>
          <BlurText as="h2" className="h-display h2" id="org-title">
            {org.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {org.lead}
          </p>
          <ul className={styles.includes} data-reveal="">
            {org.includes.map((i) => (
              <li key={i}>
                <IconCheckCircle />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <a className="btn btn--white btn--lg" href={org.cta.href} data-reveal="">
            {org.cta.label}
          </a>
        </div>

        <div className={styles.tableWrap} data-reveal="">
          <div className={styles.art} aria-hidden="true">
            <IllustIntakePage />
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Seats</th>
                <th scope="col">Per seat</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {org.packages.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.seats}</td>
                  <td>{p.perSeat}</td>
                  <td>{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
