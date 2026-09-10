import "server-only";
import { adminAuth } from "@/lib/firebase/admin";
import { ApiError } from "./errors";
import { ensureUser, getUser } from "@/lib/store/users";
import { findExtensionKey, isExtensionKey, touchExtensionKey } from "@/lib/store/extension-keys";
import { resolveEntitlement } from "@/lib/billing/entitlements";
import { countryFromLocale } from "./markets";
import type { EntitlementSummary, ExtensionKey, UserDoc } from "./types";

export interface AuthedUser {
  uid: string;
  email: string;
  doc: UserDoc;
}

/** Verify the Firebase ID token in the Authorization header and load (or create) the user document. */
export async function requireUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new ApiError(401, "unauthenticated", "Sign in to continue.");
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch {
    throw new ApiError(401, "invalid_token", "Your session has expired. Sign in again.");
  }
  const email = decoded.email ?? "";
  if (!email) throw new ApiError(401, "no_email", "An email address is required on the account.");
  // First sign-in: the browser's locale region is the initial guess at the home market; the profile page can change it.
  const doc = await ensureUser({ uid: decoded.uid, email, displayName: decoded.name as string | undefined, country: countryFromLocale(req.headers.get("accept-language")) });
  return { uid: decoded.uid, email, doc };
}

export interface ExtensionAuthedUser extends AuthedUser {
  via: "token" | "key";
  key?: ExtensionKey;
}

const TOUCH_INTERVAL_MS = 10 * 60_000;

/**
 * The extension authenticates with a long-lived key (ovx_…) issued from the
 * account page; the web app keeps using Firebase ID tokens. Either works here.
 */
export async function requireExtensionUser(req: Request): Promise<ExtensionAuthedUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!isExtensionKey(token)) {
    const user = await requireUser(req);
    return { ...user, via: "token" };
  }
  const key = await findExtensionKey(token);
  const doc = key ? await getUser(key.uid) : null;
  if (!key || !doc) throw new ApiError(401, "invalid_key", "This browser is no longer connected to Orvenic. Connect it again from the Extension page in your account.");
  if (!key.lastUsedAt || Date.now() - Date.parse(key.lastUsedAt) > TOUCH_INTERVAL_MS) await touchExtensionKey(key.id).catch(() => undefined);
  return { uid: doc.uid, email: doc.email, doc, via: "key", key };
}

/** The extension comes with the passes. Anything it does beyond identifying the account needs one. */
export async function requireExtensionAccess(uid: string): Promise<EntitlementSummary> {
  const { summary } = await resolveEntitlement(uid);
  if (!summary.features.extension) throw new ApiError(402, "no_extension", "The browser extension comes with the 30-Day Pass and Landed.");
  return summary;
}
