import "server-only";
import type { CandidateProfile, JobRequirements, PayReport, PlanBRole } from "@/lib/app/types";
import { config } from "@/lib/app/config";
import { normalize, tokens } from "@/lib/scoring/text";

/* ------------------------------------------------------------------
   Rule 2: salary comes from market data, never from the model.
   Adzuna's Canadian index by title and location; a failed or thin
   lookup returns "no reliable data", not an estimate.
------------------------------------------------------------------- */

const BASE = "https://api.adzuna.com/v1/api/jobs/ca";
const MIN_SAMPLE = 8;

async function getJson<T>(url: string): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function creds(): string {
  return `app_id=${encodeURIComponent(config.adzuna.appId)}&app_key=${encodeURIComponent(config.adzuna.appKey)}`;
}

function percentiles(hist: Record<string, number>): { low: number; median: number; high: number; n: number } | null {
  const buckets = Object.entries(hist)
    .map(([k, v]) => [Number(k), Number(v)] as [number, number])
    .filter(([k, v]) => Number.isFinite(k) && v > 0)
    .sort((a, b) => a[0] - b[0]);
  const n = buckets.reduce((s, [, v]) => s + v, 0);
  if (!n) return null;
  const at = (p: number) => {
    let acc = 0;
    for (const [k, v] of buckets) {
      acc += v;
      if (acc / n >= p) return k;
    }
    return buckets[buckets.length - 1][0];
  };
  return { low: at(0.25), median: at(0.5), high: at(0.75), n };
}

export async function getPayReport(input: { title: string; city?: string; province?: string }): Promise<PayReport> {
  const location = [input.city, input.province].filter(Boolean).join(", ") || "Canada";
  const base: PayReport = { available: false, title: input.title, location, currency: "CAD", source: "none", fetchedAt: new Date().toISOString() };

  if (!config.adzuna.appId || !config.adzuna.appKey) {
    if (config.isProd) return { ...base, message: "Salary data is not configured." };
    return mockPay(input.title, location);
  }

  const attempts = [input.city, input.province, undefined].filter((v, i, a) => a.indexOf(v) === i);
  for (const where of attempts) {
    const url = `${BASE}/histogram?${creds()}&what=${encodeURIComponent(input.title)}${where ? `&where=${encodeURIComponent(where)}` : ""}`;
    const data = await getJson<{ histogram?: Record<string, number> }>(url);
    const p = data?.histogram ? percentiles(data.histogram) : null;
    if (p && p.n >= MIN_SAMPLE) {
      return { ...base, available: true, low: p.low, median: p.median, high: p.high, sampleSize: p.n, source: "adzuna", location: where ?? "Canada", message: where !== input.city && input.city ? `Not enough postings in ${input.city}; showing ${where ?? "Canada"}.` : undefined };
    }
  }
  return { ...base, message: `No reliable data for “${input.title}” in ${location}.` };
}

export async function getPlanB(input: { profile: CandidateProfile; req: JobRequirements; city?: string; province?: string }): Promise<PlanBRole[]> {
  const where = [input.city, input.province].filter(Boolean).join(", ");
  if (!config.adzuna.appId || !config.adzuna.appKey) {
    if (config.isProd) return [];
    return mockPlanB(input.req, where);
  }
  const what = input.req.title;
  const url = `${BASE}/search/1?${creds()}&what=${encodeURIComponent(what)}${where ? `&where=${encodeURIComponent(where)}&distance=50` : ""}&results_per_page=25&sort_by=relevance&content-type=application/json`;
  const data = await getJson<{ results?: AdzunaJob[] }>(url);
  const jobs = data?.results ?? [];
  const profileTokens = new Set(tokens([input.profile.skills.join(" "), ...input.profile.experience.map((e) => `${e.title} ${e.bullets.map((b) => b.text).join(" ")}`)].join(" ")));
  const scored = jobs
    .filter((j) => normalize(j.title) !== normalize(what))
    .map((j) => {
      const t = tokens(`${j.title} ${j.description ?? ""}`);
      const overlap = t.filter((x) => profileTokens.has(x)).length;
      return { j, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3);
  return scored.map(({ j, overlap }) => ({
    title: j.title,
    company: j.company?.display_name,
    location: j.location?.display_name,
    salaryLow: j.salary_min ? Math.round(j.salary_min) : undefined,
    salaryHigh: j.salary_max ? Math.round(j.salary_max) : undefined,
    url: j.redirect_url,
    why: overlap ? `${overlap} of your listed skills and terms appear in this posting.` : "Same field, nearby.",
  }));
}

interface AdzunaJob {
  title: string;
  description?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  redirect_url?: string;
}

/* ---------- deterministic local stand-ins ---------- */

function hashInt(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h >>> 0);
}

function mockPay(title: string, location: string): PayReport {
  const base = 42000 + (hashInt(normalize(title)) % 36) * 1000;
  return { available: true, title, location, currency: "CAD", low: base, median: base + 8000, high: base + 16000, sampleSize: 40, source: "mock", fetchedAt: new Date().toISOString(), message: "Local sample data (Adzuna keys not configured)." };
}

function mockPlanB(req: JobRequirements, where: string): PlanBRole[] {
  const pool = ["Inventory Analyst", "Operations Coordinator", "Supply Planner", "Purchasing Assistant", "Fleet Coordinator", "Production Scheduler", "Shipping Coordinator", "Customer Service Lead"];
  const start = hashInt(normalize(req.title)) % pool.length;
  return [0, 1, 2].map((i) => {
    const t = pool[(start + i * 2) % pool.length];
    const base = 44000 + (hashInt(t) % 30) * 1000;
    return { title: t, company: ["Regional distributor", "Manufacturer", "3PL warehouse"][i], location: where || "Windsor, ON", salaryLow: base, salaryHigh: base + 12000, why: "Shares most of the same keywords as your resume (local sample data)." };
  });
}
