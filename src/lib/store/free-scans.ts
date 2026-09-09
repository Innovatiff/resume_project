import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { FreeScanResult } from "@/lib/app/types";
import { config } from "@/lib/app/config";
import { sha256 } from "@/lib/app/hash";

export function emailHash(email: string): string {
  return sha256(`${config.freeScan.salt}:${email.trim().toLowerCase()}`);
}

interface FreeScanLedger {
  emailHash: string;
  lastScanAt: string;
  count: number;
}

export async function freeScanAllowedAt(email: string): Promise<{ allowed: boolean; nextAt?: string }> {
  const hash = emailHash(email);
  const snap = await adminDb().collection("freeScans").doc(hash).get();
  if (!snap.exists) return { allowed: true };
  const ledger = snap.data() as FreeScanLedger;
  const next = new Date(ledger.lastScanAt);
  next.setUTCDate(next.getUTCDate() + config.freeScan.windowDays);
  if (next.getTime() <= Date.now()) return { allowed: true };
  return { allowed: false, nextAt: next.toISOString() };
}

export async function recordFreeScan(email: string): Promise<void> {
  const hash = emailHash(email);
  const ref = adminDb().collection("freeScans").doc(hash);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? ((snap.data() as FreeScanLedger).count ?? 0) + 1 : 1;
    tx.set(ref, { emailHash: hash, lastScanAt: new Date().toISOString(), count } satisfies FreeScanLedger);
  });
}

export async function saveFreeScanResult(result: FreeScanResult): Promise<void> {
  await adminDb().collection("freeScanResults").doc(result.id).set(result);
}

export async function getFreeScanResult(id: string): Promise<FreeScanResult | null> {
  const snap = await adminDb().collection("freeScanResults").doc(id).get();
  if (!snap.exists) return null;
  const r = snap.data() as FreeScanResult;
  return new Date(r.expiresAt).getTime() > Date.now() ? r : null;
}
