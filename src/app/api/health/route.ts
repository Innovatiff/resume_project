import { ok, withHandler } from "@/lib/app/errors";
import { config } from "@/lib/app/config";
import { billingMode } from "@/lib/billing/stripe";
import { aiMode } from "@/lib/ai/tasks";

export const runtime = "nodejs";

/** Non-secret status for operators: which integrations are live. */
export const GET = withHandler(async () => {
  return ok({
    ai: aiMode(),
    billing: billingMode(),
    firebase: config.firebase.usingEmulator ? "emulator" : "cloud",
    salary: config.adzuna.appId ? "adzuna" : "sample",
    email: config.email.resendKey ? "resend" : "off",
  });
});
