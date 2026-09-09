import { ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { config } from "@/lib/app/config";
import { fileFromForm, readForm, textField } from "@/lib/app/request";
import { listApplications } from "@/lib/store/applications";
import { createApplication } from "@/lib/pipeline/application";
import type { Application } from "@/lib/app/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export interface ApplicationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: Application["status"];
  posting: { title: string; company?: string; location?: string };
  score: number;
  verdict: Application["score"]["verdict"];
  scoreAfter?: number;
  strategy: Application["strategy"];
}

export function summarize(a: Application): ApplicationSummary {
  return {
    id: a.id,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    status: a.status,
    posting: { title: a.posting.title, company: a.posting.company, location: a.posting.location },
    score: a.score.score,
    verdict: a.score.verdict,
    scoreAfter: a.package?.scoreAfter.score,
    strategy: a.strategy,
  };
}

export const GET = withHandler(async (req) => {
  const { uid } = await requireUser(req);
  const apps = await listApplications(uid);
  return ok({ applications: apps.map(summarize) });
});

/** Create and score an application. Multipart: posting (text), url?, file? (new resume). */
export const POST = withHandler(async (req) => {
  const { doc } = await requireUser(req);
  const form = await readForm(req);
  const postingText = textField(form, "posting", { min: config.limits.minPostingChars, max: config.limits.maxPostingChars });
  const url = textField(form, "url", { required: false, max: 500 }) || undefined;
  const file = await fileFromForm(form, "file", false);
  const application = await createApplication(doc, { postingText, postingUrl: url, file: file ?? undefined });
  return ok({ application }, { status: 201 });
});
