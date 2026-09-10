import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { requireExtensionAccess, requireExtensionUser } from "@/lib/app/auth-server";
import { getApplication } from "@/lib/store/applications";
import { buildFillData } from "@/lib/extension/server";

export const runtime = "nodejs";

/** What the content script may type into a form for this application. Needs a built package. */
export const GET = withHandler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { uid, doc } = await requireExtensionUser(req);
  await requireExtensionAccess(uid);
  const { id } = await ctx.params;
  const app = await getApplication(uid, id);
  if (!app) throw new ApiError(404, "not_found", "Application not found.");
  if (!app.package) throw new ApiError(409, "not_ready", "Build the package in Orvenic first; the extension fills forms from the tailored resume.");
  return ok({ fill: buildFillData(app, doc) });
});
