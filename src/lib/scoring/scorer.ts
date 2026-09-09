import type { CandidateProfile, JobRequirements, LayoutFlags, ScoreComponent, ScoreResult, Verdict } from "@/lib/app/types";
import { countWords, jaccard, normalize, phraseIn, tokens } from "./text";

/* ------------------------------------------------------------------
   Deterministic ATS scorer. No model involved: the same inputs always
   produce the same score, and the breakdown is published to the user.
------------------------------------------------------------------- */

export function profileText(profile: CandidateProfile): string {
  const parts: string[] = [];
  if (profile.name) parts.push(profile.name);
  if (profile.headline) parts.push(profile.headline);
  if (profile.summary) parts.push(profile.summary);
  for (const e of profile.experience) {
    parts.push(e.title, e.company, e.location ?? "");
    for (const b of e.bullets) parts.push(b.text);
  }
  parts.push(...profile.skills, ...profile.certifications, ...profile.languages);
  for (const ed of profile.education) parts.push(ed.credential, ed.institution ?? "");
  return normalize(parts.join(" \n "));
}

export function verdictFor(score: number): Verdict {
  if (score >= 85) return "apply";
  if (score >= 70) return "borderline";
  return "skip";
}

const WEIGHTS = {
  mustHave: 35,
  niceToHave: 10,
  title: 10,
  years: 10,
  credentials: 10,
  metrics: 10,
  format: 10,
  structure: 5,
} as const;

