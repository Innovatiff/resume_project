import { withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { getApplication } from "@/lib/store/applications";
import { buildDeliverable, deliverableParams, deliverableResponse } from "@/lib/documents/deliverables";
import { ApiError } from "@/lib/app/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generate the delivered documents on demand: ?type=resume|cover&format=docx|pdf */
export const GET = withHandler(async (req, ctx: RouteContext<"/api/applications/[id]/documents">) => {
  const { uid } = await requireUser(req);
  const { id } = await ctx.params;
  const app = await getApplication(uid, id);
  if (!app) throw new ApiError(404, "not_found", "Application not found.");
  const { type, format } = deliverableParams(new URL(req.url));
  return deliverableResponse(await buildDeliverable(app, type, format));
});
