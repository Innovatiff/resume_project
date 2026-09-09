"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MeResponse } from "./types";
import { apiFetch, useAuth } from "./auth-client";
import { type CheckoutCurrency, checkoutCurrencyFor, countryFromLocale } from "./markets";

interface MeValue {
  me: MeResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MeCtx = createContext<MeValue | null>(null);

export function MeProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ me: MeResponse }>("/api/me");
      setMe(data.me);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void Promise.resolve().then(refresh);
  }, [authLoading, refresh]);

  const value = useMemo(() => ({ me, loading: authLoading || loading, error, refresh }), [me, authLoading, loading, error, refresh]);
  return <MeCtx.Provider value={value}>{children}</MeCtx.Provider>;
}

export function useMe(): MeValue {
  const v = useContext(MeCtx);
  if (!v) throw new Error("useMe must be used inside MeProvider");
  return v;
}

/** Checkout currency for the visitor: the account's market when signed in, else the browser's locale. Works outside MeProvider. */
export function useCheckoutCurrency(): CheckoutCurrency {
  const { user, loading } = useAuth();
  const [currency, setCurrency] = useState<CheckoutCurrency>("cad");
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const apply = (c: CheckoutCurrency) => {
      if (!cancelled) setCurrency(c);
    };
    if (user) {
      apiFetch<{ me: MeResponse }>("/api/me")
        .then((d) => apply(d.me.user.currency))
        .catch(() => apply(checkoutCurrencyFor(countryFromLocale(navigator.language))));
    } else {
      void Promise.resolve().then(() => apply(checkoutCurrencyFor(countryFromLocale(navigator.language))));
    }
    return () => {
      cancelled = true;
    };
  }, [user, loading]);
  return currency;
}
