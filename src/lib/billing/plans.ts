import type { AddonId, PlanFeatures, PlanId, ProductId } from "@/lib/app/types";

/* ------------------------------------------------------------------
   Product catalogue. Prices in CAD cents. Fair-use caps live here and
   in the terms; they are enforced server-side and never rendered.
------------------------------------------------------------------- */

export interface Product {
  id: ProductId;
  name: string;
  amountCents: number;
  description: string;
  /** Access period in days for time-based products. */
  periodDays?: number;
  kind: "plan" | "addon";
}

export const PRODUCTS: Record<ProductId, Product> = {
  single: { id: "single", name: "Single Shot", amountCents: 2900, description: "One posting, the complete package.", kind: "plan" },
  pass: { id: "pass", name: "30-Day Pass", amountCents: 9900, description: "Everything, unlimited for 30 days.", periodDays: 30, kind: "plan" },
  landed: { id: "landed", name: "Landed", amountCents: 29900, description: "90 days, with a human in the loop.", periodDays: 90, kind: "plan" },
  extra30: { id: "extra30", name: "Extra 30 days", amountCents: 7900, description: "Another 30 days of the pass.", periodDays: 30, kind: "addon" },
  coaching: { id: "coaching", name: "Coaching session (45 min)", amountCents: 9500, description: "One additional live session.", kind: "addon" },
  rush_review: { id: "rush_review", name: "Rush human review", amountCents: 4900, description: "A human reviews one resume before you send it.", kind: "addon" },
  linkedin: { id: "linkedin", name: "LinkedIn profile rewrite", amountCents: 3900, description: "Headline and About, standalone.", kind: "addon" },
};

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

export function formatCad(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 0 })}`;
}
