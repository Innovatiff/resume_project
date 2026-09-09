"use client";

import { getAnalytics, isSupported, logEvent, setUserProperties, type Analytics } from "firebase/analytics";
import { firebaseApp, firebaseWebConfig, usingEmulator } from "./client";
import { readHeadlineVariant } from "@/lib/headline";

/* ------------------------------------------------------------------
   Google Analytics through Firebase. Production builds only, never
   against the emulators, and only when a measurement id is set.
   The headline A/B variant is attached as a user property so the two
   headlines can be compared in the Analytics console.
------------------------------------------------------------------- */

export const analyticsEnabled = process.env.NODE_ENV === "production" && !usingEmulator && Boolean(firebaseWebConfig.measurementId);

let pending: Promise<Analytics | null> | null = null;

export function analytics(): Promise<Analytics | null> {
  if (!analyticsEnabled || typeof window === "undefined") return Promise.resolve(null);
  if (!pending) {
    pending = isSupported()
      .then((ok) => {
        if (!ok) return null;
        const a = getAnalytics(firebaseApp());
        setUserProperties(a, { headline_variant: readHeadlineVariant() });
        return a;
      })
      .catch(() => null);
  }
  return pending;
}

/** Client-side navigations. The first page view is sent automatically by the SDK. */
export function trackPageView(path: string): void {
  void analytics().then((a) => {
    if (a) logEvent(a, "page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
  });
}

export function track(event: string, params?: Record<string, string | number | boolean>): void {
  void analytics().then((a) => {
    if (a) logEvent(a, event, params);
  });
}
