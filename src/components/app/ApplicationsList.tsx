"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/app/auth-client";
import type { ApplicationSummary } from "@/app/api/applications/route";
import { Card, EmptyState, PageHead, ScoreRing, Skeleton, StatusBadge, VerdictChip, fmtDate } from "./ui";
import { IconPlus } from "@/components/icons";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "apply", label: "Worth applying" },
  { id: "ready", label: "Package ready" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interviews" },
  { id: "skip", label: "Skipped" },
];

export default function ApplicationsList() {
  const [apps, setApps] = useState<ApplicationSummary[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    apiFetch<{ applications: ApplicationSummary[] }>("/api/applications")
      .then((d) => setApps(d.applications))
      .catch(() => setApps([]));
  }, []);

  const shown = useMemo(() => {
    if (!apps) return [];
    return apps.filter((a) => {
      if (q && !`${a.posting.title} ${a.posting.company ?? ""} ${a.posting.location ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      switch (filter) {
        case "apply":
          return a.verdict === "apply";
        case "skip":
          return a.verdict === "skip";
        case "ready":
          return a.status === "ready";
        case "applied":
          return a.status === "applied" || a.status === "interview" || a.status === "offer";
        case "interview":
          return a.status === "interview" || a.status === "offer";
        default:
          return true;
      }
    });
  }, [apps, filter, q]);

  return (
    <>
      <PageHead
        title="Applications"
        sub="Every posting you have scanned, with its verdict and where it stands."
        actions={
          <Link className="btn btn--coral" href="/app/applications/new">
            <IconPlus /> New application
          </Link>
        }
      />
      <Card>
        <div className="app-actions" style={{ justifyContent: "space-between" }}>
          <div className="app-tabbar" role="tablist" style={{ maxWidth: "100%" }}>
            {FILTERS.map((f) => (
              <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <input className="app-input" style={{ maxWidth: 260 }} placeholder="Search title or company" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search applications" />
        </div>
        {!apps ? (
          <>
            <Skeleton h={56} />
            <Skeleton h={56} />
            <Skeleton h={56} />
          </>
        ) : shown.length === 0 ? (
          <EmptyState title={apps.length ? "Nothing matches that filter." : "Nothing scanned yet."} body={apps.length ? undefined : "Paste a posting and get a verdict in a couple of minutes."} action={apps.length ? undefined : <Link className="btn btn--coral" href="/app/applications/new">Scan a posting</Link>} />
        ) : (
          <div className="app-list">
            {shown.map((a) => (
              <Link key={a.id} href={`/app/applications/${a.id}`} className="app-row">
                <ScoreRing score={a.scoreAfter ?? a.score} verdict={a.verdict} size={48} stroke={5} />
                <span>
                  <span className="app-row__title">{a.posting.title}</span>
                  <span className="app-row__meta">
                    {[a.posting.company, a.posting.location].filter(Boolean).join(" · ") || "Posting"} · {fmtDate(a.createdAt)}
                    {a.scoreAfter ? ` · ${a.score} → ${a.scoreAfter} after rewrite` : ""}
                  </span>
                </span>
                <span className="app-row__end">
                  <VerdictChip verdict={a.verdict} />
                  <StatusBadge status={a.status} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
