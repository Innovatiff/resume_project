import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { getFreeScanResult } from "@/lib/store/free-scans";

export const runtime = "nodejs";

export const GET = withHandler(async (_req, ctx: RouteContext<"/api/scan/[id]">) => {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new ApiError(400, "bad_id", "Invalid scan id.");
  const result = await getFreeScanResult(id);
  if (!result) throw new ApiError(404, "not_found", "That scan has expired or does not exist.");
  return ok({ result });
});
