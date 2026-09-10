import "server-only";
import { randomBytes } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import type { ExtensionKey, PublicExtensionKey } from "@/lib/app/types";
import { nowIso, sha256 } from "@/lib/app/hash";

/* ------------------------------------------------------------------
   Long-lived keys for the browser extension. Top-level collection keyed
   by the sha256 of the secret, so a lookup is one document read and the
   secret itself is never stored. Revoking deletes the document.
------------------------------------------------------------------- */

export const KEY_PREFIX = "ovx_";

const col = () => adminDb().collection("extensionKeys");

export function isExtensionKey(token: string): boolean {
  return token.startsWith(KEY_PREFIX) && token.length > KEY_PREFIX.length + 20;
}

export function publicKey(k: ExtensionKey): PublicExtensionKey {
  return { id: k.id, label: k.label, prefix: k.prefix, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt };
}

export async function createExtensionKey(uid: string, label: string): Promise<{ secret: string; key: ExtensionKey }> {
  const secret = KEY_PREFIX + randomBytes(32).toString("base64url");
  const key: ExtensionKey = {
    id: sha256(secret),
    uid,
    label: label.trim().slice(0, 80) || "Browser",
    prefix: secret.slice(0, KEY_PREFIX.length + 6),
    createdAt: nowIso(),
  };
  await col().doc(key.id).set(key);
  return { secret, key };
}

export async function findExtensionKey(secret: string): Promise<ExtensionKey | null> {
  const snap = await col().doc(sha256(secret)).get();
  return snap.exists ? (snap.data() as ExtensionKey) : null;
}

export async function touchExtensionKey(id: string): Promise<void> {
  await col().doc(id).set({ lastUsedAt: nowIso() }, { merge: true });
}

export async function listExtensionKeys(uid: string): Promise<ExtensionKey[]> {
  const snap = await col().where("uid", "==", uid).get();
  return snap.docs.map((d) => d.data() as ExtensionKey).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Only the owner can revoke. Returns false when the key is not theirs (or already gone). */
export async function revokeExtensionKey(uid: string, id: string): Promise<boolean> {
  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as ExtensionKey).uid !== uid) return false;
  await ref.delete();
  return true;
}

export async function deleteExtensionKeys(uid: string): Promise<void> {
  const snap = await col().where("uid", "==", uid).get();
  if (snap.empty) return;
  const batch = adminDb().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
