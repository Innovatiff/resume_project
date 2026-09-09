import { ok, withHandler, ApiError } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { readJson } from "@/lib/app/request";
import { resolveEntitlement } from "@/lib/billing/entitlements";
import { updateUser } from "@/lib/store/users";
import type { Language, MeResponse } from "@/lib/app/types";
import { checkoutCurrencyFor, DEFAULT_COUNTRY, isCountryCode } from "@/lib/app/markets";

export const runtime = "nodejs";

export const GET = withHandler(async (req) => {
  const { uid, doc } = await requireUser(req);
  const { summary, purchases } = await resolveEntitlement(uid);
  const me: MeResponse = {
    user: { uid: doc.uid, email: doc.email, displayName: doc.displayName, language: doc.language ?? "en", country: doc.country ?? DEFAULT_COUNTRY, currency: checkoutCurrencyFor(doc.country), city: doc.city, province: doc.province, createdAt: doc.createdAt },
    hasProfile: Boolean(doc.profile),
    profile: doc.profile,
    profileSource: doc.profileSource,
    entitlement: summary,
    purchases,
  };
  return ok({ me });
});

const LANGS: Language[] = ["en", "fr", "es"];

export const PATCH = withHandler(async (req) => {
  const { uid } = await requireUser(req);
  const body = await readJson<{ language?: string; country?: string; city?: string; province?: string; displayName?: string }>(req);
  const patch: Record<string, string> = {};
  if (body.country !== undefined) {
    if (!isCountryCode(body.country)) throw new ApiError(400, "bad_country", "Unknown country.");
    patch.country = body.country;
  }
  if (body.language !== undefined) {
    if (!LANGS.includes(body.language as Language)) throw new ApiError(400, "bad_language", "Language must be en, fr or es.");
    patch.language = body.language;
  }
  for (const k of ["city", "province", "displayName"] as const) {
    if (body[k] !== undefined) patch[k] = String(body[k]).trim().slice(0, 80);
  }
  await updateUser(uid, patch);
  return ok({});
});
