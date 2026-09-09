"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/app/auth-client";
import { useMe } from "@/lib/app/use-me";
import type { CandidateProfile, Language, ProfileSource } from "@/lib/app/types";
import { Card, Dropzone, Field, Notice, PageHead, Progress, Skeleton, fmtDate } from "./ui";

const STEPS = ["Reading the file", "Extracting your profile", "Saving"];

export default function ProfilePanel() {
  const { me, loading, refresh } = useMe();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [edits, setEdits] = useState<{ language?: Language; city?: string; province?: string }>({});
  const language: Language = edits.language ?? me?.user.language ?? "en";
  const city = edits.city ?? me?.user.city ?? "";
  const province = edits.province ?? me?.user.province ?? "";
  const setLanguage = (v: Language) => setEdits((e) => ({ ...e, language: v }));
  const setCity = (v: string) => setEdits((e) => ({ ...e, city: v }));
  const setProvince = (v: string) => setEdits((e) => ({ ...e, province: v }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 2500);
    return () => clearInterval(t);
  }, [busy]);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setStep(0);
    setMsg(null);
    const form = new FormData();
    form.set("file", file);
    try {
      await apiFetch<{ profile: CandidateProfile; source: ProfileSource }>("/api/profile/resume", { method: "POST", body: form });
      await refresh();
      setFile(null);
      setMsg({ kind: "success", text: "Profile updated. Every new application scores from this version." });
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof ApiClientError ? e.message : "Upload failed. Try again." });
    } finally {
      setBusy(false);
    }
  };

  const savePrefs = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ language, city, province }) });
      await refresh();
      setEdits({});
      setMsg({ kind: "success", text: "Preferences saved." });
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof ApiClientError ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  const p = me?.profile;
  const layout = me?.profileSource?.layout;

  return (
    <>
      <PageHead title="Resume profile" sub="What we extracted from your resume. Every application is scored and rewritten from this." />
      {msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : null}

      <div className="app-grid app-grid--main">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <Skeleton h={320} />
          ) : !p ? (
            <Card title="No resume yet" hint="Upload it once; PDF or DOCX.">
              <p className="app-muted">We read the file, rebuild the true structure (even from two-column layouts), and flag every bullet that has a real figure in it.</p>
            </Card>
          ) : (
            <>
              <Card title={p.name ?? "Your profile"} hint={p.headline}>
                <dl className="app-kv">
                  <dt>Email</dt>
                  <dd>{p.contact.email ?? "—"}</dd>
                  <dt>Phone</dt>
                  <dd>{p.contact.phone ?? "—"}</dd>
                  <dt>Location</dt>
                  <dd>{[p.contact.city, p.contact.province].filter(Boolean).join(", ") || "—"}</dd>
                  <dt>Experience</dt>
                  <dd>{p.totalYears ? `${p.totalYears} years` : `${p.experience.length} roles`}</dd>
                </dl>
                {p.summary ? <p className="app-muted">{p.summary}</p> : null}
              </Card>

              <Card title="Experience" hint={`${p.experience.reduce((n, e) => n + e.bullets.filter((b) => b.hasMetric).length, 0)} of ${p.experience.reduce((n, e) => n + e.bullets.length, 0)} bullets carry a figure`}>
                {p.experience.map((e, i) => (
                  <div key={i} className="app-qa__item">
                    <h4>
                      {e.title}
                      {e.company ? ` · ${e.company}` : ""}
                    </h4>
                    <p>
                      {[e.start, e.current ? "Present" : e.end].filter(Boolean).join(" – ")}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    <ul style={{ display: "grid", gap: 6, fontSize: "0.9rem" }}>
                      {e.bullets.map((b, j) => (
                        <li key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span className={`chip ${b.hasMetric ? "chip--apply" : "chip--skip"}`} style={{ flex: "none", height: 20, fontSize: "0.7rem" }}>
                            {b.hasMetric ? "figure" : "no figure"}
                          </span>
                          <span>{b.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Card>

              <Card title="Skills, credentials, languages">
                <div className="app-chips">
                  {p.skills.map((s) => (
                    <span key={s} className="chip chip--purple">
                      {s}
                    </span>
                  ))}
                  {p.certifications.map((s) => (
                    <span key={s} className="chip chip--apply">
                      {s}
                    </span>
                  ))}
                  {p.languages.map((s) => (
                    <span key={s} className="chip chip--skip">
                      {s}
                    </span>
                  ))}
                </div>
                {p.education.length ? (
                  <ul className="app-muted" style={{ display: "grid", gap: 4 }}>
                    {p.education.map((ed, i) => (
                      <li key={i}>{[ed.credential, ed.institution, ed.year].filter(Boolean).join(" · ")}</li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title={p ? "Replace resume" : "Upload resume"} hint={me?.profileSource ? `On file: ${me.profileSource.fileName} (${fmtDate(me.profileSource.extractedAt)})` : undefined}>
            {busy ? (
              <Progress steps={STEPS} active={step} />
            ) : (
              <>
                <Dropzone file={file} onFile={setFile} />
                <button type="button" className="btn btn--ink btn--block" disabled={!file} onClick={() => void upload()}>
                  {p ? "Replace and re-extract" : "Upload and extract"}
                </button>
              </>
            )}
            {layout ? (
              <p className="app-muted" style={{ fontSize: "0.8rem" }}>
                File check: {layout.fileType.toUpperCase()}, {layout.pages} page{layout.pages === 1 ? "" : "s"}, {layout.words} words{layout.multiColumn ? ", two-column layout (we read it column by column)" : ""}{layout.tables ? ", contains tables" : ""}.
              </p>
            ) : null}
          </Card>

          <Card title="Preferences">
            <Field label="Resume language" htmlFor="lang">
              <select id="lang" className="app-select" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </Field>
            <Field label="Home city" hint="for pay data" htmlFor="city">
              <input id="city" className="app-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Windsor" />
            </Field>
            <Field label="Province" htmlFor="prov">
              <input id="prov" className="app-input" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="ON" />
            </Field>
            <button type="button" className="btn btn--outline" disabled={saving} onClick={() => void savePrefs()}>
              {saving ? "Saving…" : "Save preferences"}
            </button>
          </Card>
        </div>
      </div>
    </>
  );
}
