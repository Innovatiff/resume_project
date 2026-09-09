import "server-only";
import type { CandidateProfile, InterviewPrep, JobRequirements, Language, LinkedInRewrite, MetricQuestion, ObjectionReport, PlanId, Strategy, TailoredResume } from "@/lib/app/types";
import { config } from "@/lib/app/config";
import { type CountryCode, detectCountry, isCountryCode } from "@/lib/app/markets";
import { extractNumbers } from "@/lib/scoring/text";
import { generate } from "./client";
import { EXTRACT_SYSTEM, LINKEDIN_SYSTEM, LONG_SHOT_ADDENDUM, OBJECTIONS_SYSTEM, POSTING_SYSTEM, PREP_SYSTEM, QUESTIONS_SYSTEM, rewriteSystem } from "./prompts";
import { LinkedInSchema, ObjectionsSchema, PrepSchema, ProfileSchema, QuestionsSchema, RequirementsSchema, RewriteSchema, type ProfileOut, type RequirementsOut, type RewriteOut } from "./schemas";
import { mockExtractProfile, mockLinkedIn, mockObjections, mockParsePosting, mockPrep, mockQuestions, mockRewrite } from "./mock";

const n = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
/** The model is asked for an ISO code; accept a country name too. */
const toCountry = (v: string | null): CountryCode | undefined => {
  if (!v) return undefined;
  const code = v.trim().toUpperCase();
  if (code === "UK") return "GB";
  return isCountryCode(code) ? code : detectCountry(v);
};

export function aiMode(): "live" | "mock" {
  return config.ai.mock ? "mock" : "live";
}

/* ---------- Stage 1: extract ---------- */

function toProfile(o: ProfileOut): CandidateProfile {
  return {
    name: n(o.name),
    headline: n(o.headline),
    contact: { email: n(o.contact.email), phone: n(o.contact.phone), city: n(o.contact.city), province: n(o.contact.province), country: toCountry(o.contact.country), linkedin: n(o.contact.linkedin) },
    summary: n(o.summary),
    experience: o.experience.map((e) => ({
      title: e.title,
      company: e.company,
      location: n(e.location),
      start: n(e.start),
      end: n(e.end),
      current: e.current,
      bullets: e.bullets.map((text) => {
        const metrics = extractNumbers(text);
        return { text, metrics, hasMetric: metrics.length > 0 };
      }),
    })),
    skills: o.skills,
    education: o.education.map((e) => ({ credential: e.credential, institution: n(e.institution), year: n(e.year) })),
    certifications: o.certifications,
    languages: o.languages,
    totalYears: n(o.totalYears),
  };
}

export async function extractProfile(resumeText: string): Promise<{ profile: CandidateProfile; model: string }> {
  if (config.ai.mock) return { profile: mockExtractProfile(resumeText), model: "mock" };
  const { output, model } = await generate({ role: "extract", system: EXTRACT_SYSTEM, user: `RESUME TEXT:\n\n${resumeText}`, schema: ProfileSchema, maxTokens: 8000 });
  return { profile: toProfile(output), model };
}

/* ---------- posting ---------- */

function toRequirements(o: RequirementsOut): JobRequirements {
  return {
    title: o.title,
    company: n(o.company),
    location: n(o.location),
    city: n(o.city),
    province: n(o.province),
    country: toCountry(o.country),
    remote: o.remote,
    employmentType: n(o.employmentType),
    salaryStated: n(o.salaryStated),
    yearsRequired: n(o.yearsRequired),
    mustHave: o.mustHave,
    niceToHave: o.niceToHave,
    credentials: o.credentials,
    responsibilities: o.responsibilities,
    postedDaysAgo: n(o.postedDaysAgo),
    attestations: o.attestations,
  };
}

export async function parsePosting(postingText: string): Promise<{ requirements: JobRequirements; model: string }> {
  if (config.ai.mock) return { requirements: mockParsePosting(postingText), model: "mock" };
  const { output, model } = await generate({ role: "extract", system: POSTING_SYSTEM, user: `JOB POSTING:\n\n${postingText}`, schema: RequirementsSchema, maxTokens: 6000 });
  return { requirements: toRequirements(output), model };
}

/* ---------- metric interview ---------- */

export async function metricQuestions(profile: CandidateProfile, req: JobRequirements): Promise<MetricQuestion[]> {
  if (config.ai.mock) return mockQuestions(profile, req);
  const { output } = await generate({
    role: "extract",
    system: QUESTIONS_SYSTEM,
    user: `CANDIDATE PROFILE (JSON):\n${JSON.stringify(profile)}\n\nJOB REQUIREMENTS (JSON):\n${JSON.stringify(req)}`,
    schema: QuestionsSchema,
    maxTokens: 3000,
  });
  const out: MetricQuestion[] = [];
  output.questions.slice(0, 3).forEach((q, i) => {
    const bullet = profile.experience[q.experienceIndex]?.bullets[q.bulletIndex];
    if (!bullet || bullet.hasMetric) return;
    out.push({ id: `q${i + 1}`, experienceIndex: q.experienceIndex, bulletIndex: q.bulletIndex, bullet: bullet.text, question: q.question, why: q.why });
  });
  return out;
}

