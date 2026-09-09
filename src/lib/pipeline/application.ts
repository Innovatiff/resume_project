import "server-only";
import type { Application, ApplicationPackage, CandidateProfile, Language, PlanId, ProfileSource, Purchase, Strategy, UserDoc } from "@/lib/app/types";
import { config } from "@/lib/app/config";
import { ApiError } from "@/lib/app/errors";
import { newId, nowIso } from "@/lib/app/hash";
import { parseResume } from "@/lib/parse/resume";
import { extractProfile, interviewPrep, linkedinRewrite, metricQuestions, objectionReport, parsePosting, rewriteResume } from "@/lib/ai/tasks";
import { enforceNumbers, sourceNumberKeys } from "@/lib/ai/validate";
import { scoreResume } from "@/lib/scoring/scorer";
import { checkRedFlags } from "@/lib/scoring/redflags";
import { getPayReport, getPlanB } from "@/lib/salary/adzuna";
import { getApplication, saveApplication, updateApplication } from "@/lib/store/applications";
import { setProfile } from "@/lib/store/users";
import { consumePackage, requireBuildCapacity } from "@/lib/billing/entitlements";
import { featuresFor } from "@/lib/billing/plans";
import { notifyFounder, packageReadyEmail, sendEmail } from "@/lib/email/resend";

/* ------------------------------------------------------------------
   Paid pipeline.
   1. createApplication: profile (saved or fresh upload) + posting -> score,
      verdict, red flags, pay report, Plan B. Free within a live plan.
   2. buildPackage: metric interview (pass+) -> rewrite -> validate figures
      -> rescore -> extras. Counts one package against the purchase.
------------------------------------------------------------------- */

const LAYOUT_FALLBACK: ProfileSource["layout"] = { fileType: "docx", pages: 1, words: 400, multiColumn: false, tables: false, images: false, noText: false };

export async function ingestResume(user: UserDoc, file: { buffer: Buffer; name: string; type?: string }): Promise<{ profile: CandidateProfile; source: ProfileSource }> {
  const parsed = await parseResume(file.buffer, file.name, file.type);
  const { profile } = await extractProfile(parsed.text);
  const source: ProfileSource = { fileName: file.name, fileType: parsed.layout.fileType, extractedAt: nowIso(), textLength: parsed.text.length, layout: parsed.layout };
  await setProfile(user.uid, profile, source);
  return { profile, source };
}

export interface CreateInput {
  postingText: string;
  postingUrl?: string;
  file?: { buffer: Buffer; name: string; type?: string };
}

export async function createApplication(user: UserDoc, input: CreateInput): Promise<Application> {
  let profile = user.profile;
  let layout = user.profileSource?.layout ?? LAYOUT_FALLBACK;
  if (input.file) {
    const ingested = await ingestResume(user, input.file);
    profile = ingested.profile;
    layout = ingested.source.layout;
  }
  if (!profile) throw new ApiError(400, "no_profile", "Upload your resume first so we can score it against the posting.");

  const { requirements } = await parsePosting(input.postingText);
  const score = scoreResume(profile, requirements, layout);
  const redFlags = checkRedFlags(input.postingText, requirements);
  const city = requirements.city ?? user.city ?? profile.contact.city;
  const province = requirements.province ?? user.province ?? profile.contact.province;
  const [payReport, planB] = await Promise.all([
    getPayReport({ title: requirements.title, city, province }),
    getPlanB({ profile, req: requirements, city, province }).catch(() => []),
  ]);

  const now = nowIso();
  const app: Application = {
    id: newId(),
    uid: user.uid,
    createdAt: now,
    updatedAt: now,
    status: "scored",
    posting: { title: requirements.title, company: requirements.company, location: requirements.location, text: input.postingText, url: input.postingUrl },
    requirements,
    score,
    redFlags,
    payReport,
    planB,
    strategy: score.verdict === "skip" ? "long_shot" : "standard",
  };
  await saveApplication(app);
  return app;
}

/** Step 1 of the package: decide whether the metric interview is needed. */
export async function startPackage(user: UserDoc, appId: string, strategy?: Strategy): Promise<Application> {
  const app = await getApplication(user.uid, appId);
  if (!app) throw new ApiError(404, "not_found", "Application not found.");
  if (app.package) return app;
  const { plan } = await requireBuildCapacity(user.uid);
  if (!user.profile) throw new ApiError(400, "no_profile", "Upload your resume first.");

  const features = featuresFor(plan);
  const chosen: Strategy = strategy ?? app.strategy;
  if (features.metricInterview && !app.interview?.completedAt) {
    const questions = await metricQuestions(user.profile, app.requirements);
    if (questions.length) {
      const patch: Partial<Application> = { status: "needs_input", strategy: chosen, interview: { questions, answers: app.interview?.answers ?? {} } };
      await updateApplication(user.uid, appId, patch);
      return { ...app, ...patch, updatedAt: nowIso() };
    }
  }
  return finishPackage(user, { ...app, strategy: chosen }, plan);
}

