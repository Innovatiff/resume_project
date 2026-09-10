"use client";

import { useState, type ReactNode } from "react";
import { formatMoney } from "@/lib/app/markets";
import Link from "next/link";
import type { ApplicationStatus, Verdict } from "@/lib/app/types";
import { IconArrowLeft, IconCheck } from "@/components/icons";

/* Small presentational primitives for the app. */

export function PageHead({ title, sub, actions, back }: { title: string; sub?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div>
      {back ? (
        <Link className="app-back" href={back.href}>
          <IconArrowLeft /> {back.label}
        </Link>
      ) : null}
      <div className="app-head">
        <div>
          <h1>{title}</h1>
          {sub ? <p>{sub}</p> : null}
        </div>
        {actions ? <div className="app-head__actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Card({ children, className = "", title, hint, right, id }: { children: ReactNode; className?: string; title?: string; hint?: string; right?: ReactNode; id?: string }) {
  return (
    <section className={`app-card ${className}`} id={id}>
      {title ? (
        <div className="app-card__head">
          <div>
            <h2>{title}</h2>
            {hint ? <div className="app-card__hint">{hint}</div> : null}
          </div>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Notice({ kind = "warn", children }: { kind?: "warn" | "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div className="app-notice" data-kind={kind} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
    </div>
  );
}

export function Spinner() {
  return <span className="app-spinner" aria-hidden="true" />;
}

export function Skeleton({ h = 16, w = "100%" }: { h?: number; w?: string }) {
  return <div className="app-skeleton" style={{ height: h, width: w }} aria-hidden="true" />;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="app-empty">
      <h3>{title}</h3>
      {body ? <p className="app-muted">{body}</p> : null}
      {action}
    </div>
  );
}

export function verdictColor(v: Verdict): string {
  return v === "apply" ? "var(--green)" : v === "borderline" ? "var(--amber)" : "var(--coral)";
}

export function ScoreRing({ score, verdict, size = 88, stroke = 8 }: { score: number; verdict: Verdict; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="app-ring" style={{ width: size, height: size }} role="img" aria-label={`Score ${score} out of 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-soft-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={verdictColor(verdict)} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`} />
      </svg>
      <span className="app-ring__value" style={{ fontSize: size * 0.32 }}>
        {score}
      </span>
    </div>
  );
}

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const label = verdict === "apply" ? "Apply" : verdict === "borderline" ? "Borderline" : "Skip";
  return <span className={`chip chip--${verdict}`}>{label}</span>;
}

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  scored: "Scored",
  needs_input: "Needs your input",
  building: "Building",
  ready: "Package ready",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Closed",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className="app-status" data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="app-field">
      <label htmlFor={htmlFor}>
        {label}
        {hint ? <span>{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

export function Progress({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="app-progress" aria-live="polite">
      {steps.map((s, i) => {
        const state = i < active ? "done" : i === active ? "active" : "todo";
        return (
          <div key={s} className="app-progress__step" data-state={state}>
            {state === "active" ? (
              <Spinner />
            ) : (
              <span className="app-dot" style={state === "done" ? { borderColor: "var(--green)", color: "var(--green-ink)" } : undefined}>
                {state === "done" ? <IconCheck strokeWidth={3} /> : null}
              </span>
            )}
            {s}
          </div>
        );
      })}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="app-tabbar" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function money(n?: number, currency = "CAD"): string {
  if (n === undefined || n === null) return "—";
  return formatMoney(n, currency);
}

export function fmtDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

export function Dropzone({ file, onFile, hint = "PDF or DOCX, up to 4 MB", label = "Drop your resume here, or browse" }: { file: File | null; onFile: (f: File | null) => void; hint?: string; label?: string }) {
  const [over, setOver] = useState(false);
  const accept = (f?: File) => {
    if (!f) return;
    if (!/\.(pdf|docx)$/i.test(f.name)) return alert("Only PDF and DOCX resumes are supported.");
    if (f.size > 4 * 1024 * 1024) return alert("Resumes must be 4 MB or smaller.");
    onFile(f);
  };
  return (
    <label
      className="app-drop"
      data-over={over}
      data-has={!!file}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        accept(e.dataTransfer.files?.[0]);
      }}
    >
      <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => accept(e.target.files?.[0])} aria-label={label} />
      {file ? (
        <>
          <b>{file.name}</b>
          <small>
            {(file.size / 1024).toFixed(0)} KB ·{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onFile(null);
              }}
              style={{ textDecoration: "underline" }}
            >
              remove
            </button>
          </small>
        </>
      ) : (
        <>
          <b>{label}</b>
          <small>{hint}</small>
        </>
      )}
    </label>
  );
}
