import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Purchase } from "@/lib/app/types";

/* Top-level collection keyed by purchase id; queried by uid or Stripe ids (single-field indexes only). */
const col = () => adminDb().collection("purchases");

export async function listPurchases(uid: string): Promise<Purchase[]> {
  const snap = await col().where("uid", "==", uid).get();
  return snap.docs.map((d) => d.data() as Purchase).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getPurchase(id: string): Promise<Purchase | null> {
  const snap = await col().doc(id).get();
  return snap.exists ? (snap.data() as Purchase) : null;
}

export async function findPurchaseBySession(sessionId: string): Promise<Purchase | null> {
  const snap = await col().where("stripeSessionId", "==", sessionId).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as Purchase);
}

export async function findPurchaseByPaymentIntent(pi: string): Promise<Purchase | null> {
  const snap = await col().where("stripePaymentIntentId", "==", pi).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as Purchase);
}

export async function addPurchase(p: Purchase): Promise<void> {
  await col().doc(p.id).set(p);
}

export async function updatePurchase(id: string, patch: Partial<Purchase>): Promise<void> {
  await col().doc(id).set(patch, { merge: true });
}

export async function incrementUsed(id: string): Promise<void> {
  await col().doc(id).update({ used: FieldValue.increment(1) });
}

/** Idempotency ledger for Stripe events. Returns true when the event is new. */
export async function claimWebhookEvent(eventId: string): Promise<boolean> {
  const ref = adminDb().collection("webhookEvents").doc(eventId);
  try {
    await ref.create({ processedAt: new Date().toISOString() });
    return true;
  } catch {
    return false;
  }
}
