"use client";

import { useCallback, useEffect, useState } from "react";
import { ATS_LABEL, type Ats } from "@/lib/extension/ats";
import { marketFor } from "@/lib/app/markets";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError, downloadFile } from "@/lib/app/auth-client";
import { useMe } from "@/lib/app/use-me";
import type { Application, ApplicationStatus, TailoredResume } from "@/lib/app/types";
import { PRODUCTS } from "@/lib/billing/plans";
import { Card, CopyButton, Notice, PageHead, Progress, ScoreRing, Skeleton, Spinner, StatusBadge, STATUS_LABEL, Tabs, VerdictChip, fmtDate, money } from "./ui";

const USER_STATUSES: ApplicationStatus[] = ["ready", "applied", "interview", "offer", "rejected", "archived"];
const BUILD_STEPS = ["Choosing what to lead with", "Writing the resume and cover letter", "Checking every figure against your source", "Rescoring and preparing the extras"];

export default function ApplicationDetail({ id }: { id: string }) {
  const router = useRouter();
  const { me, refresh } = useMe();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"build" | "interview" | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const [longShot, setLongShot] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("resume");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ application: Application }>(`/api/applications/${id}`);
      setApp(d.application);
      setLongShot(d.application.strategy === "long_shot");
      setNotes(d.application.notes ?? "");
      setAnswers(d.application.interview?.answers ?? {});
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not load this application.");
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setBuildStep((s) => Math.min(BUILD_STEPS.length - 1, s + 1)), 4000);
    return () => clearInterval(t);
  }, [busy]);

  const run = async (kind: "build" | "interview", body?: object) => {
    setError(null);
    setBusy(kind);
    setBuildStep(0);
    try {
      const path = kind === "build" ? `/api/applications/${id}/package` : `/api/applications/${id}/interview`;
      const d = await apiFetch<{ application: Application }>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
      setApp(d.application);
      void refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (status: ApplicationStatus) => {
    if (!app) return;
    setApp({ ...app, status });
    try {
      await apiFetch(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not update the status.");
      void load();
    }
  };

  const saveNotes = async () => {
    if (!app || notes === (app.notes ?? "")) return;
    try {
      await apiFetch(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify({ notes }) });
    } catch {
      /* non-critical */
    }
  };

  const remove = async () => {
    if (!confirm("Delete this application and its package? This cannot be undone.")) return;
    await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
    router.push("/app/applications");
  };

  if (error && !app) {
    return (
      <>
        <PageHead title="Application" back={{ href: "/app/applications", label: "Applications" }} />
        <Notice kind="error">{error}</Notice>
      </>
    );
  }
  if (!app) {
    return (
      <>
        <Skeleton h={40} w="50%" />
        <Skeleton h={180} />
        <Skeleton h={240} />
      </>
    );
  }

  const ent = me?.entitlement;
  const plan = app.planUsed ?? ent?.plan ?? null;
  const features = ent?.features;
  const pkg = app.package;
  const verdictLine = app.score.verdict === "apply" ? "Worth your evening. Build the package and apply." : app.score.verdict === "borderline" ? "Borderline. Fixable with a targeted rewrite, if the gaps are real experience you have." : "We would skip this one. The gaps are structural. If you want it anyway, we switch to long-shot strategy.";

  return (
    <>
      <PageHead
        title={app.posting.title}
        sub={`${[app.posting.company, app.posting.location].filter(Boolean).join(" · ") || "Posting"} · scanned ${fmtDate(app.createdAt)}${app.posting.url ? " · " : ""}`}
        back={{ href: "/app/applications", label: "Applications" }}
        actions={
          <>
            {app.posting.url ? (
              <a className="btn btn--ghost btn--sm" href={app.posting.url} target="_blank" rel="noreferrer">
                Open posting
              </a>
            ) : null}
            <select className="app-select app-select--sm" value={USER_STATUSES.includes(app.status) ? app.status : ""} onChange={(e) => void setStatus(e.target.value as ApplicationStatus)} aria-label="Application status" disabled={!pkg && app.status !== "scored"}>
              {!USER_STATUSES.includes(app.status) ? <option value="">{STATUS_LABEL[app.status]}</option> : null}
              {USER_STATUSES.filter((s) => s !== "ready" || pkg).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </>
        }
      />

      {error ? <Notice kind="error">{error}</Notice> : null}

      <Card>
        <div className="app-verdict">
          <ScoreRing score={app.score.score} verdict={app.score.verdict} size={112} stroke={10} />
          <div className="app-verdict__copy" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="app-actions">
              <VerdictChip verdict={app.score.verdict} />
              <StatusBadge status={app.status} />
              {pkg ? (
                <span className="app-after">
                  after rewrite <b>{pkg.scoreAfter.score}</b>
                </span>
              ) : null}
              {app.extension ? (
                <span className="app-after" data-filled="">
                  filled by the extension on {ATS_LABEL[(app.extension.ats as Ats) in ATS_LABEL ? (app.extension.ats as Ats) : "other"]} · {fmtDate(app.extension.filledAt)}
                </span>
              ) : null}
            </div>
            <h2>{verdictLine}</h2>
            <ol className="app-reasons">
              {app.score.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </div>
        </div>
      </Card>

      <div className="app-grid app-grid--main">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ---------- package ---------- */}
          {busy ? (
            <Card title={busy === "build" ? "Building your package" : "Writing with your answers"} hint="Usually one to two minutes. You can leave this page; we will email you.">
              <Progress steps={BUILD_STEPS} active={buildStep} />
            </Card>
          ) : pkg ? (
            <PackageView app={app} id={id} tab={tab} setTab={setTab} />
          ) : app.status === "needs_input" && app.interview ? (
            <Card title="The metric interview" hint="Three questions, real numbers only. Skip any you cannot defend.">
              <div className="app-qa">
                {app.interview.questions.map((q) => (
                  <div key={q.id} className="app-qa__item">
                    <blockquote>{q.bullet}</blockquote>
                    <h4>{q.question}</h4>
                    <p>{q.why}</p>
                    <input className="app-input" value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="e.g. 34%, over seven months" maxLength={400} />
                  </div>
                ))}
              </div>
              <div className="app-actions">
                <button type="button" className="btn btn--coral" onClick={() => void run("interview", { answers })}>
                  Use these answers
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => void run("interview", { answers: {} })}>
                  Skip, use what is there
                </button>
              </div>
              <p className="app-muted">Anything you leave blank stays exactly as it was. Nothing gets invented to fill it.</p>
            </Card>
          ) : (
            <Card title="Build the package" hint={plan ? `Included in your ${PRODUCTS[plan].name}.` : "Choose a package to continue."}>
              <ul className="app-muted" style={{ display: "grid", gap: 6 }}>
                <li>Tailored resume (.docx and PDF) and cover letter for this posting</li>
                <li>Every figure checked against your source before delivery</li>
                <li>Interview prep for the role{features?.objections ? ", recruiter objection report" : ""}{features?.linkedin ? ", LinkedIn rewrite" : ""}</li>
                {features?.humanReview ? <li>A human reviews it before you send it</li> : null}
              </ul>
              {app.score.verdict !== "apply" ? (
                <label className="app-switch">
                  <input type="checkbox" checked={longShot} onChange={(e) => setLongShot(e.target.checked)} />
                  <span>
                    <b>{longShot ? "Long-shot strategy on." : "Long-shot strategy off."}</b> Lead with transferable evidence and address the gap directly in the cover letter.
                  </span>
                </label>
              ) : null}
              {ent && !ent.canBuild ? (
                <Notice kind="info">
                  {ent.plan ? (ent.reason === "single_used" ? "Your Single Shot has been used." : "This pass has reached its fair-use limit for the period.") : "Building the package needs an active package."}{" "}
                  <Link href={ent.plan === "single" ? "/checkout?plan=pass" : "/checkout?plan=pass"}>See packages</Link>
                </Notice>
              ) : null}
              <div className="app-actions">
                <button type="button" className="btn btn--coral btn--lg" disabled={!ent?.canBuild} onClick={() => void run("build", { strategy: longShot ? "long_shot" : "standard" })}>
                  Build my package
                </button>
                {app.score.verdict === "skip" && !longShot ? <span className="app-muted">Turn on long-shot strategy first; we will not pretend the gaps are not there.</span> : null}
              </div>
            </Card>
          )}

          <Card title="Score breakdown" hint="Published so you can audit it. The same scorer backs the guarantee.">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Points</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {app.score.breakdown.map((c) => (
                  <tr key={c.key}>
                    <td>{c.label}</td>
                    <td className="num">
                      {c.points} / {c.max}
                    </td>
                    <td className="app-muted">{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Notes" hint="Private to you.">
            <textarea className="app-textarea" style={{ minHeight: 90 }} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => void saveNotes()} placeholder="Contact name, interview date, what they asked." data-lenis-prevent="" />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <PayCard app={app} />
          <Card title="Red flags" hint={app.redFlags.length ? `${app.redFlags.length} to know about` : "Nothing flagged"}>
            {app.redFlags.length ? (
              <div>
                {app.redFlags.map((f) => (
                  <div key={f.id} className="app-flag" data-severity={f.severity}>
                    <i />
                    <div>
                      <b>{f.title}</b>
                      <span>{f.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="app-muted">No bait, no stale posting, no pay-to-play language.</p>
            )}
          </Card>
          <Card title="Plan B" hint="Better-matched roles nearby">
            {app.planB.length ? (
              <div className="app-list">
                {app.planB.map((r) => (
                  <div key={`${r.title}-${r.company}`} className="app-row app-row--wrap" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
                    <span>
                      <span className="app-row__title">{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : r.title}</span>
                      <span className="app-row__meta">{[r.company, r.location].filter(Boolean).join(" · ")}</span>
                      <span className="app-row__meta">{r.why}</span>
                    </span>
                    <span className="app-muted" style={{ whiteSpace: "nowrap" }}>
                      {r.salaryLow ? `${money(r.salaryLow, r.currency)}–${money(r.salaryHigh, r.currency)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="app-muted">No nearby matches came back for this title.</p>
            )}
          </Card>
          {app.requirements.attestations.length ? (
            <Card title="You will be asked to attest" hint="Never pre-filled. Answer these yourself.">
              <div className="app-chips">
                {app.requirements.attestations.map((a) => (
                  <span key={a} className="chip chip--coral">
                    {a}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}
          <Card className="app-danger">
            <button type="button" className="btn btn--outline btn--sm" style={{ alignSelf: "flex-start", color: "var(--coral-deep)" }} onClick={() => void remove()}>
              Delete this application
            </button>
          </Card>
        </div>
      </div>
    </>
  );
}

function PayCard({ app }: { app: Application }) {
  const p = app.payReport;
  if (!p.available || p.low === undefined || p.median === undefined || p.high === undefined) {
    return (
      <Card title="Pay report" hint={p.location}>
        <p className="app-muted">{p.message ?? "No reliable data for this role in this market."}</p>
        {app.requirements.salaryStated ? <p className="app-muted">The posting states: <b>{app.requirements.salaryStated}</b></p> : null}
      </Card>
    );
  }
  const span = Math.max(1, p.high - p.low);
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - p.low!) / span) * 100))}%`;
  return (
    <Card title="Pay report" hint={`${p.location} · ${p.sampleSize} postings · ${p.currency}`}>
      <div className="app-stat" style={{ fontSize: "1.9rem" }}>
        {money(p.low, p.currency)}–{money(p.high, p.currency)}
      </div>
      <div className="app-band">
        <span className="app-band__tick" style={{ left: pct(p.median) }} title={`Median ${money(p.median, p.currency)}`} />
      </div>
      <div className="app-band__labels">
        <span>25th</span>
        <b>median {money(p.median, p.currency)}</b>
        <span>75th</span>
      </div>
      {app.requirements.salaryStated ? (
        <p className="app-muted">
          Posting says <b>{app.requirements.salaryStated}</b>. Anchor your counter on the band, not the ask.
        </p>
      ) : (
        <p className="app-muted">The posting does not state pay. When they ask for a number, name the median and let them come up.</p>
      )}
      <p className="app-muted" style={{ fontSize: "0.78rem" }}>
        {p.source === "adzuna" ? `Source: Adzuna market data, ${marketFor(p.country).name}.` : "Sample data: connect Adzuna for live figures."} Never estimated by a model.
      </p>
    </Card>
  );
}

function PackageView({ app, id, tab, setTab }: { app: Application; id: string; tab: string; setTab: (t: string) => void }) {
  const pkg = app.package!;
  const [dl, setDl] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);
  const tabs = [
    { id: "resume", label: "Resume" },
    { id: "cover", label: "Cover letter" },
    ...(pkg.prep ? [{ id: "prep", label: "Interview prep" }] : []),
    ...(pkg.objections ? [{ id: "objections", label: "Objections" }] : []),
    ...(pkg.linkedin ? [{ id: "linkedin", label: "LinkedIn" }] : []),
  ];

  const download = async (type: "resume" | "cover", format: "docx" | "pdf") => {
    const key = `${type}-${format}`;
    setDl(key);
    setDlError(null);
    try {
      await downloadFile(`/api/applications/${id}/documents?type=${type}&format=${format}`, `${type}.${format}`);
    } catch (e) {
      setDlError(e instanceof ApiClientError ? e.message : "Could not generate the file.");
    } finally {
      setDl(null);
    }
  };

  return (
    <Card
      title="Your package"
      hint={`${pkg.strategy === "long_shot" ? "Long-shot strategy · " : ""}Generated ${fmtDate(pkg.generatedAt)}`}
      right={
        <span className={`chip ${pkg.validation.passed ? "chip--apply" : "chip--borderline"}`}>
          {pkg.validation.passed ? "Every figure verified" : `${pkg.validation.removedBullets} unverified figure${pkg.validation.removedBullets === 1 ? "" : "s"} removed`}
        </span>
      }
    >
      {app.humanReview ? (
        <Notice kind={app.humanReview.status === "done" ? "success" : "info"}>
          {app.humanReview.status === "done" ? "A human has reviewed this resume." : "Landed: a human is reviewing this resume before you send it. You will get an email within a business day."}
        </Notice>
      ) : null}
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "resume" ? (
        <>
          <div className="app-actions">
            <button type="button" className="btn btn--ink btn--sm" disabled={dl !== null} onClick={() => void download("resume", "docx")}>
              {dl === "resume-docx" ? <Spinner /> : null} Download .docx
            </button>
            <button type="button" className="btn btn--outline btn--sm" disabled={dl !== null} onClick={() => void download("resume", "pdf")}>
              {dl === "resume-pdf" ? <Spinner /> : null} Download PDF
            </button>
          </div>
          {dlError ? <Notice kind="error">{dlError}</Notice> : null}
          <ResumePreview r={pkg.resume} />
        </>
      ) : null}

      {tab === "cover" ? (
        <>
          <div className="app-actions">
            <button type="button" className="btn btn--ink btn--sm" disabled={dl !== null} onClick={() => void download("cover", "docx")}>
              {dl === "cover-docx" ? <Spinner /> : null} Download .docx
            </button>
            <button type="button" className="btn btn--outline btn--sm" disabled={dl !== null} onClick={() => void download("cover", "pdf")}>
              {dl === "cover-pdf" ? <Spinner /> : null} Download PDF
            </button>
            <CopyButton text={pkg.coverLetter} label="Copy text" />
          </div>
          {dlError ? <Notice kind="error">{dlError}</Notice> : null}
          <div className="app-resume app-prose">{pkg.coverLetter}</div>
        </>
      ) : null}

      {tab === "prep" && pkg.prep ? (
        <div className="app-qa">
          {pkg.prep.questions.map((q) => (
            <div key={q.question} className="app-qa__item">
              <h4>{q.question}</h4>
              <p>
                <b>What they are probing:</b> {q.angle}
              </p>
              <blockquote>{q.evidence}</blockquote>
            </div>
          ))}
          <div className="app-qa__item">
            <h4>Stories to prepare</h4>
            <ul className="app-muted" style={{ paddingLeft: 18, listStyle: "disc" }}>
              {pkg.prep.storiesToPrepare.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="app-qa__item">
            <h4>Questions to ask them</h4>
            <ul className="app-muted" style={{ paddingLeft: 18, listStyle: "disc" }}>
              {pkg.prep.questionsToAsk.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "objections" && pkg.objections ? (
        <div className="app-qa">
          {pkg.objections.objections.map((o) => (
            <div key={o.objection} className="app-qa__item">
              <div className="app-actions" style={{ justifyContent: "space-between" }}>
                <h4>{o.objection}</h4>
                <span className={`chip ${o.likelihood === "high" ? "chip--coral" : o.likelihood === "medium" ? "chip--borderline" : "chip--skip"}`}>{o.likelihood} likelihood</span>
              </div>
              <p>
                <b>Counter:</b> {o.counter}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "linkedin" && pkg.linkedin ? (
        <div className="app-qa">
          <div className="app-qa__item">
            <div className="app-actions" style={{ justifyContent: "space-between" }}>
              <h4>Headline</h4>
              <CopyButton text={pkg.linkedin.headline} />
            </div>
            <p style={{ color: "var(--ink)" }}>{pkg.linkedin.headline}</p>
          </div>
          <div className="app-qa__item">
            <div className="app-actions" style={{ justifyContent: "space-between" }}>
              <h4>About</h4>
              <CopyButton text={pkg.linkedin.about} />
            </div>
            <p className="app-prose" style={{ color: "var(--ink)" }}>
              {pkg.linkedin.about}
            </p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function ResumePreview({ r }: { r: TailoredResume }) {
  const contact = [r.contact.city, r.contact.phone, r.contact.email, r.contact.linkedin].filter(Boolean).join("  ·  ");
  return (
    <article className="app-resume" aria-label="Resume preview">
      <h3>{r.name}</h3>
      {r.headline ? <div className="headline">{r.headline}</div> : null}
      {contact ? <div className="contact">{contact}</div> : null}
      {r.summary ? (
        <>
          <h4>Summary</h4>
          <p>{r.summary}</p>
        </>
      ) : null}
      {r.experience.length ? <h4>Experience</h4> : null}
      {r.experience.map((e, i) => (
        <div key={i} className="job">
          <div className="job__head">
            <b>{e.title}</b>
            <span>
              {e.start ?? ""}
              {e.start || e.end ? " – " : ""}
              {e.end ?? "Present"}
            </span>
          </div>
          <div className="job__co">{[e.company, e.location].filter(Boolean).join(", ")}</div>
          <ul>
            {e.bullets.map((b, j) => (
              <li key={j}>{b}</li>
            ))}
          </ul>
        </div>
      ))}
      {r.skills.length ? <h4>Skills</h4> : null}
      {r.skills.map((g) => (
        <p key={g.group}>
          <b>{g.group}:</b> {g.items.join(", ")}
        </p>
      ))}
      {r.education.length ? <h4>Education</h4> : null}
      {r.education.map((ed, i) => (
        <p key={i}>{[ed.credential, ed.institution, ed.year].filter(Boolean).join(" · ")}</p>
      ))}
      {r.certifications.length ? (
        <>
          <h4>Certifications</h4>
          <ul>
            {r.certifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      ) : null}
      {r.languages.length ? (
        <>
          <h4>Languages</h4>
          <p>{r.languages.join(", ")}</p>
        </>
      ) : null}
    </article>
  );
}
