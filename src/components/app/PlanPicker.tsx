"use client";

import Link from "next/link";
import { PRODUCTS, formatCad, type Product } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/app/types";
import { IconCheck } from "@/components/icons";

const HIGHLIGHTS: Record<PlanId, string[]> = {
  single: ["One posting, the complete package", "Tailored resume (.docx + PDF) and cover letter", "Pay report, red flags, interview prep, Plan B"],
  pass: ["Unlimited postings for 30 days", "Metric interview and recruiter objections", "LinkedIn rewrite, tracker, extension"],
  landed: ["90 days of everything", "Human review of every resume", "Two live coaching sessions"],
};

/** Compact plan cards that send the user to checkout. Used on the dashboard and account page. */
export default function PlanPicker({ compact = false, current }: { compact?: boolean; current?: PlanId | null }) {
  const plans = (["single", "pass", "landed"] as PlanId[]).map((id) => PRODUCTS[id] as Product);
  return (
    <div className="app-grid app-grid--3" data-compact={compact ? "" : undefined}>
      {plans.map((p) => {
        const featured = p.id === "pass";
        return (
          <div key={p.id} className={`app-card ${featured ? "app-card--ink" : ""}`} style={{ gap: 10 }}>
            <div className="app-card__head" style={{ flexWrap: "wrap", rowGap: 6 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{p.name}</h3>
              {featured ? <span className="chip chip--coral">Most popular</span> : null}
            </div>
            <div className="app-stat" style={{ fontSize: "2rem" }}>
              {formatCad(p.amountCents)} <span style={{ fontSize: "0.85rem", fontWeight: 400, letterSpacing: 0, color: featured ? "rgba(255,255,255,.6)" : "var(--muted)" }}>CAD, one-time</span>
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.88rem", color: featured ? "rgba(255,255,255,.85)" : "var(--ink-2)" }}>
              {HIGHLIGHTS[p.id as PlanId].map((h) => (
                <li key={h} style={{ display: "flex", gap: 8 }}>
                  <IconCheck style={{ width: 16, height: 16, flex: "none", color: featured ? "#b9a4ff" : "var(--purple)" }} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <Link className={`btn ${featured ? "btn--coral" : "btn--outline"} btn--block`} href={`/checkout?plan=${p.id}`}>
              {current === p.id ? "Buy again" : `Get ${p.name}`}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
