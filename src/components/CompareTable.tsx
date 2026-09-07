import styles from "./CompareTable.module.css";
import BlurText from "./BlurText";
import { pricingPage, type CompareValue } from "@/lib/pages";
import { IconCheck, IconX } from "./icons";

function Cell({ v }: { v: CompareValue }) {
  if (v === true)
    return (
      <span className={styles.yes} aria-label="Included">
        <IconCheck strokeWidth={2.4} />
      </span>
    );
  if (v === false)
    return (
      <span className={styles.no} aria-label="Not included">
        <IconX />
      </span>
    );
  return <span className={styles.text}>{v}</span>;
}

const FEATURED = 2;

export default function CompareTable() {
  const c = pricingPage.compare;
  return (
    <section className={styles.section} aria-labelledby="compare-title" id="compare">
      <div className="wrap">
        <div className="section-head">
          <BlurText as="h2" className="h-display h2" id="compare-title">
            {c.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {c.lead}
          </p>
        </div>

        <div className={styles.wrapTable} data-reveal="" data-lenis-prevent="">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                {c.columns.map((col, i) => (
                  <th scope="col" key={col} className={i === FEATURED ? styles.featuredCol : undefined}>
                    <span className={styles.plan}>
                      <b>{col}</b>
                      <span>{c.prices[i]}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.groups.map((g) => (
                <GroupRows key={g.group} group={g.group} rows={g.rows} />
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.hint}>Scroll sideways to compare all four packages.</p>
      </div>
    </section>
  );
}

function GroupRows({ group, rows }: { group: string; rows: { label: string; values: CompareValue[] }[] }) {
  return (
    <>
      <tr className={styles.group}>
        <td colSpan={5}>{group}</td>
      </tr>
      {rows.map((r) => (
        <tr key={r.label}>
          <td className={styles.label}>{r.label}</td>
          {r.values.map((v, i) => (
            <td key={i} className={i === FEATURED ? styles.featuredCol : undefined}>
              <Cell v={v} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
