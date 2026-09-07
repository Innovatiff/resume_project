import styles from "./PostingCard.module.css";
import { verdictLabel, type Posting } from "@/lib/content";

const R = 17;
const C = 2 * Math.PI * R;

export default function PostingCard({ p }: { p: Posting }) {
  const dash = (p.score / 100) * C;
  return (
    <article className={`${styles.card} ${styles[p.verdict]}`}>
      <div className={styles.head}>
        <span className={styles.title}>{p.title}</span>
        <span className={styles.meta}>
          {p.org} · {p.place}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.ring} aria-label={`Score ${p.score}`}>
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r={R} className={styles.track} />
            <circle cx="20" cy="20" r={R} className={styles.arc} strokeDasharray={`${dash} ${C - dash}`} />
          </svg>
          <b>{p.score}</b>
        </span>
        <span className={`chip chip--${p.verdict}`}>{verdictLabel[p.verdict]}</span>
      </div>
      {p.note ? <span className={styles.note}>{p.note}</span> : null}
    </article>
  );
}
