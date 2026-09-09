"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseAuth, firebaseConfigured, googleProvider } from "@/lib/firebase/client";

/* ------------------------------------------------------------------
   Client auth state + a fetch helper that attaches the Firebase ID token.
------------------------------------------------------------------- */

interface AuthValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = firebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(firebaseAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
  }, [configured]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      configured,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(firebaseAuth(), email, password);
      },
      signUp: async (email, password, displayName) => {
        const cred = await createUserWithEmailAndPassword(firebaseAuth(), email, password);
        if (displayName) await updateProfile(cred.user, { displayName });
      },
      signInWithGoogle: async () => {
        await signInWithPopup(firebaseAuth(), googleProvider());
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(firebaseAuth(), email);
      },
      signOut: async () => {
        await fbSignOut(firebaseAuth());
      },
    }),
    [user, loading, configured],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

export async function getIdToken(): Promise<string | null> {
  if (!firebaseConfigured()) return null;
  const u = firebaseAuth().currentUser;
  return u ? u.getIdToken() : null;
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** JSON API call with the ID token attached. Throws ApiClientError on non-2xx. */
export async function apiFetch<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(path, { ...init, headers });
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    if (!res.ok) throw new ApiClientError(res.status, "http_error", `Request failed (${res.status}).`);
    return {} as T;
  }
  const data = (await res.json()) as { ok: boolean; error?: string; message?: string } & T;
  if (!res.ok || data.ok === false) throw new ApiClientError(res.status, data.error ?? "error", data.message ?? "Something went wrong.");
  return data;
}

/** Fetch a generated file with the ID token and hand it to the browser as a download. */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const token = await getIdToken();
  const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiClientError(res.status, "download_failed", data.message ?? "Could not generate the file.");
  }
  const disposition = res.headers.get("content-disposition") ?? "";
  const name = disposition.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Full page load to a same-origin path. Used after sign-out / account deletion so no client state survives. */
export function hardNavigate(path: string): void {
  window.location.assign(path);
}

export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password do not match.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/email-already-in-use":
      return "There is already an account with that email. Sign in instead.";
    case "auth/weak-password":
      return "Use a password with at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google window was closed before finishing.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    default:
      return (err as Error)?.message?.replace(/^Firebase: /, "").replace(/ \(auth\/.*\)\.?$/, "") || "Something went wrong. Try again.";
  }
}
