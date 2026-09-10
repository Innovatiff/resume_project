import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: code, message }, { status });
}

/**
 * Turn the infrastructure failures a fresh deployment runs into (no Firebase
 * credentials, no Firestore database, wrong project) into a 503 that says what
 * to fix. Messages carry no secrets. Returns null for anything else.
 */
export function explainInfraError(err: unknown): { status: number; code: string; message: string } | null {
  const e = err as { message?: unknown; code?: unknown; details?: unknown } | null;
  const text = [e?.message, e?.code, e?.details].filter((v) => typeof v === "string" || typeof v === "number").join(" | ");
  if (!text) return null;
  if (/could not load the default credentials|unable to detect a project id|failed to determine project id|metadata\.google\.internal|invalid_grant|invalid jwt|error:1e08010c|decoder routines|unauthenticated|16 UNAUTHENTICATED|request had invalid authentication/i.test(text)) {
    return { status: 503, code: "firebase_credentials", message: "The server cannot sign in to Firebase. Set FIREBASE_SERVICE_ACCOUNT to the service-account JSON from the Firebase console (Project settings → Service accounts → Generate new private key), or host on Google Cloud where default credentials exist." };
  }
  if (/does not exist for project|database .*not found|5 NOT_FOUND.*database|NOT_FOUND: The database|firestore.*not (?:been )?(?:created|enabled)|Cloud Firestore API has not been used/i.test(text)) {
    return { status: 503, code: "firestore_missing", message: "Firestore is not set up for this Firebase project yet. In the Firebase console open Build → Firestore Database → Create database (Native mode), then deploy firestore.rules." };
  }
  if (/PERMISSION_DENIED|7 PERMISSION_DENIED|insufficient permissions|caller does not have permission/i.test(text)) {
    return { status: 503, code: "firebase_permission", message: "The server's Firebase credentials cannot access this project's data. Check that the service account belongs to this project and has the Firebase Admin or Cloud Datastore User role." };
  }
  if (/DEADLINE_EXCEEDED|4 DEADLINE_EXCEEDED|ETIMEDOUT|ECONNRESET|socket hang up|fetch failed/i.test(text)) {
    return { status: 503, code: "upstream_timeout", message: "A backend service did not answer in time. Try again in a moment." };
  }
  return null;
}

/** Wrap a route handler so thrown ApiErrors become JSON and anything else becomes a clean, explained error. */
export function withHandler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return apiError(err.status, err.code, err.message);
      console.error(`[api] ${req.method} ${new URL(req.url).pathname}`, err);
      const known = explainInfraError(err);
      if (known) return apiError(known.status, known.code, known.message);
      return apiError(500, "internal", "Something went wrong on our side. Try again in a moment.");
    }
  };
}

export function ok<T extends object>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}