export function scoreResume(profile: CandidateProfile, req: JobRequirements, layout: LayoutFlags): ScoreResult {
  const text = profileText(profile);
  const breakdown: ScoreComponent[] = [];

  // 1. Must-have coverage
  const must = dedupe(req.mustHave);
  const missingMust = must.filter((k) => !phraseIn(k, text));
  const mustCovered = must.length ? (must.length - missingMust.length) / must.length : 1;
  breakdown.push({
    key: "mustHave",
    label: "Must-have keywords",
    points: round(WEIGHTS.mustHave * mustCovered),
    max: WEIGHTS.mustHave,
    detail: must.length ? `${must.length - missingMust.length} of ${must.length} covered${missingMust.length ? `. Missing: ${missingMust.slice(0, 6).join(", ")}` : ""}` : "The posting lists no explicit requirements.",
  });

  // 2. Nice-to-have coverage
  const nice = dedupe(req.niceToHave).filter((k) => !must.includes(k));
  const missingNice = nice.filter((k) => !phraseIn(k, text));
  const niceCovered = nice.length ? (nice.length - missingNice.length) / nice.length : 1;
  breakdown.push({
    key: "niceToHave",
    label: "Nice-to-have keywords",
    points: round(WEIGHTS.niceToHave * niceCovered),
    max: WEIGHTS.niceToHave,
    detail: nice.length ? `${nice.length - missingNice.length} of ${nice.length} covered` : "None listed.",
  });

  // 3. Title alignment
  const targetTokens = tokens(req.title);
  const profileTitles = [profile.headline ?? "", ...profile.experience.map((e) => e.title)].map(tokens);
  const bestTitle = Math.max(0, ...profileTitles.map((t) => jaccard(targetTokens, t)));
  const titleScore = bestTitle >= 0.5 ? 1 : bestTitle >= 0.25 ? 0.6 : bestTitle > 0 ? 0.3 : 0;
  breakdown.push({
    key: "title",
    label: "Title alignment",
    points: round(WEIGHTS.title * titleScore),
    max: WEIGHTS.title,
    detail: titleScore === 1 ? `Your titles line up with “${req.title}”.` : titleScore > 0 ? `Partial overlap with “${req.title}”.` : `Nothing in your titles or headline resembles “${req.title}”.`,
  });

  // 4. Years of experience
  const years = profile.totalYears ?? estimateYears(profile);
  let yearsScore = 1;
  let yearsDetail = "No minimum stated.";
  if (req.yearsRequired && req.yearsRequired > 0) {
    yearsScore = Math.min(1, years / req.yearsRequired);
    yearsDetail = `${years} years visible against ${req.yearsRequired} required.`;
  }
  breakdown.push({ key: "years", label: "Experience level", points: round(WEIGHTS.years * yearsScore), max: WEIGHTS.years, detail: yearsDetail });

  // 5. Credentials / licences
  const creds = dedupe(req.credentials);
  const missingCreds = creds.filter((c) => !phraseIn(c, text));
  const credScore = creds.length ? (creds.length - missingCreds.length) / creds.length : 1;
  breakdown.push({
    key: "credentials",
    label: "Credentials and licences",
    points: round(WEIGHTS.credentials * credScore),
    max: WEIGHTS.credentials,
    detail: creds.length ? (missingCreds.length ? `Not found: ${missingCreds.join(", ")}` : "All required credentials present.") : "None required.",
  });

  // 6. Quantified outcomes
  const bullets = profile.experience.flatMap((e) => e.bullets);
  const withMetric = bullets.filter((b) => b.hasMetric).length;
  const metricRatio = bullets.length ? withMetric / bullets.length : 0;
  const metricScore = Math.min(1, metricRatio / 0.35);
  breakdown.push({
    key: "metrics",
    label: "Quantified outcomes",
    points: round(WEIGHTS.metrics * metricScore),
    max: WEIGHTS.metrics,
    detail: bullets.length ? `${withMetric} of ${bullets.length} bullets contain a figure.` : "No experience bullets found.",
  });

  // 7. ATS format
  let formatPenalty = 0;
  const formatIssues: string[] = [];
  if (layout.noText) {
    formatPenalty += 10;
    formatIssues.push("no machine-readable text (scanned or image-only)");
  }
  if (layout.multiColumn) {
    formatPenalty += 6;
    formatIssues.push("multi-column layout");
  }
  if (layout.tables) {
    formatPenalty += 2;
    formatIssues.push("tables");
  }
  if (layout.images) {
    formatPenalty += 1;
    formatIssues.push("images or graphics");
  }
  if (layout.pages > 2) {
    formatPenalty += 1;
    formatIssues.push(`${layout.pages} pages`);
  }
  breakdown.push({
    key: "format",
    label: "ATS-safe format",
    points: Math.max(0, WEIGHTS.format - formatPenalty),
    max: WEIGHTS.format,
    detail: formatIssues.length ? `Parsers struggle with: ${formatIssues.join(", ")}.` : "Single column, plain text, parses cleanly.",
  });

  // 8. Structure and length
  let structure = 0;
  const checks: string[] = [];
  if (profile.contact.email || profile.contact.phone) structure += 1;
  else checks.push("contact details");
  if (profile.experience.length) structure += 1;
  else checks.push("an experience section");
  if (profile.skills.length) structure += 1;
  else checks.push("a skills section");
  if (profile.summary) structure += 1;
  else checks.push("a summary");
  const words = layout.words;
  if (words >= 250 && words <= 1000) structure += 1;
  else checks.push(words < 250 ? "enough detail (under 250 words)" : "a tighter length (over 1,000 words)");
  breakdown.push({
    key: "structure",
    label: "Structure and length",
    points: structure,
    max: WEIGHTS.structure,
    detail: checks.length ? `Missing ${checks.join(", ")}.` : "All standard sections present.",
  });

  const score = clamp(Math.round(breakdown.reduce((s, c) => s + c.points, 0)), 0, 100);

  return {
    score,
    verdict: verdictFor(score),
    breakdown,
    reasons: buildReasons({ missingMust, layout, metricRatio, bulletsCount: bullets.length, missingCreds, titleScore, req, yearsScore, years, checks }),
    missingMustHave: missingMust,
    missingNiceToHave: missingNice,
  };
}

