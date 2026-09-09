import "server-only";
import { adminAuth } from "@/lib/firebase/admin";
import { ApiError } from "./errors";
import { ensureUser } from "@/lib/store/users";
import type { UserDoc } from "./types";

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
  const doc = await ensureUser({ uid: decoded.uid, email, displayName: decoded.name as string | undefined });
  return { uid: decoded.uid, email, doc };
}