/* ---------- rewrite ---------- */

export interface RewriteInput {
  profile: CandidateProfile;
  req: JobRequirements;
  postingText: string;
  questions: MetricQuestion[];
  answers: Record<string, string>;
  strategy: Strategy;
  plan: PlanId;
  language: Language;
  /** Market of the posting: spelling and resume conventions. */
  country: CountryCode;
  /** Figures the validator rejected on a previous attempt, for a corrective retry. */
  forbidden?: string[];
}

function toResume(o: RewriteOut["resume"]): TailoredResume {
  return {
    name: o.name,
    headline: o.headline,
    contact: { email: n(o.contact.email), phone: n(o.contact.phone), city: n(o.contact.city), linkedin: n(o.contact.linkedin) },
    summary: o.summary,
    experience: o.experience.map((e) => ({ title: e.title, company: e.company, location: n(e.location), start: n(e.start), end: n(e.end), bullets: e.bullets })),
    skills: o.skills,
    education: o.education.map((e) => ({ credential: e.credential, institution: n(e.institution), year: n(e.year) })),
    certifications: o.certifications,
    languages: o.languages,
  };
}

export async function rewriteResume(input: RewriteInput): Promise<{ resume: TailoredResume; coverLetter: string; model: string }> {
  if (config.ai.mock) {
    const out = mockRewrite({ profile: input.profile, req: input.req, answers: input.answers, questions: input.questions, strategy: input.strategy });
    return { ...out, model: "mock" };
  }
  const answers = input.questions
    .filter((q) => input.answers[q.id]?.trim())
    .map((q) => `- About “${q.bullet}”: ${input.answers[q.id].trim()}`)
    .join("\n");
  const user = [
    `CANDIDATE PROFILE (JSON):\n${JSON.stringify(input.profile)}`,
    answers ? `CANDIDATE'S INTERVIEW ANSWERS (the only additional figures you may use):\n${answers}` : "CANDIDATE'S INTERVIEW ANSWERS: none.",
    `JOB REQUIREMENTS (JSON):\n${JSON.stringify(input.req)}`,
    `FULL POSTING TEXT:\n${input.postingText}`,
    input.strategy === "long_shot" ? LONG_SHOT_ADDENDUM : "Strategy for this application: STANDARD.",
    input.forbidden?.length ? `CORRECTION: your previous draft contained figures that do not exist in the source material and were rejected: ${input.forbidden.join(", ")}. Remove them; do not replace them with other invented figures.` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const { output, model } = await generate({
    role: input.plan === "landed" ? "premium" : "rewrite",
    system: rewriteSystem(input.language, input.country),
    user,
    schema: RewriteSchema,
    maxTokens: 12000,
    effort: "high",
  });
  return { resume: toResume(output.resume), coverLetter: output.coverLetter, model };
}

/* ---------- extras ---------- */

export async function interviewPrep(profile: CandidateProfile, req: JobRequirements, plan: PlanId): Promise<InterviewPrep> {
  if (config.ai.mock) return mockPrep(profile, req);
  const { output } = await generate({ role: plan === "landed" ? "premium" : "rewrite", system: PREP_SYSTEM, user: `CANDIDATE PROFILE (JSON):\n${JSON.stringify(profile)}\n\nJOB REQUIREMENTS (JSON):\n${JSON.stringify(req)}`, schema: PrepSchema, maxTokens: 6000, effort: "medium" });
  return output;
}

export async function objectionReport(profile: CandidateProfile, req: JobRequirements, missing: string[], plan: PlanId): Promise<ObjectionReport> {
  if (config.ai.mock) return mockObjections(profile, req, missing);
  const { output } = await generate({ role: plan === "landed" ? "premium" : "rewrite", system: OBJECTIONS_SYSTEM, user: `CANDIDATE PROFILE (JSON):\n${JSON.stringify(profile)}\n\nJOB REQUIREMENTS (JSON):\n${JSON.stringify(req)}\n\nMISSING MUST-HAVES (from the deterministic scorer): ${missing.join(", ") || "none"}`, schema: ObjectionsSchema, maxTokens: 4000, effort: "medium" });
  return output;
}

export async function linkedinRewrite(profile: CandidateProfile, req: JobRequirements, plan: PlanId): Promise<LinkedInRewrite> {
  if (config.ai.mock) return mockLinkedIn(profile, req);
  const { output } = await generate({ role: plan === "landed" ? "premium" : "rewrite", system: LINKEDIN_SYSTEM, user: `CANDIDATE PROFILE (JSON):\n${JSON.stringify(profile)}\n\nTARGET ROLE (JSON):\n${JSON.stringify(req)}`, schema: LinkedInSchema, maxTokens: 3000, effort: "medium" });
  return output;
}