interface ReasonInput {
  missingMust: string[];
  layout: LayoutFlags;
  metricRatio: number;
  bulletsCount: number;
  missingCreds: string[];
  titleScore: number;
  req: JobRequirements;
  yearsScore: number;
  years: number;
  checks: string[];
}

function buildReasons(i: ReasonInput): string[] {
  const candidates: { weight: number; text: string }[] = [];
  if (i.layout.noText) candidates.push({ weight: 100, text: "The file has no machine-readable text. It is a scanned image, so the parser sees nothing at all." });
  if (i.missingMust.length) {
    const lost = Math.round((i.missingMust.length / Math.max(1, i.req.mustHave.length)) * 35);
    candidates.push({ weight: 40 + lost, text: `No keyword coverage for ${listQuoted(i.missingMust.slice(0, 3))}${i.missingMust.length > 3 ? ` and ${i.missingMust.length - 3} more` : ""}. The posting treats ${i.missingMust.length === 1 ? "it" : "these"} as must-have${i.missingMust.length === 1 ? "" : "s"}.` });
  }
  if (i.layout.multiColumn) candidates.push({ weight: 45, text: "A two-column layout. Most parsers read straight across the page and scramble the order, so whole sections are dropped." });
  if (i.bulletsCount && i.metricRatio < 0.2) candidates.push({ weight: 38, text: i.metricRatio === 0 ? "No quantified outcomes anywhere. Not one bullet contains a number, so nothing reads as a result." : `Only ${Math.round(i.metricRatio * 100)}% of bullets contain a figure. Recruiters skim for results, not duties.` });
  if (i.missingCreds.length) candidates.push({ weight: 36, text: `The posting requires ${listQuoted(i.missingCreds.slice(0, 2))} and the resume never mentions ${i.missingCreds.length === 1 ? "it" : "them"}.` });
  if (i.titleScore === 0) candidates.push({ weight: 30, text: `Nothing in your titles or headline resembles “${i.req.title}”. Title matching is one of the first filters.` });
  if (i.yearsScore < 0.7 && i.req.yearsRequired) candidates.push({ weight: 28, text: `The posting asks for ${i.req.yearsRequired} years; only ${i.years} are visible on the resume.` });
  if (i.layout.tables) candidates.push({ weight: 20, text: "Skills or dates sit inside tables. Table cells are often flattened into one unreadable line." });
  if (i.checks.length) candidates.push({ weight: 15, text: `The resume is missing ${i.checks[0]}, which parsers use to anchor the other sections.` });
  candidates.sort((a, b) => b.weight - a.weight);
  const reasons = candidates.slice(0, 3).map((c) => c.text);
  while (reasons.length < 3) reasons.push(reasons.length === 0 ? "This resume already covers what the posting asks for. Small gains only." : "Tighten wording toward the posting's exact phrasing to lift keyword matches further.");
  return reasons;
}

function listQuoted(items: string[]): string {
  const q = items.map((s) => `“${s}”`);
  if (q.length <= 1) return q.join("");
  return `${q.slice(0, -1).join(", ")} and ${q[q.length - 1]}`;
}

export function estimateYears(profile: CandidateProfile): number {
  let months = 0;
  const now = new Date();
  for (const e of profile.experience) {
    const start = parseYearMonth(e.start);
    const end = e.current || !e.end || /present|current|now/i.test(e.end) ? now : parseYearMonth(e.end);
    if (start && end && end > start) months += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  }
  return Math.round(months / 12);
}

function parseYearMonth(s?: string): Date | null {
  if (!s) return null;
  const m = s.match(/(\d{4})/);
  if (!m) return null;
  const year = Number(m[1]);
  const monthMatch = s.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = monthMatch ? months.indexOf(monthMatch[0].slice(0, 3).toLowerCase()) : 0;
  return new Date(year, Math.max(0, month), 1);
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const k = normalize(raw);
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(raw.trim());
    }
  }
  return out;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export { countWords };
