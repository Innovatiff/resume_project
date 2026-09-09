"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

/* ------------------------------------------------------------------
   Firebase web SDK: authentication only. Firestore is server-side.
------------------------------------------------------------------- */

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export const usingEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "1";

export function firebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || usingEmulator;
}

export function firebaseAuth(): Auth {
  if (auth) return auth;
  if (!getApps().length) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? (usingEmulator ? "demo-api-key" : ""),
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? undefined,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-shortlist",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? undefined,
    });
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  if (usingEmulator && typeof window !== "undefined") {
    const host = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ?? "http://localhost:9099";
    connectAuthEmulator(auth, host, { disableWarnings: true });
  }
  return auth;
}

export const googleProvider = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
};
