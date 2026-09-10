import { ApiError, withHandler } from "@/lib/app/errors";
import { requireExtensionAccess, requireExtensionUser } from "@/lib/app/auth-server";
import { getApplication } from "@/lib/store/applications";
import { buildDeliverable, deliverableParams, deliverableResponse } from "@/lib/documents/deliverables";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The generated resume or cover letter for the extension to attach: ?type=resume|cover&format=pdf|docx */
export const GET = withHandler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { uid } = await requireExtensionUser(req);
  await requireExtensionAccess(uid);
  const { id } = await ctx.params;
  const app = await getApplication(uid, id);
  if (!app) throw new ApiError(404, "not_found", "Application not found.");
  const { type, format } = deliverableParams(new URL(req.url));
  return deliverableResponse(await buildDeliverable(app, type, format));
});
