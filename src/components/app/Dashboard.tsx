"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMe } from "@/lib/app/use-me";
import { apiFetch } from "@/lib/app/auth-client";
import { PRODUCTS } from "@/lib/billing/plans";
import type { ApplicationSummary } from "@/app/api/applications/route";
import { Card, EmptyState, PageHead, ScoreRing, Skeleton, StatusBadge, VerdictChip, fmtDate } from "./ui";
import PlanPicker from "./PlanPicker";
import { CURRENCY_NAMES } from "@/lib/app/markets";
import { IconPlus } from "@/components/icons";

export default function Dashboard() {
  const { me, loading } = useMe();
  const [apps, setApps] = useState<ApplicationSummary[] | null>(null);

  useEffect(() => {
    apiFetch<{ applications: ApplicationSummary[] }>("/api/applications")
      .then((d) => setApps(d.applications))
      .catch(() => setApps([]));
  }, []);

  const first = me?.user.displayName?.split(" ")[0];
  const e = me?.entitlement;
  const hasPlan = Boolean(e?.plan);

  return (
    <>
      <PageHead
        title={first ? `Hi, ${first}.` : "Your shortlist."}
        sub={new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        actions={
          <Link className="btn btn--coral" href="/app/applications/new">
            <IconPlus /> New application
          </Link>
        }
      />

      {loading ? (
        <div className="app-grid app-grid--3">
          <Skeleton h={140} />
          <Skeleton h={140} />
          <Skeleton h={140} />
        </div>
      ) : (
        <div className="app-grid app-grid--3">
          <Card className={hasPlan ? "app-card--ink" : ""}>
            <div className="app-card__hint">Your package</div>
            {hasPlan ? (
              <>
                <div className="app-stat" style={{ fontSize: "1.7rem" }}>
                  {PRODUCTS[e!.plan!].name}
                </div>
                <p className="app-muted" style={{ color: "rgba(255,255,255,.65)" }}>
                  {e!.endsAt ? `Unlimited postings until ${fmtDate(e!.endsAt)} (${e!.daysLeft} days).` : e!.canBuild ? "One complete package ready to build." : "Your package has been used."}
                </p>
                <Link href="/app/account" style={{ fontSize: "0.85rem", color: "#b9a4ff", fontWeight: 500 }}>
                  Manage
                </Link>
              </>
            ) : (
              <>
                <div className="app-stat" style={{ fontSize: "1.7rem" }}>
                  Free scan
                </div>
                <p className="app-muted">Scoring is included with every package. Pick one to start building applications.</p>
                <Link href="/checkout?plan=pass" className="btn btn--ink btn--sm" style={{ alignSelf: "flex-start" }}>
                  Choose a package
                </Link>
              </>
            )}
          </Card>

          <Card>
            <div className="app-card__hint">Resume on file</div>
            {me?.hasProfile ? (
              <>
                <div className="app-stat" style={{ fontSize: "1.4rem", letterSpacing: "-0.03em" }}>
                  {me.profileSource?.fileName ?? "Resume"}
                </div>
                <p className="app-muted">
                  {me.profile?.experience.length ?? 0} roles, {me.profile?.skills.length ?? 0} skills extracted {me.profileSource ? `on ${fmtDate(me.profileSource.extractedAt)}` : ""}.
                </p>
                <Link href="/app/profile" style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--purple-deep)" }}>
                  Review or replace
                </Link>
              </>
            ) : (
              <>
                <div className="app-stat" style={{ fontSize: "1.4rem", letterSpacing: "-0.03em" }}>
                  Not uploaded yet
                </div>
                <p className="app-muted">Upload it once. Every application scores and rewrites from the same profile.</p>
                <Link href="/app/profile" className="btn btn--outline btn--sm" style={{ alignSelf: "flex-start" }}>
                  Upload resume
                </Link>
              </>
            )}
          </Card>

          <Card>
            <div className="app-card__hint">This month</div>
            <div className="app-stat">{apps ? apps.length : "–"}</div>
            <p className="app-muted">
              {apps ? `${apps.filter((a) => a.verdict === "apply").length} worth applying to, ${apps.filter((a) => a.verdict === "skip").length} to skip.` : "Loading your applications."}
            </p>
            <Link href="/app/applications" style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--purple-deep)" }}>
              See all
            </Link>
          </Card>
        </div>
      )}

      {!loading && !hasPlan ? (
        <Card title="Pick a package" hint={`One-time purchases in ${CURRENCY_NAMES[me?.user.currency ?? "cad"]}. No subscription, no card kept on file.`}>
          <PlanPicker compact currency={me?.user.currency ?? "cad"} />
        </Card>
      ) : null}

      <Card title="Recent applications" right={apps?.length ? <Link className="btn btn--ghost btn--sm" href="/app/applications">All applications</Link> : null}>
        {!apps ? (
          <>
            <Skeleton h={56} />
            <Skeleton h={56} />
          </>
        ) : apps.length === 0 ? (
          <EmptyState title="Nothing scanned yet." body="Paste a posting and we will tell you whether it is worth your evening." action={<Link className="btn btn--coral" href="/app/applications/new">Scan a posting</Link>} />
        ) : (
          <div className="app-list">
            {apps.slice(0, 6).map((a) => (
              <Link key={a.id} href={`/app/applications/${a.id}`} className="app-row">
                <ScoreRing score={a.scoreAfter ?? a.score} verdict={a.verdict} size={48} stroke={5} />
                <span>
                  <span className="app-row__title">{a.posting.title}</span>
                  <span className="app-row__meta">
                    {[a.posting.company, a.posting.location].filter(Boolean).join(" · ") || "Posting"} · {fmtDate(a.createdAt)}
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
