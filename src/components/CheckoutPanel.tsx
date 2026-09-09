"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiClientError, hardNavigate, useAuth } from "@/lib/app/auth-client";
import { PRODUCTS, isProduct, priceFor } from "@/lib/billing/plans";
import { formatCents } from "@/lib/app/markets";
import { useCheckoutCurrency } from "@/lib/app/use-me";
import type { Purchase } from "@/lib/app/types";
import { Card, Notice, Spinner } from "@/components/app/ui";
import { IconCheck } from "@/components/icons";

const INCLUDES: Record<string, string[]> = {
  single: ["Tailored resume (.docx and PDF) and cover letter", "Match score and verdict", "Honest pay report for that title and city", "Red flag check on the posting", "Interview prep for that role", "Plan B: three better-matched roles nearby", "One free revision within 48 hours"],
  pass: ["Everything in Single Shot, unlimited for 30 days", "One-click apply browser extension", "Application tracker", "The metric interview", "Recruiter objection report", "LinkedIn headline and About rewrite", "No subscription, no auto-renew, no card retained"],
  landed: ["90 days of everything in the pass", "Human review of every resume before it is sent", "Two live 45-minute coaching sessions", "Priority delivery in under 2 minutes", "Direct email access, same-day response"],
  extra30: ["Another 30 days of the pass, queued after your current period"],
  coaching: ["One additional live 45-minute session"],
  rush_review: ["A human reviews one resume before you send it, same day"],
  linkedin: ["Headline and About section, rewritten from your real profile"],
};

export function CheckoutPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const raw = params.get("plan") ?? "pass";
  const productId = isProduct(raw) ? raw : "pass";
  const product = PRODUCTS[productId];
  const currency = useCheckoutCurrency();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ billing: string }>("/api/health")
      .then((h) => setMode(h.billing))
      .catch(() => setMode(null));
  }, []);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const d = await apiFetch<{ url: string; mode: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ product: productId }) });
      hardNavigate(d.url);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not start checkout.");
      setBusy(false);
    }
  };

  const here = `/checkout?plan=${productId}`;

  return (
    <div className="wrap" style={{ maxWidth: 980 }}>
      <div className="app-grid app-grid--main">
        <Card title={product.name} hint={product.description}>
          <div className="app-stat">
            {formatCents(priceFor(productId, currency), currency)} <span style={{ fontSize: "0.9rem", fontWeight: 400, letterSpacing: 0, color: "var(--muted)" }}>{currency.toUpperCase()}, one-time{product.periodDays ? ` · ${product.periodDays} days` : ""}</span>
          </div>
          <ul style={{ display: "grid", gap: 8 }}>
            {INCLUDES[productId].map((i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: "0.95rem", color: "var(--ink-2)" }}>
                <IconCheck style={{ width: 18, height: 18, flex: "none", color: "var(--purple)" }} />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <p className="app-muted">Taxes are calculated at checkout. 85 or it&apos;s free: if the tailored resume scores below 85, one email gets a full refund and you keep the resume.</p>
          <p className="app-muted">
            Want a different package? <Link href="/pricing">Compare all of them</Link>.
          </p>
        </Card>

        <Card title="Pay once" hint="No subscription. No card kept on file.">
          {error ? <Notice kind="error">{error}</Notice> : null}
          {loading ? (
            <Spinner />
          ) : user ? (
            <>
              <p className="app-muted">
                Buying as <b>{user.email}</b>. Your documents and purchases live in this account.
              </p>
              {mode === "dev" ? <Notice kind="info">Development checkout: the purchase is granted without payment.</Notice> : null}
              {mode === "off" ? <Notice kind="warn">Payments are not configured yet. Email us and we will set you up by hand.</Notice> : null}
              <button type="button" className="btn btn--coral btn--lg btn--block" disabled={busy || mode === "off"} onClick={() => void pay()}>
                {busy ? "Opening checkout…" : mode === "stripe" ? "Continue to secure payment" : `Get ${product.name}`}
              </button>
              <p className="app-muted" style={{ fontSize: "0.8rem" }}>
                {mode === "stripe" ? "Payment is handled by Stripe. We never see your card number." : ""}
              </p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => router.push("/app")}>
                Back to the app
              </button>
            </>
          ) : (
            <>
              <p className="app-muted">Paid packages need an account so your documents have somewhere to live. It takes a minute, and there is no card until you buy.</p>
              <Link className="btn btn--ink btn--lg btn--block" href={`/sign-up?next=${encodeURIComponent(here)}`}>
                Create an account
              </Link>
              <Link className="btn btn--ghost btn--block" href={`/sign-in?next=${encodeURIComponent(here)}`}>
                I already have one
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export function CheckoutSuccess() {
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [state, setState] = useState<"checking" | "ok" | "pending" | "error">("checking");
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const sessionId = params.get("session_id");
    const purchaseId = params.get("purchase");
    const q = purchaseId ? `purchase=${purchaseId}` : sessionId ? `session_id=${sessionId}` : "";
    let tries = 0;
    const check = async () => {
      await Promise.resolve();
      if (!user) {
        setState("error");
        setMessage("Sign in to see your purchase.");
        return;
      }
      if (!q) {
        setState("error");
        setMessage("Missing checkout reference.");
        return;
      }
      try {
        const d = await apiFetch<{ purchase: Purchase | null; pending?: boolean }>(`/api/billing/confirm?${q}`);
        if (d.purchase) {
          setPurchase(d.purchase);
          setState("ok");
        } else if (tries++ < 5) {
          setState("pending");
          setTimeout(check, 2000);
        } else {
          setState("pending");
        }
      } catch (e) {
        setState("error");
        setMessage(e instanceof ApiClientError ? e.message : "Could not confirm the purchase.");
      }
    };
    void check();
  }, [loading, user, params]);

  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <Card>
        {state === "checking" || state === "pending" ? (
          <>
            <div className="app-actions">
              <Spinner /> <b>{state === "pending" ? "Payment received, finishing up…" : "Confirming your purchase…"}</b>
            </div>
            <p className="app-muted">This usually takes a few seconds.</p>
          </>
        ) : state === "ok" && purchase ? (
          <>
            <span className="chip chip--apply" style={{ alignSelf: "flex-start" }}>
              Paid
            </span>
            <h2 className="h-display h2">You&apos;re set.</h2>
            <p className="app-muted">
              {PRODUCTS[purchase.product].name} is active on <b>{user?.email}</b>.{purchase.endsAt ? ` It runs until ${new Date(purchase.endsAt).toLocaleDateString("en-CA", { month: "long", day: "numeric" })} and does not renew.` : ""} A receipt is on its way from Stripe.
            </p>
            <div className="app-actions">
              <Link className="btn btn--coral btn--lg" href="/app/applications/new">
                Scan your first posting
              </Link>
              <Link className="btn btn--ghost" href="/app">
                Go to the dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="h-display h2">Almost there.</h2>
            <Notice kind="warn">{message ?? "We could not confirm the purchase yet. If you were charged, your access will appear within a few minutes; email us if it does not."}</Notice>
            <Link className="btn btn--ink" href="/app">
              Go to the dashboard
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
