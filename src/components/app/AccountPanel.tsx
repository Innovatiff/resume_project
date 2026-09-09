"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, ApiClientError, hardNavigate, useAuth } from "@/lib/app/auth-client";
import { useMe } from "@/lib/app/use-me";
import { PRODUCTS, priceFor } from "@/lib/billing/plans";
import { formatCents } from "@/lib/app/markets";
import { Card, Notice, PageHead, Skeleton, fmtDate } from "./ui";
import PlanPicker from "./PlanPicker";

export default function AccountPanel() {
  const { me, loading } = useMe();
  const { signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await apiFetch("/api/account/delete", { method: "POST" });
      await signOut().catch(() => undefined);
      // Full reload on purpose: clears every trace of the deleted account from the client.
      hardNavigate("/?deleted=1");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not delete the account.");
      setDeleting(false);
    }
  };

  const e = me?.entitlement;
  const isPass = e?.plan === "pass" || e?.plan === "landed";
  const currency = me?.user.currency ?? "cad";
  const cur = currency.toUpperCase();

  return (
    <>
      <PageHead title="Account" sub={me?.user.email} />
      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="app-grid app-grid--main">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Purchases" hint="One-time payments. Nothing renews.">
            {loading ? (
              <Skeleton h={80} />
            ) : me?.purchases.length ? (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Date</th>
                    <th>Access</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {me.purchases.map((p) => (
                    <tr key={p.id}>
                      <td>{PRODUCTS[p.product]?.name ?? p.product}</td>
                      <td>{fmtDate(p.createdAt)}</td>
                      <td className="app-muted">{p.endsAt ? `${fmtDate(p.startsAt)} – ${fmtDate(p.endsAt)}` : "Single use"}</td>
                      <td className="num">{formatCents(p.amountCents, p.currency)}</td>
                      <td>
                        <span className="app-status" data-status={p.status === "active" ? "ready" : p.status === "refunded" ? "rejected" : "archived"}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="app-muted">No purchases yet.</p>
            )}
          </Card>

          <Card title={e?.plan ? "Add or extend" : "Choose a package"} hint={`All prices ${cur}, one-time.`}>
            <PlanPicker current={e?.plan} currency={currency} />
            {isPass ? (
              <div className="app-actions">
                <Link className="btn btn--ghost btn--sm" href="/checkout?plan=extra30">
                  Extra 30 days · {formatCents(priceFor("extra30", currency), currency)}
                </Link>
                <Link className="btn btn--ghost btn--sm" href="/checkout?plan=rush_review">
                  Rush human review · {formatCents(priceFor("rush_review", currency), currency)}
                </Link>
                <Link className="btn btn--ghost btn--sm" href="/checkout?plan=coaching">
                  Coaching session · {formatCents(priceFor("coaching", currency), currency)}
                </Link>
              </div>
            ) : null}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Details">
            <dl className="app-kv">
              <dt>Email</dt>
              <dd>{me?.user.email}</dd>
              <dt>Member since</dt>
              <dd>{fmtDate(me?.user.createdAt)}</dd>
              <dt>Language</dt>
              <dd>{me?.user.language === "fr" ? "Français" : me?.user.language === "es" ? "Español" : "English"}</dd>
            </dl>
            <Link href="/app/profile" style={{ fontSize: "0.88rem", fontWeight: 500, color: "var(--purple-deep)" }}>
              Change language or city
            </Link>
            <button type="button" className="btn btn--outline btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => void signOut().then(() => hardNavigate("/"))}>
              Sign out
            </button>
          </Card>

          <Card title="Your data" hint="One click deletes everything." className="app-danger">
            <p className="app-muted">Every application, your resume profile, purchase records and the sign-in itself. Deleted permanently and immediately. Downloads you already saved stay with you.</p>
            {confirming ? (
              <div className="app-actions">
                <button type="button" className="btn btn--coral btn--sm" disabled={deleting} onClick={() => void deleteAccount()}>
                  {deleting ? "Deleting…" : "Yes, delete everything"}
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)}>
                  Keep my account
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn--outline btn--sm" style={{ alignSelf: "flex-start", color: "var(--coral-deep)" }} onClick={() => setConfirming(true)}>
                Delete my account and data
              </button>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
