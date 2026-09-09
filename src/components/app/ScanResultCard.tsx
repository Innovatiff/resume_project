"use client";

import { useState } from "react";
import Link from "next/link";
import type { FreeScanResult } from "@/lib/app/types";
import { ScoreRing, VerdictChip } from "./ui";
import styles from "./ScanResultCard.module.css";

/** Free scan outcome: score, verdict, three reasons, breakdown, and the next step. */
export default function ScanResultCard({ result, standalone = false }: { result: FreeScanResult; standalone?: boolean }) {
  const [open, setOpen] = useState(false);
  const s = result.score;
  const line = s.verdict === "apply" ? "Worth applying to. A tailored rewrite would push this higher." : s.verdict === "borderline" ? "Borderline. The gaps are specific and mostly fixable." : "We would skip this one, or go in with a long-shot strategy.";
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <ScoreRing score={s.score} verdict={s.verdict} size={120} stroke={11} />
        <div className={styles.copy}>
          <div className={styles.meta}>
            <VerdictChip verdict={s.verdict} />
            <span>
              {result.postingTitle} · scanned {new Date(result.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
            </span>
          </div>
          <h3 className="h3">{line}</h3>
          <ol className={styles.reasons}>
            {s.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </div>
      </div>

      <button type="button" className={styles.toggle} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "Hide the breakdown" : "See the full breakdown"}
      </button>
      {open ? (
        <table className={styles.table}>
          <tbody>
            {s.breakdown.map((c) => (
              <tr key={c.key}>
                <td>{c.label}</td>
                <td className={styles.num}>
                  {c.points} / {c.max}
                </td>
                <td className={styles.detail}>{c.detail}</td>
              </tr>
            ))}
            {result.redFlags.length ? (
              <tr>
                <td>Red flags</td>
                <td className={styles.num}>{result.redFlags.length}</td>
                <td className={styles.detail}>{result.redFlags.map((f) => f.title).join(" · ")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      ) : null}

      <div className={styles.next}>
        <div>
          <b>Fix it for this posting.</b>
          <span>Tailored resume and cover letter, pay report, interview prep, Plan B. Every figure verified. 85 or it&apos;s free.</span>
        </div>
        <div className={styles.actions}>
          <Link className="btn btn--coral" href="/checkout?plan=single">
            Single Shot · $29
          </Link>
          <Link className="btn btn--ink" href="/checkout?plan=pass">
            30-Day Pass · $99
          </Link>
        </div>
      </div>
      {standalone ? (
        <p className={styles.fine}>
          This result link works for 7 days. <Link href="/scan">Scan another posting</Link>.
        </p>
      ) : null}
    </div>
  );
}
