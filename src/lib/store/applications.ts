import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { Application } from "@/lib/app/types";
import { nowIso } from "@/lib/app/hash";

const col = (uid: string) => adminDb().collection("users").doc(uid).collection("applications");

export async function listApplications(uid: string, limit = 100): Promise<Application[]> {
  const snap = await col(uid).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => d.data() as Application);
}

export async function getApplication(uid: string, id: string): Promise<Application | null> {
  const snap = await col(uid).doc(id).get();
  return snap.exists ? (snap.data() as Application) : null;
}

export async function saveApplication(app: Application): Promise<void> {
  await col(app.uid).doc(app.id).set(app);
}

export async function updateApplication(uid: string, id: string, patch: Partial<Application>): Promise<void> {
  await col(uid).doc(id).set({ ...patch, updatedAt: nowIso() }, { merge: true });
}

export async function deleteApplication(uid: string, id: string): Promise<void> {
  await col(uid).doc(id).delete();
}

export async function countApplications(uid: string): Promise<number> {
  const snap = await col(uid).count().get();
  return snap.data().count;
}
