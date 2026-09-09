import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { readJson } from "@/lib/app/request";
import { startPackage } from "@/lib/pipeline/application";
import type { Strategy } from "@/lib/app/types";

export const runtime = "nodejs";
export const maxDuration = 180;

/** Start building the package: returns needs_input (metric interview) or ready. */
export const POST = withHandler(async (req, ctx: RouteContext<"/api/applications/[id]/package">) => {
  const { doc } = await requireUser(req);
  const { id } = await ctx.params;
  const body = req.headers.get("content-type")?.includes("application/json") ? await readJson<{ strategy?: string }>(req) : {};
  let strategy: Strategy | undefined;
  if (body.strategy !== undefined) {
    if (body.strategy !== "standard" && body.strategy !== "long_shot") throw new ApiError(400, "bad_strategy", "Strategy must be standard or long_shot.");
    strategy = body.strategy;
  }
  const application = await startPackage(doc, id, strategy);
  return ok({ application });
});
