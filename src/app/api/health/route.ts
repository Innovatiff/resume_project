import { explainInfraError, ok, withHandler } from "@/lib/app/errors";
import { assertProductionConfig, config, productionWarnings } from "@/lib/app/config";
import { billingMode } from "@/lib/billing/stripe";
import { aiMode } from "@/lib/ai/tasks";
import { adminAuth, adminDb, credentialSource } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** Says what went wrong without leaking anything: our own explanation, else the error's code. */
function describe(err: unknown): string {
  const known = explainInfraError(err);
  if (known) return `${known.code}: ${known.message}`;
  const e = err as { code?: unknown; name?: unknown; message?: unknown };
  if (typeof e?.code === "string") return `error ${e.code}`;
  if (typeof e?.message === "string" && e.message.length < 120) return e.message;
  return typeof e?.name === "string" ? e.name : "error";
}

/**
 * Non-secret status for operators: which integrations are live and which
 * variables are missing. Add ?check=1 to exercise Firestore and Firebase
 * Auth with the server's credentials and get the actual failure explained.
 */
export const GET = withHandler(async (req) => {
  const status = {
    ai: aiMode(),
    billing: billingMode(),
    firebase: credentialSource(),
    salary: config.adzuna.appId ? "adzuna" : "sample",
    email: config.email.resendKey ? "resend" : "off",
    missing: assertProductionConfig(),
    warnings: productionWarnings(),
  };
  if (!new URL(req.url).searchParams.get("check")) return ok(status);

  const checks: Record<string, string> = {};
  try {
    await adminDb().collection("meta").doc("health").get();
    checks.firestore = "ok";
  } catch (err) {
    checks.firestore = describe(err);
  }
  try {
    await adminAuth().getUserByEmail("health-check@example.invalid");
    checks.auth = "ok";
  } catch (err) {
    checks.auth = (err as { code?: string })?.code === "auth/user-not-found" ? "ok" : describe(err);
  }
  return ok({ ...status, checks });
});
