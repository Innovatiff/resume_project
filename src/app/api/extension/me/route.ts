import { ok, withHandler } from "@/lib/app/errors";
import { requireExtensionUser } from "@/lib/app/auth-server";
import { resolveEntitlement } from "@/lib/billing/entitlements";
import { config } from "@/lib/app/config";
import type { ExtensionMe } from "@/lib/app/types";

export const runtime = "nodejs";

/** Who the connected browser belongs to and whether their package includes the extension. */
export const GET = withHandler(async (req) => {
  const { uid, doc } = await requireExtensionUser(req);
  const { summary, purchases } = await resolveEntitlement(uid);
  const me: ExtensionMe = {
    email: doc.email,
    displayName: doc.displayName,
    plan: summary.plan,
    extension: summary.features.extension,
    hadPass: purchases.some((p) => p.product === "pass" || p.product === "landed" || p.product === "extra30"),
    hasProfile: Boolean(doc.profile),
    endsAt: summary.endsAt,
    daysLeft: summary.daysLeft,
    siteUrl: config.siteUrl,
  };
  return ok({ me });
});
