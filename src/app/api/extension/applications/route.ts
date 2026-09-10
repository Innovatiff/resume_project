import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { requireExtensionAccess, requireExtensionUser } from "@/lib/app/auth-server";
import { readJson } from "@/lib/app/request";
import { config } from "@/lib/app/config";
import { listApplications } from "@/lib/store/applications";
import { createApplication } from "@/lib/pipeline/application";
import { toExtensionApplication } from "@/lib/extension/server";
import { bestMatch } from "@/lib/extension/match";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Recent applications, and which one the current page belongs to: ?url=&title= */
export const GET = withHandler(async (req) => {
  const { uid } = await requireExtensionUser(req);
  await requireExtensionAccess(uid);
  const url = new URL(req.url);
  const pageUrl = url.searchParams.get("url") ?? undefined;
  const title = url.searchParams.get("title") ?? undefined;
  const apps = (await listApplications(uid, 50)).map(toExtensionApplication);
  const match = pageUrl || title ? bestMatch(apps, { url: pageUrl, title }) : null;
  return ok({ applications: apps, match: match ? { id: match.app.id, score: match.score } : null });
});

/** Score a posting the extension read off the page. Same pipeline as the app: verdict, pay report, red flags, Plan B. */
export const POST = withHandler(async (req) => {
  const { uid, doc } = await requireExtensionUser(req);
  await requireExtensionAccess(uid);
  const body = await readJson<{ posting?: string; url?: string }>(req);
  const posting = String(body.posting ?? "").replace(/\s+\n/g, "\n").trim();
  if (posting.length < config.limits.minPostingChars) throw new ApiError(400, "posting_too_short", "This page does not read like a job posting. Open the posting itself and try again.");
  const postingUrl = typeof body.url === "string" && /^https?:\/\//i.test(body.url) ? body.url.slice(0, 500) : undefined;
  const application = await createApplication(doc, { postingText: posting.slice(0, config.limits.maxPostingChars), postingUrl });
  return ok({ application: toExtensionApplication(application) }, { status: 201 });
});
