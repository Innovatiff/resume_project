import type { AddonId, PlanFeatures, PlanId, ProductId } from "@/lib/app/types";
import type { CheckoutCurrency } from "@/lib/app/markets";

/* ------------------------------------------------------------------
   Product catalogue. Prices in cents per checkout currency: CAD for
   Canada, USD everywhere else. Fair-use caps live here and in the
   terms; they are enforced server-side and never rendered.
------------------------------------------------------------------- */

export interface Product {
  id: ProductId;
  name: string;
  description: string;
  /** Access period in days for time-based products. */
  periodDays?: number;
  kind: "plan" | "addon";
}

export const PRODUCTS: Record<ProductId, Product> = {
  single: { id: "single", name: "Single Shot", description: "One posting, the complete package.", kind: "plan" },
  pass: { id: "pass", name: "30-Day Pass", description: "Everything, unlimited for 30 days.", periodDays: 30, kind: "plan" },
  landed: { id: "landed", name: "Landed", description: "90 days, with a human in the loop.", periodDays: 90, kind: "plan" },
  extra30: { id: "extra30", name: "Extra 30 days", description: "Another 30 days of the pass.", periodDays: 30, kind: "addon" },
  coaching: { id: "coaching", name: "Coaching session (45 min)", description: "One additional live session.", kind: "addon" },
  rush_review: { id: "rush_review", name: "Rush human review", description: "A human reviews one resume before you send it.", kind: "addon" },
  linkedin: { id: "linkedin", name: "LinkedIn profile rewrite", description: "Headline and About, standalone.", kind: "addon" },
};

export const PRICES: Record<CheckoutCurrency, Record<ProductId, number>> = {
  cad: { single: 2900, pass: 9900, landed: 29900, extra30: 7900, coaching: 9500, rush_review: 4900, linkedin: 3900 },
  usd: { single: 2900, pass: 9900, landed: 29900, extra30: 7900, coaching: 9500, rush_review: 4900, linkedin: 3900 },
};

export function priceFor(product: ProductId, currency: CheckoutCurrency): number {
  return PRICES[currency][product];
}

export const PLAN_IDS: PlanId[] = ["single", "pass", "landed"];
export const ADDON_IDS: AddonId[] = ["extra30", "coaching", "rush_review", "linkedin"];

export function isPlan(id: string): id is PlanId {
  return (PLAN_IDS as string[]).includes(id);
}

export function isProduct(id: string): id is ProductId {
  return id in PRODUCTS;
}

/** Server-only. Packages per purchase before fair use kicks in. */
export const FAIR_USE_CAP: Record<PlanId, number> = {
  single: 1,
  pass: 50,
  landed: 150,
};

export const PLAN_RANK: Record<PlanId, number> = { single: 1, pass: 2, landed: 3 };

export function featuresFor(plan: PlanId | null): PlanFeatures {
  if (!plan) {
    return { rewrite: false, metricInterview: false, objections: false, linkedin: false, humanReview: false, coaching: false, priority: false, tracker: false };
  }
  const passPlus = plan === "pass" || plan === "landed";
  return {
    rewrite: true,
    metricInterview: passPlus,
    objections: passPlus,
    linkedin: passPlus,
    tracker: passPlus,
    humanReview: plan === "landed",
    coaching: plan === "landed",
    priority: plan === "landed",
  };
}
