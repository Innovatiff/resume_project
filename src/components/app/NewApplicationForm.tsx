"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/app/auth-client";
import { useMe } from "@/lib/app/use-me";
import type { Application } from "@/lib/app/types";
import { Card, Dropzone, Field, Notice, PageHead, Progress } from "./ui";

const STEPS = ["Reading your resume", "Parsing the posting", "Scoring against the requirements", "Checking pay data and red flags"];

export default function NewApplicationForm() {
  const router = useRouter();
  const { me, loading, refresh } = useMe();
  const [posting, setPosting] = useState("");
  const [url, setUrl] = useState("");
  const [modeChoice, setMode] = useState<"saved" | "upload" | null>(null);
  const mode: "saved" | "upload" = modeChoice ?? (me?.hasProfile ? "saved" : "upload");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 2600);
    return () => clearInterval(t);
  }, [busy]);

  const hasPlan = Boolean(me?.entitlement.plan);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (posting.trim().length < 80) return setError("Paste the full job posting, not just the title.");
    if (mode === "upload" && !file) return setError("Attach your resume, or use the one on file.");
    const form = new FormData();
    form.set("posting", posting.trim());
    if (url.trim()) form.set("url", url.trim());
    if (mode === "upload" && file) form.set("file", file);
    setBusy(true);
    setStep(mode === "upload" ? 0 : 1);
    try {
      const data = await apiFetch<{ application: Application }>("/api/applications", { method: "POST", body: form });
      if (mode === "upload") void refresh();
      router.push(`/app/applications/${data.application.id}`);
    } catch (err) {
      setBusy(false);
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
    }
  };

  return (
    <>
      <PageHead title="New application" sub="Paste the posting. We score your resume against it and tell you whether it is worth your time." back={{ href: "/app/applications", label: "Applications" }} />

      {!loading && !hasPlan ? (
        <Notice kind="info">
          Scoring inside the app is part of every package.{" "}
          <Link href="/checkout?plan=pass">Choose a package</Link> or use the <Link href="/scan">free scan</Link> for one posting.
        </Notice>
      ) : null}

      {busy ? (
        <Card title="Working on it" hint="Usually under a minute.">
          <Progress steps={STEPS} active={step} />
        </Card>
      ) : (
        <form onSubmit={submit} className="app-grid app-grid--main">
          <Card title="The posting">
            <Field label="Job posting" hint={`${posting.trim().length} characters`} htmlFor="posting">
              <textarea id="posting" className="app-textarea" style={{ minHeight: 260 }} value={posting} onChange={(e) => setPosting(e.target.value)} placeholder="Paste the full description, including requirements. A link alone is not enough." required data-lenis-prevent="" />
            </Field>
            <Field label="Posting link" hint="optional" htmlFor="url">
              <input id="url" className="app-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" inputMode="url" />
            </Field>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card title="Your resume">
              {me?.hasProfile ? (
                <label className="app-radio" data-checked={mode === "saved"}>
                  <input type="radio" name="mode" checked={mode === "saved"} onChange={() => setMode("saved")} />
                  <span>
                    <b>Use the resume on file</b>
                    <span>{me.profileSource?.fileName ?? "Saved profile"}</span>
                  </span>
                </label>
              ) : null}
              <label className="app-radio" data-checked={mode === "upload"}>
                <input type="radio" name="mode" checked={mode === "upload"} onChange={() => setMode("upload")} />
                <span>
                  <b>{me?.hasProfile ? "Upload a different one" : "Upload your resume"}</b>
                  <span>PDF or DOCX. It replaces the profile on file.</span>
                </span>
              </label>
              {mode === "upload" ? <Dropzone file={file} onFile={setFile} /> : null}
            </Card>
            {error ? <Notice kind="error">{error}</Notice> : null}
            <button className="btn btn--coral btn--lg btn--block" type="submit" disabled={!hasPlan && !loading}>
              Score this posting
            </button>
            <p className="app-muted" style={{ textAlign: "center" }}>
              Scoring never invents anything and never submits anything. You decide what happens next.
            </p>
          </div>
        </form>
      )}
    </>
  );
}
