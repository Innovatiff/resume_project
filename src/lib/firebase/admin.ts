import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { config } from "@/lib/app/config";
import { ApiError } from "@/lib/app/errors";

/* ------------------------------------------------------------------
   Firebase Admin. All Firestore access happens server-side through
   this module; clients never talk to Firestore directly.
   - Production: FIREBASE_SERVICE_ACCOUNT (JSON or base64 JSON), or the
     default credentials of Google Cloud hosting (App Hosting, Cloud Run).
   - Local: the Auth + Firestore emulators via FIREBASE_AUTH_EMULATOR_HOST
     and FIRESTORE_EMULATOR_HOST; no credentials needed.
------------------------------------------------------------------- */

let app: App | null = null;
let db: Firestore | null = null;

export type CredentialSource = "emulator" | "service-account" | "adc" | "unconfigured";

/** Where the Admin SDK will get its credentials from. Reported by /api/health. */
export function credentialSource(): CredentialSource {
  if (config.firebase.usingEmulator) return "emulator";
  if (config.firebase.serviceAccount) return "service-account";
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE || process.env.GAE_SERVICE || process.env.FUNCTION_TARGET) return "adc";
  return "unconfigured";
}

/** A private key pasted with real line breaks inside the JSON string is the usual copy-paste accident. */
function repairPrivateKey(json: string): string {
  return json.replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, (block) => block.replace(/\r?\n/g, "\\n"));
}

function parseServiceAccount(raw: string): Record<string, string> {
  const text = raw.trim().replace(/^['"]|['"]$/g, "");
  const decoded = text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8");
  for (const candidate of [decoded, repairPrivateKey(decoded)]) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, string>;
      if (parsed.client_email && parsed.private_key && parsed.project_id) return parsed;
    } catch {
      // try the next form
    }
  }
  throw new ApiError(503, "firebase_credentials", "FIREBASE_SERVICE_ACCOUNT is set but is not the service-account JSON (or its base64). Paste the whole key file from the Firebase console: Project settings → Service accounts → Generate new private key.");
}

export function adminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0];
    return app;
  }
  const projectId = config.firebase.projectId;
  switch (credentialSource()) {
    case "emulator":
      app = initializeApp({ projectId });
      break;
    case "service-account": {
      const sa = parseServiceAccount(config.firebase.serviceAccount);
      app = initializeApp({ credential: cert(sa), projectId: sa.project_id || projectId });
      break;
    }
    case "adc":
      app = initializeApp({ credential: applicationDefault(), projectId });
      break;
    default:
      throw new ApiError(
        503,
        "firebase_credentials",
        config.isProd
          ? "The server has no Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT in the hosting environment to the service-account JSON from the Firebase console (Project settings → Service accounts → Generate new private key)."
          : "No Firebase credentials. Run the emulators (npm run emulators with .env.local.example) or set FIREBASE_SERVICE_ACCOUNT in .env.local.",
      );
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
