"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

/* ------------------------------------------------------------------
   Firebase web SDK: authentication (and analytics) only. Firestore is
   server-side through the Admin SDK.

   The web config below identifies the Shortlist Firebase project. These
   values are meant to ship to browsers: access is controlled by Firebase
   Auth and the Firestore rules, not by keeping them secret. Set the
   NEXT_PUBLIC_FIREBASE_* variables to point at another project (staging)
   or at the emulators.
------------------------------------------------------------------- */

export const usingEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "1";

export const firebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBN3Jk7aZA3_6uBpOUsPdStexi1iwqXdcQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "resume-project-56b09.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "resume-project-56b09",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "resume-project-56b09.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "342152589301",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:342152589301:web:8e02ee565fa477f8533abc",
  /** Leave empty (NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=) to turn Google Analytics off. */
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-W7E0F1J0ZP",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function firebaseConfigured(): boolean {
  return Boolean(firebaseWebConfig.apiKey) || usingEmulator;
}

export function firebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length ? getApps()[0] : initializeApp(usingEmulator ? { ...firebaseWebConfig, apiKey: firebaseWebConfig.apiKey || "demo-api-key" } : firebaseWebConfig);
  return app;
}

export function firebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(firebaseApp());
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
