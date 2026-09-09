import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { confirmSession } from "@/lib/billing/stripe";
import { getPurchase } from "@/lib/store/purchases";

export const runtime = "nodejs";

/** Called from the success page. Grants access immediately if the webhook has not arrived yet. */
export const GET = withHandler(async (req) => {
  const { uid } = await requireUser(req);
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const purchaseId = url.searchParams.get("purchase");
  if (purchaseId) {
    const purchase = await getPurchase(purchaseId);
    if (!purchase || purchase.uid !== uid) throw new ApiError(404, "not_found", "Purchase not found.");
    return ok({ purchase });
  }
  if (!sessionId) throw new ApiError(400, "missing_session", "Missing session id.");
  const purchase = await confirmSession(sessionId, uid);
  if (!purchase) return ok({ purchase: null, pending: true });
  return ok({ purchase });
});
