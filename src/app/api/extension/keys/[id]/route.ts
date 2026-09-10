import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { revokeExtensionKey } from "@/lib/store/extension-keys";

export const runtime = "nodejs";

/** Disconnect a browser. The extension holding the key gets 401 from then on. */
export const DELETE = withHandler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { uid } = await requireUser(req);
  const { id } = await ctx.params;
  const removed = await revokeExtensionKey(uid, id);
  if (!removed) throw new ApiError(404, "not_found", "That browser is not connected.");
  return ok({});
});
