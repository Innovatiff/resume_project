/* ------------------------------------------------------------------
   Server-side configuration. Reads env once; never import from client code.
------------------------------------------------------------------- */

const isProd = process.env.NODE_ENV === "production";

function flag(name: string): boolean {
  const v = process.env[name];
  return v === "1" || v === "true";
}

export const config = {
  isProd,
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-shortlist",
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ?? "",
    usingEmulator: Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST),
  },

  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    /** Mock mode runs the whole pipeline with deterministic local logic. Never allowed in production. */
    mock: !isProd && (flag("SHORTLIST_AI_MOCK") || !process.env.ANTHROPIC_API_KEY),
    models: {
      extract: process.env.SHORTLIST_MODEL_EXTRACT ?? "claude-haiku-4-5",
      rewrite: process.env.SHORTLIST_MODEL_REWRITE ?? "claude-sonnet-5",
      premium: process.env.SHORTLIST_MODEL_PREMIUM ?? "claude-opus-5",
    },
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    /** Grants purchases without payment. Ignored in production. */
    devCheckout: !isProd && flag("SHORTLIST_DEV_CHECKOUT"),
    /** Stripe Tax on Checkout sessions (HST). Off unless STRIPE_AUTOMATIC_TAX=1. */
    automaticTax: flag("STRIPE_AUTOMATIC_TAX"),
  },

  adzuna: {
    appId: process.env.ADZUNA_APP_ID ?? "",
    appKey: process.env.ADZUNA_APP_KEY ?? "",
  },

  email: {
    resendKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM ?? "Shortlist <hello@shortlist.ca>",
    founder: process.env.FOUNDER_EMAIL ?? "",
  },

  freeScan: {
    salt: process.env.FREE_SCAN_SALT ?? "shortlist-free-scan",
    windowDays: 7,
    resultTtlDays: 7,
  },

  limits: {
    maxUploadBytes: 5 * 1024 * 1024,
    minPostingChars: 80,
    maxPostingChars: 20000,
  },
} as const;

export function assertProductionConfig(): string[] {
  const missing: string[] = [];
  if (!isProd) return missing;
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) missing.push("FIREBASE_SERVICE_ACCOUNT");
  if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");
  return missing;
}
