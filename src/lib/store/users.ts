import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { CandidateProfile, ProfileSource, UserDoc } from "@/lib/app/types";
import { nowIso } from "@/lib/app/hash";
import type { CountryCode } from "@/lib/app/markets";
import { deleteExtensionKeys } from "./extension-keys";

const users = () => adminDb().collection("users");

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await users().doc(uid).get();
  return snap.exists ? (snap.data() as UserDoc) : null;
}

export async function ensureUser(input: { uid: string; email: string; displayName?: string; country?: CountryCode }): Promise<UserDoc> {
  const ref = users().doc(input.uid);
  const snap = await ref.get();
  if (snap.exists) {
    const doc = snap.data() as UserDoc;
    if (doc.email !== input.email) {
      await ref.update({ email: input.email, updatedAt: nowIso() });
      doc.email = input.email;
    }
    return doc;
  }
  const now = nowIso();
  const doc: UserDoc = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    language: "en",
    country: input.country,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(doc);
  return doc;
}

export async function updateUser(uid: string, patch: Partial<Pick<UserDoc, "language" | "country" | "city" | "province" | "displayName" | "stripeCustomerId">>): Promise<void> {
  await users().doc(uid).set({ ...patch, updatedAt: nowIso() }, { merge: true });
}

export async function setProfile(uid: string, profile: CandidateProfile, source: ProfileSource): Promise<void> {
  await users().doc(uid).set({ profile, profileSource: source, updatedAt: nowIso() }, { merge: true });
}

/** PIPEDA one-click delete: every document under the user, then the user itself. */
export async function deleteUserData(uid: string): Promise<void> {
  const db = adminDb();
  const ref = users().doc(uid);
  await db.recursiveDelete(ref);
  await deleteExtensionKeys(uid);
  const purchases = await db.collection("purchases").where("uid", "==", uid).get();
  const batch = db.batch();
  purchases.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
