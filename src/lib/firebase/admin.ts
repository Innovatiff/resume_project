import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { config } from "@/lib/app/config";

/* ------------------------------------------------------------------
   Firebase Admin. All Firestore access happens server-side through
   this module; clients never talk to Firestore directly.
   - Production: FIREBASE_SERVICE_ACCOUNT (JSON or base64 JSON) or ADC.
   - Local: the Auth + Firestore emulators via FIREBASE_AUTH_EMULATOR_HOST
     and FIRESTORE_EMULATOR_HOST; no credentials needed.
------------------------------------------------------------------- */

let app: App | null = null;
let db: Firestore | null = null;

function parseServiceAccount(raw: string): Record<string, string> {
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(text) as Record<string, string>;
}

export function adminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0];
    return app;
  }
  const projectId = config.firebase.projectId;
  if (config.firebase.usingEmulator) {
    app = initializeApp({ projectId });
  } else if (config.firebase.serviceAccount) {
    app = initializeApp({ credential: cert(parseServiceAccount(config.firebase.serviceAccount)), projectId });
  } else {
    app = initializeApp({ credential: applicationDefault(), projectId });
  }
  return app;
}

export function adminAuth() {
  return getAuth(adminApp());
}

export function adminDb(): Firestore {
  if (db) return db;
  db = getFirestore(adminApp());
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}
