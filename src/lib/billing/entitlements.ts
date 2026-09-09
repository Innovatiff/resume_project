import "server-only";
import type { EntitlementSummary, PlanId, Purchase } from "@/lib/app/types";
import { FAIR_USE_CAP, PLAN_RANK, featuresFor } from "./plans";
import { incrementUsed, listPurchases, updatePurchase } from "@/lib/store/purchases";
import { ApiError } from "@/lib/app/errors";

/* ------------------------------------------------------------------
   What a signed-in user can do right now, derived from their purchases.
   Caps are enforced here and never returned to the client.
------------------------------------------------------------------- */

export function planForPurchase(p: Purchase): PlanId | null {
  if (p.product === "single" || p.product === "pass" || p.product === "landed") return p.product;
  if (p.product === "extra30") return "pass";
  return null;
}

function isLive(p: Purchase, now: number): boolean {
  if (p.status !== "active") return false;
  if (p.endsAt && new Date(p.endsAt).getTime() <= now) return false;
  if (new Date(p.startsAt).getTime() > now) return false;
  return true;
}

export async function resolveEntitlement(uid: string): Promise<{ summary: EntitlementSummary; purchase: Purchase | null; purchases: Purchase[] }> {
  const purchases = await listPurchases(uid);
  const now = Date.now();

  // Lazily expire finished periods so the account page stays truthful.
  for (const p of purchases) {
    if (p.status === "active" && p.endsAt && new Date(p.endsAt).getTime() <= now) {
      p.status = "expired";
      await updatePurchase(p.id, { status: "expired" });
    }
  }

  const live = purchases.filter((p) => isLive(p, now) && planForPurchase(p));
  live.sort((a, b) => {
    const r = PLAN_RANK[planForPurchase(b)!] - PLAN_RANK[planForPurchase(a)!];
    if (r !== 0) return r;
    return (b.endsAt ?? "") < (a.endsAt ?? "") ? -1 : 1;
  });

  const best = live[0] ?? null;
  const plan = best ? planForPurchase(best) : null;
  const features = featuresFor(plan);

  if (!best || !plan) {
    return { summary: { plan: null, canBuild: false, reason: "no_plan", features }, purchase: null, purchases };
  }

  const cap = FAIR_USE_CAP[plan];
  const remaining = cap - best.used;
  const daysLeft = best.endsAt ? Math.max(0, Math.ceil((new Date(best.endsAt).getTime() - now) / 86_400_000)) : undefined;

  let canBuild = remaining > 0;
  let reason: string | undefined;
  if (!canBuild) reason = plan === "single" ? "single_used" : "fair_use";

  // Single Shot exhausted: try the next best live purchase (e.g. a pass bought later).
  if (!canBuild && live.length > 1) {
    const alt = live.find((p) => p.used < FAIR_USE_CAP[planForPurchase(p)!]);
    if (alt) {
      const altPlan = planForPurchase(alt)!;
      return {
        summary: { plan: altPlan, purchaseId: alt.id, endsAt: alt.endsAt, daysLeft: alt.endsAt ? Math.max(0, Math.ceil((new Date(alt.endsAt).getTime() - now) / 86_400_000)) : undefined, canBuild: true, features: featuresFor(altPlan) },
        purchase: alt,
        purchases,
      };
    }
    canBuild = false;
  }

  return {
    summary: { plan, purchaseId: best.id, endsAt: best.endsAt, daysLeft, canBuild, reason, features },
    purchase: best,
    purchases,
  };
}

/** Throw a friendly error unless the user can build a package now. */
export async function requireBuildCapacity(uid: string): Promise<{ plan: PlanId; purchase: Purchase }> {
  const { summary, purchase } = await resolveEntitlement(uid);
  if (!summary.plan || !purchase) throw new ApiError(402, "no_plan", "Choose a package to build your application. The free scan does not include the rewrite.");
  if (!summary.canBuild) {
    if (summary.reason === "single_used") throw new ApiError(402, "single_used", "Your Single Shot has been used. Buy another, or get the 30-Day Pass for unlimited postings.");
    throw new ApiError(429, "fair_use", "This pass has reached its fair-use limit for the period (see the Terms). Email us if you need more capacity.");
  }
  return { plan: summary.plan, purchase };
}

/** Count a delivered package against the purchase it was built with. */
export async function consumePackage(purchase: Purchase): Promise<void> {
  await incrementUsed(purchase.id);
  const plan = planForPurchase(purchase);
  if (plan === "single") await updatePurchase(purchase.id, { status: "used" });
}