/** Step 2: answers arrive (or the user skips), then the rewrite runs. */
export async function submitInterview(user: UserDoc, appId: string, answers: Record<string, string>): Promise<Application> {
  const app = await getApplication(user.uid, appId);
  if (!app) throw new ApiError(404, "not_found", "Application not found.");
  if (app.package) return app;
  const { plan } = await requireBuildCapacity(user.uid);
  const clean: Record<string, string> = {};
  for (const q of app.interview?.questions ?? []) {
    const a = (answers[q.id] ?? "").toString().trim().slice(0, 400);
    if (a) clean[q.id] = a;
  }
  const interview = { questions: app.interview?.questions ?? [], answers: clean, completedAt: nowIso() };
  await updateApplication(user.uid, appId, { interview });
  return finishPackage(user, { ...app, interview }, plan);
}

async function finishPackage(user: UserDoc, app: Application, plan: PlanId): Promise<Application> {
  const profile = user.profile!;
  const layout = user.profileSource?.layout ?? LAYOUT_FALLBACK;
  const language: Language = user.language ?? "en";
  const questions = app.interview?.questions ?? [];
  const answers = app.interview?.answers ?? {};
  const features = featuresFor(plan);

  await updateApplication(user.uid, app.id, { status: "building" });
  const purchase = (await requireBuildCapacity(user.uid)).purchase;

  const allowed = sourceNumberKeys(profile, answers);
  const base = { profile, req: app.requirements, postingText: app.posting.text, questions, answers, strategy: app.strategy, plan, language };

  let draft = await rewriteResume(base);
  let checked = enforceNumbers(draft.resume, draft.coverLetter, allowed, false);
  if (!checked.validation.passed && !config.ai.mock) {
    draft = await rewriteResume({ ...base, forbidden: checked.validation.orphanNumbers });
    checked = enforceNumbers(draft.resume, draft.coverLetter, allowed, true);
  }

  // Rescore the delivered resume as a profile so the guarantee is measured the same way.
  const rewrittenProfile: CandidateProfile = {
    ...profile,
    headline: checked.resume.headline,
    summary: checked.resume.summary,
    experience: checked.resume.experience.map((e) => ({ title: e.title, company: e.company, location: e.location, start: e.start, end: e.end, current: !e.end || /present/i.test(e.end), bullets: e.bullets.map((text) => ({ text, metrics: [], hasMetric: /\d/.test(text) })) })),
    skills: checked.resume.skills.flatMap((g) => g.items),
  };
  const scoreAfter = scoreResume(rewrittenProfile, app.requirements, { ...layout, multiColumn: false, tables: false, images: false, noText: false, pages: 1 });

  const [prep, objections, linkedin] = await Promise.all([
    interviewPrep(profile, app.requirements, plan).catch(() => undefined),
    features.objections ? objectionReport(profile, app.requirements, app.score.missingMustHave, plan).catch(() => undefined) : Promise.resolve(undefined),
    features.linkedin ? linkedinRewrite(profile, app.requirements, plan).catch(() => undefined) : Promise.resolve(undefined),
  ]);

  const pkg: ApplicationPackage = {
    resume: checked.resume,
    coverLetter: checked.coverLetter,
    strategy: app.strategy,
    validation: checked.validation,
    scoreAfter,
    prep,
    objections,
    linkedin,
    model: draft.model,
    generatedAt: nowIso(),
  };

  const patch: Partial<Application> = { status: "ready", package: pkg, planUsed: plan };
  if (features.humanReview) {
    patch.humanReview = { status: "queued", requestedAt: nowIso() };
    void notifyFounder(`Human review queued: ${app.posting.title}`, `User ${user.email} built a Landed package for ${app.posting.title}${app.posting.company ? ` at ${app.posting.company}` : ""}. Application ${app.id}.`);
  }
  await updateApplication(user.uid, app.id, patch);
  await consumePackage(purchase);

  const mail = packageReadyEmail({ title: app.posting.title, company: app.posting.company, score: scoreAfter.score, url: `${config.siteUrl}/app/applications/${app.id}` });
  void sendEmail({ to: user.email, ...mail });

  return { ...app, ...patch, updatedAt: nowIso() };
}

export function planFromPurchase(p: Purchase): PlanId {
  return p.product === "extra30" ? "pass" : (p.product as PlanId);
}
