import { ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { readJson } from "@/lib/app/request";
import { submitInterview } from "@/lib/pipeline/application";

export const runtime = "nodejs";
export const maxDuration = 180;

/** Metric interview answers. Missing answers are allowed; nothing is invented for them. */
export const POST = withHandler(async (req, ctx: RouteContext<"/api/applications/[id]/interview">) => {
  const { doc } = await requireUser(req);
  const { id } = await ctx.params;
  const body = await readJson<{ answers?: Record<string, string> }>(req);
  const application = await submitInterview(doc, id, body.answers ?? {});
  return ok({ application });
});
