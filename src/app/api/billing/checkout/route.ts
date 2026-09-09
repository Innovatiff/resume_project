import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { readJson } from "@/lib/app/request";
import { config } from "@/lib/app/config";
import { isProduct } from "@/lib/billing/plans";
import { createCheckout } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export const POST = withHandler(async (req) => {
  const { uid, email, doc } = await requireUser(req);
  const body = await readJson<{ product?: string }>(req);
  if (!body.product || !isProduct(body.product)) throw new ApiError(400, "bad_product", "Unknown product.");
  const origin = config.isProd ? config.siteUrl : (req.headers.get("origin") ?? config.siteUrl);
  const { url, mode } = await createCheckout({ uid, email, product: body.product, origin, country: doc.country });
  return ok({ url, mode });
});
