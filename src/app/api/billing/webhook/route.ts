import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { handleWebhook } from "@/lib/billing/stripe";

export const runtime = "nodejs";

/** Stripe webhook: grants purchases on paid checkouts, records refunds. */
export const POST = withHandler(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) throw new ApiError(400, "no_signature", "Missing Stripe signature.");
  const raw = await req.text();
  const result = await handleWebhook(raw, signature);
  return ok(result);
});
