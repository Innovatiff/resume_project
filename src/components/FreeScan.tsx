"use client";

import { useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import styles from "./FreeScan.module.css";
import BlurText from "./BlurText";
import ScanResultCard from "./app/ScanResultCard";
import { scan } from "@/lib/content";
import type { FreeScanResult } from "@/lib/app/types";
import { IconClock, IconFile, IconLock, IconTrash, IconUpload } from "./icons";

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_POSTING = 80;

type Status = { kind: "idle" } | { kind: "busy"; step: number } | { kind: "error" | "info"; message: string } | { kind: "ok"; result: FreeScanResult };

const STEPS = ["Reading your resume", "Parsing the posting", "Scoring against the requirements", "Emailing the breakdown"];

function fmtSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function FreeScan({ first = false }: { first?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [posting, setPosting] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const accept = (f: File | undefined) => {
    if (!f) return;
    const okType = /\.(pdf|docx)$/i.test(f.name);
    if (!okType) return setStatus({ kind: "error", message: "Only PDF and DOCX resumes are supported." });
    if (f.size > MAX_BYTES) return setStatus({ kind: "error", message: "Resumes must be 5 MB or smaller." });
    setFile(f);
    setStatus({ kind: "idle" });
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(false);
    accept(e.dataTransfer.files?.[0]);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => accept(e.target.files?.[0]);

  const clear = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return setStatus({ kind: "error", message: "Attach your resume first." });
    if (posting.trim().length < MIN_POSTING) return setStatus({ kind: "error", message: "Paste the full job posting, not just the title." });
    setStatus({ kind: "busy", step: 0 });
    const tick = window.setInterval(() => setStatus((s) => (s.kind === "busy" ? { kind: "busy", step: Math.min(STEPS.length - 1, s.step + 1) } : s)), 2600);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("posting", posting.trim());
      form.set("email", email.trim());
      const res = await fetch("/api/scan", { method: "POST", body: form });
      const data = (await res.json()) as { ok: boolean; message?: string; error?: string; result?: FreeScanResult };
      if (res.ok && data.ok && data.result) {
        setStatus({ kind: "ok", result: data.result });
      } else if (res.status === 429) {
        setStatus({ kind: "info", message: data.message ?? "One scan per email address every 7 days." });
      } else {
        setStatus({ kind: "error", message: data.message ?? "Something went wrong. Try again." });
      }
    } catch {
      setStatus({ kind: "error", message: "Could not reach the server. Check your connection and try again." });
    } finally {
      window.clearInterval(tick);
    }
  };

  const busy = status.kind === "busy";

  return (
    <section className={`panel ${styles.section} ${first ? styles.first : ""}`} id="scan" aria-labelledby="scan-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy}>
          <BlurText as="h2" className="h-display h2" id="scan-title">
            {scan.title}
          </BlurText>
          <p className="lead" data-reveal="">
            {scan.lead}
          </p>
          <ul className={styles.fine} data-reveal="">
            <li>
              <IconClock /> {scan.fine[0]}
            </li>
            <li>
              <IconFile /> {scan.fine[1]}
            </li>
            <li>
              <IconLock /> {scan.fine[2]}
            </li>
          </ul>
        </div>

        {status.kind === "ok" ? (
          <div className={styles.result} id="scan-result">
            <ScanResultCard result={status.result} />
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setStatus({ kind: "idle" }); clear(); setPosting(""); }}>
              Scan another posting
            </button>
          </div>
        ) : (
        <form className={styles.form} onSubmit={submit} noValidate data-reveal="" aria-describedby={`${uid}-consent`}>
          <label
            className={styles.drop}
            data-over={over}
            data-has={!!file}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onPick} aria-label="Upload your resume" />
            <span className={styles.dropIcon}>{file ? <IconFile /> : <IconUpload />}</span>
            {file ? (
              <span className={styles.fileRow}>
                <b>{file.name}</b>
                <small>{fmtSize(file.size)}</small>
                <button type="button" aria-label="Remove file" onClick={clear}>
                  <IconTrash />
                </button>
              </span>
            ) : (
              <>
                <b>Drop your resume here, or browse</b>
                <small>PDF or DOCX, up to 5 MB</small>
              </>
            )}
          </label>

          <div className={styles.field}>
            <label htmlFor={`${uid}-posting`}>
              Paste the job posting
              <span>{posting.trim().length} characters</span>
            </label>
            <textarea
              id={`${uid}-posting`}
              value={posting}
              onChange={(e) => setPosting(e.target.value)}
              placeholder="Paste the full description, including requirements. A URL alone is not enough."
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor={`${uid}-email`}>Where should we send the breakdown?</label>
              <input id={`${uid}-email`} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button className="btn btn--coral" type="submit" disabled={busy} aria-busy={busy}>
              {busy ? "Scoring…" : "Get my score"}
            </button>
          </div>

          {status.kind === "busy" ? (
            <ol className={styles.progress} aria-live="polite">
              {STEPS.map((st, i) => (
                <li key={st} data-state={i < status.step ? "done" : i === status.step ? "active" : "todo"}>
                  {st}
                </li>
              ))}
            </ol>
          ) : null}

          {status.kind === "error" || status.kind === "info" ? (
            <p className={styles.status} data-kind={status.kind === "info" ? "info" : status.kind} role="status">
              {status.message}
            </p>
          ) : null}

          <p className={styles.consent} id={`${uid}-consent`}>
            One scan per email address every 7 days. No card, no account. Your resume is personal information: it is used only to produce your score and deleted afterwards, never sold or shared.
          </p>
        </form>
        )}
      </div>
    </section>
  );
}
